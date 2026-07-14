import { ObdAdapter, ObdConnectionState, ObdDeviceInfo } from "@/types";

const MOCK_DEVICES: ObdDeviceInfo[] = [
  { id: "mock-obdlink-cx", name: "OBDLink CX (demo - BMW)", transport: "simulated", rssi: -52 },
  { id: "mock-vlinker-bm", name: "vLinker BM+ (demo - Audi)", transport: "simulated", rssi: -61 },
  { id: "mock-obdlink-mx", name: "OBDLink MX+ (demo - Volkswagen)", transport: "simulated", rssi: -58 },
  { id: "mock-icar-pro", name: "iCar Pro (demo - Mercedes-Benz)", transport: "simulated", rssi: -66 },
];

// One illustrative, structurally-valid demo VIN per mock device so the
// brand-filtered module catalogue (src/services/coding/codingService.ts)
// has something real to filter without any hardware attached.
const MOCK_VINS: Record<string, string> = {
  "mock-obdlink-cx": "WBA5A5C50FD123456",
  "mock-vlinker-bm": "WAUZZZ4G9DN123456",
  "mock-obdlink-mx": "WVWAA71K08W123456",
  "mock-icar-pro": "WDDGF4HB1CA123456",
};

/**
 * Stands in for a real ELM327 adapter so the app is fully usable without
 * hardware. Mirrors the timing/shape of `Elm327BleAdapter` so screens don't
 * need to know which one is active.
 */
export class MockObdAdapter implements ObdAdapter {
  readonly transport = "simulated" as const;
  private state: ObdConnectionState = "disconnected";
  private connectedDeviceId: string | null = null;
  private mockRpmJitter = 0;

  getConnectionState(): ObdConnectionState {
    return this.state;
  }

  async scan(onDeviceFound: (device: ObdDeviceInfo) => void, _timeoutMs = 4000): Promise<void> {
    this.state = "scanning";
    for (const device of MOCK_DEVICES) {
      await delay(400);
      onDeviceFound(device);
    }
    this.state = "disconnected";
  }

  async stopScan(): Promise<void> {
    if (this.state === "scanning") this.state = "disconnected";
  }

  async connect(deviceId: string): Promise<void> {
    this.state = "connecting";
    this.connectedDeviceId = deviceId;
    await delay(600);
    this.state = "connected";
  }

  async disconnect(): Promise<void> {
    await delay(150);
    this.state = "disconnected";
    this.connectedDeviceId = null;
  }

  async sendCommand(command: string): Promise<string[]> {
    if (this.state !== "connected") {
      throw new Error("Adapter is not connected");
    }
    await delay(120);
    return this.mockResponseFor(command.trim().toUpperCase());
  }

  private mockResponseFor(command: string): string[] {
    if (command === "ATZ") return ["ELM327 v2.1 (simulated)"];
    if (command === "ATE0") return ["OK"];
    if (command === "0902") {
      // Mode 09 PID 02: Vehicle Identification Number.
      const vin = (this.connectedDeviceId && MOCK_VINS[this.connectedDeviceId]) || MOCK_VINS["mock-obdlink-cx"];
      return [vin];
    }
    if (command === "0100") return ["41 00 BE 3E B8 11"];

    // Mode 03/07/04: a couple of illustrative generic DTCs for the demo,
    // and an ack for clearing them.
    if (command === "03") return ["43 01 33 00 00"]; // P0133
    if (command === "07") return ["47 01 71 00 00"]; // P0171
    if (command === "04") return ["44"];

    // Mode 01 live-data PIDs: plausible idling-engine values with a touch
    // of jitter so the live-data screen visibly updates between polls.
    this.mockRpmJitter = (this.mockRpmJitter + 1) % 20;
    if (command === "010C") {
      const rpmRaw = 3200 + this.mockRpmJitter * 8; // ~800rpm +/- jitter
      return [`41 0C ${hex(Math.floor(rpmRaw / 256))} ${hex(rpmRaw % 256)}`];
    }
    if (command === "010D") return ["41 0D 00"]; // parked, 0 km/h
    if (command === "0105") return ["41 05 82"]; // 90C coolant
    if (command === "010F") return ["41 0F 41"]; // 25C intake air
    if (command === "0104") return ["41 04 33"]; // ~20% load
    if (command === "0111") return ["41 11 26"]; // ~15% throttle
    if (command === "012F") return ["41 2F 99"]; // ~60% fuel level

    return ["OK"];
  }
}

function hex(n: number): string {
  return n.toString(16).toUpperCase().padStart(2, "0");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
