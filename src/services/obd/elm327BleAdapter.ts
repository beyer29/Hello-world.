import { PermissionsAndroid, Platform } from "react-native";
import {
  BleError,
  BleManager,
  Characteristic,
  Device,
  Service,
  Subscription,
} from "react-native-ble-plx";
import { ObdAdapter, ObdConnectionState, ObdDeviceInfo, ObdTransport } from "@/types";

/**
 * Real ELM327-over-Bluetooth-LE transport.
 *
 * This talks the real, publicly documented ELM327 AT-command protocol
 * (ASCII commands terminated with "\r", responses terminated by a ">"
 * prompt character) over a real BLE GATT connection via `react-native-ble-plx`.
 * It has no knowledge of BMW-specific coding data - it just moves bytes for
 * whatever OBD/AT command `services/coding` (or a screen) hands it. See
 * `src/data/README.md` for why the *coding values* sent over this transport
 * are sample data, not verified BMW byte offsets.
 *
 * Cheap ELM327 BLE clones almost universally expose a single UART-style
 * GATT service with either one characteristic that both accepts writes and
 * emits notifications, or a split TX/RX pair (mirroring Nordic UART
 * Service). `connect()` discovers whichever shape the device presents and
 * throws a clear error if neither is found, rather than silently failing.
 */

const DEFAULT_SCAN_TIMEOUT_MS = 8000;
const COMMAND_TIMEOUT_MS = 5000;
const RESPONSE_PROMPT = ">";

let cachedBleAvailable: boolean | null = null;

/**
 * True when the native BLE module is actually linked (i.e. a custom dev
 * client / standalone build), false in environments like Expo Go where
 * `react-native-ble-plx`'s native side doesn't exist. Constructing
 * `BleManager` is what surfaces that failure, so we do it once and cache
 * the outcome rather than risk crashing the app on every check.
 */
export function isBleAvailable(): boolean {
  if (cachedBleAvailable !== null) {
    return cachedBleAvailable;
  }
  try {
    const probe = new BleManager();
    probe.destroy();
    cachedBleAvailable = true;
  } catch {
    cachedBleAvailable = false;
  }
  return cachedBleAvailable;
}

interface WritableCharacteristic {
  characteristic: Characteristic;
  withResponse: boolean;
}

interface CommunicationCharacteristics {
  write: WritableCharacteristic;
  notify: Characteristic;
}

interface PendingResponse {
  resolve: (lines: string[]) => void;
  reject: (error: Error) => void;
}

export class Elm327BleAdapter implements ObdAdapter {
  readonly transport: ObdTransport = "bluetooth-le";

  private manager: BleManager | null = null;
  private state: ObdConnectionState = "disconnected";
  private device: Device | null = null;
  private comms: CommunicationCharacteristics | null = null;
  private notifySubscription: Subscription | null = null;
  private disconnectSubscription: Subscription | null = null;
  private responseBuffer = "";
  private pendingResponse: PendingResponse | null = null;
  private responseTimer: ReturnType<typeof setTimeout> | null = null;
  private scanTimer: ReturnType<typeof setTimeout> | null = null;
  private seenDeviceIds = new Set<string>();

  getConnectionState(): ObdConnectionState {
    return this.state;
  }

