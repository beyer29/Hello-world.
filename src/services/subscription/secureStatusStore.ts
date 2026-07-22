import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { SubscriptionStatus } from "@/types";

const STORE_KEY = "thecoder_subscription_status_v1";

/**
 * Raises the bar against casual local tampering with the simulated
 * subscription status - a pen-test finding was that plain AsyncStorage let
 * anyone with basic file/ADB access hand-edit the stored JSON to
 * `{"tier":"premium",...}` for free access. This module:
 *
 * 1. Stores the value in OS-backed secure storage (iOS Keychain / Android
 *    Keystore via expo-secure-store) instead of a plaintext-readable
 *    AsyncStorage file, and
 * 2. Signs the payload with a keyed digest, so even someone who does get
 *    at the raw stored bytes can't just paste in new JSON - it has to
 *    verify against the signature, which requires the signing key below.
 *
 * Be honest about what this does and doesn't achieve: `SIGNING_KEY` ships
 * inside the app binary. Anyone who reverse-engineers the JS bundle can
 * extract it and forge a valid signature - there is no way to fully close
 * that gap without a server, which is exactly what
 * `RevenueCatSubscriptionService`'s real, Apple/Google-signed receipt
 * validation provides instead. This module only defeats the *trivial*
 * "open the storage file in a text editor and change a field" attack that
 * plain AsyncStorage was vulnerable to - it's a meaningful improvement for
 * the simulated/demo service, not a substitute for real server-validated
 * purchases.
 */
const SIGNING_KEY = "thecoder-local-entitlement-v1-8f2b6c";

interface SignedPayload {
  status: SubscriptionStatus;
  signature: string;
}

async function sign(status: SubscriptionStatus): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${SIGNING_KEY}:${JSON.stringify(status)}`
  );
}

export async function readSignedStatus(): Promise<SubscriptionStatus | null> {
  const raw = await SecureStore.getItemAsync(STORE_KEY);
  if (!raw) return null;

  try {
    const parsed: SignedPayload = JSON.parse(raw);
    if (!parsed || typeof parsed.signature !== "string" || !parsed.status) return null;

    const expectedSignature = await sign(parsed.status);
    if (expectedSignature !== parsed.signature) {
      // Tampered or corrupted - fail closed rather than trusting it.
      return null;
    }
    return parsed.status;
  } catch {
    return null;
  }
}

export async function writeSignedStatus(status: SubscriptionStatus): Promise<void> {
  const signature = await sign(status);
  const payload: SignedPayload = { status, signature };
  await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(payload));
}
