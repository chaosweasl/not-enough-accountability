/**
 * Secure preload script - minimal API bridge between main and renderer
 */

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type { AppSettings, ViolationEvent, HistoryEntry } from '../types/shared/app.js';

// Type-safe IPC wrapper
type IPCListener = (event: IpcRendererEvent, ...args: any[]) => void;

/**
 * Secure API bridge exposed to renderer process
 */
const electronAPI = {
  // Settings management
  settings: {
    get: (): Promise<AppSettings> => ipcRenderer.invoke('get-settings'),
    save: (settings: Partial<AppSettings>): Promise<boolean> => ipcRenderer.invoke('save-settings', settings),
    reset: (): Promise<AppSettings> => ipcRenderer.invoke('reset-settings'),
    export: (filePath?: string): Promise<boolean> => ipcRenderer.invoke('export-settings', filePath),
    import: (filePath?: string): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('import-settings', filePath),
  },

  // Check-in/Check-out
  checkin: {
    setStatus: (checked: boolean): Promise<boolean> => ipcRenderer.invoke('set-checked-in', checked),
    getStatus: (): Promise<boolean> => ipcRenderer.invoke('get-checked-in-status'),
  },

  // Process monitoring
  monitoring: {
    start: (): Promise<boolean> => ipcRenderer.invoke('start-monitoring'),
    stop: (): Promise<boolean> => ipcRenderer.invoke('stop-monitoring'),
    stopWithReason: (reason: string): Promise<boolean> => 
      ipcRenderer.invoke('stop-monitoring-with-reason', reason),
    pauseWithReason: (reason: string, minutes?: number): Promise<boolean> => 
      ipcRenderer.invoke('pause-monitoring-with-reason', reason, minutes),
    getStatus: (): Promise<boolean> => ipcRenderer.invoke('get-monitoring-status'),
    getStatistics: (): Promise<{ isActive: boolean; violations: number; uptime: number }> => 
      ipcRenderer.invoke('get-monitoring-statistics'),
  },

  // Discord integration
  discord: {
    testWebhook: (webhook: string): Promise<{ ok: boolean; error?: string; status?: number; body?: string }> => 
      ipcRenderer.invoke('test-discord-webhook', webhook),
    sendMessage: (message: string): Promise<{ ok: boolean; error?: string }> => 
      ipcRenderer.invoke('send-discord-message', message),
  },

  // Activity log and history
  activity: {
    getLog: (options?: Record<string, unknown>): Promise<Array<HistoryEntry | ViolationEvent>> => 
      ipcRenderer.invoke('get-activity-log', options),
    clearLog: (): Promise<boolean> => ipcRenderer.invoke('clear-activity-log'),
    exportLog: (logData?: any, filePath?: string): Promise<boolean> => 
      ipcRenderer.invoke('export-log', logData, filePath),
    getStatistics: (): Promise<{
      totalHistory: number;
      totalViolations: number;
      violationsByType: Record<string, number>;
      violationsBySeverity: Record<string, number>;
      firstEntry?: Date;
      lastEntry?: Date;
    }> => ipcRenderer.invoke('get-activity-statistics'),
    createBackup: (): Promise<string | null> => ipcRenderer.invoke('create-backup'),
  },

  // Application management
  app: {
    getVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),
    quitWithReason: (reason: string): Promise<boolean> => ipcRenderer.invoke('quit-app-with-reason', reason),
    checkForUpdates: (): Promise<boolean> => ipcRenderer.invoke('check-for-updates'),
    installUpdate: (): Promise<boolean> => ipcRenderer.invoke('install-update'),
  },

  // Window management
  window: {
    show: (): Promise<boolean> => ipcRenderer.invoke('show-window'),
    hide: (): Promise<boolean> => ipcRenderer.invoke('hide-window'),
    minimize: (): Promise<boolean> => ipcRenderer.invoke('minimize-window'),
    maximize: (): Promise<boolean> => ipcRenderer.invoke('maximize-window'),
    getBounds: (): Promise<Electron.Rectangle | null> => ipcRenderer.invoke('get-window-bounds'),
    setBounds: (bounds: Partial<Electron.Rectangle>): Promise<boolean> => 
      ipcRenderer.invoke('set-window-bounds', bounds),
  },

  // Event listeners with automatic cleanup
  on: {
    violationDetected: (callback: (violation: ViolationEvent) => void): (() => void) => {
      const listener: IPCListener = (event, violation) => callback(violation);
      ipcRenderer.on('violation-detected', listener);
      return () => ipcRenderer.removeListener('violation-detected', listener);
    },

    checkedInStatusChanged: (callback: (isCheckedIn: boolean) => void): (() => void) => {
      const listener: IPCListener = (event, isCheckedIn) => callback(isCheckedIn);
      ipcRenderer.on('checked-in-status-changed', listener);
      return () => ipcRenderer.removeListener('checked-in-status-changed', listener);
    },

    monitoringStatusChanged: (callback: (status: { isActive: boolean }) => void): (() => void) => {
      const listener: IPCListener = (event, status) => callback(status);
      ipcRenderer.on('monitoring-status-changed', listener);
      return () => ipcRenderer.removeListener('monitoring-status-changed', listener);
    },

    settingsChanged: (callback: (settings: Partial<AppSettings>) => void): (() => void) => {
      const listener: IPCListener = (event, settings) => callback(settings);
      ipcRenderer.on('settings-changed', listener);
      return () => ipcRenderer.removeListener('settings-changed', listener);
    },

    triggerCheckin: (callback: () => void): (() => void) => {
      const listener: IPCListener = () => callback();
      ipcRenderer.on('trigger-checkin', listener);
      return () => ipcRenderer.removeListener('trigger-checkin', listener);
    },

    triggerCheckout: (callback: () => void): (() => void) => {
      const listener: IPCListener = () => callback();
      ipcRenderer.on('trigger-checkout', listener);
      return () => ipcRenderer.removeListener('trigger-checkout', listener);
    },

    requestQuitReason: (callback: () => void): (() => void) => {
      const listener: IPCListener = () => callback();
      ipcRenderer.on('request-quit-reason', listener);
      return () => ipcRenderer.removeListener('request-quit-reason', listener);
    },

    requestPauseMonitoring: (callback: () => void): (() => void) => {
      const listener: IPCListener = () => callback();
      ipcRenderer.on('request-pause-monitoring', listener);
      return () => ipcRenderer.removeListener('request-pause-monitoring', listener);
    },

    requestResumeMonitoring: (callback: () => void): (() => void) => {
      const listener: IPCListener = () => callback();
      ipcRenderer.on('request-resume-monitoring', listener);
      return () => ipcRenderer.removeListener('request-resume-monitoring', listener);
    },

    lateCheckin: (callback: (data: { scheduled: string; actual: string }) => void): (() => void) => {
      const listener: IPCListener = (event, data) => callback(data);
      ipcRenderer.on('late-checkin', listener);
      return () => ipcRenderer.removeListener('late-checkin', listener);
    },

    trayNotification: (callback: (data: { title: string; content: string }) => void): (() => void) => {
      const listener: IPCListener = (event, data) => callback(data);
      ipcRenderer.on('tray-notification', listener);
      return () => ipcRenderer.removeListener('tray-notification', listener);
    },

    navigateToSettings: (callback: () => void): (() => void) => {
      const listener: IPCListener = () => callback();
      ipcRenderer.on('navigate-to-settings', listener);
      return () => ipcRenderer.removeListener('navigate-to-settings', listener);
    },

    navigateToActivityLog: (callback: () => void): (() => void) => {
      const listener: IPCListener = () => callback();
      ipcRenderer.on('navigate-to-activity-log', listener);
      return () => ipcRenderer.removeListener('navigate-to-activity-log', listener);
    },

    // Auto-updater events
    updateAvailable: (callback: (info: any) => void): (() => void) => {
      const listener: IPCListener = (event, info) => callback(info);
      ipcRenderer.on('update-available', listener);
      return () => ipcRenderer.removeListener('update-available', listener);
    },

    downloadProgress: (callback: (progress: { percent: number }) => void): (() => void) => {
      const listener: IPCListener = (event, progress) => callback(progress);
      ipcRenderer.on('download-progress', listener);
      return () => ipcRenderer.removeListener('download-progress', listener);
    },

    updateDownloaded: (callback: (info: any) => void): (() => void) => {
      const listener: IPCListener = (event, info) => callback(info);
      ipcRenderer.on('update-downloaded', listener);
      return () => ipcRenderer.removeListener('update-downloaded', listener);
    },

    updateError: (callback: (error: string) => void): (() => void) => {
      const listener: IPCListener = (event, error) => callback(error);
      ipcRenderer.on('update-error', listener);
      return () => ipcRenderer.removeListener('update-error', listener);
    },

    windowFocused: (callback: () => void): (() => void) => {
      const listener: IPCListener = () => callback();
      ipcRenderer.on('window-focused', listener);
      return () => ipcRenderer.removeListener('window-focused', listener);
    },

    windowBlurred: (callback: () => void): (() => void) => {
      const listener: IPCListener = () => callback();
      ipcRenderer.on('window-blurred', listener);
      return () => ipcRenderer.removeListener('window-blurred', listener);
    },
  },

  // Utility functions
  utils: {
    formatTime: (date: Date): string => date.toLocaleTimeString(),
    formatDate: (date: Date): string => date.toLocaleDateString(),
    formatDateTime: (date: Date): string => date.toLocaleString(),
    
    timeToMinutes: (timeStr: string): number => {
      const [hours = 0, minutes = 0] = (timeStr || '0:0').split(':').map(Number);
      return hours * 60 + minutes;
    },

    minutesToTime: (minutes: number): string => {
      const hrs = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    },

    isValidUrl: (url: string): boolean => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    },

    escapeHtml: (unsafe: string): string =>
      String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;'),
  },
};