  async scan(
    onDeviceFound: (device: ObdDeviceInfo) => void,
    timeoutMs: number = DEFAULT_SCAN_TIMEOUT_MS
  ): Promise<void> {
    this.assertBleAvailable();
    await ensureAndroidScanPermissions();

    const manager = this.getManager();
    this.seenDeviceIds.clear();
    this.state = "scanning";

    return new Promise<void>((resolve, reject) => {
      let settled = false;

      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        manager.stopDeviceScan();
        if (this.scanTimer) {
          clearTimeout(this.scanTimer);
          this.scanTimer = null;
        }
        if (this.state === "scanning") {
          this.state = error ? "error" : "disconnected";
        }
        if (error) reject(error);
        else resolve();
      };

      try {
        manager.startDeviceScan(null, { allowDuplicates: false }, (error, scannedDevice) => {
          if (error) {
            finish(new Error(`BLE scan failed: ${error.message}`));
            return;
          }
          if (!scannedDevice || !scannedDevice.id || this.seenDeviceIds.has(scannedDevice.id)) {
            return;
          }
          this.seenDeviceIds.add(scannedDevice.id);
          onDeviceFound({
            id: scannedDevice.id,
            name: scannedDevice.name ?? scannedDevice.localName ?? "Unknown device",
            transport: "bluetooth-le",
            rssi: scannedDevice.rssi ?? undefined,
          });
        });
      } catch (error) {
        finish(error instanceof Error ? error : new Error(String(error)));
        return;
      }

      this.scanTimer = setTimeout(() => finish(), timeoutMs);
    });
  }

  async stopScan(): Promise<void> {
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }
    this.manager?.stopDeviceScan();
    if (this.state === "scanning") {
      this.state = "disconnected";
    }
  }

  async connect(deviceId: string): Promise<void> {
    this.assertBleAvailable();
    await this.stopScan();

    const manager = this.getManager();
    this.state = "connecting";

    try {
      const device = await manager.connectToDevice(deviceId, { autoConnect: false });
      await device.discoverAllServicesAndCharacteristics();

      const services = await device.services();
      const comms = await findCommunicationCharacteristics(services);
      if (!comms) {
        await manager.cancelDeviceConnection(deviceId).catch(() => undefined);
        throw new Error(
          "This device did not expose a BLE characteristic pair that supports both " +
            "write and notify, so it cannot be driven as an ELM327 adapter."
        );
      }

      this.device = device;
      this.comms = comms;
      this.responseBuffer = "";

      this.notifySubscription = comms.notify.monitor((error, characteristic) => {
        this.handleNotification(error, characteristic);
      });

      this.disconnectSubscription = manager.onDeviceDisconnected(deviceId, () => {
        this.handleUnexpectedDisconnect();
      });

      this.state = "connected";
    } catch (error) {
      this.state = "error";
      this.device = null;
      this.comms = null;
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  async disconnect(): Promise<void> {
    const deviceId = this.device?.id;
    this.teardownConnectionResources(new Error("Adapter disconnected"));
    this.device = null;

    if (deviceId && this.manager) {
      try {
        await this.manager.cancelDeviceConnection(deviceId);
      } catch {
        // Already disconnected at the native layer - nothing more to do.
      }
    }
    this.state = "disconnected";
  }

  async sendCommand(command: string): Promise<string[]> {
    if (this.state !== "connected" || !this.device || !this.comms) {
      throw new Error("Adapter is not connected");
    }
    if (this.pendingResponse) {
      throw new Error("A command is already in flight on this adapter");
    }

    const trimmed = command.trim();
    const payload = encodeAsciiToBase64(`${trimmed}\r`);
    const { characteristic, withResponse } = this.comms.write;

    return new Promise<string[]>((resolve, reject) => {
      this.pendingResponse = { resolve, reject };
      this.responseTimer = setTimeout(() => {
        this.settlePending(undefined, new Error(`Timed out waiting for a response to "${trimmed}"`));
      }, COMMAND_TIMEOUT_MS);

      const write = withResponse
        ? characteristic.writeWithResponse(payload)
        : characteristic.writeWithoutResponse(payload);

      write.catch((error) => {
        this.settlePending(undefined, error instanceof Error ? error : new Error(String(error)));
      });
    });
  }

  private assertBleAvailable(): void {
    if (!isBleAvailable()) {
      throw new Error(
        "Bluetooth LE is not available in this build (react-native-ble-plx's native " +
          "module isn't linked - this happens in Expo Go; use a custom dev client)."
      );
    }
  }

  private getManager(): BleManager {
    if (!this.manager) {
      this.manager = new BleManager();
    }
    return this.manager;
  }

  private handleNotification(error: BleError | null, characteristic: Characteristic | null): void {
    if (error) {
      this.settlePending(undefined, new Error(`BLE notification error: ${error.message}`));
      return;
    }
    if (!characteristic?.value) {
      return;
    }

    this.responseBuffer += decodeBase64ToAscii(characteristic.value);

    const promptIndex = this.responseBuffer.indexOf(RESPONSE_PROMPT);
    if (promptIndex === -1) {
      return;
    }

    const raw = this.responseBuffer.slice(0, promptIndex);
    this.responseBuffer = this.responseBuffer.slice(promptIndex + 1);
    this.settlePending(parseElmResponse(raw), undefined);
  }

  private handleUnexpectedDisconnect(): void {
    if (this.state === "disconnected") {
      return;
    }
    this.state = "error";
    this.device = null;
    this.teardownConnectionResources(new Error("BLE device disconnected unexpectedly"));
  }

  private settlePending(lines: string[] | undefined, error: Error | undefined): void {
    const pending = this.pendingResponse;
    if (!pending) return;
    this.pendingResponse = null;
    if (this.responseTimer) {
      clearTimeout(this.responseTimer);
      this.responseTimer = null;
    }
    if (error) pending.reject(error);
    else pending.resolve(lines ?? []);
  }

  private teardownConnectionResources(pendingError: Error): void {
    this.notifySubscription?.remove();
    this.notifySubscription = null;
    this.disconnectSubscription?.remove();
    this.disconnectSubscription = null;
    this.comms = null;
    this.responseBuffer = "";
    this.settlePending(undefined, pendingError);
  }
}

/**
 * Finds a write + notify characteristic pair to drive as the ELM327 UART
 * link. Prefers a single characteristic that does both (the common case for
 * cheap ELM327 BLE clones), then a same-service pair (Nordic UART-style
 * split TX/RX), then falls back to any pair on the device.
 */
async function findCommunicationCharacteristics(
  services: Service[]
): Promise<CommunicationCharacteristics | null> {
  const allWritable: WritableCharacteristic[] = [];
  const allNotifiable: Characteristic[] = [];

  for (const service of services) {
    const characteristics = await service.characteristics();
    const writableInService: WritableCharacteristic[] = [];
    const notifiableInService: Characteristic[] = [];

    for (const characteristic of characteristics) {
      if (characteristic.isWritableWithResponse || characteristic.isWritableWithoutResponse) {
        const writable: WritableCharacteristic = {
          characteristic,
          withResponse: characteristic.isWritableWithResponse,
        };
        writableInService.push(writable);
        allWritable.push(writable);
      }
      if (characteristic.isNotifiable || characteristic.isIndicatable) {
        notifiableInService.push(characteristic);
        allNotifiable.push(characteristic);
      }
    }

    const combined = writableInService.find((writable) =>
      notifiableInService.some((notifiable) => notifiable.uuid === writable.characteristic.uuid)
    );
    if (combined) {
      return { write: combined, notify: combined.characteristic };
    }
    if (writableInService.length > 0 && notifiableInService.length > 0) {
      return { write: writableInService[0], notify: notifiableInService[0] };
    }
  }

  if (allWritable.length > 0 && allNotifiable.length > 0) {
    return { write: allWritable[0], notify: allNotifiable[0] };
  }

  return null;
}

/** Strips the "\r"/"\n"-delimited lines out of a raw ELM327 response body (the ">" prompt itself has already been removed by the caller). */
function parseElmResponse(raw: string): string[] {
  return raw
    .split(/[\r\n]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Best-effort Android runtime permission request for BLE scanning.
 * Android 12+ (API 31+) requires BLUETOOTH_SCAN/BLUETOOTH_CONNECT; older
 * versions require location permission for BLE scan results. iOS has no
 * equivalent runtime prompt here (it's handled via Info.plist usage strings
 * at the OS level), so this is a no-op there.
 */
async function ensureAndroidScanPermissions(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }
  try {
    const apiLevel =
      typeof Platform.Version === "number" ? Platform.Version : parseInt(String(Platform.Version), 10);
    const permissions =
      apiLevel >= 31
        ? [PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT]
        : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
    await PermissionsAndroid.requestMultiple(permissions);
  } catch {
    // Best-effort only - if this fails, the subsequent native BLE call will
    // surface its own, clearer permission-related error.
  }
}

const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Minimal, dependency-free base64 encoder for the ASCII AT-command strings ble-plx's write APIs require. */
function encodeAsciiToBase64(input: string): string {
  let output = "";
  let i = 0;
  while (i < input.length) {
    const byte1 = input.charCodeAt(i++) & 0xff;
    const hasByte2 = i < input.length;
    const byte2 = hasByte2 ? input.charCodeAt(i++) & 0xff : 0;
    const hasByte3 = i < input.length;
    const byte3 = hasByte3 ? input.charCodeAt(i++) & 0xff : 0;

    const enc1 = byte1 >> 2;
    const enc2 = ((byte1 & 0x03) << 4) | (byte2 >> 4);
    const enc3 = hasByte2 ? ((byte2 & 0x0f) << 2) | (byte3 >> 6) : 64;
    const enc4 = hasByte3 ? byte3 & 0x3f : 64;

    output +=
      BASE64_CHARS.charAt(enc1) +
      BASE64_CHARS.charAt(enc2) +
      (enc3 === 64 ? "=" : BASE64_CHARS.charAt(enc3)) +
      (enc4 === 64 ? "=" : BASE64_CHARS.charAt(enc4));
  }
  return output;
}

/** Minimal, dependency-free base64 decoder for the notification payloads ble-plx delivers. */
function decodeBase64ToAscii(input: string): string {
  const sanitized = input.replace(/[^A-Za-z0-9+/=]/g, "");
  let output = "";
  let i = 0;
  while (i < sanitized.length) {
    const enc1 = BASE64_CHARS.indexOf(sanitized.charAt(i++));
    const enc2 = BASE64_CHARS.indexOf(sanitized.charAt(i++));
    const enc3 = BASE64_CHARS.indexOf(sanitized.charAt(i++));
    const enc4 = BASE64_CHARS.indexOf(sanitized.charAt(i++));

    const byte1 = (enc1 << 2) | (enc2 >> 4);
    const byte2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const byte3 = ((enc3 & 3) << 6) | enc4;

    output += String.fromCharCode(byte1);
    if (enc3 !== -1 && enc3 !== 64) output += String.fromCharCode(byte2);
    if (enc4 !== -1 && enc4 !== 64) output += String.fromCharCode(byte3);
  }
  return output;
}
