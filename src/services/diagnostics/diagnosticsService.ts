import {
  DiagnosticScanResult,
  DiagnosticsService,
  DtcCode,
  DtcStatus,
  LiveDataReading,
  ObdAdapter,
} from "@/types";
import { describeDtc } from "@/data/dtcDescriptions";

/**
 * Real OBD-II diagnostics per SAE J1979 / ISO 15031-6 - Mode 03 (stored
 * DTCs), Mode 04 (clear DTCs), Mode 07 (pending DTCs), and a handful of
 * Mode 01 live-data PIDs. This is the standardized layer every OBD-II
 * vehicle (any manufacturer) implements identically - unlike coding/flash,
 * nothing here is manufacturer-specific or sample data.
 */
export class Obd2DiagnosticsService implements DiagnosticsService {
  constructor(private readonly adapter: ObdAdapter) {}

  async scanForCodes(): Promise<DiagnosticScanResult> {
    const [storedLines, pendingLines] = await Promise.all([
      this.adapter.sendCommand("03"),
      this.adapter.sendCommand("07"),
    ]);

    return {
      storedCodes: parseDtcResponse(storedLines, 0x43, "stored"),
      pendingCodes: parseDtcResponse(pendingLines, 0x47, "pending"),
      scannedAt: new Date().toISOString(),
    };
  }

  async clearCodes(): Promise<void> {
    await this.adapter.sendCommand("04");
  }

  async readLiveData(): Promise<LiveDataReading[]> {
    const readings: LiveDataReading[] = [];
    for (const def of LIVE_PIDS) {
      try {
        const lines = await this.adapter.sendCommand(`01${def.pid}`);
        const dataBytes = extractPidDataBytes(lines, def.pid, def.dataBytes);
        if (dataBytes) {
          readings.push({ pid: def.pid, label: def.label, unit: def.unit, value: def.decode(dataBytes) });
        }
      } catch {
        // A PID an adapter/vehicle doesn't support returns "NO DATA" or
        // errors - skip it, same as a real scan tool would for an
        // unsupported PID, rather than failing the whole live-data read.
      }
    }
    return readings;
  }
}

const DTC_TYPE_CHARS = ["P", "C", "B", "U"];

function decodeDtcBytes(byte1: number, byte2: number): string {
  const typeChar = DTC_TYPE_CHARS[(byte1 >> 6) & 0b11];
  const digit1 = (byte1 >> 4) & 0b11;
  const digit2 = byte1 & 0b1111;
  const digit3 = (byte2 >> 4) & 0b1111;
  const digit4 = byte2 & 0b1111;
  const hex = (n: number) => n.toString(16).toUpperCase();
  return `${typeChar}${digit1}${hex(digit2)}${hex(digit3)}${hex(digit4)}`;
}

function extractHexBytes(lines: string[]): number[] {
  const bytes: number[] = [];
  for (const line of lines) {
    const trimmed = line.trim().toUpperCase();
    if (!trimmed || trimmed === "NO DATA" || trimmed === "OK") continue;
    for (const token of trimmed.split(/\s+/)) {
      if (/^[0-9A-F]{2}$/.test(token)) bytes.push(parseInt(token, 16));
    }
  }
  return bytes;
}

function parseDtcResponse(lines: string[], modeEchoByte: number, status: DtcStatus): DtcCode[] {
  const bytes = extractHexBytes(lines);
  const start = bytes[0] === modeEchoByte ? 1 : 0;

  const codes: DtcCode[] = [];
  for (let i = start; i + 1 < bytes.length; i += 2) {
    const byte1 = bytes[i];
    const byte2 = bytes[i + 1];
    if (byte1 === 0 && byte2 === 0) continue; // unused DTC slot padding
    const code = decodeDtcBytes(byte1, byte2);
    codes.push({ code, status, description: describeDtc(code) });
  }
  return codes;
}

function extractPidDataBytes(lines: string[], pidHex: string, dataByteCount: number): number[] | null {
  const bytes = extractHexBytes(lines);
  const pidByte = parseInt(pidHex, 16);
  for (let i = 0; i + 1 < bytes.length; i++) {
    if (bytes[i] === 0x41 && bytes[i + 1] === pidByte) {
      const data = bytes.slice(i + 2, i + 2 + dataByteCount);
      return data.length === dataByteCount ? data : null;
    }
  }
  return null;
}

interface LivePidDefinition {
  pid: string;
  label: string;
  unit: string;
  dataBytes: number;
  decode: (bytes: number[]) => number;
}

const LIVE_PIDS: LivePidDefinition[] = [
  { pid: "0C", label: "Engine RPM", unit: "rpm", dataBytes: 2, decode: ([a, b]) => Math.round(((a * 256 + b) / 4) * 10) / 10 },
  { pid: "0D", label: "Vehicle speed", unit: "km/h", dataBytes: 1, decode: ([a]) => a },
  { pid: "05", label: "Coolant temperature", unit: "°C", dataBytes: 1, decode: ([a]) => a - 40 },
  { pid: "0F", label: "Intake air temperature", unit: "°C", dataBytes: 1, decode: ([a]) => a - 40 },
  { pid: "04", label: "Calculated engine load", unit: "%", dataBytes: 1, decode: ([a]) => Math.round((a * 100) / 255) },
  { pid: "11", label: "Throttle position", unit: "%", dataBytes: 1, decode: ([a]) => Math.round((a * 100) / 255) },
  { pid: "2F", label: "Fuel level", unit: "%", dataBytes: 1, decode: ([a]) => Math.round((a * 100) / 255) },
];
