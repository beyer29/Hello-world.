import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AgentResponse,
  AgentTools,
  AiAgent,
  BackupService,
  ChatMessage,
  CodingBackup,
  CodingService,
  ConnectedVehicle,
  ControlModule,
  DiagnosticScanResult,
  DiagnosticsService,
  FlashJob,
  FlashPackage,
  FlashService,
  FlashStepResult,
  ImportedFlashPackage,
  LiveDataReading,
  ObdAdapter,
  ObdConnectionState,
  ObdDeviceInfo,
  PendingConfirmation,
  PickedFile,
  SubscriptionPlan,
  SubscriptionProduct,
  SubscriptionService,
  SubscriptionStatus,
} from "@/types";
import { createObdAdapter } from "@/services/obd";
import { decodeVin } from "@/services/vin";
import { SampleCodingService } from "@/services/coding";
import { AsyncStorageBackupService } from "@/services/backup";
import { SimulatedFlashService } from "@/services/flash";
import { Obd2DiagnosticsService } from "@/services/diagnostics";
import { LocalRuleBasedAgent } from "@/services/agent";
import { createSubscriptionService, MockSubscriptionService } from "@/services/subscription";

interface Services {
  obd: ObdAdapter;
  coding: CodingService;
  backup: BackupService;
  flash: FlashService;
  diagnostics: DiagnosticsService;
  subscription: SubscriptionService;
}

const ServicesContext = createContext<Services | null>(null);

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) throw new Error("useServices must be used within AppProviders");
  return services;
}

interface VehicleState {
  vehicle: ConnectedVehicle | null;
  connectionState: ObdConnectionState;
  discoveredDevices: ObdDeviceInfo[];
  error: string | null;
}

interface VehicleContextValue extends VehicleState {
  scanForDevices: () => Promise<void>;
  connectToDevice: (deviceId: string) => Promise<void>;
  disconnect: () => Promise<void>;
}

const VehicleContext = createContext<VehicleContextValue | null>(null);

export function useVehicle(): VehicleContextValue {
  const ctx = useContext(VehicleContext);
  if (!ctx) throw new Error("useVehicle must be used within AppProviders");
  return ctx;
}

interface ModulesContextValue {
  modules: ControlModule[];
  loading: boolean;
  refresh: () => Promise<void>;
  updateOption: (
    moduleId: string,
    optionId: string,
    value: boolean | string | number
  ) => Promise<void>;
  resetOption: (moduleId: string, optionId: string) => Promise<void>;
}

const ModulesContext = createContext<ModulesContextValue | null>(null);

export function useModules(): ModulesContextValue {
  const ctx = useContext(ModulesContext);
  if (!ctx) throw new Error("useModules must be used within AppProviders");
  return ctx;
}

interface BackupsContextValue {
  backups: CodingBackup[];
  refresh: () => Promise<void>;
  createBackup: (label: string) => Promise<void>;
  restoreBackup: (backupId: string) => Promise<void>;
  deleteBackup: (backupId: string) => Promise<void>;
}

const BackupsContext = createContext<BackupsContextValue | null>(null);

export function useBackups(): BackupsContextValue {
  const ctx = useContext(BackupsContext);
  if (!ctx) throw new Error("useBackups must be used within AppProviders");
  return ctx;
}

interface FlashContextValue {
  activeJob: FlashJob | null;
  progress: FlashStepResult | null;
  listPackages: (moduleCode: string) => Promise<FlashPackage[]>;
  importPackage: (moduleCode: string, file: PickedFile, notes?: string) => Promise<ImportedFlashPackage>;
  deleteImportedPackage: (packageId: string) => Promise<void>;
  startFlash: (moduleId: string, pkg: FlashPackage) => Promise<FlashJob>;
  abort: () => Promise<void>;
}

const FlashContext = createContext<FlashContextValue | null>(null);

export function useFlash(): FlashContextValue {
  const ctx = useContext(FlashContext);
  if (!ctx) throw new Error("useFlash must be used within AppProviders");
  return ctx;
}

interface DiagnosticsContextValue {
  scanResult: DiagnosticScanResult | null;
  scanning: boolean;
  liveData: LiveDataReading[];
  liveDataActive: boolean;
  scanForCodes: () => Promise<DiagnosticScanResult>;
  clearCodes: () => Promise<void>;
  startLiveData: () => void;
  stopLiveData: () => void;
}

const DiagnosticsContext = createContext<DiagnosticsContextValue | null>(null);

export function useDiagnostics(): DiagnosticsContextValue {
  const ctx = useContext(DiagnosticsContext);
  if (!ctx) throw new Error("useDiagnostics must be used within AppProviders");
  return ctx;
}

