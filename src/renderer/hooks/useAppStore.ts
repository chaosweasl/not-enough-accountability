import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { AppState, AppSettings, ViolationEvent, SessionInfo, ActivityStats, DetectedApp } from '../types';

interface AppStore extends AppState {
  // Actions
  setSettings: (settings: Partial<AppSettings>) => void;
  updateSession: (session: Partial<SessionInfo>) => void;
  addViolation: (violation: ViolationEvent) => void;
  clearViolations: () => void;
  setStats: (stats: Partial<ActivityStats>) => void;
  setDetectedApps: (apps: DetectedApp[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | undefined) => void;
  
  // Computed values
  isWorkHours: () => boolean;
  canCheckIn: () => boolean;
  canCheckOut: () => boolean;
  canStartMonitoring: () => boolean;
  canStopMonitoring: () => boolean;
  
  // Async actions
  loadSettings: () => Promise<void>;
  saveSettings: (settings: Partial<AppSettings>) => Promise<void>;
  checkIn: () => Promise<void>;
  checkOut: () => Promise<void>;
  startMonitoring: () => Promise<void>;
  stopMonitoring: (reason?: string) => Promise<void>;
  pauseMonitoring: (reason?: string, minutes?: number) => Promise<void>;
  testDiscordWebhook: () => Promise<boolean>;
  loadActivityLog: () => Promise<void>;
  exportActivityLog: () => Promise<void>;
}

const initialSettings: AppSettings = {
  discordWebhook: '',
  checkInTime: '08:00',
  checkOutTime: '16:00',
  restrictedApps: ['steam.exe'],
  monitoringKeywords: ['youtube', 'netflix', 'twitch', 'reddit'],
  theme: 'auto',
  autoStart: false,
  minimizeToTray: true,
};

const initialSession: SessionInfo = {
  isCheckedIn: false,
  isMonitoring: false,
  checkInTime: undefined,
  sessionDuration: 0,
  todayViolations: 0,
  status: 'checked-out',
};

const initialStats: ActivityStats = {
  todayViolations: 0,
  weeklyTrend: new Array(7).fill(0),
  mostTriggeredApp: '',
  mostTriggeredKeyword: '',
  productiveHours: 0,
  averageSessionLength: 0,
  violationsByHour: {},
  violationsByDay: {},
};

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    session: initialSession,
    settings: initialSettings,
    violations: [],
    stats: initialStats,
    detectedApps: [],
    isLoading: false,
    error: undefined,

    // Basic actions
    setSettings: (newSettings) =>
      set((state) => ({
        settings: { ...state.settings, ...newSettings },
      })),

    updateSession: (sessionUpdate) =>
      set((state) => ({
        session: { ...state.session, ...sessionUpdate },
      })),

    addViolation: (violation) =>
      set((state) => ({
        violations: [violation, ...state.violations].slice(0, 100), // Keep last 100
        session: {
          ...state.session,
          todayViolations: state.session.todayViolations + 1,
        },
      })),

    clearViolations: () => set({ violations: [] }),

    setStats: (statsUpdate) =>
      set((state) => ({
        stats: { ...state.stats, ...statsUpdate },
      })),

    setDetectedApps: (apps) => set({ detectedApps: apps }),

    setLoading: (loading) => set({ isLoading: loading }),

    setError: (error) => set({ error }),

    // Computed values
    isWorkHours: () => {
      const { settings } = get();
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = timeToMinutes(settings.checkInTime);
      const endMinutes = timeToMinutes(settings.checkOutTime);
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    },

    canCheckIn: () => {
      const { session } = get();
      return !session.isCheckedIn;
    },

    canCheckOut: () => {
      const { session } = get();
      return session.isCheckedIn;
    },

    canStartMonitoring: () => {
      const { session } = get();
      return session.isCheckedIn && !session.isMonitoring;
    },

    canStopMonitoring: () => {
      const { session } = get();
      return session.isCheckedIn && session.isMonitoring;
    },

