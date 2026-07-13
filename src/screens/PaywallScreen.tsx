import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSubscription } from "@/context/AppProviders";
import { colors, spacing, typography } from "@/theme/theme";
import { SubscriptionPlan } from "@/types";

const FEATURES = [
  "Beyer, the built-in AI assistant",
  "Full control-module coding for every supported brand",
  "Backup and restore of coding state",
  "Transmission/engine flash and Stage 1-2-3 tuning workflow",
  "No ads",
];

interface PaywallScreenProps {
  featureName?: string;
}

export default function PaywallScreen({ featureName }: PaywallScreenProps) {
  const { products, purchasing, purchase, restorePurchases, loading } = useSubscription();
  const [restoring, setRestoring] = useState(false);

  const handlePurchase = useCallback(
    async (plan: SubscriptionPlan) => {
      try {
        await purchase(plan);
      } catch (err) {
        Alert.alert("Purchase failed", String(err));
      }
    },
    [purchase]
  );

  const handleRestore = useCallback(async () => {
    setRestoring(true);
    try {
      await restorePurchases();
    } catch (err) {
      Alert.alert("Restore failed", String(err));
    } finally {
      setRestoring(false);
    }
  }, [restorePurchases]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {featureName ? `${featureName} is a Premium feature` : "Go Premium"}
        </Text>
        <Text style={styles.subtitle}>
          The free plan covers scanning your car's fault codes. Premium unlocks everything else.
        </Text>

        <View style={styles.featureList}>
          {FEATURES.map((feature) => (
            <Text key={feature} style={styles.featureItem}>
              • {feature}
            </Text>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={styles.loading} />
        ) : (
          <View style={styles.plans}>
            {products.map((product) => (
              <Pressable
                key={product.productId}
                onPress={() => handlePurchase(product.plan)}
                disabled={purchasing}
                style={({ pressed }) => [
                  styles.planCard,
                  product.plan === "annual" && styles.planCardHighlighted,
                  purchasing && styles.buttonDisabled,
                  pressed && !purchasing && styles.buttonPressed,
                ]}
              >
                <Text style={styles.planPrice}>{product.priceDisplay}</Text>
                <Text style={styles.planLabel}>
                  {product.plan === "annual" ? "Annual - best value" : "Monthly"}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {purchasing ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.accent} size="small" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        ) : null}

        <Pressable onPress={handleRestore} disabled={restoring} style={styles.restoreButton}>
          <Text style={styles.restoreButtonLabel}>
            {restoring ? "Restoring..." : "Restore purchases"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: "center",
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  featureList: {
    alignSelf: "stretch",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  featureItem: {
    ...typography.body,
    color: colors.textPrimary,
  },
  loading: {
    marginVertical: spacing.lg,
  },
  plans: {
    flexDirection: "row",
    gap: spacing.md,
    alignSelf: "stretch",
    marginBottom: spacing.md,
  },
  planCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    alignItems: "center",
  },
  planCardHighlighted: {
    borderColor: colors.accent,
  },
  planPrice: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  planLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  restoreButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  restoreButtonLabel: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "600",
  },
});
