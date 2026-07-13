import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system";
import {
  FlashJob,
  FlashJobStatus,
  FlashPackage,
  FlashService,
  FlashStepResult,
  ImportedFlashPackage,
  PickedFile,
  SampleFlashPackage,
} from "@/types";

function stagePackages(moduleCode: string): SampleFlashPackage[] {
  return [
    {
      id: `${moduleCode.toLowerCase()}-demo-stage1-v1`,
      moduleCode,
      name: "Stage 1 (simulated)",
      description:
        "Illustrative only. Conceptually: a software-only remap for otherwise-stock " +
        "hardware, raising torque/power within the stock turbo and fuel system's " +
        "margin - no hardware changes assumed. Not a real calibrated tune; real Stage " +
        "1 maps are dyno-derived per engine/hardware combo by a tuner.",
      source: "sample",
    },
    {
      id: `${moduleCode.toLowerCase()}-demo-stage2-v1`,
      moduleCode,
      name: "Stage 2 (simulated)",
      description:
        "Illustrative only. Conceptually: a remap paired with supporting hardware " +
        "(e.g. intake, downpipe/exhaust, intercooler) that raises boost/airflow limits " +
        "beyond what Stage 1 assumes. Not a real calibrated tune.",
      source: "sample",
    },
    {
      id: `${moduleCode.toLowerCase()}-demo-stage3-v1`,
      moduleCode,
      name: "Stage 3 (simulated)",
      description:
        "Illustrative only. Conceptually: a heavily reworked map paired with major " +
        "hardware changes (upgraded turbo(s), fuel system, sometimes internals). Not a " +
        "real calibrated tune - real Stage 3 packages require a tuner to calibrate " +
        "against the exact hardware installed, on a dyno, to avoid engine damage.",
      source: "sample",
    },
  ];
}

const SAMPLE_PACKAGES: Record<string, SampleFlashPackage[]> = {
  EGS: [
    {
      id: "egs-demo-shift-map-v1",
      moduleCode: "EGS",
      name: "Demo shift map v1 (simulated)",
      description:
        "Illustrates the flash workflow only - not a real transmission firmware image.",
      source: "sample",
    },
  ],
  DME: stagePackages("DME"),
  ECU: stagePackages("ECU"),
  ME: stagePackages("ME"),
};

const IMPORTED_STORAGE_KEY = "bimmercoder:importedTunes";
const TUNES_DIR = `${FileSystem.documentDirectory ?? ""}tunes/`;

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
 * control-unit flash - even for real files staged via `importPackage`. See
 * README.md in this directory for why.
 */
export class SimulatedFlashService implements FlashService {
  private aborted = new Set<string>();
  private importedCache: ImportedFlashPackage[] | null = null;

  async listAvailablePackages(moduleCode: string): Promise<FlashPackage[]> {
    const sample = SAMPLE_PACKAGES[moduleCode] ?? [];
    const imported = (await this.loadImported()).filter((p) => p.moduleCode === moduleCode);
    return [...sample, ...imported];
  }

  async importPackage(
    moduleCode: string,
    file: PickedFile,
    notes?: string
  ): Promise<ImportedFlashPackage> {
    await FileSystem.makeDirectoryAsync(TUNES_DIR, { intermediates: true }).catch(() => {});

    const id = `imported-${moduleCode}-${Date.now()}`;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const localUri = `${TUNES_DIR}${id}-${safeName}`;

    await FileSystem.copyAsync({ from: file.uri, to: localUri });

    const info = await FileSystem.getInfoAsync(localUri, { size: true });
    const fileSizeBytes = (info.exists && "size" in info ? info.size : file.sizeBytes) ?? file.sizeBytes;

    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const fingerprint = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, base64);

    const pkg: ImportedFlashPackage = {
      id,
      moduleCode,
      name: file.name,
      description: notes?.trim()
        ? notes.trim()
        : "Imported file. Staged for the simulated install workflow only - actually writing " +
          "this to a real vehicle still requires your own licensed flashing tool and hardware.",
      source: "imported",
      fileName: file.name,
      fileSizeBytes,
      fingerprint,
      importedAt: new Date().toISOString(),
      localUri,
      notes: notes?.trim() || undefined,
    };

    const all = await this.loadImported();
    all.push(pkg);
    await this.persistImported(all);
    return pkg;
  }

  async deleteImportedPackage(packageId: string): Promise<void> {
    const all = await this.loadImported();
    const target = all.find((p) => p.id === packageId);
    if (target) {
      await FileSystem.deleteAsync(target.localUri, { idempotent: true }).catch(() => {});
    }
    await this.persistImported(all.filter((p) => p.id !== packageId));
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
    onProgress({
      status: "complete",
      label: "Flash complete (simulated)",
      progress: 1,
      message:
        pkg.source === "imported"
          ? "No real control unit was written. To actually apply this file to a vehicle, use " +
            "the licensed flashing tool/hardware it came from."
          : undefined,
    });
    return job;
  }

  async abort(jobId: string): Promise<void> {
    this.aborted.add(jobId);
  }

  private async loadImported(): Promise<ImportedFlashPackage[]> {
    if (this.importedCache) return this.importedCache;
    const stored = await AsyncStorage.getItem(IMPORTED_STORAGE_KEY);
    this.importedCache = stored ? JSON.parse(stored) : [];
    return this.importedCache!;
  }

  private async persistImported(packages: ImportedFlashPackage[]): Promise<void> {
    this.importedCache = packages;
    await AsyncStorage.setItem(IMPORTED_STORAGE_KEY, JSON.stringify(packages));
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
