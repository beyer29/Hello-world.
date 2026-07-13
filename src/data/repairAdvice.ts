/**
 * Repair-advice knowledge base for Beyer (src/services/agent), covering the
 * same public, SAE-standardized generic (P0xxx) codes as
 * src/data/dtcDescriptions.ts. Causes/guidance below reflect widely
 * published, generic automotive knowledge (the kind found in any repair
 * manual or OBD code reference) - not manufacturer-specific diagnostic
 * data, and not a substitute for a physical inspection. A code narrows
 * down what to check; it doesn't replace a mechanic confirming the actual
 * cause on the car in front of them.
 */

export type DtcUrgency = "low" | "medium" | "high";

export interface DtcAdvice {
  commonCauses: string[];
  urgency: DtcUrgency;
  guidance: string;
}

const MISFIRE_ADVICE: DtcAdvice = {
  commonCauses: [
    "Worn or fouled spark plug",
    "Failing ignition coil",
    "Clogged or failing fuel injector on that cylinder",
    "Low compression (e.g. worn valve/piston rings)",
    "Vacuum or intake leak",
  ],
  urgency: "high",
  guidance:
    "Worth having inspected soon regardless. If the check-engine light is FLASHING (not " +
    "just steady) during the misfire, that specifically means unburned fuel may be reaching " +
    "the catalytic converter and overheating it - stop driving and have it towed/inspected " +
    "rather than continuing on that engine.",
};

