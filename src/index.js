const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  dialog,
} = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { exec } = require("child_process");
const { autoUpdater } = require("electron-updater");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow;
let tray;
let isMonitoring = false;
let monitoringInterval;
let lastWarningTime = new Map(); // Track when each app was last warned about

// Configure auto-updater
autoUpdater.checkForUpdatesAndNotify();
autoUpdater.setFeedURL({
  provider: "github",
  owner: "chaosweasl",
  repo: "not-enough-accountability",
});

// Auto-updater event handlers
autoUpdater.on("checking-for-update", () => {
  console.log("Checking for update...");
});

autoUpdater.on("update-available", (info) => {
  console.log("Update available.");
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("update-available", info);
  }
});

autoUpdater.on("update-not-available", (info) => {
  console.log("Update not available.");
});

autoUpdater.on("error", (err) => {
  console.log("Error in auto-updater. " + err);
});

autoUpdater.on("download-progress", (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + " - Downloaded " + progressObj.percent + "%";
  log_message =
    log_message +
    " (" +
    progressObj.transferred +
    "/" +
    progressObj.total +
    ")";
  console.log(log_message);

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("download-progress", progressObj);
  }
});

autoUpdater.on("update-downloaded", (info) => {
  console.log("Update downloaded");
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("update-downloaded", info);
  }
});

// App settings
let settings = {
  discordWebhook: "",
  checkInTime: "08:00",
  checkOutTime: "16:00",
  restrictedApps: ["steam.exe"],
  monitoringKeywords: ["youtube", "netflix", "twitch", "reddit"],
};

const createWindow = () => {
  // Create the browser window.
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
    show: false, // Don't show until ready
  });

  // Load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Handle window closed (minimize to tray instead of quitting)
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

  // Open DevTools in development
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
};

const createTray = () => {
  // Create system tray icon using built-in empty image
  let trayIcon;
  try {
    // Try to create a simple tray icon
    trayIcon = nativeImage.createEmpty();
    tray = new Tray(trayIcon);
  } catch (error) {
    console.log("Could not create tray icon:", error.message);
    return; // Skip tray creation if it fails
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show App",
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    {
      label: "Check In",
      click: () => {
        mainWindow.webContents.send("trigger-checkin");
      },
    },
    {
      label: "Check Out",
      click: () => {
        mainWindow.webContents.send("trigger-checkout");
      },
    },
    { type: "separator" },
    {
      label: isMonitoring ? "Stop Monitoring" : "Start Monitoring",
      click: () => {
        if (isMonitoring) {
          stopProcessMonitoring();
        } else {
          startProcessMonitoring();
        }
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip("Accountability Tracker");

  // Show window on double-click
  tray.on("double-click", () => {
    mainWindow.show();
    mainWindow.focus();
  });
};

// Load settings from file
const loadSettings = () => {
  const settingsPath = path.join(app.getPath("userData"), "settings.json");
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, "utf8");
      settings = { ...settings, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
};

// Save settings to file
const saveSettings = () => {
  const settingsPath = path.join(app.getPath("userData"), "settings.json");
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error("Error saving settings:", error);
  }
};

// Process monitoring functions
const getRunningProcesses = () => {
  return new Promise((resolve, reject) => {
    let command;

    if (process.platform === "win32") {
      command = "tasklist /fo csv /nh";
    } else if (process.platform === "darwin") {
      command = "ps aux";
    } else {
      command = "ps aux";
    }

    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }

      let processes = [];

      if (process.platform === "win32") {
        const lines = stdout.split("\n").filter((line) => line.trim());
        processes = lines
          .map((line) => {
            const parts = line.split(",");
            return parts[0] ? parts[0].replace(/"/g, "").toLowerCase() : "";
          })
          .filter((name) => name);
      } else {
        const lines = stdout.split("\n").slice(1);
        processes = lines
          .map((line) => {
            const parts = line.trim().split(/\s+/);
            return parts[parts.length - 1]
              ? path.basename(parts[parts.length - 1]).toLowerCase()
              : "";
          })
          .filter((name) => name);
      }

      resolve(processes);
    });
  });
};

const checkForRestrictedApps = async () => {
  try {
    const runningProcesses = await getRunningProcesses();
    const restrictedFound = [];

    settings.restrictedApps.forEach((app) => {
      const appName = app.toLowerCase();
      if (
        runningProcesses.some((process) =>
          process.includes(appName.replace(".exe", ""))
        )
      ) {
        restrictedFound.push(app);
      }
    });

    return restrictedFound;
  } catch (error) {
    console.error("Error checking processes:", error);
    return [];
  }
};

