export type ObdTransport = "bluetooth-le" | "bluetooth-classic" | "simulated";

export interface ObdDeviceInfo {
  id: string;
  name: string;
  transport: ObdTransport;
  rssi?: number;
}

export type ObdConnectionState =
  | "disconnected"
  | "scanning"
  | "connecting"
  | "connected"
  | "error";

/**
 * Transport-level abstraction over an ELM327-compatible OBD-II adapter.
 * `sendCommand` speaks the real, publicly documented ELM327 AT/OBD command
 * set (e.g. "ATZ", "0100") - this layer is not BMW-specific.
 */
export interface ObdAdapter {
  readonly transport: ObdTransport;
  scan(onDeviceFound: (device: ObdDeviceInfo) => void, timeoutMs?: number): Promise<void>;
  stopScan(): Promise<void>;
  connect(deviceId: string): Promise<void>;
  disconnect(): Promise<void>;
  getConnectionState(): ObdConnectionState;
  sendCommand(command: string): Promise<string[]>;
}