interface AgentContextValue {
  messages: ChatMessage[];
  pendingConfirmation: PendingConfirmation | null;
  sendMessage: (text: string) => Promise<AgentResponse>;
}

const AgentContext = createContext<AgentContextValue | null>(null);

export function useAgent(): AgentContextValue {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgent must be used within AppProviders");
  return ctx;
}

interface SubscriptionContextValue {
  status: SubscriptionStatus;
  loading: boolean;
  products: SubscriptionProduct[];
  purchasing: boolean;
  purchase: (plan: SubscriptionPlan) => Promise<void>;
  restorePurchases: () => Promise<void>;
  /** Only set when running the local mock (no real store configured) - lets Settings offer a demo downgrade. */
  resetToFreeForTesting: (() => Promise<void>) | null;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within AppProviders");
  return ctx;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const servicesRef = useRef<Services | null>(null);
  if (!servicesRef.current) {
    const obd = createObdAdapter();
    servicesRef.current = {
      obd,
      coding: new SampleCodingService(),
      backup: new AsyncStorageBackupService(),
      flash: new SimulatedFlashService(),
      diagnostics: new Obd2DiagnosticsService(obd),
      subscription: createSubscriptionService(),
    };
  }
  const services = servicesRef.current;

  const [vehicleState, setVehicleState] = useState<VehicleState>({
    vehicle: null,
    connectionState: "disconnected",
    discoveredDevices: [],
    error: null,
  });