const checkForRestrictedKeywords = async () => {
  try {
    return new Promise((resolve) => {
      let command;

      if (process.platform === "win32") {
        command =
          'powershell "Get-Process | Where-Object {$_.MainWindowTitle -ne \\"\\"} | Select-Object ProcessName,MainWindowTitle | ConvertTo-Json"';
      } else if (process.platform === "darwin") {
        command =
          'osascript -e "tell application \\"System Events\\" to get {name, title of window 1} of every application process whose frontmost is true"';
      } else {
        command = "xdotool getwindowfocus getwindowname";
      }

      exec(command, (error, stdout, stderr) => {
        if (error) {
          resolve([]);
          return;
        }

        const keywordsFound = [];

        try {
          if (process.platform === "win32") {
            const processes = JSON.parse(stdout);
            const processArray = Array.isArray(processes)
              ? processes
              : [processes];

            processArray.forEach((proc) => {
              if (proc.MainWindowTitle) {
                const title = proc.MainWindowTitle.toLowerCase();
                settings.monitoringKeywords.forEach((keyword) => {
                  if (title.includes(keyword.toLowerCase())) {
                    keywordsFound.push(`${keyword} (in ${proc.ProcessName})`);
                  }
                });
              }
            });
          } else {
            // For macOS/Linux, check the window title directly
            const title = stdout.toLowerCase();
            settings.monitoringKeywords.forEach((keyword) => {
              if (title.includes(keyword.toLowerCase())) {
                keywordsFound.push(keyword);
              }
            });
          }
        } catch (parseError) {
          console.error("Error parsing window titles:", parseError);
        }

        resolve([...new Set(keywordsFound)]); // Remove duplicates
      });
    });
  } catch (error) {
    console.error("Error checking for keywords:", error);
    return [];
  }
};

const startProcessMonitoring = () => {
  if (isMonitoring) return;

  isMonitoring = true;
  console.log("Starting process monitoring...");

  monitoringInterval = setInterval(async () => {
    const restrictedApps = await checkForRestrictedApps();
    const restrictedKeywords = await checkForRestrictedKeywords();
    const allViolations = [...restrictedApps, ...restrictedKeywords];

    if (allViolations.length > 0) {
      const now = Date.now();
      const violationsToWarnAbout = [];

      // Check if we should warn about each violation (only once per minute)
      allViolations.forEach((violation) => {
        const lastWarned = lastWarningTime.get(violation) || 0;
        const oneMinuteAgo = now - 60 * 1000; // 60 seconds

        if (lastWarned < oneMinuteAgo) {
          violationsToWarnAbout.push(violation);
          lastWarningTime.set(violation, now);
        }
      });

      if (violationsToWarnAbout.length > 0) {
        const hasApps = violationsToWarnAbout.some((v) =>
          restrictedApps.includes(v)
        );
        const hasKeywords = violationsToWarnAbout.some((v) =>
          restrictedKeywords.includes(v)
        );

        let message = "🚨 Violation detected: ";
        if (hasApps && hasKeywords) {
          message += `Apps: ${violationsToWarnAbout.filter((v) => restrictedApps.includes(v)).join(", ")}, Keywords: ${violationsToWarnAbout.filter((v) => restrictedKeywords.includes(v)).join(", ")}`;
        } else if (hasApps) {
          message += `Restricted apps: ${violationsToWarnAbout.join(", ")}`;
        } else {
          message += `Restricted content: ${violationsToWarnAbout.join(", ")}`;
        }

        console.log(message);

        // Send to renderer process
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("violation-detected", {
            apps: restrictedApps,
            keywords: restrictedKeywords,
            allViolations: violationsToWarnAbout,
            timestamp: new Date().toISOString(),
          });
        }

        // Send Discord notification
        await sendDiscordNotification(
          `🚨 **Violation Alert**\n${message}\nTime: ${new Date().toLocaleString()}`
        );

        // Show system notification
        showTrayNotification("Violation Detected!", message);
      }
    }
  }, 5000); // Check every 5 seconds

  updateTrayMenu();
};

const stopProcessMonitoring = () => {
  if (!isMonitoring) return;

  isMonitoring = false;
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }

  console.log("Process monitoring stopped");
  updateTrayMenu();
};

const updateTrayMenu = () => {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show App",
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    {
      label: "Check In",
      click: () => {
        mainWindow.webContents.send("trigger-checkin");
      },
    },
    {
      label: "Check Out",
      click: () => {
        mainWindow.webContents.send("trigger-checkout");
      },
    },
    { type: "separator" },
    {
      label: isMonitoring ? "Stop Monitoring" : "Start Monitoring",
      click: () => {
        if (isMonitoring) {
          stopProcessMonitoring();
        } else {
          startProcessMonitoring();
        }
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        // Send request to renderer to ask for quit reason
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("request-quit-reason");
        } else {
          // If no window available, quit without reason
          app.isQuiting = true;
          app.quit();
        }
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
};

const sendDiscordNotification = async (message) => {
  if (!settings.discordWebhook) {
    console.log("Discord webhook not configured");
    return;
  }

  try {
    const fetch = require("node-fetch"); // You'll need to install this: npm install node-fetch@2

    const response = await fetch(settings.discordWebhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: message,
        username: "Accountability Bot",
      }),
    });

    if (response.ok) {
      console.log("Discord notification sent successfully");
    } else {
      console.error(
        "Failed to send Discord notification:",
        response.statusText
      );
    }
  } catch (error) {
    console.error("Error sending Discord notification:", error);
  }
};

