// renderer/app.js - Simplified UI management
(() => {
  let checkInTimestamp = null;
  let sessionDurationInterval = null;
  let isCheckedIn = false;
  let isMonitoring = false;

  // Update session duration display
  function updateSessionDuration() {
    const el = document.getElementById("sessionDuration");
    if (!el) return;
    if (!isCheckedIn || !checkInTimestamp) {
      el.textContent = "";
      return;
    }
    const now = new Date();
    let diff = Math.floor((now - checkInTimestamp) / 1000);
    const hours = Math.floor(diff / 3600);
    diff %= 3600;
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    el.textContent = `Session Duration: ${hours}h ${minutes}m ${seconds}s`;
  }

  // Update time display
  function updateTime() {
    const timeElement = document.getElementById("currentTime");
    if (timeElement) {
      timeElement.textContent = new Date().toLocaleTimeString();
    }
  }

  // Update UI based on states
  function updateUI() {
    const statusIndicator = document.getElementById("statusIndicator");
    const monitoringIndicator = document.getElementById("monitoringIndicator");

    if (statusIndicator) {
      if (isCheckedIn) {
        statusIndicator.textContent = "Checked In";
        statusIndicator.className = "status-indicator status-checked-in";
      } else {
        statusIndicator.textContent = "Not Checked In";
        statusIndicator.className = "status-indicator status-checked-out";
      }
    }

    if (monitoringIndicator) {
      if (isMonitoring && isCheckedIn) {
        monitoringIndicator.style.display = "inline-block";
        monitoringIndicator.textContent = "Monitoring Active";
        monitoringIndicator.className = "status-indicator status-monitoring";
      } else if (isCheckedIn) {
        monitoringIndicator.style.display = "inline-block";
        monitoringIndicator.textContent = "Monitoring Paused";
        monitoringIndicator.className = "status-indicator status-paused";
      } else {
        monitoringIndicator.style.display = "none";
      }
    }

    // Update monitoring control buttons
    const resumeBtn = document.getElementById("resumeMonitoringBtn");
    const pauseBtn = document.getElementById("pauseMonitoringBtn");
    const stopBtn = document.getElementById("stopMonitoringBtn");

    if (resumeBtn) resumeBtn.disabled = !isCheckedIn || isMonitoring;
    if (pauseBtn) pauseBtn.disabled = !isCheckedIn || !isMonitoring;
    if (stopBtn) stopBtn.disabled = !isCheckedIn || !isMonitoring;
  }

  // Load and display settings
  async function loadSettings() {
    if (!window.electronAPI?.getSettings) return;

    try {
      const settings = await window.electronAPI.getSettings();

      // Update form fields
      const webhookInput = document.getElementById("discordWebhook");
      const checkInInput = document.getElementById("checkInTime");
      const checkOutInput = document.getElementById("checkOutTime");

      if (webhookInput) webhookInput.value = settings.discordWebhook || "";
      if (checkInInput) checkInInput.value = settings.checkInTime || "08:00";
      if (checkOutInput) checkOutInput.value = settings.checkOutTime || "16:00";

      // Display restricted apps
      const restrictedAppsContainer = document.getElementById("restrictedApps");
      if (restrictedAppsContainer && settings.restrictedApps) {
        restrictedAppsContainer.innerHTML = settings.restrictedApps
          .map((app) => `<span class="tag">${app}</span>`)
          .join("");
      }

      // Display keywords
      const keywordsContainer = document.getElementById("keywords");
      if (keywordsContainer && settings.monitoringKeywords) {
        keywordsContainer.innerHTML = settings.monitoringKeywords
          .map((keyword) => `<span class="tag">${keyword}</span>`)
          .join("");
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }

  // Check monitoring status
  async function checkMonitoringStatus() {
    if (!window.electronAPI?.getMonitoringStatus) return;

    try {
      isMonitoring = await window.electronAPI.getMonitoringStatus();
      updateUI();
    } catch (error) {
      console.error("Failed to get monitoring status:", error);
    }
  }

  // Check checked-in status
  async function checkCheckedInStatus() {
    if (!window.electronAPI?.getCheckedInStatus) return;

    try {
      isCheckedIn = await window.electronAPI.getCheckedInStatus();
      if (isCheckedIn) {
        checkInTimestamp = new Date(); // Best effort, will be updated with real timestamp from main
      }
      updateUI();
    } catch (error) {
      console.error("Failed to get checked-in status:", error);
    }
  }

  // Show version info
  async function showVersionInfo() {
    if (!window.electronAPI?.getAppVersion) return;

    try {
      const version = await window.electronAPI.getAppVersion();
      const versionElement = document.getElementById("versionInfo");
      if (versionElement) {
        const lastChecked = localStorage.getItem("lastUpdateCheck");
        const lastCheckedText = lastChecked
          ? `Last checked: ${new Date(lastChecked).toLocaleDateString()}`
          : "Never checked for updates";
        versionElement.innerHTML = `v${version} | ${lastCheckedText}`;
      }
    } catch (error) {
      console.error("Failed to get version:", error);
    }
  }

  // Event listeners for IPC events from main process
  function wirePreloadEvents() {
    if (!window.electronAPI) return;

    // Listen for check-in/out triggers from tray
    if (window.electronAPI.onTriggerCheckin) {
      window.electronAPI.onTriggerCheckin(() => {
        isCheckedIn = true;
        checkInTimestamp = new Date();
        if (sessionDurationInterval) clearInterval(sessionDurationInterval);
        sessionDurationInterval = setInterval(updateSessionDuration, 1000);
        updateUI();
      });
    }

    if (window.electronAPI.onTriggerCheckout) {
      window.electronAPI.onTriggerCheckout(() => {
        isCheckedIn = false;
        isMonitoring = false;
        if (sessionDurationInterval) {
          clearInterval(sessionDurationInterval);
          sessionDurationInterval = null;
        }
        updateUI();
      });
    }

    // Listen for monitoring status changes
    if (window.electronAPI.onMonitoringStarted) {
      window.electronAPI.onMonitoringStarted(() => {
        isMonitoring = true;
        updateUI();
      });
    }

    if (window.electronAPI.onMonitoringStopped) {
      window.electronAPI.onMonitoringStopped(() => {
        isMonitoring = false;
        updateUI();
      });
    }

    // Handle checked-in status changes
    if (window.electronAPI.onCheckedInStatusChanged) {
      window.electronAPI.onCheckedInStatusChanged((checkedIn) => {
        isCheckedIn = checkedIn;
        if (checkedIn) {
          checkInTimestamp = new Date();
        } else {
          checkInTimestamp = null;
        }
        updateUI();
      });
    }

    // Handle settings changes
    if (window.electronAPI.onSettingsChanged) {
      window.electronAPI.onSettingsChanged(() => {
        loadSettings();
      });
    }

    // Handle quit requests from tray
    if (window.electronAPI.onRequestQuitReason) {
      window.electronAPI.onRequestQuitReason(async () => {
        let reason = "User quit";
        try {
          // Try to use prompt if available, otherwise use default
          const userReason = window.prompt(
            "Please provide a reason for quitting the accountability app:"
          );
          if (userReason) reason = userReason;
        } catch (e) {
          console.warn("prompt() not available, using default reason");
        }

        if (window.electronAPI.quitAppWithReason) {
          await window.electronAPI.quitAppWithReason(reason);
        }
      });
    }
  }

  // Initialize when DOM is loaded
  document.addEventListener("DOMContentLoaded", async () => {
    // Wire preload events
    wirePreloadEvents();

    // Initial load
    await loadSettings();
    await checkMonitoringStatus();
    await checkCheckedInStatus();
    await showVersionInfo();
    updateUI();

    // Update time every second
    setInterval(updateTime, 1000);
    updateTime();

    // Check monitoring status every 10 seconds
    setInterval(checkMonitoringStatus, 10000);
    setInterval(checkCheckedInStatus, 10000);

    // Auto-save settings when form fields change
    const webhookInput = document.getElementById("discordWebhook");
    const checkInInput = document.getElementById("checkInTime");
    const checkOutInput = document.getElementById("checkOutTime");

    if (webhookInput) {
      webhookInput.addEventListener("blur", () => {
        if (window.api?.saveSettings) window.api.saveSettings();
      });
    }

    if (checkInInput) {
      checkInInput.addEventListener("change", () => {
        if (window.api?.saveSettings) window.api.saveSettings();
      });
    }

    if (checkOutInput) {
      checkOutInput.addEventListener("change", () => {
        if (window.api?.saveSettings) window.api.saveSettings();
      });
    }
  });
})();
