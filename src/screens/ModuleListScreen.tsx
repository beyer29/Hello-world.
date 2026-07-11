import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useModules, useVehicle } from "@/context/AppProviders";
import { colors, spacing, typography } from "@/theme/theme";
import { ModulesStackParamList } from "@/navigation/RootNavigator";
import { ControlModule, ModuleCategory } from "@/types";

const CATEGORY_LABELS: Record<ModuleCategory, string> = {
  lighting: "Lighting",
  "instrument-cluster": "Cluster",
  climate: "Climate",
  "parking-assist": "Parking",
  transmission: "Transmission",
  engine: "Engine",
  comfort: "Comfort",
  other: "Other",
};

type Navigation = NativeStackNavigationProp<ModulesStackParamList, "ModuleList">;

export default function ModuleListScreen() {
  const navigation = useNavigation<Navigation>();
  const { vehicle, disconnect } = useVehicle();
  const { modules, loading, refresh } = useModules();

  const vehicleSummary = useMemo(() => {
    if (!vehicle) return null;
    const decoded = vehicle.decoded;
    const parts = [decoded.manufacturer, decoded.modelYear ?? undefined, decoded.platformGuess]
      .filter((part): part is string | number => part !== null && part !== undefined)
      .map((part) => String(part));
    return parts.length > 0 ? parts.join(" · ") : "Model details unavailable";
  }, [vehicle]);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleSelectModule = useCallback(
    (moduleId: string) => {
      navigation.navigate("ModuleDetail", { moduleId });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: ControlModule }) => (
      <Pressable
        onPress={() => handleSelectModule(item.id)}
        style={({ pressed }) => [styles.moduleRow, pressed && styles.moduleRowPressed]}
      >
        <View style={styles.moduleInfo}>
          <View style={styles.moduleTitleRow}>
            <Text style={styles.moduleCode}>{item.code}</Text>
            <Text style={styles.moduleName}>{item.name}</Text>
          </View>
          <Text style={styles.moduleDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{CATEGORY_LABELS[item.category]}</Text>
        </View>
      </Pressable>
    ),
    [handleSelectModule]
  );

  const showInitialLoading = loading && modules.length === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.vinBlock}>
              <Text style={styles.vinLabel}>VIN</Text>
              <Text style={styles.vinValue}>{vehicle?.vin ?? "Unknown"}</Text>
            </View>
            <Pressable onPress={handleDisconnect} style={styles.disconnectButton}>
              <Text style={styles.disconnectLabel}>Disconnect</Text>
            </Pressable>
          </View>
          {vehicleSummary ? <Text style={styles.vehicleSummary}>{vehicleSummary}</Text> : null}
          <View style={styles.headerBottomRow}>
            <Text style={styles.moduleCount}>
              {modules.length} module{modules.length === 1 ? "" : "s"}
            </Text>
            <Pressable onPress={handleRefresh} disabled={loading} style={styles.refreshButton}>
              {loading && modules.length > 0 ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : (
                <Text style={styles.refreshLabel}>Refresh</Text>
              )}
            </Pressable>
          </View>
        </View>

        {showInitialLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={styles.loadingText}>Reading control modules...</Text>
          </View>
        ) : (
          <FlatList
            data={modules}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            style={styles.list}
            contentContainerStyle={modules.length === 0 ? styles.listEmptyContainer : undefined}
            refreshControl={
              <RefreshControl
                refreshing={loading && modules.length > 0}
                onRefresh={handleRefresh}
                tintColor={colors.accent}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No control modules found. Pull down or tap "Refresh" to try again.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  vinBlock: {
    flex: 1,
    marginRight: spacing.md,
  },
  vinLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  vinValue: {
    ...typography.title,
    color: colors.textPrimary,
  },
  disconnectButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  disconnectLabel: {
    ...typography.body,
    color: colors.danger,
    fontWeight: "600",
  },
  vehicleSummary: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  headerBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  moduleCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  refreshButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minWidth: 64,
    alignItems: "flex-end",
  },
  refreshLabel: {
    ...typography.body,
    color: colors.accent,
    fontWeight: "600",
  },
  list: {
    flex: 1,
  },
  listEmptyContainer: {
    flexGrow: 1,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  moduleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  moduleRowPressed: {
    opacity: 0.85,
  },
  moduleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  moduleTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  moduleCode: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: "700",
  },
  moduleName: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  moduleDescription: {
    ...typography.body,
    color: colors.textSecondary,
  },
  categoryBadge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryBadgeText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
});
