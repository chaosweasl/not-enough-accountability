/**
 * System tray management module
 */

import { Tray, Menu, nativeImage, app } from 'electron';
import * as path from 'node:path';
import * as fs from 'node:fs';
import type { WindowManager } from './window.js';

export interface TrayState {
  isCheckedIn: boolean;
  isMonitoring: boolean;
}

export class TrayManager {
  private tray: Tray | null = null;
  private state: TrayState = {
    isCheckedIn: false,
    isMonitoring: false,
  };

  constructor(private windowManager: WindowManager) {}

  /**
   * Create and initialize the system tray
   */
  public createTray(): boolean {
    try {
      const trayIcon = this.getTrayIcon();
      if (!trayIcon) {
        console.warn('Could not create tray icon');
        return false;
      }

      this.tray = new Tray(trayIcon);
      this.setupTrayEvents();
      this.updateTrayMenu();
      this.tray.setToolTip('Accountability Tracker');

      console.log('System tray created successfully');
      return true;
    } catch (error) {
      console.error('Error creating system tray:', error);
      return false;
    }
  }

  /**
   * Update tray state
   */
  public updateState(newState: Partial<TrayState>): void {
    this.state = { ...this.state, ...newState };
    this.updateTrayMenu();
    this.updateTrayTooltip();
  }

  /**
   * Show tray notification
   */
  public showNotification(title: string, content: string): void {
    if (!this.tray) return;

    try {
      // Try to use balloon notification (Windows)
      if (process.platform === 'win32') {
        this.tray.displayBalloon({
          title,
          content,
          iconType: 'warning',
        });
      } else {
        // Fallback: send notification to renderer
        this.windowManager.sendToRenderer('tray-notification', { title, content });
      }
    } catch (error) {
      console.error('Error showing tray notification:', error);
      // Fallback to renderer notification
      this.windowManager.sendToRenderer('tray-notification', { title, content });
    }
  }

  /**
   * Destroy the tray
   */
  public destroyTray(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }

  /**
   * Check if tray exists
   */
  public hasTray(): boolean {
    return this.tray !== null && !this.tray.isDestroyed();
  }

  /**
   * Get tray icon
   */
  private getTrayIcon(): Electron.NativeImage | null {
    try {
      // Look for platform-specific icons first
      const iconExtensions = process.platform === 'win32' ? ['.ico', '.png'] : ['.png', '.icns'];
      const iconBasePath = path.join(__dirname, '../assets', 'electron');

      for (const ext of iconExtensions) {
        const iconPath = iconBasePath + ext;
        if (fs.existsSync(iconPath)) {
          const icon = nativeImage.createFromPath(iconPath);
          // Resize icon for tray (16x16 or 24x24 depending on platform)
          const size = process.platform === 'darwin' ? 16 : 16;
          return icon.resize({ width: size, height: size });
        }
      }

      // Fallback to basic icon
      const fallbackPath = path.join(__dirname, '../assets', 'electron.png');
      if (fs.existsSync(fallbackPath)) {
        const icon = nativeImage.createFromPath(fallbackPath);
        return icon.resize({ width: 16, height: 16 });
      }

      // Create empty icon as last resort
      return nativeImage.createEmpty();
    } catch (error) {
      console.error('Error loading tray icon:', error);
      return nativeImage.createEmpty();
    }
  }

  /**
   * Setup tray event handlers
   */
  private setupTrayEvents(): void {
    if (!this.tray) return;

    // Double-click to show main window
    this.tray.on('double-click', () => {
      this.windowManager.showMainWindow();
    });

    // Single click on Windows to show window
    if (process.platform === 'win32') {
      this.tray.on('click', () => {
        this.windowManager.showMainWindow();
      });
    }

    // Handle tray destruction (removed - not supported in current Electron)
    // this.tray.on('destroyed', () => {
    //   console.log('Tray was destroyed');
    // });
  }

  /**
   * Update tray context menu
   */
  private updateTrayMenu(): void {
    if (!this.tray) return;

    const { isCheckedIn, isMonitoring } = this.state;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show App',
        type: 'normal',
        click: () => {
          this.windowManager.showMainWindow();
        },
      },
      { type: 'separator' },
      {
        label: isCheckedIn ? '✅ Checked In' : 'Check In',
        type: 'normal',
        enabled: !isCheckedIn,
        click: () => {
          this.windowManager.sendToRenderer('trigger-checkin');
        },
      },
      {
        label: 'Check Out',
        type: 'normal',
        enabled: isCheckedIn,
        click: () => {
          this.windowManager.sendToRenderer('trigger-checkout');
        },
      },
      { type: 'separator' },
      {
        label: this.getMonitoringMenuLabel(),
        type: 'normal',
        enabled: isCheckedIn,
        click: () => {
          if (isMonitoring) {
            this.windowManager.sendToRenderer('request-pause-monitoring');
          } else {
            this.windowManager.sendToRenderer('request-resume-monitoring');
          }
        },
      },
      {
        label: `Status: ${this.getStatusText()}`,
        type: 'normal',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Settings',
        type: 'normal',
        click: () => {
          this.windowManager.showMainWindow();
          this.windowManager.sendToRenderer('navigate-to-settings');
        },
      },
      {
        label: 'Activity Log',
        type: 'normal',
        click: () => {
          this.windowManager.showMainWindow();
          this.windowManager.sendToRenderer('navigate-to-activity-log');
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        type: 'normal',
        click: () => {
          this.windowManager.sendToRenderer('request-quit-reason');
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  /**
   * Get monitoring menu label
   */
  private getMonitoringMenuLabel(): string {
    const { isCheckedIn, isMonitoring } = this.state;

    if (!isCheckedIn) {
      return 'Monitoring (Not Checked In)';
    }

    return isMonitoring ? '⏸️ Pause Monitoring' : '▶️ Resume Monitoring';
  }

  /**
   * Get current status text
   */
  private getStatusText(): string {
    const { isCheckedIn, isMonitoring } = this.state;

    if (!isCheckedIn) {
      return 'Not Checked In';
    }

    return isMonitoring ? 'Monitoring' : 'Paused';
  }

  /**
   * Update tray tooltip
   */
  private updateTrayTooltip(): void {
    if (!this.tray) return;

    const statusText = this.getStatusText();
    const tooltip = `Accountability Tracker - ${statusText}`;
    this.tray.setToolTip(tooltip);
  }

  /**
   * Flash tray icon for attention (Windows/Linux)
   */
  public flashTray(count: number = 3): void {
    if (!this.tray || process.platform === 'darwin') return;

    let flashCount = 0;
    const originalIcon = this.getTrayIcon();
    const emptyIcon = nativeImage.createEmpty();

    const flashInterval = setInterval(() => {
      if (flashCount >= count * 2) {
        clearInterval(flashInterval);
        if (originalIcon && this.tray) {
          this.tray.setImage(originalIcon);
        }
        return;
      }

      if (this.tray) {
        const icon = flashCount % 2 === 0 ? emptyIcon : originalIcon;
        if (icon) {
          this.tray.setImage(icon);
        }
      }
      flashCount++;
    }, 250);
  }

  /**
   * Update tray icon based on state
   */
  public updateTrayIcon(): void {
    if (!this.tray) return;

    // You could have different icons for different states
    const icon = this.getTrayIcon();
    if (icon) {
      this.tray.setImage(icon);
    }
  }

  /**
   * Get current tray position (for custom menus)
   */
  public getTrayBounds(): Electron.Rectangle | undefined {
    if (this.tray) {
      return this.tray.getBounds();
    }
    return undefined;
  }
}