import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BootConfig, PluginStatus, ConnectionStatus, PluginSettings } from '../types';
import { apiClient } from '../services/apiClient';

export interface AppContextType {
  bootConfig: BootConfig | null;
  activeModule: string;
  setActiveModule: (id: string) => void;
  pluginStatus: PluginStatus | null;
  connectionStatus: ConnectionStatus | null;
  settings: PluginSettings | null;
  isLoading: boolean;
  error: string | null;
  refreshStatus: () => Promise<void>;
  updateSettings: (newSettings: Partial<PluginSettings>) => Promise<boolean>;
  hasCapability: (cap: string) => boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bootConfig, setBootConfig] = useState<BootConfig | null>(null);
  const [activeModule, setActiveModule] = useState<string>('overview');
  const [pluginStatus, setPluginStatus] = useState<PluginStatus | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [settings, setSettings] = useState<PluginSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize from bootConfig and sync module from URL query parameter if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.blognexaBootConfig) {
        setBootConfig(window.blognexaBootConfig);
      }

      const params = new URLSearchParams(window.location.search);
      const page = params.get('page');
      if (page) {
        if (page === 'blognexa-ai') {
          setActiveModule('overview');
        } else if (page.startsWith('blognexa-ai-')) {
          const mod = page.replace('blognexa-ai-', '');
          setActiveModule(mod);
        }
      }
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statusRes, connRes, settingsRes] = await Promise.allSettled([
        apiClient.getStatus(),
        apiClient.getConnectionStatus(),
        apiClient.getSettings(),
      ]);

      if (statusRes.status === 'fulfilled' && statusRes.value?.data) {
        setPluginStatus(statusRes.value.data);
      }
      if (connRes.status === 'fulfilled' && connRes.value?.data) {
        setConnectionStatus(connRes.value.data);
      }
      if (settingsRes.status === 'fulfilled' && settingsRes.value?.data) {
        setSettings(settingsRes.value.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch status from WordPress REST API.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const updateSettings = useCallback(async (newSettings: Partial<PluginSettings>): Promise<boolean> => {
    try {
      const res = await apiClient.updateSettings(newSettings);
      if (res && res.success) {
        setSettings((prev) => (prev ? { ...prev, ...res.data } : (res.data as PluginSettings)));
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err?.message || 'Failed to update settings.');
      return false;
    }
  }, []);

  const hasCapability = useCallback((cap: string): boolean => {
    if (!bootConfig?.user?.capabilities) return true;
    return bootConfig.user.capabilities[cap] === true;
  }, [bootConfig]);

  return (
    <AppContext.Provider
      value={{
        bootConfig,
        activeModule,
        setActiveModule,
        pluginStatus,
        connectionStatus,
        settings,
        isLoading,
        error,
        refreshStatus,
        updateSettings,
        hasCapability,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

