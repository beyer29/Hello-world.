import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useBackups, useFlash, useModules } from "@/context/AppProviders";
import { colors, spacing, typography } from "@/theme/theme";
import { ModulesStackParamList } from "@/navigation/RootNavigator";
import { FlashJobStatus, FlashPackage } from "@/types";

type FlashRouteProp = RouteProp<ModulesStackParamList, "Flash">;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const RUNNING_STATUSES: FlashJobStatus[] = [
  "pre-checks",
  "backing-up",
  "erasing",
  "writing",
  "verifying",
];

function statusColor(status: FlashJobStatus): string {
  switch (status) {
    case "complete":
      return colors.success;
    case "failed":
      return colors.danger;
    case "rolled-back":
      return colors.warning;
    default:
      return colors.textSecondary;
  }
}

function statusHeadline(status: FlashJobStatus): string {
  switch (status) {
    case "complete":
      return "Flash complete (simulated) - no real module was written";
    case "failed":
      return "Flash failed (simulated)";
    case "rolled-back":
      return "Flash aborted - simulated rollback restored";
    default:
      return status;
  }
}

export default function FlashScreen() {
  const route = useRoute<FlashRouteProp>();
  const { moduleId } = route.params;

  const { modules } = useModules();
  const {
    activeJob,
    progress,
    listPackages,
    importPackage,
    deleteImportedPackage,
    startFlash,
    abort,
  } = useFlash();
  const { createBackup } = useBackups();

  const module = modules.find((m) => m.id === moduleId);
  const moduleCode = module?.code;

  const [packages, setPackages] = useState<FlashPackage[] | null>(null);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const refreshPackages = useCallback(async () => {
    if (!moduleCode) return;
    try {
      setPackages(await listPackages(moduleCode));
      setPackagesError(null);
    } catch (err) {
      setPackages([]);
      setPackagesError(String(err));
    }
  }, [moduleCode, listPackages]);

  useEffect(() => {
    setPackages(null);
    refreshPackages();
  }, [moduleCode, refreshPackages]);

  const handleImport = useCallback(async () => {
    if (!moduleCode) return;
    setImportError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || result.assets.length === 0) return;
      const asset = result.assets[0];
      setIsImporting(true);
      await importPackage(moduleCode, {
        uri: asset.uri,
        name: asset.name,
        sizeBytes: asset.size ?? 0,
      });
      await refreshPackages();
    } catch (err) {
      setImportError(String(err));
    } finally {
      setIsImporting(false);
    }
  }, [moduleCode, importPackage, refreshPackages]);

  const handleDeleteImported = useCallback(
    (pkg: Extract<FlashPackage, { source: "imported" }>) => {
      Alert.alert("Delete imported file", `Remove "${pkg.name}" from this device?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteImportedPackage(pkg.id);
            setSelectedPackageId((current) => (current === pkg.id ? null : current));
            await refreshPackages();
          },
        },
      ]);
    },
    [deleteImportedPackage, refreshPackages]
  );

  const selectedPackage = packages?.find((p) => p.id === selectedPackageId) ?? null;

  const jobForThisModule = activeJob && activeJob.moduleId === moduleId ? activeJob : null;
  const isRunning = isFlashing || (jobForThisModule ? RUNNING_STATUSES.includes(jobForThisModule.status) : false);
  const canStart = !!selectedPackage && acknowledged && !isRunning;

  const handleStart = useCallback(async () => {
    if (!selectedPackage) return;
    setStartError(null);
    setIsFlashing(true);
    try {
      await createBackup(`Pre-flash backup - ${selectedPackage.name}`);
      await startFlash(moduleId, selectedPackage);
    } catch (err) {
      setStartError(String(err));
    } finally {
      setIsFlashing(false);
    }
  }, [selectedPackage, createBackup, startFlash, moduleId]);

  const handleAbort = useCallback(() => {
    abort();
  }, [abort]);

  if (!module) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundTitle}>Module not found</Text>
          <Text style={styles.notFoundBody}>
            This control module isn't available. Go back and pick another one from the list.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const progressPct = progress ? Math.round(progress.progress * 100) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{module.name}</Text>
        <Text style={styles.subtitle}>
          {module.code} · Module software flash
        </Text>

        <View style={styles.warningBanner}>
          <Text style={styles.warningTitle}>This is a simulated flash</Text>
          <Text style={styles.warningBody}>
            This workflow demonstrates the real pre-checks {"→"} backup {"→"} erase {"→"}{" "}
            write {"→"} verify sequence that real flashing tools use, step by step. It does not
            write any real firmware to a real control unit. Real BMW TCU/EGS firmware containers are
            proprietary OEM data (BMW ISTA/PSdZData) and are not included in this app - see
            src/services/flash/README.md for details.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Available packages</Text>
        {packages === null ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.accent} size="small" />
            <Text style={styles.loadingText}>Loading available packages...</Text>
          </View>
        ) : packagesError ? (
          <Text style={styles.errorText}>Couldn't load packages: {packagesError}</Text>
        ) : packages.length === 0 ? (
          <Text style={styles.emptyText}>No packages available for this module.</Text>
        ) : (
          <View style={styles.packageList}>
            {packages.map((pkg) => {
              const selected = pkg.id === selectedPackageId;
              const imported = pkg.source === "imported";
              return (
                <Pressable
                  key={pkg.id}
                  onPress={() => setSelectedPackageId(pkg.id)}
                  disabled={isRunning}
                  style={({ pressed }) => [
                    styles.packageRow,
                    selected && styles.packageRowSelected,
                    pressed && !isRunning && styles.buttonPressed,
                  ]}
                >
                  <View style={styles.packageRadio}>
                    {selected ? <View style={styles.packageRadioDot} /> : null}
                  </View>
                  <View style={styles.packageInfo}>
                    <Text style={styles.packageName}>{pkg.name}</Text>
                    <Text style={styles.packageDescription}>{pkg.description}</Text>
                    {imported ? (
                      <Text style={styles.packageMeta}>
                        {formatBytes(pkg.fileSizeBytes)} · imported{" "}
                        {new Date(pkg.importedAt).toLocaleDateString()}
                      </Text>
                    ) : null}
                    <Text style={styles.packageSampleBadge}>
                      {imported
                        ? "Your file - install below is still simulated, not a real write"
                        : "Simulated package - not real firmware"}
                    </Text>
                  </View>
                  {imported ? (
                    <Pressable
                      onPress={() => handleDeleteImported(pkg)}
                      disabled={isRunning}
                      hitSlop={8}
                      style={styles.deleteImportedButton}
                    >
                      <Text style={styles.deleteImportedButtonLabel}>Delete</Text>
                    </Pressable>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}

        <Pressable
          onPress={handleImport}
          disabled={isImporting || isRunning || !moduleCode}
          style={({ pressed }) => [
            styles.importButton,
            (isImporting || isRunning) && styles.buttonDisabled,
            pressed && !(isImporting || isRunning) && styles.buttonPressed,
          ]}
        >
          {isImporting ? (
            <ActivityIndicator color={colors.accent} size="small" />
          ) : (
            <Text style={styles.importButtonLabel}>Import your own tune file...</Text>
          )}
        </Pressable>
        <Text style={styles.importCaption}>
          Bring a real file exported from your own licensed tuning software/tuner. This app
          stages it and runs it through the same simulated install below - actually writing it to
          a real vehicle still requires that tool's own hardware and security-access process.
        </Text>
        {importError ? <Text style={styles.errorText}>{importError}</Text> : null}

        <View style={styles.ackRow}>
          <View style={styles.ackTextBlock}>
            <Text style={styles.ackLabel}>I understand this is a simulated flash</Text>
            <Text style={styles.ackCaption}>
              No real firmware will be written to a real control unit.
            </Text>
          </View>
          <Switch
            value={acknowledged}
            onValueChange={setAcknowledged}
            disabled={isRunning}
            trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
            thumbColor={colors.textPrimary}
          />
        </View>

        {isRunning ? (
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>{progress?.label ?? "Starting..."}</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { flex: progressPct }]} />
              <View style={{ flex: 100 - progressPct }} />
            </View>
            <Text style={styles.progressPct}>{progressPct}%</Text>
            <Pressable
              onPress={handleAbort}
              style={({ pressed }) => [styles.abortButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.abortButtonLabel}>Abort</Text>
            </Pressable>
          </View>
        ) : null}

        {!isRunning && jobForThisModule ? (
          <View
            style={[
              styles.completionBanner,
              { borderColor: statusColor(jobForThisModule.status) },
            ]}
          >
            <Text style={[styles.completionTitle, { color: statusColor(jobForThisModule.status) }]}>
              {statusHeadline(jobForThisModule.status)}
            </Text>
            {jobForThisModule.error ? (
              <Text style={styles.completionBody}>{jobForThisModule.error}</Text>
            ) : null}
          </View>
        ) : null}

        {startError ? <Text style={styles.errorText}>{startError}</Text> : null}

        <Pressable
          onPress={handleStart}
          disabled={!canStart}
          style={({ pressed }) => [
            styles.startButton,
            !canStart && styles.buttonDisabled,
            pressed && canStart && styles.buttonPressed,
          ]}
        >
          <Text style={styles.startButtonLabel}>
            {isRunning ? "Flashing..." : "Start flash"}
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  notFoundTitle: {
    ...typography.title,
    color: colors.textPrimary,
  },
  notFoundBody: {
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
    marginBottom: spacing.lg,
  },
  warningBanner: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  warningTitle: {
    ...typography.subtitle,
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  warningBody: {
    ...typography.body,
    color: colors.textPrimary,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    marginBottom: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  packageList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  packageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  packageRowSelected: {
    borderColor: colors.primary,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  packageRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    marginTop: spacing.xs,
  },
  packageRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  packageInfo: {
    flex: 1,
  },
  packageName: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  packageDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  packageSampleBadge: {
    ...typography.caption,
    color: colors.warning,
  },
  packageMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  deleteImportedButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginLeft: spacing.sm,
  },
  deleteImportedButtonLabel: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: "600",
  },
  importButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  importButtonLabel: {
    ...typography.body,
    color: colors.accent,
    fontWeight: "600",
  },
  importCaption: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  ackRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  ackTextBlock: {
    flex: 1,
    marginRight: spacing.md,
  },
  ackLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  ackCaption: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  progressSection: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  progressLabel: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  progressBarTrack: {
    flexDirection: "row",
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  progressPct: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    alignSelf: "flex-end",
  },
  abortButton: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  abortButtonLabel: {
    ...typography.body,
    color: colors.danger,
    fontWeight: "600",
  },
  completionBanner: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  completionTitle: {
    ...typography.subtitle,
    marginBottom: spacing.xs,
  },
  completionBody: {
    ...typography.body,
    color: colors.textSecondary,
  },
  startButton: {
    backgroundColor: colors.danger,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
});
