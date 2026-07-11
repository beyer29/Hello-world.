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
              BimmerCoder demonstrates what a BimmerCode-style coding and flashing workflow looks
              like end to end: scanning for an OBD-II adapter, reading a vehicle's control
              modules, toggling coding options, backing up and restoring coding, and running a
              module software update.
            </Text>
            <Text style={styles.paragraph}>
              The coding options shown for each control module (in the Modules tab) are clearly
              labelled sample data - illustrative placeholders modelled on the kinds of settings
              real tools expose, not verified real BMW byte offsets. Real BMW coding definitions
              come from BMW's proprietary NCS/ISTA data, which isn't public and isn't reproduced
              here. See src/data/README.md for details.
            </Text>
            <Text style={styles.paragraph}>
              Similarly, the Flash tab's "update module software" workflow is fully simulated. It
              walks through the same pre-checks, backup, erase, write, verify, and rollback steps
              a real tool would show, but against a timed simulation rather than a real control
              unit - real flashing needs proprietary BMW firmware containers and a wired
              pass-thru connection that this app intentionally does not implement. See
              src/services/flash/README.md for details.
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
