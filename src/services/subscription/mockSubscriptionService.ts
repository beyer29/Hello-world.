import AsyncStorage from "@react-native-async-storage/async-storage";
import { SubscriptionPlan, SubscriptionProduct, SubscriptionService, SubscriptionStatus } from "@/types";

const STORAGE_KEY = "thecoder:subscription";

const PRODUCTS: SubscriptionProduct[] = [
  { plan: "monthly", productId: "premium_monthly", priceDisplay: "$9.99/month" },
  { plan: "annual", productId: "premium_annual", priceDisplay: "$100/year" },
];

const FREE_STATUS: SubscriptionStatus = { tier: "free", activePlan: null, expiresAt: null };

/**
 * Simulates purchases locally - no real money changes hands, no store is
 * involved. This is the default (and, in this build, only active)
 * implementation because there's no RevenueCat API key or real App Store
 * Connect/Play Console product configured yet. See README.md in this
 * directory for what's needed to go live with
 * `RevenueCatSubscriptionService` instead.
 */
export class MockSubscriptionService implements SubscriptionService {
  private status: SubscriptionStatus | null = null;

  async getStatus(): Promise<SubscriptionStatus> {
    if (this.status) return this.status;
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    this.status = stored ? (JSON.parse(stored) as SubscriptionStatus) : FREE_STATUS;
    return this.status;
  }

  async listProducts(): Promise<SubscriptionProduct[]> {
    return PRODUCTS;
  }

  async purchase(plan: SubscriptionPlan): Promise<SubscriptionStatus> {
    const now = new Date();
    const expires = new Date(now);
    if (plan === "monthly") expires.setMonth(expires.getMonth() + 1);
    else expires.setFullYear(expires.getFullYear() + 1);

    const status: SubscriptionStatus = { tier: "premium", activePlan: plan, expiresAt: expires.toISOString() };
    await this.persist(status);
    return status;
  }

  async restorePurchases(): Promise<SubscriptionStatus> {
    return this.getStatus();
  }

  /** Demo/testing only - lets the Settings screen simulate a downgrade since there's no real store to cancel through yet. */
  async resetToFreeForTesting(): Promise<SubscriptionStatus> {
    await this.persist(FREE_STATUS);
    return FREE_STATUS;
  }

  private async persist(status: SubscriptionStatus): Promise<void> {
    this.status = status;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(status));
  }
}
