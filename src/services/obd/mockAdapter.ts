import { ObdAdapter, ObdConnectionState, ObdDeviceInfo } from "@/types";

const MOCK_DEVICES: ObdDeviceInfo[] = [
  { id: "mock-obdlink-cx", name: "OBDLink CX (demo)", transport: "simulated", rssi: -52 },
  { id: "mock-vlinker-bm", name: "vLinker BM+ (demo)", transport: "simulated", rssi: -61 },
];

/**
 * Stands in for a real ELM327 adapter so the app is fully usable without
 * hardware. Mirrors the timing/shape of `Elm327BleAdapter` so screens don't
 * need to know which one is active.
 */
export class MockObdAdapter implements ObdAdapter {
  readonly transport = "simulated" as const;
  private state: ObdConnectionState = "disconnected";

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

  async connect(_deviceId: string): Promise<void> {
    this.state = "connecting";
    await delay(600);
    this.state = "connected";
  }

  async disconnect(): Promise<void> {
    await delay(150);
    this.state = "disconnected";
  }

  async sendCommand(command: string): Promise<string[]> {
    if (this.state !== "connected") {
      throw new Error("Adapter is not connected");
    }
    await delay(120);
    return mockResponseFor(command.trim().toUpperCase());
  }
}

function mockResponseFor(command: string): string[] {
  if (command === "ATZ") return ["ELM327 v2.1 (simulated)"];
  if (command === "ATE0") return ["OK"];
  if (command === "0902") {
    // Mode 09 PID 02: Vehicle Identification Number.
    return ["WBA5A5C50FD123456"];
  }
  if (command === "0100") return ["41 00 BE 3E B8 11"];
  return ["OK"];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
