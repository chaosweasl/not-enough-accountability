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
let lastWarningTime = new Map();
let isCheckedIn = false; // Track check-in state in main process

// App settings
let settings = {
  discordWebhook: "",
  checkInTime: "08:00",
  checkOutTime: "16:00",
  restrictedApps: ["steam.exe"],
  monitoringKeywords: ["youtube", "netflix", "twitch", "reddit"],
};

// Helper function for time conversion
function timeToMinutes(timeStr) {
  const [hours = 0, minutes = 0] = (timeStr || "0:0").split(":").map(Number);
  return hours * 60 + minutes;
}

// ------------------- Auto-updater config -------------------
autoUpdater.checkForUpdatesAndNotify();
autoUpdater.setFeedURL({
  provider: "github",
  owner: "chaosweasl",
  repo: "not-enough-accountability",
});

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
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("update-not-available", info);
  }
});
autoUpdater.on("error", (err) => {
  console.log("Error in auto-updater. " + err);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("update-error", err.message);
  }
});
autoUpdater.on("download-progress", (progressObj) => {
  console.log(`Download progress: ${progressObj.percent}%`);
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

// ------------------- Helpers for persistence -------------------
const historyPath = path.join(app.getPath("userData"), "activity-history.json");

function readHistory() {
  try {
    if (!fs.existsSync(historyPath)) return [];
    const raw = fs.readFileSync(historyPath, "utf8");
    return JSON.parse(raw || "[]");
  } catch (err) {
    console.error("Error reading history:", err);
    return [];
  }
}

function appendHistory(entry) {
  try {
    const arr = readHistory();
    arr.unshift(entry);
    // keep last 500
    const truncated = arr.slice(0, 500);
    fs.writeFileSync(historyPath, JSON.stringify(truncated, null, 2), "utf8");
  } catch (err) {
    console.error("Error appending history:", err);
  }
}

// ------------------- Create windows & tray -------------------
const createWindow = () => {
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
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

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

  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
};

const createTray = () => {
  try {
    // Use assets/electron.png as requested
    const iconPath = path.join(__dirname, "assets", "electron.png");

    let trayIcon;
    if (fs.existsSync(iconPath)) {
      trayIcon = nativeImage.createFromPath(iconPath);
    } else {
      // fallback to empty icon (still works) — but ideally ensure electron.png exists
      trayIcon = nativeImage.createEmpty();
      console.warn("Tray icon not found at:", iconPath);
    }

    // create/rescale icon
    tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
    updateTrayMenu();
    tray.setToolTip("Accountability Tracker");

    tray.on("double-click", () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (error) {
    console.log("Could not create tray icon:", error && error.message);
  }
};

function updateTrayMenu() {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show App",
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: isCheckedIn ? "✅ Checked In" : "Check In",
      enabled: !isCheckedIn,
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("trigger-checkin");
        }
      },
    },
    {
      label: "Check Out",
      enabled: isCheckedIn,
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("trigger-checkout");
        }
      },
    },
    { type: "separator" },
    {
      label:
        isMonitoring && isCheckedIn
          ? "⏸️ Pause Monitoring"
          : isCheckedIn
            ? "▶️ Resume Monitoring"
            : "Monitoring (Not Checked In)",
      enabled: isCheckedIn,
      click: () => {
        if (isMonitoring) {
          // Pause monitoring
          stopProcessMonitoring();
        } else {
          // Resume monitoring
          startProcessMonitoring();
        }
      },
    },
    {
      label: `Status: ${isCheckedIn ? (isMonitoring ? "Monitoring" : "Paused") : "Not Checked In"}`,
      enabled: false,
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          // Ask renderer to collect a quit reason (existing workflow).
          mainWindow.webContents.send("request-quit-reason");

          // Fallback: if renderer doesn't quit the app within 5s, force quit from main.
          setTimeout(() => {
            if (!app.isQuiting) {
              console.log(
                "Quit fallback: forcing app quit because renderer didn't respond."
              );
              app.isQuiting = true;
              app.quit();
            }
          }, 5000);
        } else {
          app.isQuiting = true;
          app.quit();
        }
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

// ------------------- Settings load/save -------------------
const settingsPath = path.join(app.getPath("userData"), "settings.json");

const loadSettings = () => {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, "utf8");
      settings = { ...settings, ...JSON.parse(data) };
      console.log("Settings loaded:", settings);
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
};

