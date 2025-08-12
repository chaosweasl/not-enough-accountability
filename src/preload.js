const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Settings management
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),

  // Process monitoring
  startMonitoring: () => ipcRenderer.invoke("start-monitoring"),
  stopMonitoring: () => ipcRenderer.invoke("stop-monitoring"),
  stopMonitoringWithReason: (reason) =>
    ipcRenderer.invoke("stop-monitoring-with-reason", reason),
  pauseMonitoringWithReason: (reason, minutes) =>
    ipcRenderer.invoke("pause-monitoring-with-reason", reason, minutes),
  getMonitoringStatus: () => ipcRenderer.invoke("get-monitoring-status"),
  getRunningProcesses: () => ipcRenderer.invoke("get-running-processes"),

  // Discord integration
  sendDiscordMessage: (message) =>
    ipcRenderer.invoke("send-discord-message", message),
  testDiscordWebhook: (webhook) =>
    ipcRenderer.invoke("test-discord-webhook", webhookUrl),

  // File operations
  exportLog: (logData) => ipcRenderer.invoke("export-log", logData),
  importSettings: () => ipcRenderer.invoke("import-settings"),
  exportSettings: (settings) => ipcRenderer.invoke("export-settings", settings),

  // System integration
  minimizeToTray: () => ipcRenderer.invoke("minimize-to-tray"),
  showNotification: (title, body, options = {}) =>
    ipcRenderer.invoke("show-notification", title, body, options),
  setAutoStart: (enable) => ipcRenderer.invoke("set-auto-start", enable),
  getAutoStartStatus: () => ipcRenderer.invoke("get-auto-start-status"),

  // Time and scheduling
  getCurrentTime: () => ipcRenderer.invoke("get-current-time"),
  scheduleCheckIn: (time) => ipcRenderer.invoke("schedule-check-in", time),
  scheduleCheckOut: (time) => ipcRenderer.invoke("schedule-check-out", time),
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
  quitAppWithReason: (reason) =>
    ipcRenderer.invoke("quit-app-with-reason", reason),

  // Auto-updater
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  installUpdate: () => ipcRenderer.invoke("install-update"),

  // Event listeners for main process events
  onViolationDetected: (callback) => {
    ipcRenderer.removeAllListeners("violation-detected");
    ipcRenderer.on("violation-detected", (event, data) => callback(data));
  },

  onTriggerCheckin: (callback) => {
    ipcRenderer.removeAllListeners("trigger-checkin");
    ipcRenderer.on("trigger-checkin", (event, data) => callback(data));
  },

  onTriggerCheckout: (callback) => {
    ipcRenderer.removeAllListeners("trigger-checkout");
    ipcRenderer.on("trigger-checkout", (event, data) => callback(data));
  },

  onSettingsChanged: (callback) => {
    ipcRenderer.removeAllListeners("settings-changed");
    ipcRenderer.on("settings-changed", (event, settings) => callback(settings));
  },

  onMonitoringStatusChanged: (callback) => {
    ipcRenderer.removeAllListeners("monitoring-status-changed");
    ipcRenderer.on("monitoring-status-changed", (event, status) =>
      callback(status)
    );
  },

  onScheduledEvent: (callback) => {
    ipcRenderer.removeAllListeners("scheduled-event");
    ipcRenderer.on("scheduled-event", (event, data) => callback(data));
  },

  onSystemNotification: (callback) => {
    ipcRenderer.removeAllListeners("system-notification");
    ipcRenderer.on("system-notification", (event, data) => callback(data));
  },

  onAppUpdate: (callback) => {
    ipcRenderer.removeAllListeners("app-update");
    ipcRenderer.on("app-update", (event, data) => callback(data));
  },

  onRequestQuitReason: (callback) => {
    ipcRenderer.removeAllListeners("request-quit-reason");
    ipcRenderer.on("request-quit-reason", (event, data) => callback(data));
  },

  // Auto-updater events
  onUpdateAvailable: (callback) => {
    ipcRenderer.removeAllListeners("update-available");
    ipcRenderer.on("update-available", (event, info) => callback(info));
  },

  onDownloadProgress: (callback) => {
    ipcRenderer.removeAllListeners("download-progress");
    ipcRenderer.on("download-progress", (event, progress) =>
      callback(progress)
    );
  },

  onUpdateDownloaded: (callback) => {
    ipcRenderer.removeAllListeners("update-downloaded");
    ipcRenderer.on("update-downloaded", (event, info) => callback(info));
  },

  // Process-specific monitoring
  isProcessRunning: (processName) =>
    ipcRenderer.invoke("is-process-running", processName),
  getProcessInfo: (processName) =>
    ipcRenderer.invoke("get-process-info", processName),
  killProcess: (processName) => ipcRenderer.invoke("kill-process", processName),

  // Window title monitoring (for detecting YouTube, etc.)
  getActiveWindowTitle: () => ipcRenderer.invoke("get-active-window-title"),
  startWindowTitleMonitoring: (keywords) =>
    ipcRenderer.invoke("start-window-title-monitoring", keywords),
  stopWindowTitleMonitoring: () =>
    ipcRenderer.invoke("stop-window-title-monitoring"),

  // Screenshot functionality (for evidence)
  takeScreenshot: (options = {}) =>
    ipcRenderer.invoke("take-screenshot", options),

  // Network monitoring
  startNetworkMonitoring: (urls) =>
    ipcRenderer.invoke("start-network-monitoring", urls),
  stopNetworkMonitoring: () => ipcRenderer.invoke("stop-network-monitoring"),

  // Keyboard/Mouse activity monitoring
  startActivityMonitoring: () =>
    ipcRenderer.invoke("start-activity-monitoring"),
  stopActivityMonitoring: () => ipcRenderer.invoke("stop-activity-monitoring"),
  getLastActivityTime: () => ipcRenderer.invoke("get-last-activity-time"),

  // Website blocking (if you want to implement this)
  addBlockedSite: (url) => ipcRenderer.invoke("add-blocked-site", url),
  removeBlockedSite: (url) => ipcRenderer.invoke("remove-blocked-site", url),
  getBlockedSites: () => ipcRenderer.invoke("get-blocked-sites"),

  // Statistics and reporting
  getUsageStats: (dateRange) =>
    ipcRenderer.invoke("get-usage-stats", dateRange),
  generateReport: (options) => ipcRenderer.invoke("generate-report", options),

  // Backup and restore
  createBackup: () => ipcRenderer.invoke("create-backup"),
  restoreBackup: (backupPath) =>
    ipcRenderer.invoke("restore-backup", backupPath),

  // Theme and appearance
  setTheme: (theme) => ipcRenderer.invoke("set-theme", theme),
  getTheme: () => ipcRenderer.invoke("get-theme"),

  // Logging
  logActivity: (activity) => ipcRenderer.invoke("log-activity", activity),
  getActivityLog: (options = {}) =>
    ipcRenderer.invoke("get-activity-log", options),
  clearActivityLog: () => ipcRenderer.invoke("clear-activity-log"),

  // Temporary overrides
  setTemporaryOverride: (type, duration, reason) =>
    ipcRenderer.invoke("set-temporary-override", type, duration, reason),
  getActiveOverrides: () => ipcRenderer.invoke("get-active-overrides"),
  cancelOverride: (overrideId) =>
    ipcRenderer.invoke("cancel-override", overrideId),

  // Emergency features
  panicMode: () => ipcRenderer.invoke("panic-mode"),
  enableEmergencyAccess: (duration) =>
    ipcRenderer.invoke("enable-emergency-access", duration),

  // Performance monitoring
  getSystemInfo: () => ipcRenderer.invoke("get-system-info"),
  getAppPerformance: () => ipcRenderer.invoke("get-app-performance"),

  // Custom rules
  addCustomRule: (rule) => ipcRenderer.invoke("add-custom-rule", rule),
  removeCustomRule: (ruleId) =>
    ipcRenderer.invoke("remove-custom-rule", ruleId),
  getCustomRules: () => ipcRenderer.invoke("get-custom-rules"),

  // Remove event listeners (cleanup)
  removeAllListeners: (channel) => {
    if (channel) {
      ipcRenderer.removeAllListeners(channel);
    } else {
      // Remove all listeners for all channels
      const channels = [
        "violation-detected",
        "trigger-checkin",
        "trigger-checkout",
        "settings-changed",
        "monitoring-status-changed",
        "scheduled-event",
        "system-notification",
        "app-update",
      ];
      channels.forEach((ch) => ipcRenderer.removeAllListeners(ch));
    }
  },
});

