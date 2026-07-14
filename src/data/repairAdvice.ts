/**
 * Repair-advice knowledge base for Beyer (src/services/agent), covering the
 * same public, SAE-standardized generic (P0xxx) codes as
 * src/data/dtcDescriptions.ts. Causes/guidance below reflect widely
 * published, generic automotive knowledge (the kind found in any repair
 * manual or OBD code reference) - not manufacturer-specific diagnostic
 * data, and not a substitute for a physical inspection. A code narrows
 * down what to check; it doesn't replace a mechanic confirming the actual
 * cause on the car in front of them.
 *
 * `clearingLikelihood` answers a different question from `urgency`: not
 * "how bad is this" but "if I just clear the code, will it stay gone".
 * Clearing a code never repairs anything by itself - it only resets the
 * light. Whether the code returns depends on whether the underlying
 * condition is actually gone (either because it was transient, or because
 * something was actually fixed).
 */

export type DtcUrgency = "low" | "medium" | "high";

/**
 * - "often-resolves": commonly caused by something simple/self-correcting
 *   (a loose gas cap, a connector that reseated itself) - clearing has a
 *   decent chance of sticking without any real repair.
 * - "may-return": genuinely depends on whether the underlying cause was
 *   transient or not - could go either way.
 * - "will-likely-return": caused by a real component/wear issue that
 *   clearing does nothing about - expect it back within a drive cycle or
 *   two unless something is actually repaired.
 */
export type ClearingLikelihood = "often-resolves" | "may-return" | "will-likely-return";

export interface DtcAdvice {
  commonCauses: string[];
  urgency: DtcUrgency;
  guidance: string;
  clearingLikelihood: ClearingLikelihood;
  clearingNote: string;
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
  clearingLikelihood: "will-likely-return",
  clearingNote:
    "Clearing it turns the light off, but a genuine misfire almost always comes back within a " +
    "short drive unless the actual part (plug/coil/injector) is replaced. Don't rely on " +
    "clearing alone here.",
};

