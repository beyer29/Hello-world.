# BimmerCoder

A cross-platform (iOS + Android, via Expo) React Native app modelled on
[BimmerCode](https://www.bimmer-tech.net/) - a third-party coding tool for
BMW/MINI (and Toyota Supra) owners. BimmerCoder is not affiliated with BMW
AG, BimmerTech, or Toyota.

It lets you connect to a Bluetooth OBD-II adapter, browse a vehicle's
control modules, flip "coding" options that already exist in the car but
aren't exposed in the normal owner menus, back up/restore coding state, and
walk through what a transmission (EGS) software update or engine (DME)
Stage 1/2/3 performance tune install workflow looks like.

## What's real vs. simulated - read this before anything else

| Layer | Status |
| --- | --- |
| App architecture, navigation, state management | Real, fully working |
| Bluetooth scanning/pairing UX | Real, fully working |
| ELM327 AT-command / OBD-II protocol (`src/services/obd`) | **Real.** This is a public, standardized protocol (SAE J1979 / ELM327 datasheet) and is implemented for real over BLE via `react-native-ble-plx`. |
| VIN decoding (`src/services/vin`) | **Real.** ISO 3779 is a public standard; manufacturer/region/model-year decoding follows it. `platformGuess` is explicitly a heuristic, not verified BMW platform data. |
| Coding options catalogue (`src/data/modules.ts`) | **Sample data.** The kinds of options (mirror-fold-on-lock, PDC auto-off, seatbelt chime, etc.) mirror what real tools expose, but the actual byte-level mapping into a real control unit is proprietary to BMW (ISTA/PSdZData) and isn't public. See `src/data/README.md`. |
| Gearbox/transmission (EGS) flashing (`src/services/flash`) | **Simulated.** The full pre-checks → backup → erase → write → verify workflow is real and complete, but it runs against a timed simulation, not a real control unit. See `src/services/flash/README.md` for why. |
| Engine (DME) Stage 1/2/3 tuning (`src/services/flash`) | **Simulated, and intentionally so.** Real performance tuning rewrites fuel/ignition/boost tables and is dyno-calibrated per exact hardware combo - this app only describes what each stage conceptually changes and simulates the install workflow. It never ships or fabricates real tuning values; see `src/services/flash/README.md`. |
| Importing your own tune/firmware file (Flash screen) | **Real file handling, simulated install.** You can pick a real file from your device (`expo-document-picker`); it's really copied into app storage and fingerprinted (`expo-crypto`/`expo-file-system`). But it still only runs through the *simulated* install workflow above - this app never gains a real ECU-write capability just because the file is real. |

In short: **the transport layer is real, the BMW-specific data is not.** If
you have your own verified coding definitions or licensed BMW firmware
packages, the codebase has clear extension points (`CodingService`,
`FlashService` in `src/types/services.ts`) to plug in real ones - but this
project intentionally does not fabricate proprietary BMW data, because
writing an invented value to a real control unit can cause real, unexpected
side effects (this is explicitly what the app's own about screen warns
about, referencing a documented case of a BimmerCode user's brake lights
failing after a mis-set footwell-module option).

## Project structure

```
App.tsx                      # entry point
src/
  types/                     # shared TypeScript contracts
  data/                      # sample control-module + coding-option catalogue
  services/
    obd/                     # ELM327 BLE adapter, mock adapter, factory
    vin/                     # ISO 3779 VIN decoder
    coding/                  # reads/writes coding options (sample-data backed)
    backup/                  # AsyncStorage-backed backup/restore
    flash/                   # simulated flash workflow + README on scope
  context/AppProviders.tsx   # app-wide state via React context + hooks
  navigation/RootNavigator.tsx
  theme/theme.ts
  screens/                   # Connect, ModuleList, ModuleDetail, Backups, Flash, Settings
```

## Running it

```bash
npm install
npm run start       # opens Expo Dev Tools; press i/a/w for iOS/Android/web
npm run typecheck   # tsc --noEmit
```

No physical hardware is required - on first launch, "Scan for adapters" on
the connect screen discovers two simulated demo adapters so every screen is
fully usable standalone. To talk to a **real** ELM327 Bluetooth LE adapter
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
