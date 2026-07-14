import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSubscription, useVehicle } from "@/context/AppProviders";
import { theme } from "@/theme/theme";
import VehicleConnectScreen from "@/screens/VehicleConnectScreen";
import ModuleListScreen from "@/screens/ModuleListScreen";
import ModuleDetailScreen from "@/screens/ModuleDetailScreen";
import BackupRestoreScreen from "@/screens/BackupRestoreScreen";
import FlashScreen from "@/screens/FlashScreen";
import DiagnosticsScreen from "@/screens/DiagnosticsScreen";
import AgentScreen from "@/screens/AgentScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import PaywallScreen from "@/screens/PaywallScreen";

export type ModulesStackParamList = {
  ModuleList: undefined;
  ModuleDetail: { moduleId: string };
  Flash: { moduleId: string };
};

export type RootTabParamList = {
  AgentTab: undefined;
  DiagnosticsTab: undefined;
  ModulesTab: undefined;
  BackupsTab: undefined;
  SettingsTab: undefined;
};

const ModulesStack = createNativeStackNavigator<ModulesStackParamList>();

function ModulesStackNavigator() {
  return (
    <ModulesStack.Navigator>
      <ModulesStack.Screen
        name="ModuleList"
        component={ModuleListScreen}
        options={{ title: "Control Modules" }}
      />
      <ModulesStack.Screen
        name="ModuleDetail"
        component={ModuleDetailScreen}
        options={{ title: "Coding" }}
      />
      <ModulesStack.Screen name="Flash" component={FlashScreen} options={{ title: "Flash" }} />
    </ModulesStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<RootTabParamList>();

/**
 * Wraps a premium-only screen so free-tier users see the paywall instead.
 * Diagnostics (scanning) and Settings stay free - everything else here
 * (Beyer, Modules/coding, Backups) is premium.
 */
function withPaywall(Component: React.ComponentType, featureName: string) {
  return function Gated() {
    const { status, loading } = useSubscription();
    if (!loading && status.tier !== "premium") {
      return <PaywallScreen featureName={featureName} />;
    }
    return <Component />;
  };
}

const GatedAgentScreen = withPaywall(AgentScreen, "Beyer");
const GatedModulesStackNavigator = withPaywall(ModulesStackNavigator, "Modules & coding");
const GatedBackupRestoreScreen = withPaywall(BackupRestoreScreen, "Backups");

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="AgentTab" component={GatedAgentScreen} options={{ title: "Beyer" }} />
      <Tab.Screen
        name="DiagnosticsTab"
        component={DiagnosticsScreen}
        options={{ title: "Diagnostics" }}
      />
      <Tab.Screen
        name="ModulesTab"
        component={GatedModulesStackNavigator}
        options={{ title: "Modules" }}
      />
      <Tab.Screen
        name="BackupsTab"
        component={GatedBackupRestoreScreen}
        options={{ title: "Backups" }}
      />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ title: "Settings" }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { vehicle } = useVehicle();

  return (
    <NavigationContainer theme={theme.navigationTheme}>
      {vehicle ? <MainTabs /> : <VehicleConnectScreen />}
    </NavigationContainer>
  );
}