export const GENERIC_DTC_ADVICE: Record<string, DtcAdvice> = {
  P0101: {
    commonCauses: ["Dirty or failing mass airflow (MAF) sensor", "Air intake leak after the MAF sensor", "Dirty air filter"],
    urgency: "medium",
    guidance: "Usually drivable, but can cause rough idle or poor fuel economy - worth checking soon.",
  },
  P0102: {
    commonCauses: ["MAF sensor wiring/connector issue", "Failed MAF sensor"],
    urgency: "medium",
    guidance: "Similar to P0101 - affects how much air the engine thinks it's getting, which throws off fueling.",
  },
  P0113: {
    commonCauses: ["Intake air temperature sensor circuit fault", "Damaged sensor wiring"],
    urgency: "low",
    guidance: "Rarely urgent on its own, but can affect cold-start fueling - fine to schedule normally.",
  },
  P0128: {
    commonCauses: ["Stuck-open thermostat", "Low coolant level", "Failing coolant temperature sensor"],
    urgency: "low",
    guidance: "Usually just means the engine is taking too long to reach operating temperature - not urgent, but affects fuel economy and heater performance.",
  },
  P0130: {
    commonCauses: ["Failed or aged O2 sensor", "Exhaust leak upstream of the sensor", "Wiring/connector issue"],
    urgency: "medium",
    guidance: "Affects fuel trim accuracy - not an emergency, but schedule a check to avoid it affecting fuel economy/emissions over time.",
  },
  P0133: {
    commonCauses: ["Aging/slow-responding O2 sensor", "Exhaust leak near the sensor", "Fuel pressure issue"],
    urgency: "medium",
    guidance: "Same family as P0130 - not urgent, but worth checking so it doesn't mask other fueling issues.",
  },
  P0135: {
    commonCauses: ["Failed O2 sensor heater element", "Blown fuse for the heater circuit", "Wiring issue"],
    urgency: "low",
    guidance: "Mainly affects how fast the sensor becomes accurate after a cold start - schedule normally.",
  },
  P0171: {
    commonCauses: ["Vacuum leak", "Dirty/failing MAF sensor", "Weak fuel pump or clogged fuel filter", "Failing O2 sensor"],
    urgency: "medium",
    guidance: "System is running leaner than expected. Not an emergency, but persistent lean conditions can accelerate catalytic converter wear over time.",
  },
  P0172: {
    commonCauses: ["Leaking/failing fuel injector", "Failing fuel pressure regulator", "Dirty air filter", "Failing O2 sensor"],
    urgency: "medium",
    guidance: "System running richer than expected - watch for a fuel smell, rough idle, or reduced fuel economy; get it checked soon if any of those appear.",
  },
  P0174: {
    commonCauses: ["Same as P0171, but on the other engine bank"],
    urgency: "medium",
    guidance: "Same guidance as P0171.",
  },
  P0175: {
    commonCauses: ["Same as P0172, but on the other engine bank"],
    urgency: "medium",
    guidance: "Same guidance as P0172.",
  },
  P0300: MISFIRE_ADVICE,
  P0301: MISFIRE_ADVICE,
  P0302: MISFIRE_ADVICE,
  P0303: MISFIRE_ADVICE,
  P0304: MISFIRE_ADVICE,
  P0305: MISFIRE_ADVICE,
  P0306: MISFIRE_ADVICE,
  P0401: {
    commonCauses: ["Clogged EGR valve/passages (carbon buildup)", "Failed EGR valve", "Faulty EGR position sensor"],
    urgency: "low",
    guidance: "Mainly an emissions concern; not urgent for drivability, but will typically fail an emissions test.",
  },
  P0402: {
    commonCauses: ["EGR valve stuck open", "Faulty EGR position sensor"],
    urgency: "medium",
    guidance: "Can cause rough idle or stalling if the valve is stuck open - worth checking sooner if you notice idle issues.",
  },
  P0420: {
    commonCauses: ["Aging/failing catalytic converter", "Upstream engine issue (misfire, rich/lean condition) damaging the catalyst", "Failed O2 sensor giving a false reading"],
    urgency: "medium",
    guidance: "Not an immediate drivability risk by itself, but check for - and fix - any misfire or fuel-trim codes first, since those often cause this one.",
  },
  P0430: {
    commonCauses: ["Same as P0420, but on the other engine bank"],
    urgency: "medium",
    guidance: "Same guidance as P0420.",
  },
  P0440: {
    commonCauses: ["Loose or damaged fuel cap", "Cracked EVAP hose", "Failed purge or vent valve"],
    urgency: "low",
    guidance: "Check the fuel cap is fully tightened first - that alone causes a large share of these. Not urgent otherwise.",
  },
  P0442: {
    commonCauses: ["Small EVAP system leak (hose, seal, or cap)", "Loose fuel cap"],
    urgency: "low",
    guidance: "Emissions-related, not a drivability concern. Will likely fail an emissions test until fixed.",
  },
  P0455: {
    commonCauses: ["Missing or badly damaged fuel cap", "Large crack/disconnection in an EVAP hose"],
    urgency: "low",
    guidance: "Same family as P0442 but a larger leak - still not a drivability emergency, but check the fuel cap and visible EVAP hoses.",
  },
  P0500: {
    commonCauses: ["Failed vehicle speed sensor", "Wiring issue between sensor and control module"],
    urgency: "medium",
    guidance: "Can affect ABS, cruise control, and transmission shift behavior depending on the vehicle - worth checking soon if you notice those acting oddly.",
  },
  P0505: {
    commonCauses: ["Dirty throttle body", "Failing idle air control valve", "Vacuum leak"],
    urgency: "medium",
    guidance: "Usually shows up as rough, high, or fluctuating idle - annoying but rarely dangerous; check soon for comfort/reliability.",
  },
  P0601: {
    commonCauses: ["Internal control module fault", "Corrupted software after an incomplete update"],
    urgency: "medium",
    guidance: "Can cause inconsistent behavior from whatever module reported it - worth a professional diagnostic scan to see which module and why.",
  },
  P0700: {
    commonCauses: ["This is a heads-up code from the engine ECU that the TRANSMISSION control module has its own stored codes"],
    urgency: "medium",
    guidance: "Scan the transmission control module specifically for the real underlying code - P0700 alone doesn't say what's wrong.",
  },
};

export function adviseOnDtc(code: string): DtcAdvice | null {
  return GENERIC_DTC_ADVICE[code] ?? null;
}
