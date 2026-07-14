import { SubscriptionService } from "@/types";
import { MockSubscriptionService } from "./mockSubscriptionService";
import { RevenueCatSubscriptionService } from "./revenueCatSubscriptionService";

export { MockSubscriptionService } from "./mockSubscriptionService";
export { RevenueCatSubscriptionService } from "./revenueCatSubscriptionService";

/**
 * Set this to a real RevenueCat public API key (from the RevenueCat
 * dashboard - one key per platform, iOS and Android use different keys)
 * once you have a RevenueCat account with App Store Connect/Play Console
 * products configured, and `createSubscriptionService` below will switch
 * to the real implementation automatically. Left empty, this app runs
 * entirely on the local simulated implementation - no real purchases,
 * no real money. See README.md in this directory.
 */
const REVENUECAT_API_KEY = "";

export function createSubscriptionService(): SubscriptionService {
  if (REVENUECAT_API_KEY) {
    return new RevenueCatSubscriptionService(REVENUECAT_API_KEY);
  }
  return new MockSubscriptionService();
}
