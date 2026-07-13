import { ControlModule } from "@/types";

/**
 * Sample control-module and coding-option catalogue.
 *
 * Every value below is illustrative demo data modelled loosely on the kinds
 * of options real coding/diagnostic tools expose (mirror-fold-on-lock, PDC
 * auto-off, seatbelt chime, etc) across BMW/MINI (and the BMW-co-developed
 * Toyota Supra), Audi, Volkswagen, and Mercedes-Benz. None of it is a
 * verified byte offset into a real control unit - see src/data/README.md
 * for why, and for how to plug in your own verified coding definitions.
 * `compatibleManufacturers` on each module is matched against the connected
 * vehicle's decoded VIN manufacturer (src/services/coding/codingService.ts)
 * so only relevant modules show up for a given car.
 */

const BMW_GROUP = ["BMW", "MINI", "Toyota"];

export const SAMPLE_MODULES: ControlModule[] = [
  {
    id: "frm",
    code: "FRM",
    name: "Footwell Module",
    description: "Interior/exterior lighting, mirrors, and central locking behavior.",
    category: "lighting",
    compatibleManufacturers: BMW_GROUP,
    supportsFlashing: false,
    options: [
      {
        kind: "toggle",
        id: "frm.mirror_fold_on_lock",
        label: "Fold mirrors on lock",
        description: "Automatically fold the exterior mirrors when the car is locked.",
        currentValue: false,
        defaultValue: false,
        sampleData: true,
      },
      {
        kind: "toggle",
        id: "frm.welcome_lights",
        label: "Welcome lighting",
        description: "Flash exterior lights briefly when unlocking the car.",
        currentValue: true,
        defaultValue: true,
        sampleData: true,
      },
      {
        kind: "choice",
        id: "frm.daytime_running_lights",
        label: "Daytime running light mode",
        description: "Behavior of DRLs relative to headlights.",
        choices: [
          { value: "standard", label: "Standard" },
          { value: "with_turn_signal", label: "Dim with turn signal" },
          { value: "off", label: "Disabled" },
        ],
        currentValue: "standard",
        defaultValue: "standard",
        sampleData: true,
      },
    ],
  },
  {
    id: "kombi",
    code: "KOMBI",
    name: "Instrument Cluster",
    description: "Gauges, warnings, and startup behavior of the instrument cluster.",
    category: "instrument-cluster",
    compatibleManufacturers: BMW_GROUP,
    supportsFlashing: false,
    options: [
      {
        kind: "toggle",
        id: "kombi.skip_startup_screen",
        label: "Skip iDrive startup warning",
        description: "Skip the legal disclaimer screen shown at every startup.",
        currentValue: false,
        defaultValue: false,
        sampleData: true,
      },
      {
        kind: "toggle",
        id: "kombi.seatbelt_chime",
        label: "Seatbelt chime",
        description: "Audible chime when a front seat occupant is unbelted.",
        currentValue: true,
        defaultValue: true,
        sampleData: true,
      },
      {
        kind: "toggle",
        id: "kombi.digital_speedo",
        label: "Always-on digital speedometer",
        description: "Show a persistent digital speed readout in the cluster.",
        currentValue: false,
        defaultValue: false,
        sampleData: true,
      },
    ],
  },
  {
    id: "ihka",
    code: "IHKA",
    name: "Climate Control",
    description: "HVAC automation and comfort behavior.",
    category: "climate",
    compatibleManufacturers: BMW_GROUP,
    supportsFlashing: false,
    options: [
      {
        kind: "toggle",
        id: "ihka.auto_recirculation",
        label: "Automatic air recirculation",
        description: "Automatically recirculate cabin air in heavy traffic.",
        currentValue: true,
        defaultValue: true,
        sampleData: true,
      },
      {
        kind: "numeric",
        id: "ihka.residual_heat_minutes",
        label: "Residual heat runtime",
        description: "How long the fan runs on residual engine heat after shutdown.",
        min: 0,
        max: 30,
        step: 5,
        unit: "min",
        currentValue: 10,
        defaultValue: 10,
        sampleData: true,
      },
    ],
  },
  {
    id: "pdc",
    code: "PDC",
    name: "Park Distance Control",
    description: "Parking sensors and rear-view camera timing.",
    category: "parking-assist",
    compatibleManufacturers: BMW_GROUP,
    supportsFlashing: false,
    options: [
      {
        kind: "choice",
        id: "pdc.auto_off_speed",
        label: "Auto-off speed threshold",
        description: "Vehicle speed above which parking sensors/camera turn off automatically.",
        choices: [
          { value: "10", label: "10 km/h" },
          { value: "20", label: "20 km/h" },
          { value: "35", label: "35 km/h" },
          { value: "never", label: "Never auto-off" },
        ],
        currentValue: "10",
        defaultValue: "10",
        sampleData: true,
      },
      {
        kind: "toggle",
        id: "pdc.volume_beep",
        label: "Audible proximity beep",
        description: "Play an audible beep as the car approaches an obstacle.",
        currentValue: true,
        defaultValue: true,
        sampleData: true,
      },
    ],
  },
  {
    id: "comfort_access",
    code: "CAS",
    name: "Comfort Access / Car Access System",
    description: "Keyless entry, remote start, and central locking behavior.",
    category: "security",
    compatibleManufacturers: BMW_GROUP,
    supportsFlashing: false,
    options: [
      {
        kind: "toggle",
        id: "cas.unlock_all_doors",
        label: "Unlock all doors on first press",
        description: "Unlock every door on the first button press instead of driver door only.",
        currentValue: false,
        defaultValue: false,
        sampleData: true,
      },
    ],
  },
  {
    id: "egs",
    code: "EGS",
    name: "Transmission Control (EGS)",
    description:
      "Gearbox/transmission control unit. Coding options below are safe parameter " +
      "toggles; the Flash tab additionally demonstrates - in simulation only - the " +
      "workflow real TCU firmware updates would follow.",
    category: "transmission",
    compatibleManufacturers: BMW_GROUP,
    supportsFlashing: true,
    options: [
      {
        kind: "toggle",
        id: "egs.launch_control_display",
        label: "Show launch control indicator",
        description: "Display a launch-control-ready icon in the cluster when conditions are met.",
        currentValue: false,
        defaultValue: false,
        sampleData: true,
      },
      {
        kind: "choice",
        id: "egs.shift_display_mode",
        label: "Shift indicator style",
        description: "How the current/recommended gear is displayed in the cluster.",
        choices: [
          { value: "numeric", label: "Numeric gear" },
          { value: "sport", label: "Sport display" },
          { value: "hidden", label: "Hidden" },
        ],
        currentValue: "numeric",
        defaultValue: "numeric",
        sampleData: true,
      },
    ],
  },
  {
    id: "dme",
    code: "DME",
    name: "Engine Control (DME/DDE)",
    description:
      "Engine control unit. Coding options below are safe cosmetic/behavior toggles; " +
      "the Flash tab additionally lists Stage 1/2/3 performance tuning packages - in " +
      "simulation only. Real ECU performance tuning changes fuel, ignition timing, and " +
      "boost tables, and is a fundamentally different (and higher-risk) category from " +
      "coding - see src/services/flash/README.md.",
    category: "engine",
    compatibleManufacturers: BMW_GROUP,
    supportsFlashing: true,
    options: [
      {
        kind: "toggle",
        id: "dme.exhaust_flap_always_open",
        label: "Exhaust flap always open",
        description: "Keep the active exhaust valve open at all RPM/load instead of only under load.",
        currentValue: false,
        defaultValue: false,
        sampleData: true,
      },
      {
        kind: "toggle",
        id: "dme.raise_cold_start_idle",
        label: "Raise cold-start idle RPM",
        description: "Slightly raise idle speed while the engine is still warming up.",
        currentValue: false,
        defaultValue: false,
        sampleData: true,
      },
    ],
  },

  // --- Audi ---
  {
    id: "audi_ccm",
    code: "CCM",
    name: "Central Convenience Module",
    description: "Convenience closing, mirrors, and interior lighting behavior.",
    category: "comfort",
    compatibleManufacturers: ["Audi"],
    supportsFlashing: false,
    options: [
      {
        kind: "toggle",
        id: "audi_ccm.convenience_closing",
        label: "Close windows/sunroof on remote lock hold",
        description: "Holding the lock button on the key closes open windows and the sunroof.",
        currentValue: false,
        defaultValue: false,
        sampleData: true,
      },
      {
        kind: "toggle",
        id: "audi_ccm.mirror_fold_on_lock",
        label: "Fold mirrors on lock",
        description: "Automatically fold the exterior mirrors when the car is locked.",
        currentValue: false,
        defaultValue: false,
        sampleData: true,
      },
    ],
  },
  {
    id: "audi_kombi",
    code: "KOMBI",
    name: "Instrument Cluster",
    description: "Gauges, warnings, and startup behavior of the instrument cluster.",
    category: "instrument-cluster",
    compatibleManufacturers: ["Audi"],
    supportsFlashing: false,
    options: [
      {
        kind: "toggle",
        id: "audi_kombi.seatbelt_chime",
        label: "Seatbelt chime",
        description: "Audible chime when a front seat occupant is unbelted.",
        currentValue: true,
        defaultValue: true,
        sampleData: true,
      },
      {
        kind: "toggle",
        id: "audi_kombi.digital_speedo",
        label: "Always-on digital speedometer",
        description: "Show a persistent digital speed readout in the cluster.",
        currentValue: false,
        defaultValue: false,
        sampleData: true,
      },
    ],
  },
  {
    id: "audi_gateway",
    code: "GATEWAY",
    name: "Central Gateway (J533)",
    description: "The Gateway module coordinates coding across the car's bus systems.",
    category: "security",
    compatibleManufacturers: ["Audi"],
    supportsFlashing: false,
    options: [
      {
        kind: "toggle",
        id: "audi_gateway.unlock_all_doors",
        label: "Unlock all doors on first press",
        description: "Unlock every door on the first button press instead of driver door only.",
        currentValue: false,
        defaultValue: false,
        sampleData: true,
      },
    ],
  },
  {
    id: "audi_ecu",
    code: "ECU",
    name: "Engine Control (MED17)",
    description:
      "Engine control unit. Coding options below are safe cosmetic/behavior toggles; " +
      "the Flash tab additionally lists Stage 1/2/3 performance tuning packages - in " +
      "simulation only. See src/services/flash/README.md.",
    category: "engine",
    compatibleManufacturers: ["Audi"],
    supportsFlashing: true,
    options: [
      {
        kind: "toggle",
        id: "audi_ecu.exhaust_flap_always_open",
        label: "Exhaust flap always open",
        description: "Keep the active exhaust valve open at all RPM/load instead of only under load.",
        currentValue: false,
        defaultValue: false,
        sampleData: true,
      },
      {
        kind: "toggle",
        id: "audi_ecu.raise_cold_start_idle",
        label: "Raise cold-start idle RPM",
        description: "Slightly raise idle speed while the engine is still warming up.",
        currentValue: false,
        defaultValue: false,
        sampleData: true,
      },
    ],
  },

  // --- Volkswagen ---
  {
    id: "vw_ccm",
    code: "CCM",
    name: "Comfort Control Module",
    description: "Convenience closing, mirrors, and interior lighting behavior.",
    category: "comfort",
    compatibleManufacturers: ["Volkswagen"],
    supportsFlashing: false,
    options: [
      {
        kind: "toggle",
        id: "vw_ccm.convenience_closing",
        label: "Close windows/sunroof on remote lock hold",
        description: "Holding the lock button on the key closes open windows and the sunroof.",
        currentValue: false,
        defaultValue: false,
        sampleData: true,
      },
      {
        kind: "toggle",
        id: "vw_ccm.mirror_fold_on_lock",
        label: "Fold mirrors on lock",
        description: "Automatically fold the exterior mirrors when the car is locked.",
        currentValue: false,
        defaultValue: false,
        sampleData: true,
      },
    ],
  },
  {
    id: "vw_kombi",
    code: "KOMBI",
    name: "Instrument Cluster",
    description: "Gauges, warnings, and startup behavior of the instrument cluster.",
    category: "instrument-cluster",
    compatibleManufacturers: ["Volkswagen"],
    supportsFlashing: false,
    options: [
      {
        kind: "toggle",
        id: "vw_kombi.seatbelt_chime",
        label: "Seatbelt chime",
        description: "Audible chime when a front seat occupant is unbelted.",
        currentValue: true,
        defaultValue: true,
        sampleData: true,
      },
      {
        kind: "toggle",
        id: "vw_kombi.digital_speedo",
        label: "Always-on digital speedometer",
        description: "Show a persistent digital speed readout in the cluster.",
        currentValue: false,
        defaultValue: false,
        sampleData: true,
      },
    ],
  },
  {
    id: "vw_gateway",
    code: "GATEWAY",
    name: "Central Gateway (J533)",
    description: "The Gateway module coordinates coding across the car's bus systems.",
    category: "security",
    compatibleManufacturers: ["Volkswagen"],
    supportsFlashing: false,
    options: [
      {
        kind: "toggle",
        id: "vw_gateway.unlock_all_doors",
        label: "Unlock all doors on first press",
        description: "Unlock every door on the first button press instead of driver door only.",
        currentValue: false,
        defaultValue: false,
        sampleData: true,
      },
    ],
  },
  {
    id: "vw_ecu",
    code: "ECU",
    name: "Engine Control (MED17)",
    description:
      "Engine control unit. Coding options below are safe cosmetic/behavior toggles; " +
      "the Flash tab additionally lists Stage 1/2/3 performance tuning packages - in " +
      "simulation only. See src/services/flash/README.md.",
    category: "engine",
    compatibleManufacturers: ["Volkswagen"],
    supportsFlashing: true,
    options: [
      {
        kind: "toggle",
        id: "vw_ecu.exhaust_flap_always_open",
        label: "Exhaust flap always open",
        description: "Keep the active exhaust valve open at all RPM/load instead of only under load.",
        currentValue: false,
        defaultValue: false,
        sampleData: true,
      },
      {
        kind: "toggle",
        id: "vw_ecu.raise_cold_start_idle",
        label: "Raise cold-start idle RPM",
        description: "Slightly raise idle speed while the engine is still warming up.",
        currentValue: false,
        defaultValue: false,
        sampleData: true,
      },
    ],
  },

  // --- Mercedes-Benz ---
  {
    id: "mb_sam",
    code: "SAM",
    name: "SAM (Signal Acquisition Module)",
    description: "Body/comfort electronics: mirrors, interior lighting, and locking behavior.",
    category: "comfort",
    compatibleManufacturers: ["Mercedes-Benz"],
    supportsFlashing: false,
    options: [
      {
        kind: "toggle",
        id: "mb_sam.mirror_fold_on_lock",
        label: "Fold mirrors on lock",
        description: "Automatically fold the exterior mirrors when the car is locked.",
        currentValue: false,
        defaultValue: false,
        sampleData: true,
      },
      {
        kind: "numeric",
        id: "mb_sam.interior_light_delay",
        label: "Interior light delay",
        description: "How long interior lights stay on after the doors are closed.",
        min: 0,
        max: 60,
        step: 10,
        unit: "s",
        currentValue: 20,
        defaultValue: 20,
        sampleData: true,
      },
    ],
  },
  {
    id: "mb_kombi",
    code: "KOMBI",
    name: "Instrument Cluster",
    description: "Gauges, warnings, and startup behavior of the instrument cluster.",
    category: "instrument-cluster",
    compatibleManufacturers: ["Mercedes-Benz"],
    supportsFlashing: false,
    options: [
      {
        kind: "toggle",
        id: "mb_kombi.seatbelt_chime",
        label: "Seatbelt chime",
        description: "Audible chime when a front seat occupant is unbelted.",
        currentValue: true,
        defaultValue: true,
        sampleData: true,
      },
      {
        kind: "toggle",
        id: "mb_kombi.digital_speedo",
        label: "Always-on digital speedometer",
        description: "Show a persistent digital speed readout in the cluster.",
        currentValue: false,
        defaultValue: false,
        sampleData: true,
      },
    ],
  },
  {
    id: "mb_ezs",
    code: "EZS",
    name: "EZS (Ignition Starter Switch)",
    description: "Mercedes-Benz's ignition/immobilizer coordination module.",
    category: "security",
    compatibleManufacturers: ["Mercedes-Benz"],
    supportsFlashing: false,
    options: [
      {
        kind: "toggle",
        id: "mb_ezs.comfort_start",
        label: "Comfort start (remote engine start)",
        description: "Allow starting the engine remotely from the key fob.",
        currentValue: false,
        defaultValue: false,
        sampleData: true,
      },
    ],
  },
  {
    id: "mb_me",
    code: "ME",
    name: "Engine Control (ME/CDI)",
    description:
      "Engine control unit. Coding options below are safe cosmetic/behavior toggles; " +
      "the Flash tab additionally lists Stage 1/2/3 performance tuning packages - in " +
      "simulation only. See src/services/flash/README.md.",
    category: "engine",
    compatibleManufacturers: ["Mercedes-Benz"],
    supportsFlashing: true,
    options: [
      {
        kind: "toggle",
        id: "mb_me.exhaust_flap_always_open",
        label: "Exhaust flap always open",
        description: "Keep the active exhaust valve open at all RPM/load instead of only under load.",
        currentValue: false,
        defaultValue: false,
        sampleData: true,
      },
      {
        kind: "toggle",
        id: "mb_me.raise_cold_start_idle",
        label: "Raise cold-start idle RPM",
        description: "Slightly raise idle speed while the engine is still warming up.",
        currentValue: false,
        defaultValue: false,
        sampleData: true,
      },
    ],
  },
];

export function findModuleById(id: string): ControlModule | undefined {
  return SAMPLE_MODULES.find((m) => m.id === id);
}
