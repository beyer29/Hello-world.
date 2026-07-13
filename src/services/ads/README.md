# Ads

Free-tier users see a banner ad (`src/components/AdBanner.tsx`) on the
Diagnostics screen - the one screen they have access to. Premium
subscribers never see it (`AdBanner` is only rendered when
`useSubscription().tier === "free"`).

## What's real vs. placeholder here

The integration is real: `react-native-google-mobile-ads` (Google's own
AdMob SDK for React Native) is wired up properly, using the library's
`TestIds.BANNER` constant and an adaptive banner size. What's a
placeholder is the actual IDs:

- `app.json`'s `react-native-google-mobile-ads` plugin config uses
  **Google's own published sample AdMob App IDs** (one for Android, one
  for iOS) - these are meant for exactly this (development/testing), not
  invented by this project. Replace them with your real AdMob App IDs
  before release.
- The banner itself uses `TestIds.BANNER` (the library's own test-ad
  constant), not a real ad unit ID. Replace this with your real ad unit
  ID from your AdMob account before release. **Serving test ads in a
  released app violates AdMob policy** - this is why the code makes the
  test/placeholder nature obvious rather than quietly shipping something
  that looks production-ready.

## Not handled here: consent (GDPR/ATT)

A production ads integration needs a consent management flow (a Consent
Management Platform integration for GDPR in the EU/UK, and Apple's
App Tracking Transparency prompt on iOS) before requesting personalized
ads. This build always requests non-personalized ads
(`requestNonPersonalizedAdsOnly: true`) specifically to sidestep needing
that infrastructure for now - real personalized-ad revenue would need a
CMP, which is a real (and non-trivial) addition beyond this app's current
scope.
