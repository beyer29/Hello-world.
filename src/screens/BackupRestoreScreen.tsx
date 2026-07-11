import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useBackups, useVehicle } from "@/context/AppProviders";
import { colors, spacing, typography } from "@/theme/theme";
import { CodingBackup } from "@/types";

const DEFAULT_LABEL_PLACEHOLDER = "Manual backup";

export default function BackupRestoreScreen() {
  const { vehicle } = useVehicle();
  const { backups, refresh, createBackup, restoreBackup, deleteBackup } = useBackups();
  const [label, setLabel] = useState("");

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreateBackup = useCallback(() => {
    const trimmed = label.trim();
    createBackup(trimmed.length > 0 ? trimmed : DEFAULT_LABEL_PLACEHOLDER);
    setLabel("");
  }, [label, createBackup]);

  const handleRestore = useCallback(
    (backup: CodingBackup) => {
      Alert.alert(
        "Restore backup",
        `Restore "${backup.label}"? This will overwrite the current coding on your vehicle with the ${backup.entries.length} saved setting${
          backup.entries.length === 1 ? "" : "s"
        } from this backup.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Restore",
            style: "destructive",
            onPress: () => restoreBackup(backup.id),
          },
        ]
      );
    },
    [restoreBackup]
  );

  const handleDelete = useCallback(
    (backup: CodingBackup) => {
      Alert.alert(
        "Delete backup",
        `Delete "${backup.label}"? This cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => deleteBackup(backup.id),
          },
        ]
      );
    },
    [deleteBackup]
  );

  const renderItem = useCallback(
    ({ item }: { item: CodingBackup }) => (
      <View style={styles.backupRow}>
        <View style={styles.backupInfo}>
          <Text style={styles.backupLabel}>{item.label}</Text>
          <Text style={styles.backupMeta}>{new Date(item.createdAt).toLocaleString()}</Text>
          <Text style={styles.backupMeta}>
            {item.entries.length} setting{item.entries.length === 1 ? "" : "s"} saved
          </Text>
        </View>
        <View style={styles.backupActions}>
          <Pressable
            onPress={() => handleRestore(item)}
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
          >
            <Text style={styles.restoreLabel}>Restore</Text>
          </Pressable>
          <Pressable
            onPress={() => handleDelete(item)}
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
          >
            <Text style={styles.deleteLabel}>Delete</Text>
          </Pressable>
        </View>
      </View>
    ),
    [handleRestore, handleDelete]
  );

  if (!vehicle) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Connect to a vehicle first</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Backups</Text>
          <Text style={styles.subtitle}>
            Save and restore the current coding for this vehicle.
          </Text>
          <View style={styles.createRow}>
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder={DEFAULT_LABEL_PLACEHOLDER}
              placeholderTextColor={colors.textSecondary}
              style={styles.labelInput}
            />
            <Pressable
              onPress={handleCreateBackup}
              style={({ pressed }) => [styles.createButton, pressed && styles.createButtonPressed]}
            >
              <Text style={styles.createButtonLabel}>Create backup now</Text>
            </Pressable>
          </View>
        </View>

        <FlatList
          data={backups}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={backups.length === 0 ? styles.listEmptyContainer : undefined}
          ListEmptyComponent={
            <View style={styles.listEmptyState}>
              <Text style={styles.emptyStateText}>No backups yet</Text>
            </View>
          }
        />
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
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  createRow: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  labelInput: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  createButtonPressed: {
    opacity: 0.85,
  },
  createButtonLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  list: {
    flex: 1,
  },
  listEmptyContainer: {
    flexGrow: 1,
  },
  listEmptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  backupRow: {
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
  backupInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  backupLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  backupMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  backupActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  restoreLabel: {
    ...typography.body,
    color: colors.accent,
    fontWeight: "600",
  },
  deleteLabel: {
    ...typography.body,
    color: colors.danger,
    fontWeight: "600",
  },
});
