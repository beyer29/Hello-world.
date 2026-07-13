export type FlashJobStatus =
  | "idle"
  | "pre-checks"
  | "backing-up"
  | "erasing"
  | "writing"
  | "verifying"
  | "complete"
  | "failed"
  | "rolled-back";

export interface FlashStepResult {
  status: FlashJobStatus;
  label: string;
  progress: number;
  message?: string;
}

interface BaseFlashPackage {
  id: string;
  moduleCode: string;
  name: string;
  description: string;
}

/**
 * Built into the app - illustrative only. Real BMW TCU/EGS firmware and
 * real dyno-calibrated tuning maps are proprietary and are intentionally
 * not reproduced here. See src/services/flash/README.md.
 */
export interface SampleFlashPackage extends BaseFlashPackage {
  source: "sample";
}

/**
 * A real file the user picked from their device (e.g. a tune exported from
 * their own licensed tuning software/tuner). This app stages it and runs it
 * through the same simulated install workflow as sample packages - it does
 * NOT gain the ability to actually write to a real control unit just
 * because the file is real. See src/services/flash/README.md.
 */
export interface ImportedFlashPackage extends BaseFlashPackage {
  source: "imported";
  fileName: string;
  fileSizeBytes: number;
  /** Fingerprint of the imported file's contents, for the app's own duplicate/change detection - not a claim of cryptographic verification against any OEM signature. */
  fingerprint: string;
  importedAt: string;
  localUri: string;
  notes?: string;
}

export type FlashPackage = SampleFlashPackage | ImportedFlashPackage;

export interface FlashJob {
  id: string;
  moduleId: string;
  package: FlashPackage;
  status: FlashJobStatus;
  startedAt: string;
  finishedAt?: string;
  error?: string;
}
