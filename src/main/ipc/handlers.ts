/**
 * IPC handlers for main process communication
 */

import { ipcMain, dialog } from 'electron';
import type { SettingsManager } from '../modules/settings.js';
import type { DiscordManager } from '../modules/discord.js';
import type { ProcessMonitor } from '../modules/monitoring.js';
import type { HistoryManager } from '../modules/history.js';
import type { TrayManager } from '../modules/tray.js';
import type { WindowManager } from '../modules/window.js';
import type { AppSettings } from '../../types/shared/app.js';

export class IPCHandlers {
  private isCheckedIn = false;
  private autoUpdater: any = null; // Will be injected

  constructor(
    private settingsManager: SettingsManager,
    private discordManager: DiscordManager,
    private processMonitor: ProcessMonitor,
    private historyManager: HistoryManager,
    private trayManager: TrayManager,
    private windowManager: WindowManager
  ) {
    this.setupHandlers();
  }

  /**
   * Set auto-updater reference
   */
  public setAutoUpdater(autoUpdater: any): void {
    this.autoUpdater = autoUpdater;
  }

  /**
   * Setup all IPC handlers
   */
  private setupHandlers(): void {
    this.setupSettingsHandlers();
    this.setupMonitoringHandlers();
    this.setupDiscordHandlers();
    this.setupHistoryHandlers();
    this.setupAppHandlers();
    this.setupWindowHandlers();
  }

