/**
 * Main process entry point - Secure Electron Application
 */

import { app, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import squirrelStartup from 'electron-squirrel-startup';

// Import our modular components
import { SettingsManager } from './modules/settings.js';
import { WindowManager } from './modules/window.js';
import { TrayManager } from './modules/tray.js';
import { ProcessMonitor } from './modules/monitoring.js';
import { DiscordManager } from './modules/discord.js';
import { HistoryManager } from './modules/history.js';
import { IPCHandlers } from './ipc/handlers.js';

/**
 * Main Application Class
 */
class AccountabilityApp {
  private settingsManager!: SettingsManager;
  private windowManager!: WindowManager;
  private trayManager!: TrayManager;
  private processMonitor!: ProcessMonitor;
  private discordManager!: DiscordManager;
  private historyManager!: HistoryManager;
  private ipcHandlers!: IPCHandlers;

  private isReady = false;
  private gotLock = false;

  constructor() {
    this.setupAppSecurity();
    this.setupSingleInstance();
    this.setupAppEvents();
    this.setupAutoUpdater();
  }

  /**
   * Initialize the application
   */
  public async initialize(): Promise<void> {
    if (squirrelStartup) {
      app.quit();
      return;
    }

    try {
      // Wait for app to be ready
      await app.whenReady();
      
      this.isReady = true;
      console.log('App is ready, initializing components...');

      // Initialize all components in dependency order
      this.initializeComponents();
      
      // Create window and tray
      this.windowManager.createMainWindow();
      this.trayManager.createTray();

      // Set up window security
      this.windowManager.setCSP();

      console.log('Application initialized successfully');

      // Check for updates after a delay (not in development)
      if (process.env.NODE_ENV !== 'development') {
        setTimeout(() => {
          autoUpdater.checkForUpdatesAndNotify();
        }, 5000);
      }

    } catch (error) {
      console.error('Failed to initialize application:', error);
      app.quit();
    }
  }

  /**
   * Initialize all application components
   */
  private initializeComponents(): void {
    try {
      // Initialize managers
      this.settingsManager = new SettingsManager();
      this.windowManager = new WindowManager();
      this.trayManager = new TrayManager(this.windowManager);
      this.historyManager = new HistoryManager();
      this.discordManager = new DiscordManager(this.settingsManager.getSetting('discordWebhook'));

      // Initialize process monitor with callbacks
      this.processMonitor = new ProcessMonitor(
        this.settingsManager.getSettings(),
        {
          onViolationDetected: (violation) => {
            this.ipcHandlers.handleViolation(violation);
          },
          onMonitoringStarted: () => {
            this.discordManager.sendMonitoringStarted();
            this.trayManager.updateState({ isMonitoring: true });
          },
          onMonitoringStopped: (reason) => {
            this.trayManager.updateState({ isMonitoring: false });
          },
          onError: (error) => {
            console.error('Monitoring error:', error);
            this.windowManager.sendToRenderer('monitoring-error', error.message);
          },
        }
      );

      // Initialize IPC handlers
      this.ipcHandlers = new IPCHandlers(
        this.settingsManager,
        this.discordManager,
        this.processMonitor,
        this.historyManager,
        this.trayManager,
        this.windowManager
      );

      // Set auto-updater reference
      this.ipcHandlers.setAutoUpdater(autoUpdater);

      console.log('All components initialized successfully');
    } catch (error) {
      console.error('Error initializing components:', error);
      throw error;
    }
  }

  /**
   * Setup application security
   */
  private setupAppSecurity(): void {
    // Disable web security only in development for Vite
    if (process.env.NODE_ENV === 'development') {
      app.commandLine.appendSwitch('--disable-web-security');
    }

    // Security: Prevent new window creation
    app.on('web-contents-created', (event, contents) => {
      contents.setWindowOpenHandler(() => {
        return { action: 'deny' };
      });

      contents.on('will-navigate', (navigationEvent, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        
        // Allow navigation to localhost in development
        if (process.env.NODE_ENV === 'development' && parsedUrl.origin === 'http://localhost:5173') {
          return;
        }
        
        // Allow file protocol for local app files
        if (parsedUrl.protocol === 'file:') {
          return;
        }
        
        // Block all other navigation
        navigationEvent.preventDefault();
        console.warn('Blocked navigation to:', navigationUrl);
      });
    });

    // Set app user model ID for Windows
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.accountability.app');
    }
  }

  /**
   * Setup single instance lock
   */
  private setupSingleInstance(): void {
    this.gotLock = app.requestSingleInstanceLock();

    if (!this.gotLock) {
      console.log('Another instance is already running. Quitting...');
      app.quit();
      return;
    }

    app.on('second-instance', () => {
      // Someone tried to run a second instance, focus our window instead
      if (this.windowManager?.hasMainWindow()) {
        this.windowManager.showMainWindow();
      }
    });
  }

  /**
   * Setup application-level event handlers
   */
  private setupAppEvents(): void {
    app.on('window-all-closed', () => {
      // On macOS, keep app running even when all windows are closed
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      // On macOS, re-create window when dock icon is clicked
      if (BrowserWindow.getAllWindows().length === 0 && this.isReady) {
        this.windowManager.createMainWindow();
      }
    });

    app.on('before-quit', () => {
      // Set global quit flag
      (global as any).__APP_QUITTING__ = true;

      // Cleanup
      if (this.processMonitor) {
        this.processMonitor.stop('app-quit');
      }
      
      if (this.settingsManager) {
        this.settingsManager.saveSettings();
      }

      if (this.trayManager) {
        this.trayManager.destroyTray();
      }
    });

    app.on('will-quit', () => {
      // Final cleanup
      console.log('Application is quitting...');
    });

    // Handle app crashes gracefully
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      // Log error but don't quit in production
      if (process.env.NODE_ENV === 'development') {
        app.quit();
      }
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Log error but don't quit in production
      if (process.env.NODE_ENV === 'development') {
        app.quit();
      }
    });
  }

  /**
   * Setup auto-updater
   */
  private setupAutoUpdater(): void {
    // Configure auto-updater
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'chaosweasl',
      repo: 'not-enough-accountability',
    });

    // Auto-updater events
    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info);
      if (this.windowManager?.hasMainWindow()) {
        this.windowManager.sendToRenderer('update-available', info);
      }
    });

    autoUpdater.on('update-not-available', (info) => {
      console.log('Update not available:', info);
      if (this.windowManager?.hasMainWindow()) {
        this.windowManager.sendToRenderer('update-not-available', info);
      }
    });

    autoUpdater.on('error', (err) => {
      console.error('Auto-updater error:', err);
      if (this.windowManager?.hasMainWindow()) {
        this.windowManager.sendToRenderer('update-error', err.message);
      }
    });

    autoUpdater.on('download-progress', (progressObj) => {
      console.log(`Download progress: ${progressObj.percent}%`);
      if (this.windowManager?.hasMainWindow()) {
        this.windowManager.sendToRenderer('download-progress', progressObj);
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded:', info);
      if (this.windowManager?.hasMainWindow()) {
        this.windowManager.sendToRenderer('update-downloaded', info);
      }
    });
  }

  /**
   * Get application instance (for debugging)
   */
  public getState(): {
    isReady: boolean;
    hasWindow: boolean;
    hasTray: boolean;
    isMonitoring: boolean;
    checkedInStatus: { isCheckedIn: boolean; isMonitoring: boolean } | null;
  } {
    return {
      isReady: this.isReady,
      hasWindow: this.windowManager?.hasMainWindow() || false,
      hasTray: this.trayManager?.hasTray() || false,
      isMonitoring: this.processMonitor?.isActive() || false,
      checkedInStatus: this.ipcHandlers?.getState() || null,
    };
  }
}

// Create and initialize the application
const app_instance = new AccountabilityApp();

// Start the application
app_instance.initialize().catch((error) => {
  console.error('Failed to start application:', error);
  app.quit();
});

// Export for debugging (development only)
if (process.env.NODE_ENV === 'development') {
  (global as any).__APP_INSTANCE__ = app_instance;
}