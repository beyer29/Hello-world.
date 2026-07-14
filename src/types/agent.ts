export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  timestamp: string;
}

export interface AgentNavigationIntent {
  screen: "ModuleDetail" | "Flash";
  moduleId: string;
}

export interface AgentResponse {
  reply: string;
  navigateTo?: AgentNavigationIntent;
}

/**
 * Everything Beyer (src/services/agent) can read or trigger, threaded in
 * from the same context hooks screens already use (useVehicle, useModules,
 * useBackups, useFlash, useDiagnostics) - Beyer has no capability a screen
 * doesn't already have, it just exposes it through chat.
 */
export interface AgentTools {
  vin: string | null;
  manufacturer: string | null;
  modules: import("./module").ControlModule[];
  updateOption: (
    moduleId: string,
    optionId: string,
    value: boolean | string | number
  ) => Promise<void>;
  resetOption: (moduleId: string, optionId: string) => Promise<void>;
  backups: import("./backup").CodingBackup[];
  createBackup: (label: string) => Promise<void>;
  restoreBackup: (backupId: string) => Promise<void>;
  scanForCodes: () => Promise<import("./diagnostics").DiagnosticScanResult>;
  lastScanResult: import("./diagnostics").DiagnosticScanResult | null;
  clearCodes: () => Promise<void>;
  startLiveData: () => void;
  stopLiveData: () => void;
  liveData: import("./diagnostics").LiveDataReading[];
  liveDataActive: boolean;
  listFlashPackages: (moduleCode: string) => Promise<import("./flash").FlashPackage[]>;
  /** Set right before a destructive confirmation is expected, cleared after use. */
  pendingConfirmation: PendingConfirmation | null;
  setPendingConfirmation: (pending: PendingConfirmation | null) => void;
}

export type PendingConfirmation = { kind: "clear-codes" } | { kind: "restore-backup"; backupId: string };

export interface AiAgent {
  respond(input: string, tools: AgentTools): Promise<AgentResponse>;
}
