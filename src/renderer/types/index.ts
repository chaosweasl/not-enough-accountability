import React from 'react';

// Core application types
export interface MonitoringSettings {
  isActive: boolean;
  workStartTime: string;
  workEndTime: string;
  restrictedApps: string[];
  monitoringKeywords: string[];
  discordWebhookUrl: string;
  notificationCooldown: number;
}

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

export interface ViolationEvent {
  id: string;
  timestamp: Date;
  type: 'app' | 'keyword';
  trigger: string;
  windowTitle: string;
  action: 'warned' | 'logged';
  severity?: 'low' | 'medium' | 'high';
}

export interface RawViolationData {
  timestamp: Date | string;
  windowTitle?: string;
  apps?: string[];
  allViolations?: string[];
}

export interface ActivityStats {
  todayViolations: number;
  weeklyTrend: number[];
  mostTriggeredApp: string;
  mostTriggeredKeyword: string;
  productiveHours: number;
  averageSessionLength: number;
  violationsByHour: Record<number, number>;
  violationsByDay: Record<string, number>;
}

export interface DetectedApp {
  name: string;
  path: string;
  icon?: string;
  category: 'productivity' | 'social' | 'gaming' | 'entertainment' | 'other';
  isRestricted: boolean;
  lastSeen?: Date;
  violationCount?: number;
}

export interface KeywordSuggestion {
  keyword: string;
  category: 'social-media' | 'entertainment' | 'news' | 'shopping' | 'gaming';
  description: string;
  severity: 'low' | 'medium' | 'high';
  popularity: number;
}

export interface SessionInfo {
  isCheckedIn: boolean;
  isMonitoring: boolean;
  checkInTime?: Date;
  sessionDuration?: number;
  todayViolations: number;
  status: 'checked-out' | 'checked-in' | 'monitoring' | 'paused';
}

export interface NotificationSettings {
  desktop: boolean;
  discord: boolean;
  sound: boolean;
  soundFile?: string;
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export interface AppState {
  session: SessionInfo;
  settings: AppSettings;
  violations: ViolationEvent[];
  stats: ActivityStats;
  detectedApps: DetectedApp[];
  isLoading: boolean;
  error?: string;
}

// Electron API interfaces
export interface ElectronAPI {
  // Settings management
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: Partial<AppSettings>) => Promise<boolean>;

  // Check-in/out
  setCheckedIn: (checked: boolean) => Promise<boolean>;
  getCheckedInStatus: () => Promise<boolean>;

  // Monitoring
  startMonitoring: () => Promise<boolean>;
  stopMonitoring: () => Promise<boolean>;
  stopMonitoringWithReason: (reason: string) => Promise<boolean>;
  pauseMonitoringWithReason: (
    reason: string,
    minutes?: number
  ) => Promise<boolean>;
  getMonitoringStatus: () => Promise<boolean>;

  // Discord integration
  sendDiscordMessage: (message: string) => Promise<boolean>;
  testDiscordWebhook: (
    webhook: string
  ) => Promise<{ ok: boolean; error?: string; status?: number; body?: string }>;

  // File operations
  exportLog: (logData: unknown) => Promise<boolean>;

  // System integration
  getAppVersion: () => Promise<string>;
  checkForUpdates: () => Promise<boolean>;
  quitAppWithReason: (reason: string) => Promise<boolean>;

  // Activity log
  getActivityLog: (
    options?: Record<string, unknown>
  ) => Promise<ViolationEvent[]>;
  clearActivityLog: () => Promise<boolean>;

  // Event listeners
  onViolationDetected: (callback: (data: ViolationEvent) => void) => void;
  onTriggerCheckin: (callback: () => void) => void;
  onTriggerCheckout: (callback: () => void) => void;
  onMonitoringStarted: (callback: () => void) => void;
  onMonitoringStopped: (callback: () => void) => void;
  onCheckedInStatusChanged: (callback: (checked: boolean) => void) => void;
  onRequestQuitReason: (callback: () => void) => void;
  onUpdateAvailable: (
    callback: (info: Record<string, unknown>) => void
  ) => void;
  onUpdateDownloaded: (
    callback: (info: Record<string, unknown>) => void
  ) => void;
  onLateCheckin: (callback: (data: ViolationEvent) => void) => void;
  removeAllListeners: (channel?: string) => void;
}

export interface WindowAPI {
  // Legacy API for backward compatibility
  api: {
    checkIn: () => Promise<boolean>;
    checkOut: () => Promise<boolean>;
    addRestrictedApp: () => Promise<boolean>;
    addKeyword: () => Promise<boolean>;
    testDiscordNotification: () => Promise<{
      ok: boolean;
      error?: string;
      status?: number;
      body?: string;
    }>;
    saveSettings: () => Promise<boolean>;
    pauseMonitoring: () => Promise<boolean>;
    resumeMonitoring: () => Promise<boolean>;
    stopMonitoring: () => Promise<boolean>;
    temporaryDisable: () => Promise<boolean>;
    getMonitoringStatus: () => Promise<boolean>;
    clearLog: () => Promise<boolean>;
    exportLog: () => Promise<boolean>;
    checkForUpdates: () => Promise<boolean>;
  };

  electronAPI: ElectronAPI;

  utils: {
    formatTime: (date: Date) => string;
    formatDate: (date: Date) => string;
    formatDateTime: (date: Date) => string;
    formatDuration: (milliseconds: number) => string;
    timeToMinutes: (timeStr: string) => number;
    minutesToTime: (minutes: number) => string;
    isValidUrl: (url: string) => boolean;
    escapeHtml: (unsafe: string) => string;
    uniqueArray: <T>(arr: T[]) => T[];
  };

  appInfo: {
    platform: string;
    arch: string;
    versions: {
      node: string;
      chrome: string;
      electron: string;
    };
  };
}

// Extend the global Window interface
declare global {
  interface Window extends WindowAPI {}
}

// Component props interfaces
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'time';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}
