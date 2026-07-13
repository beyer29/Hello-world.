import React, { useCallback, useEffect } from "react";
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
import { useDiagnostics, useVehicle } from "@/context/AppProviders";
import { colors, spacing, typography } from "@/theme/theme";
import { DtcCode } from "@/types";

export default function DiagnosticsScreen() {
  const { vehicle } = useVehicle();
  const {
    scanResult,
    scanning,
    liveData,
    liveDataActive,
    scanForCodes,
    clearCodes,
    startLiveData,
    stopLiveData,
  } = useDiagnostics();

  useEffect(() => {
    return () => stopLiveData();
  }, [stopLiveData]);

  const handleClear = useCallback(() => {
    Alert.alert("Clear fault codes", "Clear all stored/pending diagnostic trouble codes?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => clearCodes() },
    ]);
  }, [clearCodes]);

  if (!vehicle) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Not connected</Text>
          <Text style={styles.emptyBody}>Connect to a vehicle first to run diagnostics.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Diagnostics</Text>
        <Text style={styles.subtitle}>{vehicle.decoded.manufacturer} · {vehicle.vin}</Text>
        <Text style={styles.infoBody}>
          Fault-code reading/clearing and live data below use the real, standardized OBD-II
          protocol (SAE J1979/ISO 15031) - this works the same way on every make, unlike the
          brand-specific coding in the Modules tab. Descriptions are only shown for generic
          (P0xxx-style) codes that are publicly defined the same way for every manufacturer;
          manufacturer-specific codes show as unknown rather than a guessed meaning.
        </Text>

        <Pressable
          onPress={scanForCodes}
          disabled={scanning}
          style={({ pressed }) => [
            styles.primaryButton,
            scanning && styles.buttonDisabled,
            pressed && !scanning && styles.buttonPressed,
          ]}
        >
          {scanning ? (
            <ActivityIndicator color={colors.textPrimary} size="small" />
          ) : (
            <Text style={styles.primaryButtonLabel}>Full system scan</Text>
          )}
        </Pressable>

        {scanResult ? (
          <View style={styles.resultsBlock}>
            <Text style={styles.sectionTitle}>
              Stored codes ({scanResult.storedCodes.length})
            </Text>
            <DtcList codes={scanResult.storedCodes} emptyLabel="No stored codes" />

            <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
              Pending codes ({scanResult.pendingCodes.length})
            </Text>
            <DtcList codes={scanResult.pendingCodes} emptyLabel="No pending codes" />

            {scanResult.storedCodes.length > 0 || scanResult.pendingCodes.length > 0 ? (
              <Pressable
                onPress={handleClear}
                style={({ pressed }) => [styles.clearButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.clearButtonLabel}>Clear codes</Text>
              </Pressable>
            ) : null}

            <Text style={styles.scanMeta}>
              Scanned {new Date(scanResult.scannedAt).toLocaleString()}
            </Text>
          </View>
        ) : null}

        <View style={styles.liveDataHeader}>
          <Text style={styles.sectionTitle}>Live data</Text>
          <Pressable
            onPress={liveDataActive ? stopLiveData : startLiveData}
            style={({ pressed }) => [
              styles.liveDataToggle,
              liveDataActive && styles.liveDataToggleActive,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text
              style={[
                styles.liveDataToggleLabel,
                liveDataActive && styles.liveDataToggleLabelActive,
              ]}
            >
              {liveDataActive ? "Stop" : "Start"}
            </Text>
          </Pressable>
        </View>

        {liveDataActive && liveData.length === 0 ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.accent} size="small" />
            <Text style={styles.loadingText}>Reading live PIDs...</Text>
          </View>
        ) : (
          <View style={styles.liveGrid}>
            {liveData.map((reading) => (
              <View key={reading.pid} style={styles.liveTile}>
                <Text style={styles.liveTileLabel}>{reading.label}</Text>
                <Text style={styles.liveTileValue}>
                  {reading.value} <Text style={styles.liveTileUnit}>{reading.unit}</Text>
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DtcList({ codes, emptyLabel }: { codes: DtcCode[]; emptyLabel: string }) {
  if (codes.length === 0) {
    return <Text style={styles.emptyListLabel}>{emptyLabel}</Text>;
  }
  return (
    <View style={styles.dtcList}>
      {codes.map((dtc) => (
        <View key={`${dtc.status}-${dtc.code}`} style={styles.dtcRow}>
          <Text style={styles.dtcCode}>{dtc.code}</Text>
          <Text style={styles.dtcDescription}>
            {dtc.description ?? "Unknown / manufacturer-specific code"}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.title,
    color: colors.textPrimary,
  },
  emptyBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  infoBody: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  primaryButtonLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  resultsBlock: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  sectionTitleSpaced: {
    marginTop: spacing.lg,
  },
  emptyListLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  dtcList: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  dtcRow: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  dtcCode: {
    ...typography.subtitle,
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  dtcDescription: {
    ...typography.body,
    color: colors.textPrimary,
  },
  clearButton: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  clearButtonLabel: {
    ...typography.body,
    color: colors.danger,
    fontWeight: "600",
  },
  scanMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  liveDataHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  liveDataToggle: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  liveDataToggleActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  liveDataToggleLabel: {
    ...typography.body,
    color: colors.accent,
    fontWeight: "600",
  },
  liveDataToggleLabelActive: {
    color: colors.background,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  liveGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  liveTile: {
    minWidth: "45%",
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  liveTileLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  liveTileValue: {
    ...typography.title,
    color: colors.textPrimary,
  },
  liveTileUnit: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