const saveSettings = () => {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log("Settings saved:", settings);
  } catch (error) {
    console.error("Error saving settings:", error);
  }
};

// ------------------- Process monitoring functions -------------------
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

    exec(command, (error, stdout) => {
      if (error) {
        console.error("Error running process list command:", error);
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

      console.log("Found processes:", processes.slice(0, 10)); // Log first 10 for debugging
      resolve(processes);
    });
  });
};

const checkForRestrictedApps = async () => {
  try {
    const runningProcesses = await getRunningProcesses();
    const restrictedFound = [];

    settings.restrictedApps.forEach((appNameRaw) => {
      const appName = appNameRaw.toLowerCase();
      if (
        runningProcesses.some((process) =>
          process.includes(appName.replace(".exe", ""))
        )
      ) {
        restrictedFound.push(appNameRaw);
      }
    });

    if (restrictedFound.length > 0) {
      console.log("Restricted apps found:", restrictedFound);
    }
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
          "powershell \"Get-Process | Where-Object {$_.MainWindowTitle -ne ''} | Select-Object ProcessName,MainWindowTitle | ConvertTo-Json\"";
      } else if (process.platform === "darwin") {
        command =
          'osascript -e "tell application \\"System Events\\" to get {name, title of window 1} of every application process whose frontmost is true"';
      } else {
        command = "xdotool getwindowfocus getwindowname";
      }

      exec(command, (error, stdout) => {
        if (error) {
          console.error("Error running window title command:", error);
          resolve([]);
          return;
        }

        const keywordsFound = [];
        try {
          if (process.platform === "win32") {
            if (!stdout.trim()) {
              resolve([]);
              return;
            }

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

        const uniqueKeywords = [...new Set(keywordsFound)];
        if (uniqueKeywords.length > 0) {
          console.log("Keywords found:", uniqueKeywords);
        }
        resolve(uniqueKeywords);
      });
    });
  } catch (error) {
    console.error("Error checking for keywords:", error);
    return [];
  }
};

// ------------------- Discord / fetch helper -------------------
async function fetchWrapper(url, opts) {
  // prefer global fetch (Node 18+), otherwise require node-fetch safely
  if (typeof global.fetch === "function") {
    return global.fetch(url, opts);
  }

  try {
    // require may throw if node-fetch is missing or ESM-only; handle default export shape
    const nf = require("node-fetch");
    const f = nf.default || nf;
    if (typeof f !== "function") {
      throw new Error(
        "node-fetch did not export a function (nf/default mismatch)."
      );
    }
    return f(url, opts);
  } catch (err) {
    console.error(
      "fetchWrapper: no fetch available and require('node-fetch') failed:",
      err
    );
    // rethrow for upper layer to handle/log
    throw err;
  }
}

const sendDiscordNotification = async (message) => {
  if (!settings.discordWebhook) {
    console.log("Discord webhook not configured");
    return false;
  }

  try {
    const fetch = require("node-fetch");
    console.log("Sending Discord notification to", settings.discordWebhook);
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

    const text = await response.text().catch(() => "");
    console.log("Discord response:", response.status, text);

    return response.ok;
  } catch (error) {
    console.error("Error sending Discord notification:", error);
    return false;
  }
};

const showTrayNotification = (title, body) => {
  if (tray) {
    try {
      // displayBalloon works on Windows; on mac/linux it may be ignored.
      try {
        tray.displayBalloon({
          title,
          content: body,
          iconType: "warning",
        });
      } catch (e) {
        // fallback to sending an event to renderer to show a notification there
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("tray-notification", { title, body });
        }
      }
    } catch (error) {
      console.error("Error showing tray notification:", error);
    }
  }
};

// ------------------- Monitoring lifecycle -------------------
let isStartingMonitoring = false;

