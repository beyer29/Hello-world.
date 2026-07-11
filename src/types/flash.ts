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

export interface FlashPackage {
  id: string;
  moduleCode: string;
  name: string;
  description: string;
  /**
   * This build only ships simulated packages - real BMW TCU/EGS firmware
   * containers are proprietary and are intentionally not reproduced here.
   * See src/services/flash/README.md.
   */
  isSample: true;
}

export interface FlashJob {
  id: string;
  moduleId: string;
  package: FlashPackage;
  status: FlashJobStatus;
  startedAt: string;
  finishedAt?: string;
  error?: string;
}
