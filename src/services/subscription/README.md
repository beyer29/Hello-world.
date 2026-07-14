# Subscriptions

Free tier: Diagnostics (scanning) only, with ads. Premium ($9.99/month or
$100/year): everything else - Modules/coding, Backups, the Flash/tuning
workflow, and Beyer - plus no ads.

## What's real vs. simulated here

`MockSubscriptionService` is the only active implementation in this build.
It simulates a purchase locally (AsyncStorage-backed, persists across app
restarts) with **no real money, no App Store/Play Store involved**. This
isn't a placeholder for lack of effort - `RevenueCatSubscriptionService`
right next to it is genuine, correct integration code against the real
RevenueCat SDK (`react-native-purchases`). It's simply inactive because
going live requires accounts and configuration only you can create:

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

## Testing the gating without a real store

The Settings screen has a "(demo) reset to free" action that's only shown
when `MockSubscriptionService` is active, so you can toggle premium on/off
to see both experiences without needing real store products.
