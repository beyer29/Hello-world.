import React, { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useBackups, useModules } from "@/context/AppProviders";
import { colors, spacing, typography } from "@/theme/theme";
import { ModulesStackParamList } from "@/navigation/RootNavigator";
import { CodingOption } from "@/types";

type ModuleDetailRouteProp = RouteProp<ModulesStackParamList, "ModuleDetail">;
type ModuleDetailNavigationProp = NativeStackNavigationProp<
  ModulesStackParamList,
  "ModuleDetail"
>;

export default function ModuleDetailScreen() {
  const route = useRoute<ModuleDetailRouteProp>();
  const navigation = useNavigation<ModuleDetailNavigationProp>();
  const { modules, updateOption, resetOption } = useModules();
  const { createBackup } = useBackups();
  const [backingUp, setBackingUp] = useState(false);

  const module = modules.find((m) => m.id === route.params.moduleId);

  const handleBackup = useCallback(async () => {
    if (!module) return;
    setBackingUp(true);
    try {
      await createBackup(`Before editing ${module.name}`);
      Alert.alert("Backup created", `Saved current coding as "Before editing ${module.name}".`);
    } catch (err) {
      Alert.alert("Backup failed", String(err));
    } finally {
      setBackingUp(false);
    }
  }, [module, createBackup]);

  const handleFlash = useCallback(() => {
    if (!module) return;
    navigation.navigate("Flash", { moduleId: module.id });
  }, [module, navigation]);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{module.name}</Text>
        <Text style={styles.description}>{module.description}</Text>

        <Pressable
          onPress={handleBackup}
          disabled={backingUp}
          style={({ pressed }) => [
            styles.backupButton,
            backingUp && styles.buttonDisabled,
            pressed && !backingUp && styles.buttonPressed,
          ]}
        >
          <Text style={styles.backupButtonLabel}>
            {backingUp ? "Backing up..." : "Back up current coding"}
          </Text>
        </Pressable>

        <View style={styles.optionsList}>
          {module.options.map((option) => (
            <OptionRow
              key={option.id}
              option={option}
              onChange={(value) => updateOption(module.id, option.id, value)}
              onReset={() => resetOption(module.id, option.id)}
            />
          ))}
        </View>

        {module.supportsFlashing ? (
          <View style={styles.flashSection}>
            <View style={styles.flashDivider} />
            <Text style={styles.flashTitle}>Module software</Text>
            <Text style={styles.flashBody}>
              This module also supports firmware/software updates in addition to coding. This is
              a higher-risk operation than the toggles above.
            </Text>
            <Pressable
              onPress={handleFlash}
              style={({ pressed }) => [styles.flashButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.flashButtonLabel}>Flash / update module software...</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

interface OptionRowProps {
  option: CodingOption;
  onChange: (value: boolean | string | number) => void;
  onReset: () => void;
}

function OptionRow({ option, onChange, onReset }: OptionRowProps) {
  return (
    <View style={styles.optionRow}>
      <View style={styles.optionHeader}>
        <View style={styles.optionHeaderText}>
          <Text style={styles.optionLabel}>{option.label}</Text>
          <Text style={styles.optionDescription}>{option.description}</Text>
        </View>
        <Pressable onPress={onReset} style={styles.resetButton} hitSlop={8}>
          <Text style={styles.resetButtonLabel}>Reset</Text>
        </Pressable>
      </View>

      <View style={styles.optionControl}>
        {option.kind === "toggle" ? (
          <ToggleControl option={option} onChange={onChange} />
        ) : option.kind === "choice" ? (
          <ChoiceControl option={option} onChange={onChange} />
        ) : (
          <NumericControl option={option} onChange={onChange} />
        )}
      </View>

      {option.sampleData ? (
        <View style={styles.sampleBadge}>
          <Text style={styles.sampleBadgeText}>Sample data - not verified against a real ECU</Text>
        </View>
      ) : null}
    </View>
  );
}

function ToggleControl({
  option,
  onChange,
}: {
  option: Extract<CodingOption, { kind: "toggle" }>;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleValueLabel}>{option.currentValue ? "On" : "Off"}</Text>
      <Switch
        value={option.currentValue}
        onValueChange={onChange}
        trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
        thumbColor={colors.textPrimary}
      />
    </View>
  );
}

function ChoiceControl({
  option,
  onChange,
}: {
  option: Extract<CodingOption, { kind: "choice" }>;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.choiceRow}>
      {option.choices.map((choice) => {
        const selected = choice.value === option.currentValue;
        return (
          <Pressable
            key={choice.value}
            onPress={() => onChange(choice.value)}
            style={({ pressed }) => [
              styles.choicePill,
              selected && styles.choicePillSelected,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.choicePillLabel, selected && styles.choicePillLabelSelected]}>
              {choice.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function NumericControl({
  option,
  onChange,
}: {
  option: Extract<CodingOption, { kind: "numeric" }>;
  onChange: (value: number) => void;
}) {
  const canDecrement = option.currentValue - option.step >= option.min;
  const canIncrement = option.currentValue + option.step <= option.max;

  const clamp = (value: number) => Math.min(option.max, Math.max(option.min, value));

  return (
    <View style={styles.numericRow}>
      <Pressable
        onPress={() => onChange(clamp(option.currentValue - option.step))}
        disabled={!canDecrement}
        style={({ pressed }) => [
          styles.stepperButton,
          !canDecrement && styles.buttonDisabled,
          pressed && canDecrement && styles.buttonPressed,
        ]}
      >
        <Text style={styles.stepperButtonLabel}>-</Text>
      </Pressable>
      <Text style={styles.numericValue}>
        {option.currentValue}
        {option.unit ? ` ${option.unit}` : ""}
      </Text>
      <Pressable
        onPress={() => onChange(clamp(option.currentValue + option.step))}
        disabled={!canIncrement}
        style={({ pressed }) => [
          styles.stepperButton,
          !canIncrement && styles.buttonDisabled,
          pressed && canIncrement && styles.buttonPressed,
        ]}
      >
        <Text style={styles.stepperButtonLabel}>+</Text>
      </Pressable>
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
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  backupButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  backupButtonLabel: {
    ...typography.body,
    color: colors.accent,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  optionsList: {
    gap: spacing.md,
  },
  optionRow: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  optionHeaderText: {
    flex: 1,
    marginRight: spacing.md,
  },
  optionLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  optionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  resetButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  resetButtonLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  optionControl: {
    marginTop: spacing.md,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: spacing.sm,
  },
  toggleValueLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  choicePill: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  choicePillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  choicePillLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  choicePillLabelSelected: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
  numericRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  numericValue: {
    ...typography.subtitle,
    color: colors.textPrimary,
    minWidth: 64,
    textAlign: "center",
  },
  sampleBadge: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  sampleBadgeText: {
    ...typography.caption,
    color: colors.warning,
  },
  flashSection: {
    marginTop: spacing.xl,
  },
  flashDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  flashTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  flashBody: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  flashButton: {
    backgroundColor: colors.danger,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  flashButtonLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
});
