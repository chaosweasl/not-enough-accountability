/**
 * Window management module for the main process
 */

import { BrowserWindow, nativeImage } from 'electron';
import * as path from 'node:path';
import * as fs from 'node:fs';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private readonly isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Create the main application window
   */
  public createMainWindow(): BrowserWindow {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.focus();
      return this.mainWindow;
    }

    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 900,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        preload: path.join(__dirname, '../../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true, // Enable web security
        allowRunningInsecureContent: false, // Disable insecure content
        experimentalFeatures: false,
        spellcheck: false,
      },
      show: false, // Don't show until ready
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      icon: this.getAppIcon(),
    });

    this.setupWindowEvents();
    this.loadWindowContent();

    return this.mainWindow;
  }

  /**
   * Get the main window instance
   */
  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  /**
   * Show the main window
   */
  public showMainWindow(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  /**
   * Hide the main window
   */
  public hideMainWindow(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.hide();
    }
  }

  /**
   * Close the main window
   */
  public closeMainWindow(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.close();
    }
  }

  /**
   * Check if main window exists and is not destroyed
   */
  public hasMainWindow(): boolean {
    return this.mainWindow !== null && !this.mainWindow.isDestroyed();
  }

  /**
   * Send message to renderer process
   */
  public sendToRenderer(channel: string, ...args: unknown[]): void {
    if (this.hasMainWindow()) {
      this.mainWindow!.webContents.send(channel, ...args);
    }
  }

  /**
   * Setup window event handlers
   */
  private setupWindowEvents(): void {
    if (!this.mainWindow) return;

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.show();
      }
    });

    // Handle window close
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting()) {
        event.preventDefault();
        this.hideMainWindow();
        // Could emit an event here for tray notification
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Handle focus events
    this.mainWindow.on('focus', () => {
      if (this.hasMainWindow()) {
        this.sendToRenderer('window-focused');
      }
    });

    this.mainWindow.on('blur', () => {
      if (this.hasMainWindow()) {
        this.sendToRenderer('window-blurred');
      }
    });

    // Enable dev tools in development
    if (this.isDevelopment) {
      this.mainWindow.webContents.openDevTools();
    }

    // Handle navigation (security)
    this.mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      
      // Only allow navigation to localhost in development or file:// protocols
      if (this.isDevelopment && parsedUrl.origin === 'http://localhost:5173') {
        return; // Allow Vite dev server
      }
      
      if (parsedUrl.protocol === 'file:') {
        return; // Allow local files
      }
      
      // Block all other navigation
      event.preventDefault();
      console.warn('Blocked navigation to:', navigationUrl);
    });

    // Handle new window creation (security)
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      console.warn('Blocked new window creation for:', url);
      return { action: 'deny' };
    });
  }

  /**
   * Load window content
   */
  private loadWindowContent(): void {
    if (!this.mainWindow) return;

    if (this.isDevelopment) {
      this.mainWindow.loadURL('http://localhost:5173');
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
    }
  }

  /**
   * Get application icon
   */
  private getAppIcon(): Electron.NativeImage | undefined {
    try {
      const iconPath = path.join(__dirname, '../assets', 'electron.png');
      if (fs.existsSync(iconPath)) {
        return nativeImage.createFromPath(iconPath);
      }
    } catch (error) {
      console.warn('Could not load app icon:', error);
    }
    return undefined;
  }

  /**
   * Check if app is quitting
   */
  private isQuitting(): boolean {
    // This would be set by the main application when quitting
    return (global as any).__APP_QUITTING__ === true;
  }

  /**
   * Set Content Security Policy
   */
  public setCSP(): void {
    if (!this.hasMainWindow()) return;

    const csp = this.isDevelopment
      ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173 ws://localhost:5173; img-src 'self' data: blob:; font-src 'self' data:;"
      : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self';";

    this.mainWindow!.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': csp,
        },
      });
    });
  }

  /**
   * Reload window content (development only)
   */
  public reloadWindow(): void {
    if (this.isDevelopment && this.hasMainWindow()) {
      this.mainWindow!.webContents.reload();
    }
  }

  /**
   * Toggle dev tools (development only)
   */
  public toggleDevTools(): void {
    if (this.isDevelopment && this.hasMainWindow()) {
      this.mainWindow!.webContents.toggleDevTools();
    }
  }

  /**
   * Get window bounds
   */
  public getWindowBounds(): Electron.Rectangle | null {
    if (this.hasMainWindow()) {
      return this.mainWindow!.getBounds();
    }
    return null;
  }

  /**
   * Set window bounds
   */
  public setWindowBounds(bounds: Partial<Electron.Rectangle>): void {
    if (this.hasMainWindow()) {
      const currentBounds = this.mainWindow!.getBounds();
      this.mainWindow!.setBounds({
        ...currentBounds,
        ...bounds,
      });
    }
  }

  /**
   * Minimize window
   */
  public minimizeWindow(): void {
    if (this.hasMainWindow()) {
      this.mainWindow!.minimize();
    }
  }

  /**
   * Maximize window
   */
  public maximizeWindow(): void {
    if (this.hasMainWindow()) {
      if (this.mainWindow!.isMaximized()) {
        this.mainWindow!.unmaximize();
      } else {
        this.mainWindow!.maximize();
      }
    }
  }

  /**
   * Check if window is maximized
   */
  public isMaximized(): boolean {
    if (this.hasMainWindow()) {
      return this.mainWindow!.isMaximized();
    }
    return false;
  }
}