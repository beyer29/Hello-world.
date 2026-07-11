export interface CodingSnapshotEntry {
  moduleId: string;
  optionId: string;
  value: boolean | string | number;
}

export interface CodingBackup {
  id: string;
  label: string;
  createdAt: string;
  vin: string;
  entries: CodingSnapshotEntry[];
}
