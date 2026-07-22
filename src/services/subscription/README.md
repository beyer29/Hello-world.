# Subscriptions

Free tier: Diagnostics (scanning) only, with ads. Premium ($9.99/month or
$100/year): everything else - Modules/coding, Backups, the Flash/tuning
workflow, and Beyer - plus no ads.

## What's real vs. simulated here

`MockSubscriptionService` is the only active implementation in this build.
It simulates a purchase locally (persists across app restarts) with **no
real money, no App Store/Play Store involved**. This isn't a placeholder
for lack of effort - `RevenueCatSubscriptionService` right next to it is
genuine, correct integration code against the real RevenueCat SDK
(`react-native-purchases`). It's simply inactive because going live
requires accounts and configuration only you can create:

1. An App Store Connect subscription group with a monthly ($9.99) and an
   annual ($100) auto-renewable subscription product, and the equivalent
   in Google Play Console.
2. A RevenueCat account (free tier available) with those store products
   attached to an "Offering" containing a `monthly` and an `annual`
   package, and an "Entitlement" (this code assumes it's named
   `"premium"` - see `ENTITLEMENT_ID` in
   `revenueCatSubscriptionService.ts`) granted by both.
3. RevenueCat's public API keys (one for iOS, one for Android - these are
   safe to embed in a client, unlike an LLM API key, since purchases are
   still verified through Apple/Google and a leaked key doesn't let
   anyone spend your money).
4. Setting `REVENUECAT_API_KEY` in `index.ts` to switch
   `createSubscriptionService()` over to the real implementation.

`react-native-purchases` is a native module - like `react-native-ble-plx`,
it needs a custom Expo dev client build, not Expo Go, to actually run
(though the mock implementation works fine in Expo Go since it never
touches the native module).

## Tamper resistance of the simulated status (`secureStatusStore.ts`)

A security review of this app flagged that the original implementation
stored the simulated subscription status as plain, unsigned JSON in
AsyncStorage - trivially hand-editable (via basic file/ADB access on a
rooted device, no exploitation required) to grant free permanent premium
access. `secureStatusStore.ts` addresses this two ways:

1. **Storage**: the status now lives in `expo-secure-store`
   (iOS Keychain / Android Keystore), not a plaintext-readable
   AsyncStorage file.
2. **Integrity**: the payload is signed with a keyed digest; on read, the
   signature is re-verified and a mismatch (tampered or corrupted data) is
   treated as if nothing were stored - it fails closed to the free tier
   rather than trusting an unverified value.

**Be honest about the limits of this**: the signing key lives inside the
app binary. Anyone who reverse-engineers the JS bundle can extract it and
forge a valid signature for their own fake "premium" status - there's no
way to fully close that gap without a server, which is exactly what
`RevenueCatSubscriptionService`'s real Apple/Google-signed receipt
validation provides instead. This module raises the bar from "edit a
file in a text editor" to "reverse-engineer the app bundle" - it's a
real, worthwhile improvement for a demo/development build, but it is not
a substitute for switching to `RevenueCatSubscriptionService` before
shipping with real payment.

## Testing the gating without a real store

The Settings screen has a "(demo) reset to free" action that's only shown
when `MockSubscriptionService` is active, so you can toggle premium on/off
to see both experiences without needing real store products.
