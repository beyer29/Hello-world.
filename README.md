# The Coder

A cross-platform (iOS + Android, via Expo) React Native app combining two
real-world tool categories: a BimmerCode-style coding tool (a third-party
BMW/MINI/Toyota Supra coding app, not affiliated with BMW AG, BimmerTech, or
Toyota) and an Autel-style multi-brand diagnostic scan tool. It covers
BMW/MINI, the BMW-co-developed Toyota Supra, Audi, Volkswagen, and
Mercedes-Benz.

It lets you connect to a Bluetooth OBD-II adapter, decode the VIN to
identify the manufacturer, run a full diagnostic scan (read/clear fault
codes) and view live data, browse the vehicle's brand-appropriate control
modules, flip "coding" options that already exist in the car but aren't
exposed in the normal owner menus, back up/restore coding state, walk
through what a transmission or engine software-update/tuning install
workflow looks like, and chat with **Beyer**, a built-in assistant that can
run any of the above for you and explain fault codes in plain language.

**Not included: key/immobilizer programming, for any manufacturer.** See
"Why key programming isn't in this app" below.

## What's real vs. simulated - read this before anything else

| Layer | Status |
| --- | --- |
| App architecture, navigation, state management | Real, fully working |
| Bluetooth scanning/pairing UX | Real, fully working |
| ELM327 AT-command / OBD-II protocol (`src/services/obd`) | **Real.** This is a public, standardized protocol (SAE J1979 / ELM327 datasheet) and is implemented for real over BLE via `react-native-ble-plx`. |
| VIN decoding (`src/services/vin`) | **Real.** ISO 3779 is a public standard; manufacturer/region/model-year decoding follows it, including real WMI codes for BMW, MINI, Toyota, Audi, Volkswagen, and Mercedes-Benz. `platformGuess` is explicitly a heuristic, not verified OEM platform data. |
| Diagnostic scan / live data (`src/services/diagnostics`) | **Real, and brand-agnostic.** DTC read (Mode 03), clear (Mode 04), pending codes (Mode 07), and live PIDs (Mode 01: RPM, speed, coolant temp, etc.) are the real, standardized OBD-II protocol (SAE J1979/ISO 15031) - this works identically on every make. Only *generic* P0xxx code descriptions are shown (also a public SAE standard); manufacturer-specific codes are reported as unknown rather than guessed - see `src/data/dtcDescriptions.ts`. |
| Coding options catalogue (`src/data/modules.ts`) | **Sample data.** The kinds of options (mirror-fold-on-lock, PDC auto-off, seatbelt chime, etc.) mirror what real tools expose per brand, but the actual byte-level mapping into a real control unit is proprietary to each OEM and isn't public. See `src/data/README.md`. |
| Gearbox/transmission (EGS) flashing (`src/services/flash`) | **Simulated.** The full pre-checks → backup → erase → write → verify workflow is real and complete, but it runs against a timed simulation, not a real control unit. See `src/services/flash/README.md` for why. |
| Engine (DME) Stage 1/2/3 tuning (`src/services/flash`) | **Simulated, and intentionally so.** Real performance tuning rewrites fuel/ignition/boost tables and is dyno-calibrated per exact hardware combo - this app only describes what each stage conceptually changes and simulates the install workflow. It never ships or fabricates real tuning values; see `src/services/flash/README.md`. |
| Importing your own tune/firmware file (Flash screen) | **Real file handling, simulated install.** You can pick a real file from your device (`expo-document-picker`); it's really copied into app storage and fingerprinted (`expo-crypto`/`expo-file-system`). But it still only runs through the *simulated* install workflow above - this app never gains a real ECU-write capability just because the file is real. |
| Beyer, the built-in assistant (`src/services/agent`) | **Real actions, local rule-based reasoning.** Beyer genuinely triggers the same scan/backup/coding/live-data/tuning-lookup actions the screens do - nothing it does is faked. But the "AI" itself is keyword/pattern matching plus the real repair-advice table below, not a language model - no network call, no API key. See `src/services/agent/README.md` for the honest scope and the extension point for a real LLM. |
| Fault-code repair advice (`src/data/repairAdvice.ts`) | **Real, generic automotive knowledge.** Common causes, urgency, and whether clearing a code will likely stick vs. return without a real repair, for the same public generic (P0xxx) codes as the Diagnostics tab - the kind of information in any repair manual, not manufacturer-specific diagnosis, and not a substitute for a physical inspection. |