// Expose version info
contextBridge.exposeInMainWorld("appInfo", {
  platform: process.platform,
  arch: process.arch,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});

// Utility functions that don't need IPC
contextBridge.exposeInMainWorld("utils", {
  // Date/Time utilities
  formatTime: (date) => {
    return date.toLocaleTimeString();
  },

  formatDate: (date) => {
    return date.toLocaleDateString();
  },

  formatDateTime: (date) => {
    return date.toLocaleString();
  },

  // Duration utilities
  formatDuration: (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  },

  // Time calculations
  timeToMinutes: (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  },

  minutesToTime: (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  },

  // Validation utilities
  isValidEmail: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  isValidUrl: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isValidTime: (timeStr) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeStr);
  },

  // String utilities
  escapeHtml: (unsafe) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  // Array utilities
  uniqueArray: (arr) => [...new Set(arr)],

  // Object utilities
  deepClone: (obj) => JSON.parse(JSON.stringify(obj)),
});

// Console logging for debugging (only in development)
if (process.env.NODE_ENV === "development") {
  contextBridge.exposeInMainWorld("debug", {
    log: (...args) => console.log("[Renderer]", ...args),
    warn: (...args) => console.warn("[Renderer]", ...args),
    error: (...args) => console.error("[Renderer]", ...args),
  });
}

// Window ready notification
window.addEventListener("DOMContentLoaded", () => {
  // Notify main process that the renderer is ready
  ipcRenderer.send("renderer-ready");

  // Set up global error handling
  window.addEventListener("error", (event) => {
    ipcRenderer.send("renderer-error", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.stack,
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    ipcRenderer.send("renderer-error", {
      message: "Unhandled promise rejection",
      error: event.reason?.stack || event.reason,
    });
  });
});
