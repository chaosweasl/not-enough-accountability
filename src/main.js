const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  Notification,
} = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { exec } = require("child_process");
const fetch = require("node-fetch");

let mainWindow;
let tray;
let isMonitoring = false;
let monitoringInterval;
let violationLog = [];

// Default settings
let settings = {
  discordWebhook: "",
  checkInTime: "08:00",
  checkOutTime: "16:00",
  restrictedApps: ["chrome.exe", "firefox.exe", "steam.exe", "discord.exe"],
  monitoringKeywords: ["youtube", "netflix", "twitch", "reddit"],
};

const settingsPath = path.join(app.getPath("userData"), "settings.json");

function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, "utf-8");
      settings = JSON.parse(data);
    }
  } catch (e) {
    // fallback to defaults
  }
}

function saveSettings(newSettings) {
  settings = { ...settings, ...newSettings };
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, "assets", "icon.png"),
    show: false,
  });
  mainWindow.loadFile(path.join(__dirname, "index.html"));
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("close", (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
      showTrayNotification(
        "App minimized to tray",
        "The accountability app is still running in the background."
      );
    }
    return false;
  });
}

function createTray() {
  const trayIcon = nativeImage.createFromPath(
    path.join(__dirname, "assets", "tray-icon.png")
  );
  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
  const contextMenu = Menu.buildFromTemplate([
    { label: "Show App", click: () => mainWindow.show() },
    { label: "Check In", click: () => sendCheckIn() },
    { label: "Check Out", click: () => sendCheckOut() },
    {
      label: "Quit",
      click: () => {
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);
  tray.setToolTip("Accountability App");
  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => mainWindow.show());
}

function showTrayNotification(title, body) {
  new Notification({ title, body }).show();
}

function sendDiscordMessage(message) {
  if (!settings.discordWebhook) return;
  fetch(settings.discordWebhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: message }),
  });
}

function sendCheckIn() {
  sendDiscordMessage(":white_check_mark: Checked in for work!");
}

function sendCheckOut() {
  sendDiscordMessage(":checkered_flag: Checked out for the day!");
}

function getCurrentTime() {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

function isWithinWorkHours() {
  const now = getCurrentTime();
  return now >= settings.checkInTime && now <= settings.checkOutTime;
}

function monitorProcesses() {
  if (monitoringInterval) clearInterval(monitoringInterval);
  monitoringInterval = setInterval(async () => {
    if (!isWithinWorkHours()) return;
    exec("tasklist", (err, stdout) => {
      if (err) return;
      const running = stdout.toLowerCase();
      let violation = false;
      for (const app of settings.restrictedApps) {
        if (running.includes(app.toLowerCase())) {
          violation = app;
          break;
        }
      }
      if (!violation) {
        for (const keyword of settings.monitoringKeywords) {
          if (running.includes(keyword.toLowerCase())) {
            violation = keyword;
            break;
          }
        }
      }
      if (violation) {
        const msg = `:rotating_light: Violation detected: ${violation} at ${getCurrentTime()}`;
        sendDiscordMessage(msg);
        violationLog.push({ time: new Date().toISOString(), violation });
        if (mainWindow)
          mainWindow.webContents.send("violation-detected", {
            violation,
            time: getCurrentTime(),
          });
      }
    });
  }, 10000); // every 10 seconds
}

app.whenReady().then(() => {
  loadSettings();
  createWindow();
  createTray();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC HANDLERS
ipcMain.handle("get-settings", async () => settings);
ipcMain.handle("save-settings", async (event, newSettings) => {
  saveSettings(newSettings);
  if (mainWindow) mainWindow.webContents.send("settings-changed", settings);
  return settings;
});
ipcMain.handle("start-monitoring", async () => {
  isMonitoring = true;
  monitorProcesses();
  if (mainWindow)
    mainWindow.webContents.send("monitoring-status-changed", true);
  return true;
});
ipcMain.handle("stop-monitoring", async () => {
  isMonitoring = false;
  if (monitoringInterval) clearInterval(monitoringInterval);
  if (mainWindow)
    mainWindow.webContents.send("monitoring-status-changed", false);
  return true;
});
ipcMain.handle("get-monitoring-status", async () => isMonitoring);
ipcMain.handle("send-discord-message", async (event, message) => {
  sendDiscordMessage(message);
  return true;
});
ipcMain.handle("is-process-running", async (event, processName) => {
  return new Promise((resolve) => {
    exec("tasklist", (err, stdout) => {
      if (err) return resolve(false);
      resolve(stdout.toLowerCase().includes(processName.toLowerCase()));
    });
  });
});
ipcMain.handle("get-active-window-title", async () => {
  // Windows only: use powershell to get active window title
  return new Promise((resolve) => {
    exec(
      'powershell "(Get-Process | Where-Object {$_.MainWindowTitle}).MainWindowTitle"',
      (err, stdout) => {
        if (err) return resolve("");
        resolve(stdout.trim());
      }
    );
  });
});
// System tray
ipcMain.handle("minimize-to-tray", () => {
  if (mainWindow) mainWindow.hide();
  return true;
});
// Check-in/out
ipcMain.handle("schedule-check-in", () => {
  sendCheckIn();
  return true;
});
ipcMain.handle("schedule-check-out", () => {
  sendCheckOut();
  return true;
});
// Notification
ipcMain.handle("show-notification", (event, title, body) => {
  showTrayNotification(title, body);
  return true;
});
// App version
ipcMain.handle("get-app-version", () => app.getVersion());
ipcMain.handle("get-app-path", () => app.getAppPath());
ipcMain.handle("get-user-data-path", () => app.getPath("userData"));
ipcMain.handle("restart-app", () => {
  app.relaunch();
  app.exit();
});
ipcMain.handle("quit-app", () => {
  app.quit();
});

// Export log
ipcMain.handle("export-log", async (event, logData) => {
  const logPath = path.join(app.getPath("desktop"), "accountability-log.json");
  fs.writeFileSync(logPath, JSON.stringify(logData || violationLog, null, 2));
  return logPath;
});

// Settings import/export
ipcMain.handle("import-settings", async () => {
  if (fs.existsSync(settingsPath)) {
    const data = fs.readFileSync(settingsPath, "utf-8");
    return JSON.parse(data);
  }
  return settings;
});
ipcMain.handle("export-settings", async (event, exportSettings) => {
  const exportPath = path.join(
    app.getPath("desktop"),
    "accountability-settings.json"
  );
  fs.writeFileSync(
    exportPath,
    JSON.stringify(exportSettings || settings, null, 2)
  );
  return exportPath;
});

// Auto-start (Windows only, simple registry method)
ipcMain.handle("set-auto-start", (event, enable) => {
  const autostart = require("auto-launch");
  const launcher = new autostart({ name: "AccountabilityApp" });
  if (enable) launcher.enable();
  else launcher.disable();
  return true;
});
ipcMain.handle("get-auto-start-status", async () => {
  const autostart = require("auto-launch");
  const launcher = new autostart({ name: "AccountabilityApp" });
  return launcher.isEnabled();
});
