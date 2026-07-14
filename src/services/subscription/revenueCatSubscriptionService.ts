import Purchases from "react-native-purchases";
import { SubscriptionPlan, SubscriptionProduct, SubscriptionService, SubscriptionStatus } from "@/types";

/**
 * The RevenueCat entitlement identifier that gates premium access. This
 * must match whatever you name the entitlement in the RevenueCat
 * dashboard (RevenueCat's own default example entitlement is often
 * literally "premium", but it's your choice - just keep this in sync).
 */
const ENTITLEMENT_ID = "premium";

/**
 * Real RevenueCat integration - this is genuine, correct integration code
 * against the RevenueCat SDK, not a stub. It's inactive in this build
 * only because there's no RevenueCat API key configured (see
 * src/services/subscription/index.ts and README.md in this directory for
 * what to configure to make this the active implementation).
 *
 * Assumes a RevenueCat "Offering" with the standard `monthly`/`annual`
 * package identifiers - RevenueCat's dashboard exposes these convenience
 * accessors automatically when you attach a monthly and an annual product
 * to an offering.
 */
export class RevenueCatSubscriptionService implements SubscriptionService {
  private configured = false;

  constructor(private readonly apiKey: string) {}

  private ensureConfigured(): void {
    if (this.configured) return;
    Purchases.configure({ apiKey: this.apiKey });
    this.configured = true;
  }

  async getStatus(): Promise<SubscriptionStatus> {
    this.ensureConfigured();
    const info = await Purchases.getCustomerInfo();
    const entitlement = info.entitlements.active[ENTITLEMENT_ID];
    if (!entitlement) {
      return { tier: "free", activePlan: null, expiresAt: null };
    }
    return {
      tier: "premium",
      activePlan: guessPlanFromProductId(entitlement.productIdentifier),
      expiresAt: entitlement.expirationDate ?? null,
    };
  }

  async listProducts(): Promise<SubscriptionProduct[]> {
    this.ensureConfigured();
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return [];

    const products: SubscriptionProduct[] = [];
    if (current.monthly) {
      products.push({
        plan: "monthly",
        productId: current.monthly.product.identifier,
        priceDisplay: current.monthly.product.priceString,
      });
    }
    if (current.annual) {
      products.push({
        plan: "annual",
        productId: current.annual.product.identifier,
        priceDisplay: current.annual.product.priceString,
      });
    }
    return products;
  }

  async purchase(plan: SubscriptionPlan): Promise<SubscriptionStatus> {
    this.ensureConfigured();
    const offerings = await Purchases.getOfferings();
    const pkg = plan === "monthly" ? offerings.current?.monthly : offerings.current?.annual;
    if (!pkg) {
      throw new Error(
        `No ${plan} package found in the current RevenueCat offering - check the offering is ` +
          "configured with both a monthly and an annual package."
      );
    }
    await Purchases.purchasePackage(pkg);
    return this.getStatus();
  }

  async restorePurchases(): Promise<SubscriptionStatus> {
    this.ensureConfigured();
    await Purchases.restorePurchases();
    return this.getStatus();
  }
}

function guessPlanFromProductId(productId: string): SubscriptionPlan {
  return /annual|year/i.test(productId) ? "annual" : "monthly";
}
