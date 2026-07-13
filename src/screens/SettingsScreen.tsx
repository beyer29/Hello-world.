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
import { useServices, useVehicle } from "@/context/AppProviders";
import { colors, spacing, typography } from "@/theme/theme";
import { ObdTransport } from "@/types";

const TRANSPORT_LABELS: Record<ObdTransport, string> = {
  "bluetooth-le": "Bluetooth LE",
  "bluetooth-classic": "Bluetooth Classic",
  simulated: "Simulated (demo)",
};

export default function SettingsScreen() {
  const { obd } = useServices();
  const { vehicle, disconnect } = useVehicle();
  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnect = useCallback(async () => {
    setDisconnecting(true);
    try {
      await disconnect();
    } catch (err) {
      Alert.alert("Disconnect failed", String(err));
    } finally {
      setDisconnecting(false);
    }
  }, [disconnect]);

  const transportLabel = TRANSPORT_LABELS[obd.transport];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Adapter mode</Text>
              <Text style={styles.rowValue}>{transportLabel}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Vehicle</Text>
              <Text style={styles.rowValue}>{vehicle ? vehicle.vin : "Not connected"}</Text>
            </View>
            {vehicle ? (
              <>
                <View style={styles.divider} />
                <Pressable
                  onPress={handleDisconnect}
                  disabled={disconnecting}
                  style={({ pressed }) => [
                    styles.disconnectButton,
                    disconnecting && styles.buttonDisabled,
                    pressed && !disconnecting && styles.buttonPressed,
                  ]}
                >
                  {disconnecting ? (
                    <ActivityIndicator color={colors.danger} size="small" />
                  ) : (
                    <Text style={styles.disconnectButtonLabel}>Disconnect</Text>
                  )}
                </Pressable>
              </>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <Text style={styles.paragraph}>
              The Coder demonstrates what an Autel-style multi-brand diagnostic and coding
              workflow looks like end to end, across BMW/MINI, the BMW-co-developed Toyota Supra,
              Audi, Volkswagen, and Mercedes-Benz: scanning for an OBD-II adapter, decoding the
              VIN, reading fault codes and live data, browsing a vehicle's control modules,
              toggling coding options, backing up/restoring coding, and running a module software
              update.
            </Text>
            <Text style={styles.paragraph}>
              The Diagnostics tab's fault-code read/clear and live data are real, standardized
              OBD-II functionality (SAE J1979/ISO 15031) - it works the same way regardless of
              make. Everything else that's brand-specific is different: the coding options shown
              per control module (Modules tab) are clearly labelled sample data - illustrative
              placeholders modelled on the kinds of settings real tools expose, not verified real
              manufacturer byte offsets, which come from each OEM's proprietary diagnostic data
              and aren't public. See src/data/README.md for details.
            </Text>
            <Text style={styles.paragraph}>
              Similarly, the Flash tab's "update module software" and Stage 1/2/3 tuning workflow
              is fully simulated. It walks through the same pre-checks, backup, erase, write,
              verify, and rollback steps a real tool would show, but against a timed simulation
              rather than a real control unit - real flashing/tuning needs proprietary OEM
              firmware containers and a wired pass-thru connection that this app intentionally
              does not implement. You can also import a real file you obtained elsewhere to stage
              it here, but the install step stays simulated either way. See
              src/services/flash/README.md for details.
            </Text>
            <Text style={styles.paragraph}>
              Beyer (the chat tab) can trigger any of the above for you - it's not a separate
              capability, just a natural-language front end for the same actions. It's a local
              rule-based assistant, not a language model: no network calls, no API key. Its
              repair advice comes from a small table of real, generic (SAE-standardized) code
              knowledge, not a physical inspection - see src/services/agent/README.md.
            </Text>
          </View>
        </View>
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
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  rowLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  rowValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  disconnectButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  disconnectButtonLabel: {
    ...typography.body,
    color: colors.danger,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  paragraph: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
});
