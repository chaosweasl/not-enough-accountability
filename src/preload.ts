import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

// Helper to add event listeners safely (removes previous to avoid duplicates)
const safeOn = (channel: string, callback: (...args: any[]) => void) => {
  ipcRenderer.removeAllListeners(channel);
  ipcRenderer.on(channel, (event: IpcRendererEvent, ...args: any[]) => callback(...args));
};

// Expose API to renderer
contextBridge.exposeInMainWorld("electronAPI", {
  // Settings management
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings: any) => ipcRenderer.invoke("save-settings", settings),

  setCheckedIn: (checked: boolean) => ipcRenderer.invoke("set-checked-in", checked),

  // Process monitoring
  startMonitoring: () => ipcRenderer.invoke("start-monitoring"),
  stopMonitoring: () => ipcRenderer.invoke("stop-monitoring"),
  stopMonitoringWithReason: (reason: string) =>
    ipcRenderer.invoke("stop-monitoring-with-reason", reason),
  pauseMonitoringWithReason: (reason: string, minutes?: number) =>
    ipcRenderer.invoke("pause-monitoring-with-reason", reason, minutes),
  getMonitoringStatus: () => ipcRenderer.invoke("get-monitoring-status"),
  getCheckedInStatus: () => ipcRenderer.invoke("get-checked-in-status"),
  getRunningProcesses: () => ipcRenderer.invoke("get-running-processes"),

  // Discord integration
  sendDiscordMessage: (message: string) =>
    ipcRenderer.invoke("send-discord-message", message),

  // testDiscordWebhook returns either { ok:true } or an object with error info.
  // For backward compatibility it also returns boolean when main returns a boolean.
  testDiscordWebhook: async (webhook: string) => {
    try {
      const res = await ipcRenderer.invoke("test-discord-webhook", webhook);
      // if main returns a plain boolean (old behavior)
      if (typeof res === "boolean") return { ok: res };
      // if main returns an object with ok/status/body/error
      if (res && typeof res === "object") return res;
      // otherwise normalize
      return { ok: !!res };
    } catch (err: any) {
      return {
        ok: false,
        error: err && err.message ? err.message : String(err),
      };
    }
  },

  // File operations (may be unimplemented in main; safe to call)
  exportLog: (logData?: any[]) => ipcRenderer.invoke("export-log", logData),
  importSettings: () => ipcRenderer.invoke("import-settings"),
  exportSettings: (settings: any) => ipcRenderer.invoke("export-settings", settings),

  // System integration
  minimizeToTray: () => ipcRenderer.invoke("minimize-to-tray"),
  showNotification: (title: string, body: string, options: any = {}) =>
    ipcRenderer.invoke("show-notification", title, body, options),
  setAutoStart: (enable: boolean) => ipcRenderer.invoke("set-auto-start", enable),
  getAutoStartStatus: () => ipcRenderer.invoke("get-auto-start-status"),

  // Time and scheduling (may be unimplemented)
  getCurrentTime: () => ipcRenderer.invoke("get-current-time"),
  scheduleCheckIn: (time: string) => ipcRenderer.invoke("schedule-check-in", time),
  scheduleCheckOut: (time: string) => ipcRenderer.invoke("schedule-check-out", time),
  cancelScheduledTasks: () => ipcRenderer.invoke("cancel-scheduled-tasks"),

  // Window management
  closeWindow: () => ipcRenderer.invoke("close-window"),
  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
  maximizeWindow: () => ipcRenderer.invoke("maximize-window"),
  restoreWindow: () => ipcRenderer.invoke("restore-window"),

  // Application management
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  getAppPath: () => ipcRenderer.invoke("get-app-path"),
  getUserDataPath: () => ipcRenderer.invoke("get-user-data-path"),
  restartApp: () => ipcRenderer.invoke("restart-app"),
  quitApp: () => ipcRenderer.invoke("quit-app"),
  quitAppWithReason: (reason: string) =>
    ipcRenderer.invoke("quit-app-with-reason", reason),

  // Auto-updater
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  installUpdate: () => ipcRenderer.invoke("install-update"),

  // Event listeners for main process events (use safe callbacks)
  onViolationDetected: (callback: (data: any) => void) => safeOn("violation-detected", callback),
  onTriggerCheckin: (callback: () => void) => safeOn("trigger-checkin", callback),
  onTriggerCheckout: (callback: () => void) => safeOn("trigger-checkout", callback),
  onSettingsChanged: (callback: (data: any) => void) => safeOn("settings-changed", callback),
  onMonitoringStatusChanged: (callback: (data: any) => void) =>
    safeOn("monitoring-status-changed", callback),
  onCheckedInStatusChanged: (callback: (isCheckedIn: boolean) => void) =>
    safeOn("checked-in-status-changed", callback),
  onScheduledEvent: (callback: (data: any) => void) => safeOn("scheduled-event", callback),
  onSystemNotification: (callback: (data: any) => void) => safeOn("system-notification", callback),
  onAppUpdate: (callback: (data: any) => void) => safeOn("app-update", callback),
  onRequestQuitReason: (callback: () => void) => safeOn("request-quit-reason", callback),

  // Auto-updater events
  onUpdateAvailable: (callback: (info: any) => void) => safeOn("update-available", callback),
  onDownloadProgress: (callback: (progress: any) => void) => safeOn("download-progress", callback),
  onUpdateDownloaded: (callback: (info: any) => void) => safeOn("update-downloaded", callback),

  // Monitoring-specific events (sent by main in the updated index.js)
  onMonitoringStarted: (callback: (data: any) => void) => safeOn("monitoring-started", callback),
  onMonitoringStopped: (callback: (data: any) => void) => safeOn("monitoring-stopped", callback),
  onLateCheckin: (callback: (data: any) => void) => safeOn("late-checkin", callback),
  onTrayNotification: (callback: (data: any) => void) => safeOn("tray-notification", callback),

  // Process-specific monitoring (may be unimplemented in main)
  isProcessRunning: (processName: string) =>
    ipcRenderer.invoke("is-process-running", processName),
  getProcessInfo: (processName: string) =>
    ipcRenderer.invoke("get-process-info", processName),
  killProcess: (processName: string) => ipcRenderer.invoke("kill-process", processName),

  // Window title monitoring (may be unimplemented)
  getActiveWindowTitle: () => ipcRenderer.invoke("get-active-window-title"),
  startWindowTitleMonitoring: (keywords: string[]) =>
    ipcRenderer.invoke("start-window-title-monitoring", keywords),
  stopWindowTitleMonitoring: () =>
    ipcRenderer.invoke("stop-window-title-monitoring"),

  // Screenshot functionality
  takeScreenshot: (options: any = {}) =>
    ipcRenderer.invoke("take-screenshot", options),

  // Network / activity monitoring (may be unimplemented)
  startNetworkMonitoring: (urls: string[]) =>
    ipcRenderer.invoke("start-network-monitoring", urls),
  stopNetworkMonitoring: () => ipcRenderer.invoke("stop-network-monitoring"),
  startActivityMonitoring: () =>
    ipcRenderer.invoke("start-activity-monitoring"),
  stopActivityMonitoring: () => ipcRenderer.invoke("stop-activity-monitoring"),
  getLastActivityTime: () => ipcRenderer.invoke("get-last-activity-time"),

  // Website blocking / blocked sites
  addBlockedSite: (url: string) => ipcRenderer.invoke("add-blocked-site", url),
  removeBlockedSite: (url: string) => ipcRenderer.invoke("remove-blocked-site", url),
  getBlockedSites: () => ipcRenderer.invoke("get-blocked-sites"),

  // Statistics and reporting
  getUsageStats: (dateRange?: any) =>
    ipcRenderer.invoke("get-usage-stats", dateRange),
  generateReport: (options?: any) => ipcRenderer.invoke("generate-report", options),

  // Backup and restore
  createBackup: () => ipcRenderer.invoke("create-backup"),
  restoreBackup: (backupPath: string) =>
    ipcRenderer.invoke("restore-backup", backupPath),

  // Theme and appearance
  setTheme: (theme: string) => ipcRenderer.invoke("set-theme", theme),
  getTheme: () => ipcRenderer.invoke("get-theme"),

  // Logging
  logActivity: (activity: any) => ipcRenderer.invoke("log-activity", activity),
  getActivityLog: (options: any = {}) =>
    ipcRenderer.invoke("get-activity-log", options),
  clearActivityLog: () => ipcRenderer.invoke("clear-activity-log"),

  // Temporary overrides / emergency / performance / custom rules
  setTemporaryOverride: (type: string, duration: number, reason: string) =>
    ipcRenderer.invoke("set-temporary-override", type, duration, reason),
  getActiveOverrides: () => ipcRenderer.invoke("get-active-overrides"),
  cancelOverride: (overrideId: string) =>
    ipcRenderer.invoke("cancel-override", overrideId),
  panicMode: () => ipcRenderer.invoke("panic-mode"),
  enableEmergencyAccess: (duration: number) =>
    ipcRenderer.invoke("enable-emergency-access", duration),
  getSystemInfo: () => ipcRenderer.invoke("get-system-info"),
  getAppPerformance: () => ipcRenderer.invoke("get-app-performance"),
  addCustomRule: (rule: any) => ipcRenderer.invoke("add-custom-rule", rule),
  removeCustomRule: (ruleId: string) =>
    ipcRenderer.invoke("remove-custom-rule", ruleId),
  getCustomRules: () => ipcRenderer.invoke("get-custom-rules"),

  // Remove event listeners (cleanup)
  removeAllListeners: (channel?: string) => {
    if (channel) {
      ipcRenderer.removeAllListeners(channel);
    } else {
      // common channels to clear
      const channels = [
        "violation-detected",
        "trigger-checkin",
        "trigger-checkout",
        "settings-changed",
        "monitoring-status-changed",
        "scheduled-event",
        "system-notification",
        "app-update",
        "update-available",
        "download-progress",
        "update-downloaded",
        "monitoring-started",
        "monitoring-stopped",
        "late-checkin",
        "tray-notification",
        "request-quit-reason",
      ];
      channels.forEach((ch) => ipcRenderer.removeAllListeners(ch));
    }
  },
});