const startProcessMonitoring = () => {
  if (isMonitoring || isStartingMonitoring) return;

  isStartingMonitoring = true;
  isMonitoring = true;
  console.log("Starting process monitoring...");

  // Notify renderer that monitoring started
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("monitoring-started", { isCheckedIn });
  }

  updateTrayMenu(); // Update tray immediately

  // Send Discord notification (only if checked in)
  if (isCheckedIn) {
    sendDiscordNotification(
      `▶️ **Monitoring Started**\nTime: ${new Date().toLocaleString()}`
    ).catch((err) =>
      console.error("Monitoring start notification error:", err)
    );
  }

  // Reset the flag after a brief delay
  setTimeout(() => {
    isStartingMonitoring = false;
  }, 1000);

  // interval checks every 5s
  monitoringInterval = setInterval(async () => {
    try {
      // IMPORTANT: do not alert if user isn't checked in
      if (!isCheckedIn) {
        // skip notifications/detection while not checked in
        return;
      }

      const restrictedApps = await checkForRestrictedApps();
      const restrictedKeywords = await checkForRestrictedKeywords();
      const allViolations = [...restrictedApps, ...restrictedKeywords];

      if (allViolations.length > 0) {
        const now = Date.now();
        const violationsToWarnAbout = [];

        allViolations.forEach((violation) => {
          const lastWarned = lastWarningTime.get(violation) || 0;
          const oneMinuteAgo = now - 60 * 1000;

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
            message += `Apps: ${violationsToWarnAbout
              .filter((v) => restrictedApps.includes(v))
              .join(", ")}, Keywords: ${violationsToWarnAbout
              .filter((v) => restrictedKeywords.includes(v))
              .join(", ")}`;
          } else if (hasApps) {
            message += `Restricted apps: ${violationsToWarnAbout.join(", ")}`;
          } else {
            message += `Restricted content: ${violationsToWarnAbout.join(", ")}`;
          }

          console.log(message);

          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("violation-detected", {
              apps: restrictedApps,
              keywords: restrictedKeywords,
              allViolations: violationsToWarnAbout,
              timestamp: new Date().toISOString(),
            });
          }

          // Send discord notification (best-effort)
          sendDiscordNotification(
            `🚨 **Violation Alert**\n${message}\nTime: ${new Date().toLocaleString()}`
          ).catch((err) =>
            console.error("Error sending violation Discord notification:", err)
          );

          // Show tray notification
          showTrayNotification("Violation Detected!", message);
        }
      }
    } catch (err) {
      console.error("Error in monitoring interval:", err);
    }
  }, 5000);

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

  // Notify renderer/tray that monitoring stopped
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("monitoring-stopped", { reason: "manual" });
  }

  updateTrayMenu();
};

// ------------------- IPC Handlers -------------------
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

ipcMain.handle("stop-monitoring", async () => {
  await sendDiscordNotification(
    `⏹️ **Monitoring Stopped**\nTime: ${new Date().toLocaleString()}`
  );
  stopProcessMonitoring();
  return !isMonitoring;
});

ipcMain.handle("stop-monitoring-with-reason", async (event, reason) => {
  await sendDiscordNotification(
    `⏹️ **Monitoring Stopped**\nReason: ${reason}\nTime: ${new Date().toLocaleString()}`
  );
  stopProcessMonitoring(reason);
  return !isMonitoring;
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

        if (isWorkHours && isCheckedIn) {
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

ipcMain.handle("quit-app-with-reason", async (event, reason) => {
  await sendDiscordNotification(
    `🚪 **App Quit**\nReason: ${reason}\nTime: ${new Date().toLocaleString()}`
  );
  // record to history
  appendHistory({
    type: "quit",
    reason: reason,
    time: new Date().toISOString(),
  });
  app.isQuiting = true;
  app.quit();
  return true;
});

ipcMain.handle("check-for-updates", () => {
  console.log("Manually checking for updates...");
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

ipcMain.handle("get-checked-in-status", () => isCheckedIn);

ipcMain.handle("send-discord-message", async (event, message) => {
  return await sendDiscordNotification(message);
});

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
          "🧪 **Test Notification**\nNotifications are working correctly!",
        username: "Accountability Bot",
      }),
    });

    const body = await response.text().catch(() => "");
    if (response.ok) {
      console.log("Discord test notification sent");
    } else {
      console.error("Discord test failed:", response.status, body);
    }

    return { ok: response.ok, status: response.status, body };
  } catch (error) {
    console.error("Error testing Discord webhook:", error);
    return {
      ok: false,
      error: error && error.message ? error.message : String(error),
    };
  }
});