// Expose secure API to renderer
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Platform information
contextBridge.exposeInMainWorld('platform', {
  os: process.platform,
  arch: process.arch,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});

// Development helpers (only in development mode)
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('dev', {
    log: (...args: unknown[]) => console.log('[Renderer]', ...args),
    warn: (...args: unknown[]) => console.warn('[Renderer]', ...args),
    error: (...args: unknown[]) => console.error('[Renderer]', ...args),
    
    // Development-only IPC methods
    reloadWindow: () => ipcRenderer.invoke('reload-window'),
    toggleDevTools: () => ipcRenderer.invoke('toggle-dev-tools'),
  });
}

// Handle renderer errors and forward to main process for logging
window.addEventListener('DOMContentLoaded', () => {
  // Forward unhandled errors to main process
  window.addEventListener('error', (event) => {
    ipcRenderer.send('renderer-error', {
      type: 'error',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack || null,
    });
  });

  // Forward unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    ipcRenderer.send('renderer-error', {
      type: 'unhandledrejection',
      message: 'Unhandled promise rejection',
      reason: event.reason?.stack || event.reason || 'Unknown reason',
    });
  });

  // Notify main process that renderer is ready
  ipcRenderer.send('renderer-ready');
});

// Cleanup on window unload
window.addEventListener('beforeunload', () => {
  // Remove all listeners to prevent memory leaks
  ipcRenderer.removeAllListeners('violation-detected');
  ipcRenderer.removeAllListeners('checked-in-status-changed');
  ipcRenderer.removeAllListeners('monitoring-status-changed');
  ipcRenderer.removeAllListeners('settings-changed');
  ipcRenderer.removeAllListeners('trigger-checkin');
  ipcRenderer.removeAllListeners('trigger-checkout');
  ipcRenderer.removeAllListeners('request-quit-reason');
  ipcRenderer.removeAllListeners('request-pause-monitoring');
  ipcRenderer.removeAllListeners('request-resume-monitoring');
  ipcRenderer.removeAllListeners('late-checkin');
  ipcRenderer.removeAllListeners('tray-notification');
  ipcRenderer.removeAllListeners('navigate-to-settings');
  ipcRenderer.removeAllListeners('navigate-to-activity-log');
  ipcRenderer.removeAllListeners('update-available');
  ipcRenderer.removeAllListeners('download-progress');
  ipcRenderer.removeAllListeners('update-downloaded');
  ipcRenderer.removeAllListeners('update-error');
  ipcRenderer.removeAllListeners('window-focused');
  ipcRenderer.removeAllListeners('window-blurred');
});

// Export types for TypeScript in renderer
export type ElectronAPI = typeof electronAPI;
export type Platform = {
  os: NodeJS.Platform;
  arch: string;
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
};

// Type declarations for global objects
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
    platform: Platform;
    dev?: {
      log: (...args: unknown[]) => void;
      warn: (...args: unknown[]) => void;
      error: (...args: unknown[]) => void;
      reloadWindow: () => Promise<boolean>;
      toggleDevTools: () => Promise<boolean>;
    };
  }
}