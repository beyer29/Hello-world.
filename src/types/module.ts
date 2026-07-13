export type CodingOptionKind = "toggle" | "choice" | "numeric";

interface BaseCodingOption {
  id: string;
  label: string;
  description: string;
  /**
   * Every option shipped in this codebase is illustrative sample data, not a
   * verified real-world BMW byte offset - see src/data/README.md.
   */
  sampleData: true;
}

export interface ToggleCodingOption extends BaseCodingOption {
  kind: "toggle";
  currentValue: boolean;
  defaultValue: boolean;
}

export interface ChoiceCodingOption extends BaseCodingOption {
  kind: "choice";
  choices: { value: string; label: string }[];
  currentValue: string;
  defaultValue: string;
}

export interface NumericCodingOption extends BaseCodingOption {
  kind: "numeric";
  min: number;
  max: number;
  step: number;
  unit?: string;
  currentValue: number;
  defaultValue: number;
}

export type CodingOption = ToggleCodingOption | ChoiceCodingOption | NumericCodingOption;

export type ModuleCategory =
  | "lighting"
  | "instrument-cluster"
  | "climate"
  | "parking-assist"
  | "transmission"
  | "engine"
  | "comfort"
  | "security"
  | "other";

export interface ControlModule {
  id: string;
  code: string;
  name: string;
  description: string;
  category: ModuleCategory;
  /**
   * Which VinDecodeResult.manufacturer values this module applies to. Used
   * to show only the modules relevant to the connected vehicle - see
   * src/services/coding/codingService.ts.
   */
  compatibleManufacturers: string[];
  supportsFlashing: boolean;
  options: CodingOption[];
}