// Track check-in/out state in main process
ipcMain.handle("set-checked-in", async (event, checkedIn) => {
  // Normalize
  isCheckedIn = !!checkedIn;
  updateTrayMenu();

  // Notify renderer of state change
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("checked-in-status-changed", isCheckedIn);
  }

  const now = new Date();

  // Send basic check-in/out notification first
  if (checkedIn) {
    await sendDiscordNotification(
      `✅ **Checked In**\nTime: ${now.toLocaleString()}`
    );
  } else {
    await sendDiscordNotification(
      `🏁 **Checked Out**\nTime: ${now.toLocaleString()}`
    );
  }

  const entry = {
    type: checkedIn ? "checkin" : "checkout",
    time: now.toISOString(),
  };

  // Persist history (best-effort)
  try {
    await appendHistory(entry);
  } catch (e) {
    console.warn("appendHistory failed:", e);
  }

  // Ensure settings are current (in case renderer saved new checkInTime)
  try {
    await loadSettings(); // loadSettings should update the `settings` object in main
  } catch (e) {
    console.warn("Failed to reload settings before check-in logic:", e);
  }

  // If check-in, check lateness and notify
  if (checkedIn) {
    try {
      const scheduledMins = timeToMinutes(settings.checkInTime || "00:00");
      const currentMins = now.getHours() * 60 + now.getMinutes();

      // If more than 5 minutes late
      if (currentMins - scheduledMins > 5) {
        const msg = `⏰ **Late Check-in**\nChecked in at ${now.toLocaleTimeString()} (scheduled: ${settings.checkInTime})`;

        try {
          // best-effort Discord
          await sendDiscordNotification(msg);
        } catch (e) {
          console.warn("Late checkin notify failed", e);
        }

        showTrayNotification(
          "Late Check-in!",
          `Checked in at ${now.toLocaleTimeString()}`
        );

        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("late-checkin", {
            scheduled: settings.checkInTime,
            actual: now.toISOString(),
          });
        }
      }
    } catch (err) {
      console.error("Error while evaluating late check-in:", err);
    }

    // Auto-start monitoring when checking in (always start, regardless of time)
    if (!isMonitoring) {
      startProcessMonitoring();
    }
  }

  return true;
});

// Handle tray pause monitoring request
ipcMain.on("request-pause-monitoring", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("request-pause-monitoring");
  }
});

// Activity log handlers
let activityLog = [];

ipcMain.handle("clear-activity-log", () => {
  activityLog = [];
  return true;
});

ipcMain.handle("get-activity-log", (event, options = {}) => {
  return activityLog;
});

ipcMain.handle("export-log", async (event, logData) => {
  try {
    const { dialog } = require("electron");
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `accountability-log-${new Date().toISOString().split("T")[0]}.json`,
      filters: [
        { name: "JSON Files", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(
        result.filePath,
        JSON.stringify(logData || activityLog, null, 2)
      );
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error exporting log:", error);
    return false;
  }
});

// Provide a small modal fallback (if renderer doesn't respond to quit request)
function openQuitReasonPrompt() {
  // create a very small modal window to get reason
  const prompt = new BrowserWindow({
    parent: mainWindow,
    modal: true,
    width: 420,
    height: 180,
    resizable: false,
    webPreferences: {
      nodeIntegration: true, // quick fallback
      contextIsolation: false,
    },
  });

  const html = `
    <!doctype html>
    <html>
      <body style="font-family: sans-serif; margin: 16px;">
        <h3>Quit Accountability App</h3>
        <div>Please provide a reason for quitting (optional):</div>
        <textarea id="r" style="width:100%;height:60px;margin-top:8px"></textarea>
        <div style="display:flex;gap:8px;margin-top:10px;justify-content:flex-end">
          <button id="c">Cancel</button>
          <button id="q">Quit</button>
        </div>
        <script>
          const { ipcRenderer } = require('electron');
          document.getElementById('q').addEventListener('click', () => {
            const reason = document.getElementById('r').value || '';
            ipcRenderer.invoke('quit-app-with-reason', reason).catch(()=>{});
          });
          document.getElementById('c').addEventListener('click', () => {
            window.close();
          });
        </script>
      </body>
    </html>
  `;

  prompt.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));
}

// ------------------- App lifecycle -------------------
app.whenReady().then(() => {
  loadSettings();
  createWindow();
  createTray();

  setTimeout(() => {
    if (!process.env.NODE_ENV || process.env.NODE_ENV !== "development") {
      autoUpdater.checkForUpdatesAndNotify();
    }
  }, 5000);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopProcessMonitoring();
  saveSettings();
});

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}
