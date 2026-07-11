import { CodingBackup, CodingSnapshotEntry } from "./backup";
import { FlashJob, FlashPackage, FlashStepResult } from "./flash";
import { ControlModule } from "./module";
import { VinDecodeResult } from "./vehicle";

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
  startFlash(
    moduleId: string,
    pkg: FlashPackage,
    onProgress: (result: FlashStepResult) => void
  ): Promise<FlashJob>;
  abort(jobId: string): Promise<void>;
}
