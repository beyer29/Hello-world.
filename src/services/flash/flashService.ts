import {
  FlashJob,
  FlashJobStatus,
  FlashPackage,
  FlashService,
  FlashStepResult,
} from "@/types";

const SAMPLE_PACKAGES: Record<string, FlashPackage[]> = {
  EGS: [
    {
      id: "egs-demo-shift-map-v1",
      moduleCode: "EGS",
      name: "Demo shift map v1 (simulated)",
      description:
        "Illustrates the flash workflow only - not a real transmission firmware image.",
      isSample: true,
    },
  ],
  DME: [
    {
      id: "dme-demo-stage1-v1",
      moduleCode: "DME",
      name: "Stage 1 (simulated)",
      description:
        "Illustrative only. Conceptually: a software-only remap for otherwise-stock " +
        "hardware, raising torque/power within the stock turbo and fuel system's " +
        "margin - no hardware changes assumed. Not a real calibrated tune; real Stage " +
        "1 maps are dyno-derived per engine/hardware combo by a tuner.",
      isSample: true,
    },
    {
      id: "dme-demo-stage2-v1",
      moduleCode: "DME",
      name: "Stage 2 (simulated)",
      description:
        "Illustrative only. Conceptually: a remap paired with supporting hardware " +
        "(e.g. intake, downpipe/exhaust, intercooler) that raises boost/airflow limits " +
        "beyond what Stage 1 assumes. Not a real calibrated tune.",
      isSample: true,
    },
    {
      id: "dme-demo-stage3-v1",
      moduleCode: "DME",
      name: "Stage 3 (simulated)",
      description:
        "Illustrative only. Conceptually: a heavily reworked map paired with major " +
        "hardware changes (upgraded turbo(s), fuel system, sometimes internals). Not a " +
        "real calibrated tune - real Stage 3 packages require a tuner to calibrate " +
        "against the exact hardware installed, on a dyno, to avoid engine damage.",
      isSample: true,
    },
  ],
};

const STEP_SEQUENCE: { status: FlashJobStatus; label: string; durationMs: number }[] = [
  { status: "pre-checks", label: "Verifying VIN, voltage, and module compatibility", durationMs: 900 },
  { status: "backing-up", label: "Backing up current module software", durationMs: 1200 },
  { status: "erasing", label: "Erasing target memory region", durationMs: 900 },
  { status: "writing", label: "Writing new software", durationMs: 1800 },
  { status: "verifying", label: "Verifying checksum", durationMs: 900 },
];

/**
 * Simulates the end-to-end flash workflow (pre-checks, backup, erase, write,
 * verify) so the UI/UX is real and complete, without executing an actual
 * transmission control unit flash. See README.md in this directory for why.
 */
export class SimulatedFlashService implements FlashService {
  private aborted = new Set<string>();

  async listAvailablePackages(moduleCode: string): Promise<FlashPackage[]> {
    return SAMPLE_PACKAGES[moduleCode] ?? [];
  }

  async startFlash(
    moduleId: string,
    pkg: FlashPackage,
    onProgress: (result: FlashStepResult) => void
  ): Promise<FlashJob> {
    const job: FlashJob = {
      id: `flash-${moduleId}-${pkg.id}-${Date.now()}`,
      moduleId,
      package: pkg,
      status: "idle",
      startedAt: new Date().toISOString(),
    };

    for (const step of STEP_SEQUENCE) {
      if (this.aborted.has(job.id)) {
        job.status = "rolled-back";
        job.finishedAt = new Date().toISOString();
        onProgress({ status: "rolled-back", label: "Flash aborted - restored backup", progress: 1 });
        this.aborted.delete(job.id);
        return job;
      }

      job.status = step.status;
      const ticks = 5;
      for (let i = 1; i <= ticks; i++) {
        await delay(step.durationMs / ticks);
        onProgress({ status: step.status, label: step.label, progress: i / ticks });
      }
    }

    job.status = "complete";
    job.finishedAt = new Date().toISOString();
    onProgress({ status: "complete", label: "Flash complete", progress: 1 });
    return job;
  }

  async abort(jobId: string): Promise<void> {
    this.aborted.add(jobId);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
