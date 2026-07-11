import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useVehicle } from "@/context/AppProviders";
import { colors, spacing, typography } from "@/theme/theme";
import { ObdDeviceInfo, ObdTransport } from "@/types";

const TRANSPORT_LABELS: Record<ObdTransport, string> = {
  "bluetooth-le": "Bluetooth LE adapter",
  "bluetooth-classic": "Bluetooth Classic adapter",
  simulated: "Simulated demo adapter",
};

export default function VehicleConnectScreen() {
  const { connectionState, discoveredDevices, error, scanForDevices, connectToDevice } =
    useVehicle();

  const isScanning = connectionState === "scanning";
  const isConnecting = connectionState === "connecting";
  const isBusy = isScanning || isConnecting;

  const handleScan = useCallback(() => {
    scanForDevices();
  }, [scanForDevices]);

  const handleConnect = useCallback(
    (deviceId: string) => {
      connectToDevice(deviceId);
    },
    [connectToDevice]
  );

  const renderItem = useCallback(
    ({ item }: { item: ObdDeviceInfo }) => (
      <View style={styles.deviceRow}>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name}</Text>
          <Text style={styles.deviceMeta}>
            {TRANSPORT_LABELS[item.transport]}
            {typeof item.rssi === "number" ? ` · ${item.rssi} dBm` : ""}
          </Text>
        </View>
        <Pressable
          onPress={() => handleConnect(item.id)}
          disabled={isConnecting}
          style={({ pressed }) => [
            styles.connectButton,
            isConnecting && styles.buttonDisabled,
            pressed && !isConnecting && styles.buttonPressed,
          ]}
        >
          {isConnecting ? (
            <ActivityIndicator color={colors.textPrimary} size="small" />
          ) : (
            <Text style={styles.connectButtonLabel}>Connect</Text>
          )}
        </Pressable>
      </View>
    ),
    [handleConnect, isConnecting]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Connect your vehicle</Text>
        <Text style={styles.paragraph}>
          BimmerCoder talks to your car through a Bluetooth ELM327-compatible OBD-II adapter
          plugged into the OBD-II port (usually under the dashboard). Pair the adapter over
          Bluetooth in your phone's settings first, then turn the ignition on with the engine
          off and scan below to find it.
        </Text>
        <Text style={styles.note}>
          No adapter handy? Scanning will also discover simulated demo adapters so you can
          explore the whole app without any hardware.
        </Text>

        {connectionState === "error" && error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={handleScan}
          disabled={isScanning}
          style={({ pressed }) => [
            styles.scanButton,
            isScanning && styles.buttonDisabled,
            pressed && !isScanning && styles.buttonPressed,
          ]}
        >
          {isScanning ? (
            <View style={styles.scanButtonBusy}>
              <ActivityIndicator color={colors.textPrimary} />
              <Text style={styles.scanButtonLabel}>Scanning...</Text>
            </View>
          ) : (
            <Text style={styles.scanButtonLabel}>Scan for adapters</Text>
          )}
        </Pressable>

        <FlatList
          data={discoveredDevices}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={
            discoveredDevices.length === 0 ? styles.listEmptyContainer : undefined
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              {isScanning ? (
                <>
                  <ActivityIndicator color={colors.accent} />
                  <Text style={styles.emptyStateText}>Looking for adapters nearby...</Text>
                </>
              ) : (
                <Text style={styles.emptyStateText}>
                  No adapters found yet. Tap "Scan for adapters" to begin.
                </Text>
              )}
            </View>
          }
        />

        {isConnecting ? (
          <View style={styles.connectingBanner}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.connectingText}>Connecting to adapter...</Text>
          </View>
        ) : null}
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
    padding: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  paragraph: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  note: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  errorBanner: {
    backgroundColor: colors.danger,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  scanButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  scanButtonBusy: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  scanButtonLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  list: {
    flex: 1,
  },
  listEmptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  deviceInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  deviceName: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  deviceMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  connectButton: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 84,
    alignItems: "center",
    justifyContent: "center",
  },
  connectButtonLabel: {
    ...typography.body,
    fontWeight: "700",
    color: colors.background,
  },
  connectingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  connectingText: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
