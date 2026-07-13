import { describeDtc } from "@/data/dtcDescriptions";
import { adviseOnDtc } from "@/data/repairAdvice";
import { AgentResponse, AgentTools, AiAgent, ControlModule, DtcCode } from "@/types";

const DTC_PATTERN = /\b([PCBU][0-9A-F]{4})\b/i;
const AFFIRMATIVE = /\b(yes|confirm|do it|go ahead|proceed|sure)\b/i;
const NEGATIVE = /\b(no|cancel|nevermind|never mind|stop)\b/i;

/**
 * Beyer's default (and, in this build, only functional) reasoning engine:
 * plain keyword/pattern matching over the app's own real data and action
 * hooks - no network calls, no API key, nothing fabricated. It is a
 * command layer + repair-advice lookup, not a general-purpose language
 * model; see src/services/agent/README.md for the honest scope and the
 * extension point for a real LLM if you want one later.
 */
export class LocalRuleBasedAgent implements AiAgent {
  async respond(rawInput: string, tools: AgentTools): Promise<AgentResponse> {
    const input = rawInput.trim();
    const lower = input.toLowerCase();

    if (tools.pendingConfirmation) {
      return this.handleConfirmation(input, tools);
    }

    if (/^(hi|hello|hey|help|what can you do)\b/.test(lower) || lower.length === 0) {
      return { reply: this.helpText(tools) };
    }

    if (/\b(scan|check.*fault|check.*code|read.*code|diagnos)/i.test(lower)) {
      return this.runScan(tools);
    }

    const dtcMatch = input.match(DTC_PATTERN);
    if (/\bexplain\b/i.test(lower) || (dtcMatch && /\b(what|mean|advise|advice)/i.test(lower))) {
      if (dtcMatch) return { reply: this.explainCode(dtcMatch[1].toUpperCase()) };
      return { reply: "Which code would you like explained? Send it like \"explain P0301\"." };
    }
    if (dtcMatch) {
      return { reply: this.explainCode(dtcMatch[1].toUpperCase()) };
    }

    if (/\bclear\b.*\b(code|fault)/i.test(lower)) {
      tools.setPendingConfirmation({ kind: "clear-codes" });
      return {
        reply:
          "That'll clear all stored/pending fault codes on the connected vehicle. Reply " +
          "\"yes\" to confirm, or \"no\" to cancel.",
      };
    }

    if (/\blive data\b/.test(lower) || /\bstart.*live\b/.test(lower)) {
      tools.startLiveData();
      return { reply: "Live data started - I'll show readings as they come in on the Diagnostics tab." };
    }
    if (/\bstop.*live\b/.test(lower)) {
      tools.stopLiveData();
      return { reply: "Live data stopped." };
    }

    if (/\bback ?up\b/.test(lower) && !/\brestore\b/.test(lower)) {
      return this.createBackup(tools);
    }

    if (/\brestore\b/.test(lower)) {
      return this.restoreBackup(input, tools);
    }

    if (/\b(list|show|what).*(module|component|system)/i.test(lower)) {
      return { reply: this.listModules(tools) };
    }

    if (/\b(tune|tuning|stage ?1|stage ?2|stage ?3|flash)\b/i.test(lower)) {
      return this.pointToTuning(tools);
    }

    const toggleMatch = lower.match(/\b(turn on|turn off|enable|disable|toggle)\b\s+(.+)/);
    if (toggleMatch) {
      return this.toggleOption(toggleMatch[1], toggleMatch[2], tools);
    }

    if (/\b(repair|fix|should i|need.*repair|urgent|worry)\b/i.test(lower)) {
      return { reply: this.repairVerdict(tools) };
    }

    return {
      reply:
        "I'm not sure how to help with that yet. Try: \"scan for faults\", \"explain P0301\", " +
        "\"should I get this repaired\", \"back up my coding\", \"list modules\", " +
        "\"turn on welcome lighting\", \"start live data\", or \"show tuning options\".",
    };
  }

  private helpText(tools: AgentTools): string {
    const vehicleLine = tools.vin
      ? `Connected to a ${tools.manufacturer ?? "vehicle"} (VIN ${tools.vin}).`
      : "No vehicle connected yet - connect one first from the Connect screen.";
    return (
      `Hi, I'm Beyer. ${vehicleLine}\n\n` +
      "I can: run a full diagnostic scan and explain what any fault code means and whether " +
      "it needs attention, back up or restore your coding, list/toggle coding options, start " +
      "live data, and point you to Stage 1/2/3 tuning options. I'm a local rule-based " +
      "assistant - no internet connection, no account needed - so I work best with short, " +
      "direct requests rather than open-ended conversation."
    );
  }

  private async runScan(tools: AgentTools): Promise<AgentResponse> {
    if (!tools.vin) return { reply: "Connect to a vehicle first, then ask me to scan." };
    const result = await tools.scanForCodes();
    const all = [...result.storedCodes, ...result.pendingCodes];
    if (all.length === 0) {
      return {
        reply:
          "Scan complete - no stored or pending fault codes right now. That doesn't rule out " +
          "everything (things like brakes, tires, or fluid levels don't trigger a code), but " +
          "there's nothing here pointing to a repair.",
      };
    }
    const lines = all.map((dtc) => `• ${dtc.code} (${dtc.status}): ${this.shortSummary(dtc)}`);
    return {
      reply:
        `Scan complete - found ${all.length} code${all.length === 1 ? "" : "s"}:\n${lines.join("\n")}\n\n` +
        `${this.repairVerdict(tools)}`,
    };
  }

  private shortSummary(dtc: DtcCode): string {
    if (dtc.description) return dtc.description;
    return "unknown / manufacturer-specific code - no public generic definition";
  }

