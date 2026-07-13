export type SubscriptionTier = "free" | "premium";
export type SubscriptionPlan = "monthly" | "annual";

export interface SubscriptionProduct {
  plan: SubscriptionPlan;
  productId: string;
  priceDisplay: string;
}

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  activePlan: SubscriptionPlan | null;
  expiresAt: string | null;
}