export const GENERIC_DTC_ADVICE: Record<string, DtcAdvice> = {
  P0101: {
    commonCauses: ["Dirty or failing mass airflow (MAF) sensor", "Air intake leak after the MAF sensor", "Dirty air filter"],
    urgency: "medium",
    guidance: "Usually drivable, but can cause rough idle or poor fuel economy - worth checking soon.",
    clearingLikelihood: "may-return",
    clearingNote: "If it was a loose connector or a dirty sensor that got jostled, clearing it can stick. If the sensor's actually failing, it'll come back within a few drives.",
  },
  P0102: {
    commonCauses: ["MAF sensor wiring/connector issue", "Failed MAF sensor"],
    urgency: "medium",
    guidance: "Similar to P0101 - affects how much air the engine thinks it's getting, which throws off fueling.",
    clearingLikelihood: "will-likely-return",
    clearingNote: "A \"low input\" fault like this is usually a real sensor/wiring failure, not a transient blip - expect it to return until checked.",
  },
  P0113: {
    commonCauses: ["Intake air temperature sensor circuit fault", "Damaged sensor wiring"],
    urgency: "low",
    guidance: "Rarely urgent on its own, but can affect cold-start fueling - fine to schedule normally.",
    clearingLikelihood: "may-return",
    clearingNote: "Can be a one-off electrical glitch. Clear it and see - if it comes right back, the sensor/wiring needs a look.",
  },
  P0128: {
    commonCauses: ["Stuck-open thermostat", "Low coolant level", "Failing coolant temperature sensor"],
    urgency: "low",
    guidance: "Usually just means the engine is taking too long to reach operating temperature - not urgent, but affects fuel economy and heater performance.",
    clearingLikelihood: "may-return",
    clearingNote: "Very short trips in cold weather can trigger this on a perfectly good thermostat. Clear it; if it only reappears in cold weather after short drives, it may not be a real fault. If it comes back every time, the thermostat likely needs replacing.",
  },
  P0130: {
    commonCauses: ["Failed or aged O2 sensor", "Exhaust leak upstream of the sensor", "Wiring/connector issue"],
    urgency: "medium",
    guidance: "Affects fuel trim accuracy - not an emergency, but schedule a check to avoid it affecting fuel economy/emissions over time.",
    clearingLikelihood: "will-likely-return",
    clearingNote: "An aged/failed O2 sensor doesn't un-fail itself - expect this to return until the sensor (or the exhaust leak causing it) is addressed.",
  },
  P0133: {
    commonCauses: ["Aging/slow-responding O2 sensor", "Exhaust leak near the sensor", "Fuel pressure issue"],
    urgency: "medium",
    guidance: "Same family as P0130 - not urgent, but worth checking so it doesn't mask other fueling issues.",
    clearingLikelihood: "may-return",
    clearingNote: "A borderline-slow sensor can come and go for a while before it's bad enough to trigger consistently - don't be surprised if it returns intermittently rather than every drive.",
  },
  P0135: {
    commonCauses: ["Failed O2 sensor heater element", "Blown fuse for the heater circuit", "Wiring issue"],
    urgency: "low",
    guidance: "Mainly affects how fast the sensor becomes accurate after a cold start - schedule normally.",
    clearingLikelihood: "will-likely-return",
    clearingNote: "A failed heater element or blown fuse doesn't fix itself - expect this back on the next cold start until repaired.",
  },
  P0171: {
    commonCauses: ["Vacuum leak", "Dirty/failing MAF sensor", "Weak fuel pump or clogged fuel filter", "Failing O2 sensor"],
    urgency: "medium",
    guidance: "System is running leaner than expected. Not an emergency, but persistent lean conditions can accelerate catalytic converter wear over time.",
    clearingLikelihood: "may-return",
    clearingNote: "If a vacuum hose had worked loose and reseated itself, clearing can stick. If it's a genuine leak or a weak fuel pump, it'll come back within a few drive cycles.",
  },
  P0172: {
    commonCauses: ["Leaking/failing fuel injector", "Failing fuel pressure regulator", "Dirty air filter", "Failing O2 sensor"],
    urgency: "medium",
    guidance: "System running richer than expected - watch for a fuel smell, rough idle, or reduced fuel economy; get it checked soon if any of those appear.",
    clearingLikelihood: "may-return",
    clearingNote: "A dirty air filter causing this can be fixed by just replacing the filter - clearing after that will likely stick. A leaking injector or bad regulator will keep bringing it back.",
  },
  P0174: {
    commonCauses: ["Same as P0171, but on the other engine bank"],
    urgency: "medium",
    guidance: "Same guidance as P0171.",
    clearingLikelihood: "may-return",
    clearingNote: "Same as P0171 - depends on whether the cause was transient (reseated hose) or ongoing (real leak/weak pump).",
  },
  P0175: {
    commonCauses: ["Same as P0172, but on the other engine bank"],
    urgency: "medium",
    guidance: "Same guidance as P0172.",
    clearingLikelihood: "may-return",
    clearingNote: "Same as P0172 - a dirty filter fix will likely stick; a failing injector/regulator won't.",
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
    clearingLikelihood: "will-likely-return",
    clearingNote: "Carbon buildup doesn't clear itself - this will almost always come back until the EGR valve/passages are cleaned or the valve replaced.",
  },
  P0402: {
    commonCauses: ["EGR valve stuck open", "Faulty EGR position sensor"],
    urgency: "medium",
    guidance: "Can cause rough idle or stalling if the valve is stuck open - worth checking sooner if you notice idle issues.",
    clearingLikelihood: "will-likely-return",
    clearingNote: "A mechanically stuck valve stays stuck after you clear the code - expect it back quickly.",
  },
  P0420: {
    commonCauses: ["Aging/failing catalytic converter", "Upstream engine issue (misfire, rich/lean condition) damaging the catalyst", "Failed O2 sensor giving a false reading"],
    urgency: "medium",
    guidance: "Not an immediate drivability risk by itself, but check for - and fix - any misfire or fuel-trim codes first, since those often cause this one.",
    clearingLikelihood: "may-return",
    clearingNote: "If this was triggered by a misfire or lean/rich condition that's now actually fixed, clearing it can stick. If the catalytic converter itself is worn out, it'll return.",
  },
  P0430: {
    commonCauses: ["Same as P0420, but on the other engine bank"],
    urgency: "medium",
    guidance: "Same guidance as P0420.",
    clearingLikelihood: "may-return",
    clearingNote: "Same as P0420 - fix any upstream misfire/fuel-trim cause first, then clearing has a real chance of sticking.",
  },
  P0440: {
    commonCauses: ["Loose or damaged fuel cap", "Cracked EVAP hose", "Failed purge or vent valve"],
    urgency: "low",
    guidance: "Check the fuel cap is fully tightened first - that alone causes a large share of these. Not urgent otherwise.",
    clearingLikelihood: "often-resolves",
    clearingNote: "Tighten the gas cap (or replace it if the seal looks worn), then clear the code - this alone resolves a large share of EVAP codes with no other repair needed. Give it a few drive cycles before assuming it's something bigger.",
  },
  P0442: {
    commonCauses: ["Small EVAP system leak (hose, seal, or cap)", "Loose fuel cap"],
    urgency: "low",
    guidance: "Emissions-related, not a drivability concern. Will likely fail an emissions test until fixed.",
    clearingLikelihood: "often-resolves",
    clearingNote: "Same as P0440 - check/tighten the fuel cap first. If that was the cause, clearing it will stick.",
  },
  P0455: {
    commonCauses: ["Missing or badly damaged fuel cap", "Large crack/disconnection in an EVAP hose"],
    urgency: "low",
    guidance: "Same family as P0442 but a larger leak - still not a drivability emergency, but check the fuel cap and visible EVAP hoses.",
    clearingLikelihood: "often-resolves",
    clearingNote: "If the cap was missing or badly damaged, replacing it (a cheap part) and clearing the code will usually resolve this for good.",
  },
  P0500: {
    commonCauses: ["Failed vehicle speed sensor", "Wiring issue between sensor and control module"],
    urgency: "medium",
    guidance: "Can affect ABS, cruise control, and transmission shift behavior depending on the vehicle - worth checking soon if you notice those acting oddly.",
    clearingLikelihood: "will-likely-return",
    clearingNote: "A failed sensor or damaged wiring stays failed after clearing - expect it back.",
  },
  P0505: {
    commonCauses: ["Dirty throttle body", "Failing idle air control valve", "Vacuum leak"],
    urgency: "medium",
    guidance: "Usually shows up as rough, high, or fluctuating idle - annoying but rarely dangerous; check soon for comfort/reliability.",
    clearingLikelihood: "may-return",
    clearingNote: "A throttle-body clean can genuinely fix this - if that's the cause, clearing afterward will stick. A failing idle air control valve will keep bringing it back.",
  },
  P0601: {
    commonCauses: ["Internal control module fault", "Corrupted software after an incomplete update"],
    urgency: "medium",
    guidance: "Can cause inconsistent behavior from whatever module reported it - worth a professional diagnostic scan to see which module and why.",
    clearingLikelihood: "may-return",
    clearingNote: "If it was a one-time software glitch, clearing it (effectively a reset) can resolve it. If the module itself has a hardware fault, it'll return.",
  },
  P0700: {
    commonCauses: ["This is a heads-up code from the engine ECU that the TRANSMISSION control module has its own stored codes"],
    urgency: "medium",
    guidance: "Scan the transmission control module specifically for the real underlying code - P0700 alone doesn't say what's wrong.",
    clearingLikelihood: "will-likely-return",
    clearingNote: "Clearing this without addressing the actual transmission code behind it won't accomplish anything - it'll come right back until that real code is found and fixed.",
  },
};

export function adviseOnDtc(code: string): DtcAdvice | null {
  return GENERIC_DTC_ADVICE[code] ?? null;
}