    // Async actions
    loadSettings: async () => {
      try {
        set({ isLoading: true, error: undefined });
        
        if (!window.electronAPI?.getSettings) {
          throw new Error('Electron API not available');
        }

        const settings = await window.electronAPI.getSettings();
        set({ settings: { ...initialSettings, ...settings } });
        
        // Also load current status
        const isCheckedIn = await window.electronAPI.getCheckedInStatus();
        const isMonitoring = await window.electronAPI.getMonitoringStatus();
        
        set((state) => ({
          session: {
            ...state.session,
            isCheckedIn,
            isMonitoring,
            status: isCheckedIn 
              ? (isMonitoring ? 'monitoring' : 'checked-in')
              : 'checked-out',
          },
        }));
      } catch (error) {
        console.error('Failed to load settings:', error);
        set({ error: error instanceof Error ? error.message : 'Failed to load settings' });
      } finally {
        set({ isLoading: false });
      }
    },

    saveSettings: async (newSettings) => {
      try {
        set({ isLoading: true, error: undefined });
        
        if (!window.electronAPI?.saveSettings) {
          throw new Error('Electron API not available');
        }

        const success = await window.electronAPI.saveSettings(newSettings);
        if (success) {
          set((state) => ({
            settings: { ...state.settings, ...newSettings },
          }));
        } else {
          throw new Error('Failed to save settings');
        }
      } catch (error) {
        console.error('Failed to save settings:', error);
        set({ error: error instanceof Error ? error.message : 'Failed to save settings' });
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },

    checkIn: async () => {
      try {
        set({ isLoading: true, error: undefined });
        
        if (!window.electronAPI?.setCheckedIn) {
          throw new Error('Electron API not available');
        }

        const success = await window.electronAPI.setCheckedIn(true);
        if (success) {
          set((state) => ({
            session: {
              ...state.session,
              isCheckedIn: true,
              checkInTime: new Date(),
              status: 'checked-in',
            },
          }));
        } else {
          throw new Error('Failed to check in');
        }
      } catch (error) {
        console.error('Failed to check in:', error);
        set({ error: error instanceof Error ? error.message : 'Failed to check in' });
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },

    checkOut: async () => {
      try {
        set({ isLoading: true, error: undefined });
        
        if (!window.electronAPI?.setCheckedIn) {
          throw new Error('Electron API not available');
        }

        const success = await window.electronAPI.setCheckedIn(false);
        if (success) {
          set((state) => ({
            session: {
              ...state.session,
              isCheckedIn: false,
              isMonitoring: false,
              checkInTime: undefined,
              sessionDuration: 0,
              status: 'checked-out',
            },
          }));
        } else {
          throw new Error('Failed to check out');
        }
      } catch (error) {
        console.error('Failed to check out:', error);
        set({ error: error instanceof Error ? error.message : 'Failed to check out' });
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },

    startMonitoring: async () => {
      try {
        set({ isLoading: true, error: undefined });
        
        if (!window.electronAPI?.startMonitoring) {
          throw new Error('Electron API not available');
        }

        const success = await window.electronAPI.startMonitoring();
        if (success) {
          set((state) => ({
            session: {
              ...state.session,
              isMonitoring: true,
              status: 'monitoring',
            },
          }));
        } else {
          throw new Error('Failed to start monitoring');
        }
      } catch (error) {
        console.error('Failed to start monitoring:', error);
        set({ error: error instanceof Error ? error.message : 'Failed to start monitoring' });
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },

    stopMonitoring: async (reason = 'User requested stop') => {
      try {
        set({ isLoading: true, error: undefined });
        
        if (!window.electronAPI?.stopMonitoringWithReason) {
          throw new Error('Electron API not available');
        }

        const success = await window.electronAPI.stopMonitoringWithReason(reason);
        if (success) {
          set((state) => ({
            session: {
              ...state.session,
              isMonitoring: false,
              status: state.session.isCheckedIn ? 'checked-in' : 'checked-out',
            },
          }));
        } else {
          throw new Error('Failed to stop monitoring');
        }
      } catch (error) {
        console.error('Failed to stop monitoring:', error);
        set({ error: error instanceof Error ? error.message : 'Failed to stop monitoring' });
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },

    pauseMonitoring: async (reason = 'User requested pause', minutes = 60) => {
      try {
        set({ isLoading: true, error: undefined });
        
        if (!window.electronAPI?.pauseMonitoringWithReason) {
          throw new Error('Electron API not available');
        }

        const success = await window.electronAPI.pauseMonitoringWithReason(reason, minutes);
        if (success) {
          set((state) => ({
            session: {
              ...state.session,
              isMonitoring: false,
              status: 'paused',
            },
          }));
        } else {
          throw new Error('Failed to pause monitoring');
        }
      } catch (error) {
        console.error('Failed to pause monitoring:', error);
        set({ error: error instanceof Error ? error.message : 'Failed to pause monitoring' });
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },

    testDiscordWebhook: async () => {
      try {
        set({ isLoading: true, error: undefined });
        
        if (!window.electronAPI?.testDiscordWebhook) {
          throw new Error('Electron API not available');
        }

        const { settings } = get();
        if (!settings.discordWebhook) {
          throw new Error('Discord webhook URL not configured');
        }

        const result = await window.electronAPI.testDiscordWebhook(settings.discordWebhook);
        if (!result.ok) {
          throw new Error(result.error || 'Discord test failed');
        }
        
        return true;
      } catch (error) {
        console.error('Discord test failed:', error);
        set({ error: error instanceof Error ? error.message : 'Discord test failed' });
        return false;
      } finally {
        set({ isLoading: false });
      }
    },

    loadActivityLog: async () => {
      try {
        set({ isLoading: true, error: undefined });
        
        if (!window.electronAPI?.getActivityLog) {
          throw new Error('Electron API not available');
        }

        const violations = await window.electronAPI.getActivityLog();
        set({ violations });
      } catch (error) {
        console.error('Failed to load activity log:', error);
        set({ error: error instanceof Error ? error.message : 'Failed to load activity log' });
      } finally {
        set({ isLoading: false });
      }
    },

    exportActivityLog: async () => {
      try {
        set({ isLoading: true, error: undefined });
        
        if (!window.electronAPI?.exportLog) {
          throw new Error('Electron API not available');
        }

        const { violations } = get();
        const success = await window.electronAPI.exportLog(violations);
        if (!success) {
          throw new Error('Failed to export activity log');
        }
      } catch (error) {
        console.error('Failed to export activity log:', error);
        set({ error: error instanceof Error ? error.message : 'Failed to export activity log' });
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },
  }))
);

// Helper function for time conversion
function timeToMinutes(timeStr: string): number {
  const [hours = 0, minutes = 0] = (timeStr || '0:0').split(':').map(Number);
  return hours * 60 + minutes;
}

// Subscribe to electron events when store is created
if (typeof window !== 'undefined' && window.electronAPI) {
  // const store = useAppStore.getState();
  
  // Set up electron event listeners
  window.electronAPI.onCheckedInStatusChanged?.((isCheckedIn: boolean) => {
    useAppStore.getState().updateSession({ 
      isCheckedIn,
      status: isCheckedIn ? 'checked-in' : 'checked-out',
      checkInTime: isCheckedIn ? new Date() : undefined,
    });
  });

  window.electronAPI.onMonitoringStarted?.(() => {
    useAppStore.getState().updateSession({ 
      isMonitoring: true,
      status: 'monitoring',
    });
  });

  window.electronAPI.onMonitoringStopped?.(() => {
    useAppStore.getState().updateSession({ 
      isMonitoring: false,
      status: useAppStore.getState().session.isCheckedIn ? 'checked-in' : 'checked-out',
    });
  });

  window.electronAPI.onViolationDetected?.((data: any) => {
    const violation: ViolationEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(data.timestamp),
      type: data.apps?.length > 0 ? 'app' : 'keyword',
      trigger: data.allViolations?.[0] || 'Unknown',
      windowTitle: data.windowTitle || '',
      action: 'warned',
    };
    
    useAppStore.getState().addViolation(violation);
  });

  window.electronAPI.onTriggerCheckin?.(() => {
    useAppStore.getState().checkIn();
  });

  window.electronAPI.onTriggerCheckout?.(() => {
    useAppStore.getState().checkOut();
  });
}