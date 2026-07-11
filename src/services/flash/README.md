# Flash service

`SimulatedFlashService` implements the full flash workflow UX - pre-checks,
automatic backup, erase, write, verify, progress reporting, and abort with
rollback - against a timed simulation instead of a real control unit. It
backs two features: EGS (transmission) software updates, and DME (engine)
Stage 1/2/3 performance tuning packages.

## Why this doesn't flash a real transmission/EGS module

Real BMW TCU/EGS firmware updates depend on two things this project
intentionally does not reproduce:

1. **Proprietary firmware containers and security-access sequences** from
   BMW's ISTA-P/PSdZData toolchain. These aren't public, and fabricating
   plausible-looking equivalents would be worse than not implementing the
   feature: someone could plug a real adapter into a real car and send
   invented data to a safety-relevant module.
2. **A wired, high-throughput pass-thru connection** (ENET/DCAN or a J2534
   device). Consumer Bluetooth ELM327 adapters (the kind `services/obd`
   targets) are what BimmerCode-style *coding* tools use, but they are not
   what real flashing tools use - flashing needs much higher, more reliable
   throughput than Bluetooth SPP/BLE provides.

## Why Stage 1/2/3 engine tuning is simulated too - and why that matters more here

Stage 1/2/3 packages (`DME` in `SAMPLE_PACKAGES`) are a fundamentally
different category from coding, and arguably higher-risk than an EGS
flash: real performance tuning rewrites fuel, ignition-timing, and boost
tables in the engine control unit. Wrong values here don't just misconfigure
a convenience feature - they can cause engine knock, turbo overspeed, or
outright engine damage while driving. Real stage tunes are dyno-calibrated
by a tuner against the *exact* hardware combination installed (stock vs.
upgraded intercooler/turbo/fuel system); there is no generic "Stage 2 map"
that's safe to apply blind. For that reason this project only describes what
each stage conceptually changes and simulates the install workflow - it
never ships or invents real fuel/ignition/boost values.

## Extension point

`FlashService` (see `src/types/services.ts`) is a plain interface. A real
implementation would swap in a J2534 pass-thru driver and BMW-licensed
firmware packages (or a licensed tuner's calibrated stage maps) in place of
`SAMPLE_PACKAGES`, while keeping the same
pre-checks/backup/erase/write/verify state machine the UI already expects
via `FlashStepResult`.