  /**
   * Settings-related handlers
   */
  private setupSettingsHandlers(): void {
    ipcMain.handle('get-settings', () => {
      try {
        return this.settingsManager.getSettings();
      } catch (error) {
        console.error('Error getting settings:', error);
        throw error;
      }
    });

    ipcMain.handle('save-settings', async (event, newSettings: Partial<AppSettings>) => {
      try {
        const validation = this.settingsManager.validateSettings(newSettings);
        if (!validation.valid) {
          throw new Error(`Invalid settings: ${validation.errors.join(', ')}`);
        }

        const updatedSettings = this.settingsManager.updateSettings(newSettings);
        
        // Update dependent services
        this.processMonitor.updateSettings(updatedSettings);
        this.discordManager.setWebhookUrl(updatedSettings.discordWebhook);
        
        // Notify renderer of settings change
        this.windowManager.sendToRenderer('settings-changed', newSettings);
        
        return true;
      } catch (error) {
        console.error('Error saving settings:', error);
        throw error;
      }
    });

    ipcMain.handle('reset-settings', () => {
      try {
        const defaultSettings = this.settingsManager.resetSettings();
        this.processMonitor.updateSettings(defaultSettings);
        this.discordManager.setWebhookUrl(defaultSettings.discordWebhook);
        this.windowManager.sendToRenderer('settings-changed', defaultSettings);
        return defaultSettings;
      } catch (error) {
        console.error('Error resetting settings:', error);
        throw error;
      }
    });

    ipcMain.handle('export-settings', async (event, filePath?: string) => {
      try {
        if (!filePath) {
          const result = await dialog.showSaveDialog(this.windowManager.getMainWindow()!, {
            defaultPath: `accountability-settings-${new Date().toISOString().split('T')[0]}.json`,
            filters: [
              { name: 'JSON Files', extensions: ['json'] },
              { name: 'All Files', extensions: ['*'] },
            ],
          });

          if (!result || typeof result === 'string' || !result) {
            return false;
          }

          filePath = result;
        }

        return await this.settingsManager.exportSettings(filePath!);
      } catch (error) {
        console.error('Error exporting settings:', error);
        return false;
      }
    });

    ipcMain.handle('import-settings', async (event, filePath?: string) => {
      try {
        if (!filePath) {
          const result = await dialog.showOpenDialog(this.windowManager.getMainWindow()!, {
            filters: [
              { name: 'JSON Files', extensions: ['json'] },
              { name: 'All Files', extensions: ['*'] },
            ],
            properties: ['openFile'],
          });

          if (!result || !Array.isArray(result) || result.length === 0) {
            return { success: false, error: 'No file selected' };
          }

          filePath = result[0];
        }

        const result = await this.settingsManager.importSettings(filePath!);
        
        if (result.success) {
          const newSettings = this.settingsManager.getSettings();
          this.processMonitor.updateSettings(newSettings);
          this.discordManager.setWebhookUrl(newSettings.discordWebhook);
          this.windowManager.sendToRenderer('settings-changed', newSettings);
        }

        return result;
      } catch (error) {
        console.error('Error importing settings:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });
  }

  /**
   * Monitoring-related handlers
   */
  private setupMonitoringHandlers(): void {
    ipcMain.handle('start-monitoring', () => {
      try {
        const success = this.processMonitor.start();
        if (success) {
          this.trayManager.updateState({ isMonitoring: true });
          this.windowManager.sendToRenderer('monitoring-status-changed', { isActive: true });
        }
        return success;
      } catch (error) {
        console.error('Error starting monitoring:', error);
        throw error;
      }
    });

    ipcMain.handle('stop-monitoring', async () => {
      try {
        await this.discordManager.sendMonitoringStopped('Manual');
        const success = this.processMonitor.stop('manual');
        if (success) {
          this.trayManager.updateState({ isMonitoring: false });
          this.windowManager.sendToRenderer('monitoring-status-changed', { isActive: false });
        }
        return success;
      } catch (error) {
        console.error('Error stopping monitoring:', error);
        throw error;
      }
    });

    ipcMain.handle('stop-monitoring-with-reason', async (event, reason: string) => {
      try {
        await this.discordManager.sendMonitoringStopped(reason);
        const success = this.processMonitor.stop(reason);
        if (success) {
          this.trayManager.updateState({ isMonitoring: false });
          this.windowManager.sendToRenderer('monitoring-status-changed', { isActive: false });
        }
        return success;
      } catch (error) {
        console.error('Error stopping monitoring with reason:', error);
        throw error;
      }
    });

    ipcMain.handle('pause-monitoring-with-reason', async (event, reason: string, minutes: number = 60) => {
      try {
        await this.discordManager.sendMonitoringPaused(reason, minutes);
        const success = this.processMonitor.stop(`paused: ${reason}`);
        
        if (success) {
          this.trayManager.updateState({ isMonitoring: false });
          this.windowManager.sendToRenderer('monitoring-status-changed', { isActive: false });

          // Auto-resume after specified time
          setTimeout(() => {
            if (this.isCheckedIn && this.isWithinWorkHours()) {
              this.processMonitor.start();
              this.discordManager.sendMonitoringStarted();
              this.trayManager.updateState({ isMonitoring: true });
              this.windowManager.sendToRenderer('monitoring-status-changed', { isActive: true });
            }
          }, minutes * 60 * 1000);
        }

        return success;
      } catch (error) {
        console.error('Error pausing monitoring:', error);
        throw error;
      }
    });

    ipcMain.handle('get-monitoring-status', () => {
      try {
        return this.processMonitor.isActive();
      } catch (error) {
        console.error('Error getting monitoring status:', error);
        return false;
      }
    });

    ipcMain.handle('get-monitoring-statistics', () => {
      try {
        return this.processMonitor.getStatistics();
      } catch (error) {
        console.error('Error getting monitoring statistics:', error);
        return { isActive: false, violations: 0, uptime: 0 };
      }
    });
  }

  /**
   * Discord-related handlers
   */
  private setupDiscordHandlers(): void {
    ipcMain.handle('test-discord-webhook', async (event, webhookUrl: string) => {
      try {
        return await this.discordManager.testWebhook(webhookUrl);
      } catch (error) {
        console.error('Error testing Discord webhook:', error);
        return {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });

    ipcMain.handle('send-discord-message', async (event, message: string) => {
      try {
        return await this.discordManager.sendMessage(message);
      } catch (error) {
        console.error('Error sending Discord message:', error);
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
      }
    });
  }

  /**
   * Check-in/Check-out handlers
   */
  private setupAppHandlers(): void {
    ipcMain.handle('set-checked-in', async (event, checkedIn: boolean) => {
      try {
        this.isCheckedIn = !!checkedIn;
        
        // Update tray state
        this.trayManager.updateState({ isCheckedIn: this.isCheckedIn });
        
        // Notify renderer
        this.windowManager.sendToRenderer('checked-in-status-changed', this.isCheckedIn);

        const now = new Date();
        
        if (this.isCheckedIn) {
          // Check if late
          const settings = this.settingsManager.getSettings();
          const scheduledMins = this.timeToMinutes(settings.checkInTime);
          const currentMins = now.getHours() * 60 + now.getMinutes();
          const isLate = currentMins - scheduledMins > 5;
          
          // Send Discord notification
          await this.discordManager.sendCheckInNotification(isLate, settings.checkInTime);
          
          // Log check-in
          this.historyManager.addHistoryEntry({
            type: 'checkin',
            details: { isLate, scheduledTime: settings.checkInTime },
          });

          // Send late notification if needed
          if (isLate) {
            this.windowManager.sendToRenderer('late-checkin', {
              scheduled: settings.checkInTime,
              actual: now.toISOString(),
            });
            
            this.trayManager.showNotification(
              'Late Check-in!',
              `Checked in at ${now.toLocaleTimeString()}`
            );
          }

          // Auto-start monitoring when checking in
          if (!this.processMonitor.isActive()) {
            this.processMonitor.start();
            this.trayManager.updateState({ isMonitoring: true });
          }
        } else {
          // Check-out
          await this.discordManager.sendCheckOutNotification();
          
          // Log check-out
          this.historyManager.addHistoryEntry({
            type: 'checkout',
          });

          // Stop monitoring when checking out
          if (this.processMonitor.isActive()) {
            this.processMonitor.stop('checkout');
            this.trayManager.updateState({ isMonitoring: false });
          }
        }

        return true;
      } catch (error) {
        console.error('Error setting checked-in status:', error);
        throw error;
      }
    });

    ipcMain.handle('get-checked-in-status', () => {
      return this.isCheckedIn;
    });

    ipcMain.handle('quit-app-with-reason', async (event, reason: string) => {
      try {
        await this.discordManager.sendAppQuitNotification(reason);
        this.historyManager.addHistoryEntry({
          type: 'quit',
          reason,
        });

        // Set global quit flag
        (global as any).__APP_QUITTING__ = true;

        // Import app after setting flag to avoid circular dependency
        const { app } = await import('electron');
        app.quit();
        
        return true;
      } catch (error) {
        console.error('Error quitting app:', error);
        throw error;
      }
    });

    // Auto-updater handlers
    ipcMain.handle('check-for-updates', () => {
      if (this.autoUpdater) {
        this.autoUpdater.checkForUpdatesAndNotify();
        return true;
      }
      return false;
    });

    ipcMain.handle('install-update', () => {
      if (this.autoUpdater) {
        this.autoUpdater.quitAndInstall();
        return true;
      }
      return false;
    });

    ipcMain.handle('get-app-version', async () => {
      const { app } = await import('electron');
      return app.getVersion();
    });
  }

  /**
   * History and logging handlers
   */
  private setupHistoryHandlers(): void {
    ipcMain.handle('get-activity-log', (event, options = {}) => {
      try {
        return this.historyManager.getActivityLog(options);
      } catch (error) {
        console.error('Error getting activity log:', error);
        return [];
      }
    });

    ipcMain.handle('clear-activity-log', () => {
      try {
        return this.historyManager.clearAll();
      } catch (error) {
        console.error('Error clearing activity log:', error);
        return false;
      }
    });

    ipcMain.handle('export-log', async (event, logData?: any, filePath?: string) => {
      try {
        if (!filePath) {
          const result = await dialog.showSaveDialog(this.windowManager.getMainWindow()!, {
            defaultPath: `accountability-log-${new Date().toISOString().split('T')[0]}.json`,
            filters: [
              { name: 'JSON Files', extensions: ['json'] },
              { name: 'All Files', extensions: ['*'] },
            ],
          });

          if (!result || typeof result !== 'string') {
            return false;
          }

          filePath = result;
        }

        return await this.historyManager.exportToFile(filePath!);
      } catch (error) {
        console.error('Error exporting log:', error);
        return false;
      }
    });

    ipcMain.handle('get-activity-statistics', () => {
      try {
        return this.historyManager.getStatistics();
      } catch (error) {
        console.error('Error getting activity statistics:', error);
        return {
          totalHistory: 0,
          totalViolations: 0,
          violationsByType: {},
          violationsBySeverity: {},
        };
      }
    });

    ipcMain.handle('create-backup', () => {
      try {
        return this.historyManager.createBackup();
      } catch (error) {
        console.error('Error creating backup:', error);
        return null;
      }
    });
  }

  /**
   * Window management handlers
   */
  private setupWindowHandlers(): void {
    ipcMain.handle('show-window', () => {
      this.windowManager.showMainWindow();
      return true;
    });

    ipcMain.handle('hide-window', () => {
      this.windowManager.hideMainWindow();
      return true;
    });

    ipcMain.handle('minimize-window', () => {
      this.windowManager.minimizeWindow();
      return true;
    });

    ipcMain.handle('maximize-window', () => {
      this.windowManager.maximizeWindow();
      return true;
    });

    ipcMain.handle('get-window-bounds', () => {
      return this.windowManager.getWindowBounds();
    });

    ipcMain.handle('set-window-bounds', (event, bounds: Partial<Electron.Rectangle>) => {
      this.windowManager.setWindowBounds(bounds);
      return true;
    });
  }

  /**
   * Helper method to convert time string to minutes
   */
  private timeToMinutes(timeStr: string): number {
    const [hours = 0, minutes = 0] = (timeStr || '0:0').split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Check if current time is within work hours
   */
  private isWithinWorkHours(): boolean {
    const settings = this.settingsManager.getSettings();
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const checkInMins = this.timeToMinutes(settings.checkInTime);
    const checkOutMins = this.timeToMinutes(settings.checkOutTime);
    
    return currentMins >= checkInMins && currentMins <= checkOutMins;
  }

  /**
   * Get current state
   */
  public getState(): { isCheckedIn: boolean; isMonitoring: boolean } {
    return {
      isCheckedIn: this.isCheckedIn,
      isMonitoring: this.processMonitor.isActive(),
    };
  }

  /**
   * Handle violation events from process monitor
   */
  public handleViolation(violation: any): void {
    // Add to history
    this.historyManager.addViolation(violation);
    
    // Send to renderer
    this.windowManager.sendToRenderer('violation-detected', violation);
    
    // Send Discord notification
    this.discordManager.sendViolationAlert([violation.trigger], violation.type);
    
    // Show tray notification
    this.trayManager.showNotification(
      'Violation Detected!',
      `${violation.type}: ${violation.trigger}`
    );
  }
}