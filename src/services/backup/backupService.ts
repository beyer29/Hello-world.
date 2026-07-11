import AsyncStorage from "@react-native-async-storage/async-storage";
import { BackupService, CodingBackup, CodingSnapshotEntry, ControlModule } from "@/types";

const STORAGE_KEY = "bimmercoder:backups";

export class AsyncStorageBackupService implements BackupService {
  async createBackup(
    vin: string,
    label: string,
    modules: ControlModule[]
  ): Promise<CodingBackup> {
    const entries: CodingSnapshotEntry[] = modules.flatMap((module) =>
      module.options.map((option) => ({
        moduleId: module.id,
        optionId: option.id,
        value: option.currentValue,
      }))
    );

    const backup: CodingBackup = {
      id: `backup-${vin}-${entries.length}-${label.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}`,
      label,
      createdAt: new Date().toISOString(),
      vin,
      entries,
    };

    const all = await this.readAll();
    all.push(backup);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return backup;
  }

  async listBackups(vin: string): Promise<CodingBackup[]> {
    const all = await this.readAll();
    return all
      .filter((b) => b.vin === vin)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async restoreBackup(backupId: string): Promise<CodingSnapshotEntry[]> {
    const all = await this.readAll();
    const backup = all.find((b) => b.id === backupId);
    if (!backup) throw new Error(`Unknown backup id "${backupId}"`);
    return backup.entries;
  }

  async deleteBackup(backupId: string): Promise<void> {
    const all = await this.readAll();
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(all.filter((b) => b.id !== backupId))
    );
  }

  private async readAll(): Promise<CodingBackup[]> {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }
}