// Also expose as window.api for backward compatibility with HTML
contextBridge.exposeInMainWorld("api", {
  // Core functionality that HTML expects
  checkIn: async (): Promise<boolean> => {
    try {
      // Set checked-in state (main process will handle Discord notifications and auto-start monitoring)
      await ipcRenderer.invoke("set-checked-in", true);
      return true;
    } catch (error) {
      console.error("Check-in failed:", error);
      return false;
    }
  },

  checkOut: async (): Promise<boolean> => {
    try {
      // Stop monitoring first
      await ipcRenderer.invoke("stop-monitoring");

      // Set checked-out state (main process will handle Discord notifications)
      await ipcRenderer.invoke("set-checked-in", false);

      return true;
    } catch (error) {
      console.error("Check-out failed:", error);
      return false;
    }
  },

  addRestrictedApp: async (): Promise<boolean> => {
    try {
      const newAppInput = document.getElementById("newApp") as HTMLInputElement;
      if (!newAppInput) return false;

      const appName = newAppInput.value.trim();
      if (appName) {
        const settings = await ipcRenderer.invoke("get-settings");
        if (!settings.restrictedApps.includes(appName)) {
          settings.restrictedApps.push(appName);
          await ipcRenderer.invoke("save-settings", settings);
          newAppInput.value = ""; // Clear input
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Failed to add restricted app:", error);
      return false;
    }
  },

  addKeyword: async (): Promise<boolean> => {
    try {
      const newKeywordInput = document.getElementById("newKeyword") as HTMLInputElement;
      if (!newKeywordInput) return false;

      const keyword = newKeywordInput.value.trim();
      if (keyword) {
        const settings = await ipcRenderer.invoke("get-settings");
        if (!settings.monitoringKeywords.includes(keyword.toLowerCase())) {
          settings.monitoringKeywords.push(keyword.toLowerCase());
          await ipcRenderer.invoke("save-settings", settings);
          newKeywordInput.value = ""; // Clear input
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Failed to add keyword:", error);
      return false;
    }
  },

  testDiscordNotification: async (): Promise<any> => {
    try {
      const settings = await ipcRenderer.invoke("get-settings");
      if (!settings.discordWebhook) {
        alert("Please set your Discord webhook URL first!");
        return false;
      }
      const result = await ipcRenderer.invoke(
        "test-discord-webhook",
        settings.discordWebhook
      );
      return result;
    } catch (error) {
      console.error("Discord test failed:", error);
      return false;
    }
  },

  saveSettings: async (): Promise<boolean> => {
    try {
      const webhookInput = document.getElementById("discordWebhook") as HTMLInputElement;
      const checkInInput = document.getElementById("checkInTime") as HTMLInputElement;
      const checkOutInput = document.getElementById("checkOutTime") as HTMLInputElement;

      if (webhookInput && checkInInput && checkOutInput) {
        const settings = {
          discordWebhook: webhookInput.value.trim(),
          checkInTime: checkInInput.value,
          checkOutTime: checkOutInput.value,
        };
        await ipcRenderer.invoke("save-settings", settings);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to save settings:", error);
      return false;
    }
  },

  pauseMonitoring: async (): Promise<boolean> => {
    try {
      let reason = "User requested pause";
      let minutes = 60;

      // Try to get values from UI elements first
      const disableMinutesInput = document.getElementById("disableMinutes") as HTMLInputElement;
      if (disableMinutesInput) {
        minutes = parseInt(disableMinutesInput.value) || 60;
      }

      // Fallback to prompt if available
      try {
        const userReason = window.prompt("Reason for pausing monitoring:");
        if (userReason) reason = userReason;
      } catch (e) {
        console.warn("prompt() not available, using default reason");
      }

      await ipcRenderer.invoke("pause-monitoring-with-reason", reason, minutes);
      return true;
    } catch (error) {
      console.error("Failed to pause monitoring:", error);
      return false;
    }
  },

  resumeMonitoring: async (): Promise<boolean> => {
    try {
      await ipcRenderer.invoke("start-monitoring");
      // Discord notification is already sent by startProcessMonitoring in main process
      return true;
    } catch (error) {
      console.error("Failed to resume monitoring:", error);
      return false;
    }
  },

  stopMonitoring: async (): Promise<boolean> => {
    try {
      let reason = "User requested stop";
      try {
        reason = window.prompt("Reason for stopping monitoring:") || reason;
      } catch (e) {
        console.warn("prompt() not available, using default reason");
      }
      await ipcRenderer.invoke("stop-monitoring-with-reason", reason);
      return true;
    } catch (error) {
      console.error("Failed to stop monitoring:", error);
      return false;
    }
  },

  temporaryDisable: async (): Promise<boolean> => {
    try {
      let reason = "User requested temporary disable";
      try {
        reason = window.prompt("Reason for temporary disable:") || reason;
      } catch (e) {
        console.warn("prompt() not available, using default reason");
      }
      await ipcRenderer.invoke("stop-monitoring-with-reason", reason);
      return true;
    } catch (error) {
      console.error("Failed to disable monitoring:", error);
      return false;
    }
  },

  getMonitoringStatus: async (): Promise<boolean> => {
    try {
      return await ipcRenderer.invoke("get-monitoring-status");
    } catch (error) {
      console.error("Failed to get monitoring status:", error);
      return false;
    }
  },

  clearLog: async (): Promise<boolean> => {
    try {
      await ipcRenderer.invoke("clear-activity-log");
      return true;
    } catch (error) {
      console.error("Failed to clear log:", error);
      return false;
    }
  },

  exportLog: async (): Promise<boolean> => {
    try {
      const logData = await ipcRenderer.invoke("get-activity-log");
      await ipcRenderer.invoke("export-log", logData);
      return true;
    } catch (error) {
      console.error("Failed to export log:", error);
      return false;
    }
  },

  checkForUpdates: async (): Promise<boolean> => {
    try {
      await ipcRenderer.invoke("check-for-updates");
      return true;
    } catch (error) {
      console.error("Failed to check for updates:", error);
      return false;
    }
  },
});

// App / environment info
contextBridge.exposeInMainWorld("appInfo", {
  platform: process.platform,
  arch: process.arch,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});

// Small utils exposed to renderer (non-IPC)
contextBridge.exposeInMainWorld("utils", {
  formatTime: (date: Date): string => date.toLocaleTimeString(),
  formatDate: (date: Date): string => date.toLocaleDateString(),
  formatDateTime: (date: Date): string => date.toLocaleString(),
  formatDuration: (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  },
  timeToMinutes: (timeStr: string): number => {
    const [hours = 0, minutes = 0] = (timeStr || "0:0").split(":").map(Number);
    return hours * 60 + minutes;
  },
  minutesToTime: (minutes: number): string => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
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
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;"),
  uniqueArray: <T>(arr: T[]): T[] => Array.from(new Set(arr)),
});

// Dev debug helpers
if (process.env.NODE_ENV === "development") {
  contextBridge.exposeInMainWorld("debug", {
    log: (...args: any[]) => console.log("[Renderer]", ...args),
    warn: (...args: any[]) => console.warn("[Renderer]", ...args),
    error: (...args: any[]) => console.error("[Renderer]", ...args),
  });
}

// Notify main that renderer is ready
window.addEventListener("DOMContentLoaded", () => {
  ipcRenderer.send("renderer-ready");

  // forward renderer-side uncaught errors to main for centralized logging
  window.addEventListener("error", (event) => {
    ipcRenderer.send("renderer-error", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error ? event.error.stack : null,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    ipcRenderer.send("renderer-error", {
      message: "Unhandled promise rejection",
      error: event.reason ? event.reason.stack || event.reason : null,
    });
  });
});