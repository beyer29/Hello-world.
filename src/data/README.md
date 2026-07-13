# Sample coding data

`modules.ts` ships a small catalogue of control modules across six
manufacturers - BMW/MINI/Toyota (FRM, KOMBI, IHKA, PDC, CAS, EGS, DME), Audi
(CCM, KOMBI, GATEWAY, ECU), Volkswagen (CCM, KOMBI, GATEWAY, ECU), and
Mercedes-Benz (SAM, KOMBI, EZS, ME) - with coding options modelled on the
*kinds* of settings real tools expose (mirror-fold-on-lock, PDC auto-off
speed, seatbelt chime, etc). `compatibleManufacturers` on each module is
matched against the connected vehicle's decoded VIN manufacturer
(`services/coding/codingService.ts`) so only the relevant brand's modules
show up. The engine modules (DME/ECU/ME) additionally expose a simulated
"flash" workflow (Stage 1-2-3 tuning) - see `src/services/flash/README.md`
for why that data is sample-only too, and why engine tuning specifically is
a higher-risk category than coding. The security-category modules
(CAS/GATEWAY/EZS) are coding-only in this app - see the top-level
README's "Why key programming isn't in this app" for why they don't expose
any key/immobilizer feature.

**These are illustrative placeholders, not verified byte offsets into a
real control unit.** Real coding data (which register, which byte, which
bit) comes from each OEM's proprietary diagnostic data (e.g. BMW's
`PSdZData`/`FSW_PSW`, VAG's ODIS data, Mercedes' XENTRY data), none of
which is public or reproduced here. Writing an invented byte offset to a
real module can misconfigure unrelated behavior - the BimmerCode App Store
review referenced in this project's brief describes exactly that happening
to a real car's brake lights after a footwell-module edit gone wrong.

`dtcDescriptions.ts` is different: it's a small table of real, SAE-
standardized generic (P0xxx) diagnostic trouble code descriptions, which
*are* public and identical across every manufacturer - see
`src/services/diagnostics`.

If you have your own verified coding definitions (e.g. exported from a
data source you're licensed to use), the intended extension point is to
replace/extend `SAMPLE_MODULES` with real definitions, and swap
`services/coding`'s write path from the simulated in-memory apply to one
that sends real coded values through `services/obd`. The `sampleData`
flag on every `CodingOption` exists specifically so the app can visibly
warn the user (see `ModuleDetailScreen`) whenever they're editing
unverified sample data versus real definitions.
