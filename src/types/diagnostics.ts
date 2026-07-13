export type DtcStatus = "stored" | "pending";

export interface DtcCode {
  code: string;
  status: DtcStatus;
  /**
   * Public, SAE-standardized description for generic (P0xxx-style) codes
   * shared across all manufacturers - see src/data/dtcDescriptions.ts. Null
   * when the code isn't in that small generic table (e.g. it's a
   * manufacturer-specific code this app doesn't have a public definition
   * for) - we show "unknown" rather than guessing.
   */
  description: string | null;
}

export interface DiagnosticScanResult {
  storedCodes: DtcCode[];
  pendingCodes: DtcCode[];
  scannedAt: string;
}

export interface LiveDataReading {
  pid: string;
  label: string;
  value: number;
  unit: string;
}
