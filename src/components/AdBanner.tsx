import React from "react";
import { View } from "react-native";
import { spacing } from "@/theme/theme";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let BannerAd: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let BannerAdSize: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let TestIds: any = null;

try {
  // Loaded defensively: react-native-google-mobile-ads is a native module
  // that isn't linked in Expo Go, only in a custom dev client build. This
  // keeps the free-tier screens from crashing when run without one.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ads = require("react-native-google-mobile-ads");
  BannerAd = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
  TestIds = ads.TestIds;
} catch {
  BannerAd = null;
}

interface BoundaryState {
  failed: boolean;
}

/**
 * Catches native-render failures from <BannerAd> (e.g. the AdMob native
 * view manager isn't compiled in) so a missing native module degrades to
 * "no ad shown" instead of crashing the screen.
 */
class AdBannerBoundary extends React.Component<{ children: React.ReactNode }, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

/**
 * Google's official test ad unit (via TestIds.BANNER) is used here, not a
 * real production ad unit - see src/services/ads/README.md for what to
 * swap in before release, and why serving test ads in production would
 * violate AdMob policy.
 */
export function AdBanner() {
  if (!BannerAd) return null;
  return (
    <AdBannerBoundary>
      <View style={{ alignItems: "center", paddingVertical: spacing.sm }}>
        <BannerAd
          unitId={TestIds.BANNER}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        />
      </View>
    </AdBannerBoundary>
  );
}