  private explainCode(code: string): string {
    const description = describeDtc(code);
    if (!description) {
      return (
        `${code} isn't in my generic (SAE-standard) code table, which means it's either not a ` +
        "real code or it's manufacturer-specific - those definitions are proprietary to each " +
        "OEM and I don't have (or guess at) them. A dealer or shop with manufacturer-specific " +
        "tooling can look it up properly."
      );
    }
    const advice = adviseOnDtc(code);
    if (!advice) return `${code}: ${description}`;
    return (
      `${code}: ${description}\n\n` +
      `Common causes: ${advice.commonCauses.join(", ")}.\n\n` +
      `${advice.guidance}`
    );
  }

  private repairVerdict(tools: AgentTools): string {
    const result = tools.lastScanResult;
    if (!result) return "Run a scan first (\"scan for faults\") and I'll give you a repair verdict.";
    const all = [...result.storedCodes, ...result.pendingCodes];
    if (all.length === 0) return "Nothing from the last scan suggests a repair is needed.";
    const urgencies = all.map((dtc) => adviseOnDtc(dtc.code)?.urgency ?? "medium");
    if (urgencies.includes("high")) {
      return (
        "At least one code from the last scan is high-urgency - see that code's explanation " +
        "above for specifics, but in general: if the check-engine light is flashing rather " +
        "than steady, stop driving and get it inspected rather than continuing."
      );
    }
    if (urgencies.includes("medium")) {
      return "Nothing here looks like an emergency, but I'd get these checked in the next week or two rather than letting them sit.";
    }
    return "These are low-urgency - fine to mention at your next scheduled service rather than rushing in.";
  }

  private async createBackup(tools: AgentTools): Promise<AgentResponse> {
    if (!tools.vin) return { reply: "Connect to a vehicle first." };
    const label = `Beyer backup - ${new Date().toLocaleString()}`;
    await tools.createBackup(label);
    return { reply: `Done - saved a backup of the current coding as "${label}".` };
  }

  private async restoreBackup(input: string, tools: AgentTools): Promise<AgentResponse> {
    if (tools.backups.length === 0) return { reply: "There aren't any backups yet to restore." };
    const query = input.toLowerCase().replace(/restore/gi, "").trim();
    const match = query
      ? tools.backups.find((b) => b.label.toLowerCase().includes(query))
      : tools.backups[0];
    if (!match) {
      const options = tools.backups.map((b) => `• ${b.label}`).join("\n");
      return { reply: `I couldn't match that to a backup. You have:\n${options}\n\nTry "restore <name>".` };
    }
    tools.setPendingConfirmation({ kind: "restore-backup", backupId: match.id });
    return { reply: `Restore "${match.label}"? This overwrites current coding. Reply "yes" to confirm.` };
  }

  private listModules(tools: AgentTools): string {
    if (!tools.vin) return "Connect to a vehicle first.";
    if (tools.modules.length === 0) return "No modules found for this vehicle yet.";
    return tools.modules.map((m) => `• ${m.code} - ${m.name}`).join("\n");
  }

  private async pointToTuning(tools: AgentTools): Promise<AgentResponse> {
    if (!tools.vin) return { reply: "Connect to a vehicle first." };
    const engineModule = tools.modules.find((m) => m.category === "engine");
    if (!engineModule) return { reply: "This vehicle doesn't have an engine module with tuning options in this app." };
    const packages = await tools.listFlashPackages(engineModule.code);
    const names = packages.map((p) => p.name).join(", ") || "none listed";
    return {
      reply:
        `${engineModule.name} has these simulated options: ${names}. Opening the Flash screen - ` +
        "you'll need to confirm the simulated-install acknowledgement yourself before starting, " +
        "same as always.",
      navigateTo: { screen: "Flash", moduleId: engineModule.id },
    };
  }

  private async toggleOption(action: string, query: string, tools: AgentTools): Promise<AgentResponse> {
    if (!tools.vin) return { reply: "Connect to a vehicle first." };
    const wantOn = /turn on|enable/.test(action);
    const target = findOption(tools.modules, query.trim());
    if (!target) return { reply: `I couldn't find a coding option matching "${query.trim()}".` };
    const { module, option } = target;
    if (option.kind !== "toggle") {
      return { reply: `"${option.label}" isn't a simple on/off setting - open ${module.name} in the app to change it.` };
    }
    const value = action === "toggle" ? !option.currentValue : wantOn;
    await tools.updateOption(module.id, option.id, value);
    return { reply: `Set "${option.label}" (${module.name}) to ${value ? "on" : "off"}.` };
  }

  private async handleConfirmation(input: string, tools: AgentTools): Promise<AgentResponse> {
    const pending = tools.pendingConfirmation!;
    const isYes = AFFIRMATIVE.test(input);
    const isNo = NEGATIVE.test(input);
    if (!isYes && !isNo) {
      return { reply: "Sorry, just need a yes or no on that pending confirmation first." };
    }
    tools.setPendingConfirmation(null);
    if (isNo) return { reply: "Okay, cancelled." };

    if (pending.kind === "clear-codes") {
      await tools.clearCodes();
      return { reply: "Cleared all stored/pending fault codes." };
    }
    if (pending.kind === "restore-backup") {
      await tools.restoreBackup(pending.backupId);
      return { reply: "Restored." };
    }
    return { reply: "Done." };
  }
}

function findOption(
  modules: ControlModule[],
  query: string
): { module: ControlModule; option: ControlModule["options"][number] } | null {
  const q = query.toLowerCase();
  for (const module of modules) {
    for (const option of module.options) {
      if (option.label.toLowerCase().includes(q)) return { module, option };
    }
  }
  return null;
}
