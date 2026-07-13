import AsyncStorage from "@react-native-async-storage/async-storage";
import { CodingService, ControlModule } from "@/types";
import { SAMPLE_MODULES } from "@/data/modules";
import { decodeVin } from "@/services/vin";

const STORAGE_PREFIX = "bimmercoder:coding:";

/**
 * Applies coding writes to a per-VIN in-memory/AsyncStorage-backed copy of
 * the sample catalogue rather than over the OBD transport. The shipped
 * catalogue is sample data (see src/data/README.md), so "writing" it to a
 * real control unit would be meaningless at best and unsafe at worst - this
 * service demonstrates the read/write/reset UX without making that claim.
 * Modules are filtered to the connected VIN's decoded manufacturer so an
 * Audi doesn't show BMW-only modules and vice versa.
 */
export class SampleCodingService implements CodingService {
  private cache = new Map<string, ControlModule[]>();

  async readModules(vin: string): Promise<ControlModule[]> {
    const cached = this.cache.get(vin);
    if (cached) return cloneModules(cached);

    const stored = await AsyncStorage.getItem(STORAGE_PREFIX + vin);
    const modules: ControlModule[] = stored
      ? JSON.parse(stored)
      : cloneModules(modulesForVin(vin));
    this.cache.set(vin, modules);
    return cloneModules(modules);
  }

  async writeOption(
    moduleId: string,
    optionId: string,
    value: boolean | string | number
  ): Promise<void> {
    const [vin, modules] = this.findCachedEntry(moduleId);
    const option = findOption(modules, moduleId, optionId);
    option.currentValue = value as never;
    await this.persist(vin, modules);
  }

  async resetOptionToDefault(moduleId: string, optionId: string): Promise<void> {
    const [vin, modules] = this.findCachedEntry(moduleId);
    const option = findOption(modules, moduleId, optionId);
    option.currentValue = option.defaultValue as never;
    await this.persist(vin, modules);
  }

  private findCachedEntry(moduleId: string): [string, ControlModule[]] {
    for (const [vin, modules] of this.cache.entries()) {
      if (modules.some((m) => m.id === moduleId)) return [vin, modules];
    }
    throw new Error(`No modules loaded for module id "${moduleId}" - call readModules first`);
  }

  private async persist(vin: string, modules: ControlModule[]): Promise<void> {
    this.cache.set(vin, modules);
    await AsyncStorage.setItem(STORAGE_PREFIX + vin, JSON.stringify(modules));
  }
}

function findOption(modules: ControlModule[], moduleId: string, optionId: string) {
  const module = modules.find((m) => m.id === moduleId);
  if (!module) throw new Error(`Unknown module id "${moduleId}"`);
  const option = module.options.find((o) => o.id === optionId);
  if (!option) throw new Error(`Unknown option id "${optionId}" on module "${moduleId}"`);
  return option;
}

function cloneModules(modules: ControlModule[]): ControlModule[] {
  return JSON.parse(JSON.stringify(modules));
}

function modulesForVin(vin: string): ControlModule[] {
  const { manufacturer } = decodeVin(vin);
  return SAMPLE_MODULES.filter((m) => m.compatibleManufacturers.includes(manufacturer));
}