const showTrayNotification = (title, body) => {
  if (tray) {
    tray.displayBalloon({
      title,
      content: body,
      iconType: "warning",
    });
  }
};

// IPC Handlers
ipcMain.handle("get-settings", () => settings);

ipcMain.handle("save-settings", (event, newSettings) => {
  settings = { ...settings, ...newSettings };
  saveSettings();
  return true;
});

ipcMain.handle("start-monitoring", () => {
  startProcessMonitoring();
  return isMonitoring;
});

ipcMain.handle("stop-monitoring", () => {
  stopProcessMonitoring();
  return isMonitoring;
});

ipcMain.handle("stop-monitoring-with-reason", async (event, reason) => {
  await sendDiscordNotification(
    `⏹️ **Monitoring Stopped**\nReason: ${reason}\nTime: ${new Date().toLocaleString()}`
  );
  stopProcessMonitoring();
  return isMonitoring;
});

ipcMain.handle(
  "pause-monitoring-with-reason",
  async (event, reason, minutes = 60) => {
    await sendDiscordNotification(
      `⏸️ **Monitoring Paused**\nReason: ${reason}\nDuration: ${minutes} minutes\nTime: ${new Date().toLocaleString()}`
    );
    stopProcessMonitoring();

    setTimeout(
      () => {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const checkIn = timeToMinutes(settings.checkInTime);
        const checkOut = timeToMinutes(settings.checkOutTime);
        const isWorkHours = currentTime >= checkIn && currentTime <= checkOut;

        if (isWorkHours) {
          startProcessMonitoring();
          sendDiscordNotification(
            `▶️ **Monitoring Resumed**\nAutomatic resume after pause\nTime: ${new Date().toLocaleString()}`
          );
        }
      },
      minutes * 60 * 1000
    );

    return true;
  }
);

// Helper function for time conversion
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

ipcMain.handle("quit-app-with-reason", async (event, reason) => {
  await sendDiscordNotification(
    `🚪 **App Quit**\nReason: ${reason}\nTime: ${new Date().toLocaleString()}`
  );
  app.isQuiting = true;
  app.quit();
  return true;
});

// Auto-updater IPC handlers
ipcMain.handle("check-for-updates", () => {
  autoUpdater.checkForUpdatesAndNotify();
  return true;
});

ipcMain.handle("install-update", () => {
  autoUpdater.quitAndInstall();
  return true;
});

ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

ipcMain.handle("get-monitoring-status", () => isMonitoring);

ipcMain.handle("send-discord-message", async (event, message) => {
  await sendDiscordNotification(message);
});

ipcMain.handle("get-running-processes", async () => {
  try {
    return await getRunningProcesses();
  } catch (error) {
    console.error("Error getting processes:", error);
    return [];
  }
});

// Add missing IPC handlers
ipcMain.handle("is-process-running", async (event, processName) => {
  try {
    const runningProcesses = await getRunningProcesses();
    const processNameLower = processName.toLowerCase();
    return runningProcesses.some((process) =>
      process.includes(processNameLower.replace(".exe", ""))
    );
  } catch (error) {
    console.error("Error checking if process is running:", error);
    return false;
  }
});

ipcMain.handle("get-active-window-title", async () => {
  try {
    return new Promise((resolve, reject) => {
      let command;

      if (process.platform === "win32") {
        command =
          'powershell "Get-Process | Where-Object {$_.MainWindowTitle -ne \\"\\"}  | Select-Object MainWindowTitle"';
      } else if (process.platform === "darwin") {
        command =
          'osascript -e "tell application \\"System Events\\" to get name of first application process whose frontmost is true"';
      } else {
        command = "xdotool getwindowfocus getwindowname";
      }

      exec(command, (error, stdout, stderr) => {
        if (error) {
          resolve("");
          return;
        }
        resolve(stdout.trim());
      });
    });
  } catch (error) {
    console.error("Error getting active window title:", error);
    return "";
  }
});

// Test Discord webhook
ipcMain.handle("test-discord-webhook", async (event, webhookUrl) => {
  try {
    const fetch = require("node-fetch");
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content:
          "🧪 **Test Notification**\nYour accountability app is working correctly!",
        username: "Accountability Bot",
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error testing Discord webhook:", error);
    return false;
  }
});

// App event handlers
app.whenReady().then(() => {
  loadSettings();
  createWindow();
  createTray();

  // Check for updates after app is ready (wait 5 seconds)
  setTimeout(() => {
    if (!process.env.NODE_ENV || process.env.NODE_ENV !== "development") {
      autoUpdater.checkForUpdatesAndNotify();
    }
  }, 5000);

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Cleanup before quit
app.on("before-quit", () => {
  stopProcessMonitoring();
  saveSettings();
});

// Handle app updates (optional)
app.on("second-instance", () => {
  // Someone tried to run a second instance, focus our window instead
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}
