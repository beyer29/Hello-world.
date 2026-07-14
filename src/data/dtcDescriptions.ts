/**
 * Descriptions for SAE-standardized GENERIC diagnostic trouble codes
 * (the P0xxx range defined by SAE J2012 / ISO 15031-6). These definitions
 * are public and identical across every manufacturer - unlike the
 * manufacturer-specific P1xxx/P3xxx/B/C/U ranges, which vary by OEM and
 * are proprietary, so this app does not attempt to define those; codes
 * outside this table are reported as unknown rather than guessed.
 */
export const GENERIC_DTC_DESCRIPTIONS: Record<string, string> = {
  P0101: "Mass or volume air flow circuit range/performance problem",
  P0102: "Mass or volume air flow circuit low input",
  P0113: "Intake air temperature circuit high input",
  P0128: "Coolant thermostat (coolant temperature below regulating temperature)",
  P0130: "O2 sensor circuit malfunction (bank 1, sensor 1)",
  P0133: "O2 sensor circuit slow response (bank 1, sensor 1)",
  P0135: "O2 sensor heater circuit malfunction (bank 1, sensor 1)",
  P0171: "System too lean (bank 1)",
  P0172: "System too rich (bank 1)",
  P0174: "System too lean (bank 2)",
  P0175: "System too rich (bank 2)",
  P0300: "Random/multiple cylinder misfire detected",
  P0301: "Cylinder 1 misfire detected",
  P0302: "Cylinder 2 misfire detected",
  P0303: "Cylinder 3 misfire detected",
  P0304: "Cylinder 4 misfire detected",
  P0305: "Cylinder 5 misfire detected",
  P0306: "Cylinder 6 misfire detected",
  P0401: "Exhaust gas recirculation flow insufficient",
  P0402: "Exhaust gas recirculation flow excessive",
  P0420: "Catalyst system efficiency below threshold (bank 1)",
  P0430: "Catalyst system efficiency below threshold (bank 2)",
  P0440: "Evaporative emission control system malfunction",
  P0442: "Evaporative emission control system leak detected (small leak)",
  P0455: "Evaporative emission control system leak detected (large leak)",
  P0500: "Vehicle speed sensor malfunction",
  P0505: "Idle control system malfunction",
  P0601: "Internal control module memory checksum error",
  P0700: "Transmission control system malfunction",
};

export function describeDtc(code: string): string | null {
  return GENERIC_DTC_DESCRIPTIONS[code] ?? null;
}