  const [modules, setModules] = useState<ControlModule[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [backups, setBackups] = useState<CodingBackup[]>([]);
  const [activeJob, setActiveJob] = useState<FlashJob | null>(null);
  const [flashProgress, setFlashProgress] = useState<FlashStepResult | null>(null);

  const refreshModules = useCallback(async () => {
    if (!vehicleState.vehicle) return;
    setModulesLoading(true);
    try {
      setModules(await services.coding.readModules(vehicleState.vehicle.vin));
    } finally {
      setModulesLoading(false);
    }
  }, [services, vehicleState.vehicle]);

  const refreshBackups = useCallback(async () => {
    if (!vehicleState.vehicle) return;
    setBackups(await services.backup.listBackups(vehicleState.vehicle.vin));
  }, [services, vehicleState.vehicle]);

  useEffect(() => {
    if (vehicleState.vehicle) {
      refreshModules();
      refreshBackups();
    }
  }, [vehicleState.vehicle, refreshModules, refreshBackups]);

  const scanForDevices = useCallback(async () => {
    setVehicleState((s) => ({
      ...s,
      connectionState: "scanning",
      discoveredDevices: [],
      error: null,
    }));
    try {
      await services.obd.scan((device) => {
        setVehicleState((s) => ({ ...s, discoveredDevices: [...s.discoveredDevices, device] }));
      });
      setVehicleState((s) => ({ ...s, connectionState: "disconnected" }));
    } catch (err) {
      setVehicleState((s) => ({ ...s, connectionState: "error", error: String(err) }));
    }
  }, [services]);

  const connectToDevice = useCallback(
    async (deviceId: string) => {
      setVehicleState((s) => ({ ...s, connectionState: "connecting", error: null }));
      try {
        await services.obd.connect(deviceId);
        await services.obd.sendCommand("ATZ");
        await services.obd.sendCommand("ATE0");
        const vinResponse = await services.obd.sendCommand("0902");
        const vin = extractVinFromResponse(vinResponse);
        const decoded = decodeVin(vin);
        const vehicle: ConnectedVehicle = {
          vin,
          decoded,
          connectedAt: new Date().toISOString(),
          moduleIds: [],
        };
        setVehicleState((s) => ({ ...s, connectionState: "connected", vehicle }));
      } catch (err) {
        setVehicleState((s) => ({ ...s, connectionState: "error", error: String(err) }));
      }
    },
    [services]
  );

  const disconnect = useCallback(async () => {
    await services.obd.disconnect();
    setVehicleState({ vehicle: null, connectionState: "disconnected", discoveredDevices: [], error: null });
    setModules([]);
    setBackups([]);
    setScanResult(null);
    setLiveData([]);
    setLiveDataActive(false);
    if (liveDataIntervalRef.current) {
      clearInterval(liveDataIntervalRef.current);
      liveDataIntervalRef.current = null;
    }
  }, [services]);

  const updateOption = useCallback(
    async (moduleId: string, optionId: string, value: boolean | string | number) => {
      await services.coding.writeOption(moduleId, optionId, value);
      await refreshModules();
    },
    [services, refreshModules]
  );

  const resetOption = useCallback(
    async (moduleId: string, optionId: string) => {
      await services.coding.resetOptionToDefault(moduleId, optionId);
      await refreshModules();
    },
    [services, refreshModules]
  );

  const createBackup = useCallback(
    async (label: string) => {
      if (!vehicleState.vehicle) return;
      await services.backup.createBackup(vehicleState.vehicle.vin, label, modules);
      await refreshBackups();
    },
    [services, vehicleState.vehicle, modules, refreshBackups]
  );

  const restoreBackup = useCallback(
    async (backupId: string) => {
      const entries = await services.backup.restoreBackup(backupId);
      for (const entry of entries) {
        await services.coding.writeOption(entry.moduleId, entry.optionId, entry.value);
      }
      await refreshModules();
    },
    [services, refreshModules]
  );

  const deleteBackup = useCallback(
    async (backupId: string) => {
      await services.backup.deleteBackup(backupId);
      await refreshBackups();
    },
    [services, refreshBackups]
  );

  const listPackages = useCallback(
    (moduleCode: string) => services.flash.listAvailablePackages(moduleCode),
    [services]
  );

  const importPackage = useCallback(
    (moduleCode: string, file: PickedFile, notes?: string): Promise<ImportedFlashPackage> =>
      services.flash.importPackage(moduleCode, file, notes),
    [services]
  );

  const deleteImportedPackage = useCallback(
    (packageId: string) => services.flash.deleteImportedPackage(packageId),
    [services]
  );

  const startFlash = useCallback(
    async (moduleId: string, pkg: FlashPackage) => {
      setFlashProgress(null);
      const job = await services.flash.startFlash(moduleId, pkg, setFlashProgress);
      setActiveJob(job);
      return job;
    },
    [services]
  );

  const abort = useCallback(async () => {
    if (activeJob) await services.flash.abort(activeJob.id);
  }, [services, activeJob]);

  const vehicleValue = useMemo<VehicleContextValue>(
    () => ({ ...vehicleState, scanForDevices, connectToDevice, disconnect }),
    [vehicleState, scanForDevices, connectToDevice, disconnect]
  );

  const modulesValue = useMemo<ModulesContextValue>(
    () => ({ modules, loading: modulesLoading, refresh: refreshModules, updateOption, resetOption }),
    [modules, modulesLoading, refreshModules, updateOption, resetOption]
  );

  const backupsValue = useMemo<BackupsContextValue>(
    () => ({ backups, refresh: refreshBackups, createBackup, restoreBackup, deleteBackup }),
    [backups, refreshBackups, createBackup, restoreBackup, deleteBackup]
  );

  const flashValue = useMemo<FlashContextValue>(
    () => ({
      activeJob,
      progress: flashProgress,
      listPackages,
      importPackage,
      deleteImportedPackage,
      startFlash,
      abort,
    }),
    [activeJob, flashProgress, listPackages, importPackage, deleteImportedPackage, startFlash, abort]
  );

  const [scanResult, setScanResult] = useState<DiagnosticScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [liveData, setLiveData] = useState<LiveDataReading[]>([]);
  const [liveDataActive, setLiveDataActive] = useState(false);
  const liveDataIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scanForCodes = useCallback(async () => {
    setScanning(true);
    try {
      const result = await services.diagnostics.scanForCodes();
      setScanResult(result);
      return result;
    } finally {
      setScanning(false);
    }
  }, [services]);

  const clearCodes = useCallback(async () => {
    await services.diagnostics.clearCodes();
    setScanResult(null);
  }, [services]);

  const pollLiveData = useCallback(async () => {
    try {
      setLiveData(await services.diagnostics.readLiveData());
    } catch {
      // A transient read error shouldn't kill the polling loop.
    }
  }, [services]);

  const startLiveData = useCallback(() => {
    if (liveDataIntervalRef.current) return;
    setLiveDataActive(true);
    pollLiveData();
    liveDataIntervalRef.current = setInterval(pollLiveData, 1500);
  }, [pollLiveData]);

  const stopLiveData = useCallback(() => {
    if (liveDataIntervalRef.current) {
      clearInterval(liveDataIntervalRef.current);
      liveDataIntervalRef.current = null;
    }
    setLiveDataActive(false);
  }, []);

  useEffect(() => {
    return () => {
      if (liveDataIntervalRef.current) clearInterval(liveDataIntervalRef.current);
    };
  }, []);

  const diagnosticsValue = useMemo<DiagnosticsContextValue>(
    () => ({
      scanResult,
      scanning,
      liveData,
      liveDataActive,
      scanForCodes,
      clearCodes,
      startLiveData,
      stopLiveData,
    }),
    [scanResult, scanning, liveData, liveDataActive, scanForCodes, clearCodes, startLiveData, stopLiveData]
  );

  const agentRef = useRef<AiAgent | null>(null);
  if (!agentRef.current) agentRef.current = new LocalRuleBasedAgent();

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);

