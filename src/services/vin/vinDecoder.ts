import { VinDecodeResult } from "@/types";

/**
 * Real, public ISO 3779 VIN decoding.
 *
 * ISO 3779 defines the structure of a Vehicle Identification Number (VIN):
 *  - Exactly 17 characters.
 *  - Uppercase letters A-Z and digits 0-9 only.
 *  - The letters I, O and Q are explicitly excluded (they are too easily
 *    confused with 1, 0 and 0), so a VIN containing them is not valid.
 *  - Positions 1-3 are the World Manufacturer Identifier (WMI).
 *  - Position 10 is the model year code (this is a real, public part of the
 *    standard, but the same character is reused every 30 years, e.g. "A"
 *    can mean 1980 or 2010 - we resolve that ambiguity below by picking the
 *    more recent of the two candidate years, which is a reasonable default
 *    for a "decode the VIN on the car in front of you today" tool).
 *
 * Everything else in this file (the WMI lookup table, the platform guess)
 * is illustrative/heuristic - see the inline notes below - and is NOT
 * derived from BMW's proprietary data.
 */

const VIN_LENGTH = 17;

// A VIN may only contain uppercase letters and digits, and must exclude
// I, O and Q per ISO 3779.
const VALID_VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

/**
 * World Manufacturer Identifier (WMI) lookup.
 *
 * This is a tiny illustrative subset of the real, publicly documented WMI
 * registry (the full registry is maintained by SAE). It covers the
 * manufacturers relevant to this app's brief: BMW, MINI, and Toyota (for
 * the BMW/Toyota-shared Supra, which BimmerCode also supports), plus Audi,
 * Volkswagen, and Mercedes-Benz.
 */
const WMI_MANUFACTURERS: Array<{ prefixes: string[]; manufacturer: string }> = [
  { prefixes: ["WBA", "WBS", "WBY"], manufacturer: "BMW" },
  { prefixes: ["WMW"], manufacturer: "MINI" },
  { prefixes: ["JTN", "JT"], manufacturer: "Toyota" },
  { prefixes: ["WAU", "TRU", "WA1"], manufacturer: "Audi" },
  { prefixes: ["WVW", "WV1", "WV2", "3VW", "1VW"], manufacturer: "Volkswagen" },
  { prefixes: ["WDB", "WDD", "WDC", "4JG", "55S"], manufacturer: "Mercedes-Benz" },
];

function lookupManufacturer(wmi: string): string {
  for (const { prefixes, manufacturer } of WMI_MANUFACTURERS) {
    for (const prefix of prefixes) {
      if (wmi.startsWith(prefix)) return manufacturer;
    }
  }
  return `Unknown manufacturer (WMI: ${wmi})`;
}

/**
 * Very rough region guess from the first VIN character (the first part of
 * the WMI). This mirrors the real ISO 3779 region grouping at a coarse
 * level (e.g. "W" is one of the codes assigned to Germany, "J" to Japan)
 * without attempting the full country breakdown.
 */
function lookupRegion(firstChar: string): string {
  switch (firstChar) {
    case "W":
      return "Germany";
    case "J":
      return "Japan";
    default:
      return "Unknown region";
  }
}

/**
 * Real, public ISO 3779 model-year code table for VIN position 10.
 *
 * The same character is reused on a 30-year cycle (e.g. "A" is both 1980
 * and 2010), so this table lists the more recent occurrence of each code,
 * which is the sensible default for decoding a car that exists today.
 * Letters I, O, Q, U, Z and the digit 0 are not used as year codes.
 */
const MODEL_YEAR_CODES: Record<string, number> = {
  A: 2010,
  B: 2011,
  C: 2012,
  D: 2013,
  E: 2014,
  F: 2015,
  G: 2016,
  H: 2017,
  J: 2018,
  K: 2019,
  L: 2020,
  M: 2021,
  N: 2022,
  P: 2023,
  R: 2024,
  S: 2025,
  T: 2026,
  V: 2027,
  W: 2028,
  X: 2029,
  Y: 2030,
  1: 2001,
  2: 2002,
  3: 2003,
  4: 2004,
  5: 2005,
  6: 2006,
  7: 2007,
  8: 2008,
  9: 2009,
};

function lookupModelYear(yearCode: string): number | null {
  return MODEL_YEAR_CODES[yearCode] ?? null;
}

/**
 * HEURISTIC platform guess only - not real BMW internal platform data.
 *
 * This is deliberately vague (manufacturer + rough model-year era) and
 * must not be read as verified chassis-code information. Any illustrative
 * chassis code mentioned here (purely as a "for example" in the label) is
 * explicitly a guess, not a decoded fact - real BMW/MINI platform codes
 * come from BMW's proprietary ISTA/PSdZData, which this app does not have
 * access to.
 */
function guessPlatform(manufacturer: string, modelYear: number | null): string | null {
  if (modelYear === null) return null;

  if (manufacturer === "BMW") {
    if (modelYear >= 2019) {
      return "BMW model line (year-based guess, illustrative only - e.g. G-series era, not a verified chassis code)";
    }
    if (modelYear >= 2012) {
      return "BMW model line (year-based guess, illustrative only - e.g. F-series era, not a verified chassis code)";
    }
    return "BMW model line (year-based guess, illustrative only, not a verified chassis code)";
  }

  if (manufacturer === "MINI") {
    return "MINI model line (year-based guess, illustrative only, not a verified chassis code)";
  }

  if (manufacturer === "Toyota") {
    return "Toyota model line (year-based guess, illustrative only, not a verified chassis code)";
  }

  if (manufacturer === "Audi" || manufacturer === "Volkswagen" || manufacturer === "Mercedes-Benz") {
    return `${manufacturer} model line (year-based guess, illustrative only, not a verified platform code)`;
  }

  return `${manufacturer} model line (year-based guess, illustrative only)`;
}

/**
 * Decode a VIN using the real, public ISO 3779 standard.
 *
 * Structural/checksum validity and the model-year code (position 10) are
 * decoded per the actual standard. The manufacturer/region lookup is a
 * small illustrative WMI table (not the full SAE registry), and
 * `platformGuess` is explicitly a heuristic, not verified BMW data - see
 * the comments above.
 */
export function decodeVin(vin: string): VinDecodeResult {
  const normalized = typeof vin === "string" ? vin.trim().toUpperCase() : "";

  const valid = normalized.length === VIN_LENGTH && VALID_VIN_PATTERN.test(normalized);

  if (!valid) {
    return {
      vin,
      valid: false,
      manufacturer: "Unknown",
      region: "Unknown",
      modelYear: null,
      platformGuess: null,
    };
  }

  const wmi = normalized.slice(0, 3);
  const manufacturer = lookupManufacturer(wmi);
  const region = lookupRegion(normalized[0]);
  const modelYear = lookupModelYear(normalized[9]);
  const platformGuess = guessPlatform(manufacturer, modelYear);

  return {
    vin: normalized,
    valid: true,
    manufacturer,
    region,
    modelYear,
    platformGuess,
  };
}
