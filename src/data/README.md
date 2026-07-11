# Sample coding data

`modules.ts` ships a small catalogue of control modules (FRM, KOMBI, IHKA,
PDC, Comfort Access, EGS, DME) with coding options modelled on the *kinds*
of settings real tools like BimmerCode expose (mirror-fold-on-lock, PDC
auto-off speed, seatbelt chime, etc). EGS and DME additionally expose a
simulated "flash" workflow (transmission software / Stage 1-2-3 engine
tuning respectively) - see `src/services/flash/README.md` for why that data
is sample-only too, and why engine tuning specifically is a higher-risk
category than coding.

**These are illustrative placeholders, not verified byte offsets into a
real control unit.** Real BMW coding data (which register, which byte,
which bit) comes from BMW's proprietary NCS/ISTA data (e.g. `PSdZData`,
`FSW_PSW`), which is not public and is not reproduced here. Writing an
invented byte offset to a real module can misconfigure unrelated behavior
- the BimmerCode App Store review referenced in this project's brief
describes exactly that happening to a real car's brake lights after a
footwell-module edit gone wrong.

If you have your own verified coding definitions (e.g. exported from a
data source you're licensed to use), the intended extension point is to
replace/extend `SAMPLE_MODULES` with real definitions, and swap
`services/coding`'s write path from the simulated in-memory apply to one
that sends real coded values through `services/obd`. The `sampleData`
flag on every `CodingOption` exists specifically so the app can visibly
warn the user (see `ModuleDetailScreen`) whenever they're editing
unverified sample data versus real definitions.