  const sendMessage = useCallback(
    async (text: string): Promise<AgentResponse> => {
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}-u`,
        role: "user",
        text,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((m) => [...m, userMessage]);

      const tools: AgentTools = {
        vin: vehicleState.vehicle?.vin ?? null,
        manufacturer: vehicleState.vehicle?.decoded.manufacturer ?? null,
        modules,
        updateOption,
        resetOption,
        backups,
        createBackup,
        restoreBackup,
        scanForCodes,
        lastScanResult: scanResult,
        clearCodes,
        startLiveData,
        stopLiveData,
        liveData,
        liveDataActive,
        listFlashPackages: listPackages,
        pendingConfirmation,
        setPendingConfirmation,
      };

      const response = await agentRef.current!.respond(text, tools);
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        role: "assistant",
        text: response.reply,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((m) => [...m, assistantMessage]);
      return response;
    },
    [
      vehicleState.vehicle,
      modules,
      updateOption,
      resetOption,
      backups,
      createBackup,
      restoreBackup,
      scanForCodes,
      scanResult,
      clearCodes,
      startLiveData,
      stopLiveData,
      liveData,
      liveDataActive,
      listPackages,
      pendingConfirmation,
    ]
  );

  const agentValue = useMemo<AgentContextValue>(
    () => ({ messages: chatMessages, pendingConfirmation, sendMessage }),
    [chatMessages, pendingConfirmation, sendMessage]
  );

  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    tier: "free",
    activePlan: null,
    expiresAt: null,
  });
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionProducts, setSubscriptionProducts] = useState<SubscriptionProduct[]>([]);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [status, products] = await Promise.all([
        services.subscription.getStatus(),
        services.subscription.listProducts(),
      ]);
      if (!cancelled) {
        setSubscriptionStatus(status);
        setSubscriptionProducts(products);
        setSubscriptionLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [services]);

  const purchase = useCallback(
    async (plan: SubscriptionPlan) => {
      setPurchasing(true);
      try {
        setSubscriptionStatus(await services.subscription.purchase(plan));
      } finally {
        setPurchasing(false);
      }
    },
    [services]
  );

  const restorePurchases = useCallback(async () => {
    setSubscriptionStatus(await services.subscription.restorePurchases());
  }, [services]);

  const resetToFreeForTesting = useCallback(async () => {
    if (services.subscription instanceof MockSubscriptionService) {
      setSubscriptionStatus(await services.subscription.resetToFreeForTesting());
    }
  }, [services]);

  const subscriptionValue = useMemo<SubscriptionContextValue>(
    () => ({
      status: subscriptionStatus,
      loading: subscriptionLoading,
      products: subscriptionProducts,
      purchasing,
      purchase,
      restorePurchases,
      resetToFreeForTesting:
        services.subscription instanceof MockSubscriptionService ? resetToFreeForTesting : null,
    }),
    [
      subscriptionStatus,
      subscriptionLoading,
      subscriptionProducts,
      purchasing,
      purchase,
      restorePurchases,
      resetToFreeForTesting,
      services,
    ]
  );

  return (
    <ServicesContext.Provider value={services}>
      <VehicleContext.Provider value={vehicleValue}>
        <ModulesContext.Provider value={modulesValue}>
          <BackupsContext.Provider value={backupsValue}>
            <FlashContext.Provider value={flashValue}>
              <DiagnosticsContext.Provider value={diagnosticsValue}>
                <AgentContext.Provider value={agentValue}>
                  <SubscriptionContext.Provider value={subscriptionValue}>
                    {children}
                  </SubscriptionContext.Provider>
                </AgentContext.Provider>
              </DiagnosticsContext.Provider>
            </FlashContext.Provider>
          </BackupsContext.Provider>
        </ModulesContext.Provider>
      </VehicleContext.Provider>
    </ServicesContext.Provider>
  );
}

function extractVinFromResponse(lines: string[]): string {
  const line = lines.find((l) => /^[A-HJ-NPR-Z0-9]{17}$/i.test(l.trim()));
  if (!line) throw new Error("Could not read VIN from adapter response");
  return line.trim().toUpperCase();
}