In short: **the transport and diagnostic layers are real, the manufacturer-
specific coding/tuning data is not.** If you have your own verified coding
definitions or licensed OEM firmware packages, the codebase has clear
extension points (`CodingService`, `FlashService` in
`src/types/services.ts`) to plug in real ones - but this project
intentionally does not fabricate proprietary OEM data, because writing an
invented value to a real control unit can cause real, unexpected side
effects (this is explicitly what the app's own about screen warns about,
referencing a documented case of a BimmerCode user's brake lights failing
after a mis-set footwell-module option).

## Why key programming isn't in this app

This app does not include immobilizer/key programming, for any
manufacturer, and won't. Key programming is a fundamentally different risk
category from coding or even tuning: its primary real-world misuse case is
vehicle theft, not damage to your own car. That's exactly why real key-
programming tools (including the IMMO module on real Autel devices) gate
this behind VIN-specific security-gateway access, dealer/locksmith
credentials, or ownership verification. A tool that can "code keys for any
car" with no such gate is functionally a theft tool regardless of intent,
so it isn't something this project builds, simulated or otherwise.

## Project structure

```
App.tsx                      # entry point
src/
  types/                     # shared TypeScript contracts
  data/                      # sample control-module catalogue + generic DTC descriptions
  services/
    obd/                     # ELM327 BLE adapter, mock adapter, factory
    vin/                     # ISO 3779 VIN decoder (BMW/MINI/Toyota/Audi/VW/Mercedes-Benz)
    diagnostics/             # real OBD-II DTC read/clear + live data (brand-agnostic)
    coding/                  # reads/writes coding options (sample-data backed)
    backup/                  # AsyncStorage-backed backup/restore
    flash/                   # simulated flash/tuning workflow + README on scope
    agent/                   # Beyer: local rule-based assistant + README on scope
  context/AppProviders.tsx   # app-wide state via React context + hooks
  navigation/RootNavigator.tsx
  theme/theme.ts
  screens/                   # Beyer, Diagnostics, ModuleList, ModuleDetail, Backups, Flash, Connect, Settings
```

## Running it

```bash
npm install
npm run start       # opens Expo Dev Tools; press i/a/w for iOS/Android/web
npm run typecheck   # tsc --noEmit
```

No physical hardware is required - on first launch, "Scan for adapters" on
the connect screen discovers four simulated demo adapters, each pretending
to be paired with a different demo vehicle (BMW, Audi, Volkswagen,
Mercedes-Benz) so you can see the brand-filtered module catalogue change.
To talk to a **real** ELM327 Bluetooth LE adapter
you'll need a custom Expo dev client build (Expo Go does not support the
native `react-native-ble-plx` module) - see the Expo docs for
[custom dev clients](https://docs.expo.dev/development/introduction/).

## Safety notes carried over from the real tool

- Always back up coding values before changing them (the Backups tab and
  the "back up before editing" button on each module exist for this).
- Change one setting at a time so you can tell what caused any side effect.
- A few real-world coding tweaks (e.g. unlocking video playback while
  driving) may not be street-legal depending on where you live - that's a
  property of the real hardware/settings this app models, not something
  this simulated build can check for you.
- Real engine performance tuning (Stage 1/2/3) is a different risk category
  from coding: it changes combustion parameters, and an incorrectly
  calibrated real tune can damage an engine. If you ever move from this
  simulated workflow to a real one, that calibration should come from a
  tuner who has dyno-verified it against your car's exact hardware - not
  from a generic downloaded map.
- Importing a real file on the Flash screen stages it in this app, but
  doesn't make this app capable of writing it to a real vehicle - that step
  still has to happen through whatever licensed tool/hardware produced the
  file.
- Beyer's repair advice is generic, code-based guidance (the same kind of
  information in a repair manual), not a physical inspection or a
  professional diagnosis - a code narrows down what to check, it doesn't
  confirm the actual cause on the car in front of you.
