/**
 * Settings management module for the main process
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { app } from 'electron';
import type { AppSettings } from '../../types/shared/app.js';

export class SettingsManager {
  private settingsPath: string;
  private settings: AppSettings;

  private defaultSettings: AppSettings = {
    discordWebhook: '',
    checkInTime: '08:00',
    checkOutTime: '16:00',
    restrictedApps: ['steam.exe'],
    monitoringKeywords: ['youtube', 'netflix', 'twitch', 'reddit'],
    theme: 'auto',
    autoStart: false,
    minimizeToTray: true,
  };

  constructor() {
    this.settingsPath = path.join(app.getPath('userData'), 'settings.json');
    this.settings = { ...this.defaultSettings };
    this.loadSettings();
  }

  /**
   * Load settings from disk
   */
  public loadSettings(): void {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf8');
        const savedSettings = JSON.parse(data) as Partial<AppSettings>;
        this.settings = { ...this.defaultSettings, ...savedSettings };
        console.log('Settings loaded successfully');
      } else {
        console.log('No existing settings file, using defaults');
        this.saveSettings(); // Create default settings file
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = { ...this.defaultSettings };
    }
  }

  /**
   * Save settings to disk
   */
  public saveSettings(): void {
    try {
      const userData = app.getPath('userData');
      if (!fs.existsSync(userData)) {
        fs.mkdirSync(userData, { recursive: true });
      }
      
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2));
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      throw new Error(`Failed to save settings: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get current settings
   */
  public getSettings(): AppSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  public updateSettings(newSettings: Partial<AppSettings>): AppSettings {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    return this.getSettings();
  }

  /**
   * Reset settings to defaults
   */
  public resetSettings(): AppSettings {
    this.settings = { ...this.defaultSettings };
    this.saveSettings();
    return this.getSettings();
  }

  /**
   * Get a specific setting
   */
  public getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.settings[key];
  }

  /**
   * Set a specific setting
   */
  public setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.settings[key] = value;
    this.saveSettings();
  }

  /**
   * Validate settings object
   */
  public validateSettings(settings: Partial<AppSettings>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (settings.checkInTime && !this.isValidTime(settings.checkInTime)) {
      errors.push('Invalid check-in time format');
    }

    if (settings.checkOutTime && !this.isValidTime(settings.checkOutTime)) {
      errors.push('Invalid check-out time format');
    }

    if (settings.discordWebhook && !this.isValidUrl(settings.discordWebhook)) {
      errors.push('Invalid Discord webhook URL');
    }

    if (settings.restrictedApps && !Array.isArray(settings.restrictedApps)) {
      errors.push('Restricted apps must be an array');
    }

    if (settings.monitoringKeywords && !Array.isArray(settings.monitoringKeywords)) {
      errors.push('Monitoring keywords must be an array');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Helper to validate time format (HH:MM)
   */
  private isValidTime(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  /**
   * Helper to validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('https://discord.com/api/webhooks/') || 
             url.startsWith('https://discordapp.com/api/webhooks/');
    } catch {
      return false;
    }
  }

  /**
   * Export settings to file
   */
  public async exportSettings(filePath: string): Promise<boolean> {
    try {
      const exportData = {
        settings: this.settings,
        exportDate: new Date().toISOString(),
        version: app.getVersion(),
      };
      
      fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
      return true;
    } catch (error) {
      console.error('Error exporting settings:', error);
      return false;
    }
  }

  /**
   * Import settings from file
   */
  public async importSettings(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File does not exist' };
      }

      const data = fs.readFileSync(filePath, 'utf8');
      const importData = JSON.parse(data);
      
      if (!importData.settings) {
        return { success: false, error: 'Invalid settings file format' };
      }

      const validation = this.validateSettings(importData.settings);
      if (!validation.valid) {
        return { success: false, error: `Invalid settings: ${validation.errors.join(', ')}` };
      }

      this.settings = { ...this.defaultSettings, ...importData.settings };
      this.saveSettings();
      
      return { success: true };
    } catch (error) {
      console.error('Error importing settings:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}