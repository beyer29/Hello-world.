import { CodingBackup, CodingSnapshotEntry } from "./backup";
import { DiagnosticScanResult, LiveDataReading } from "./diagnostics";
import { FlashJob, FlashPackage, FlashStepResult, ImportedFlashPackage } from "./flash";
import { ControlModule } from "./module";
import { VinDecodeResult } from "./vehicle";

export interface PickedFile {
  uri: string;
  name: string;
  sizeBytes: number;
}

export interface VinDecoder {
  decode(vin: string): VinDecodeResult;
}

export interface CodingService {
  readModules(vin: string): Promise<ControlModule[]>;
  writeOption(
    moduleId: string,
    optionId: string,
    value: boolean | string | number
  ): Promise<void>;
  resetOptionToDefault(moduleId: string, optionId: string): Promise<void>;
}

export interface BackupService {
  createBackup(vin: string, label: string, modules: ControlModule[]): Promise<CodingBackup>;
  listBackups(vin: string): Promise<CodingBackup[]>;
  restoreBackup(backupId: string): Promise<CodingSnapshotEntry[]>;
  deleteBackup(backupId: string): Promise<void>;
}

export interface FlashService {
  listAvailablePackages(moduleCode: string): Promise<FlashPackage[]>;
  /**
   * Stages a real file the user picked from their device against a module.
   * This only catalogues the file and lets it flow through the same
   * simulated install workflow as built-in sample packages - it does not
   * grant the app a real ECU-write capability. See
   * src/services/flash/README.md.
   */
  importPackage(
    moduleCode: string,
    file: PickedFile,
    notes?: string
  ): Promise<ImportedFlashPackage>;
  deleteImportedPackage(packageId: string): Promise<void>;
  startFlash(
    moduleId: string,
    pkg: FlashPackage,
    onProgress: (result: FlashStepResult) => void
  ): Promise<FlashJob>;
  abort(jobId: string): Promise<void>;
}

/**
 * Real, brand-agnostic OBD-II diagnostics (SAE J1979/ISO 15031 Mode
 * 01/03/04/07) - works identically across every make, unlike the
 * manufacturer-specific coding/flash services above. See
 * src/services/diagnostics/diagnosticsService.ts.
 */
export interface DiagnosticsService {
  scanForCodes(): Promise<DiagnosticScanResult>;
  clearCodes(): Promise<void>;
  readLiveData(): Promise<LiveDataReading[]>;
}
