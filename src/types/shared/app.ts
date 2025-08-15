/**
 * Shared types between main and renderer processes
 */

export interface AppSettings {
  discordWebhook: string;
  checkInTime: string;
  checkOutTime: string;
  restrictedApps: string[];
  monitoringKeywords: string[];
  theme?: 'light' | 'dark' | 'auto';
  autoStart?: boolean;
  minimizeToTray?: boolean;
}

export interface HistoryEntry {
  type: 'checkin' | 'checkout' | 'violation' | 'quit';
  reason?: string;
  time: string;
  details?: Record<string, unknown>;
}

export interface ViolationEvent {
  id: string;
  timestamp: Date;
  type: 'app' | 'keyword';
  trigger: string;
  windowTitle: string;
  action: 'warned' | 'logged';
  severity?: 'low' | 'medium' | 'high';
}

export interface MonitoringStatus {
  isActive: boolean;
  isCheckedIn: boolean;
  lastCheck?: Date;
  violations: ViolationEvent[];
}

export interface AppState {
  isMonitoring: boolean;
  isCheckedIn: boolean;
  settings: AppSettings;
  violations: ViolationEvent[];
}

// IPC Events
export interface IPCEvents {
  // Main → Renderer
  'violation-detected': ViolationEvent;
  'monitoring-status-changed': { isActive: boolean };
  'checked-in-status-changed': boolean;
  'settings-changed': Partial<AppSettings>;
  'update-available': Record<string, unknown>;
  'update-downloaded': Record<string, unknown>;
  'download-progress': { percent: number };
  
  // Renderer → Main (invoke/handle)
  'get-settings': () => Promise<AppSettings>;
  'save-settings': (settings: Partial<AppSettings>) => Promise<boolean>;
  'start-monitoring': () => Promise<boolean>;
  'stop-monitoring': () => Promise<boolean>;
  'get-monitoring-status': () => Promise<boolean>;
  'set-checked-in': (checked: boolean) => Promise<boolean>;
  'get-checked-in-status': () => Promise<boolean>;
  'test-discord-webhook': (webhook: string) => Promise<{ ok: boolean; error?: string }>;
  'quit-app-with-reason': (reason: string) => Promise<boolean>;
}

// Platform-specific process information
export interface ProcessInfo {
  name: string;
  pid: number;
  windowTitle?: string;
}

// Discord notification result
export interface DiscordResult {
  ok: boolean;
  status?: number;
  error?: string;
  body?: string;
}