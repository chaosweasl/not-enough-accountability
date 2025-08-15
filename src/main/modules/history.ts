/**
 * Activity history tracking module
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { app } from 'electron';
import type { HistoryEntry, ViolationEvent } from '../../types/shared/app.js';

export class HistoryManager {
  private historyPath: string;
  private violationsPath: string;
  private maxHistoryEntries = 1000;
  private maxViolationEntries = 5000;

  constructor() {
    this.historyPath = path.join(app.getPath('userData'), 'activity-history.json');
    this.violationsPath = path.join(app.getPath('userData'), 'violations-history.json');
    this.ensureHistoryFiles();
  }

  /**
   * Ensure history files exist
   */
  private ensureHistoryFiles(): void {
    try {
      const userDataPath = app.getPath('userData');
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }

      if (!fs.existsSync(this.historyPath)) {
        this.writeHistoryFile([]);
      }

      if (!fs.existsSync(this.violationsPath)) {
        this.writeViolationsFile([]);
      }
    } catch (error) {
      console.error('Error ensuring history files:', error);
    }
  }

  /**
   * Read activity history from disk
   */
  public readHistory(): HistoryEntry[] {
    try {
      if (!fs.existsSync(this.historyPath)) {
        return [];
      }

      const raw = fs.readFileSync(this.historyPath, 'utf8');
      const data = JSON.parse(raw || '[]');
      
      // Validate and sanitize history entries
      return this.validateHistoryEntries(data);
    } catch (error) {
      console.error('Error reading history:', error);
      return [];
    }
  }

  /**
   * Write activity history to disk
   */
  private writeHistoryFile(history: HistoryEntry[]): void {
    try {
      const sanitized = this.validateHistoryEntries(history);
      const truncated = sanitized.slice(0, this.maxHistoryEntries);
      fs.writeFileSync(this.historyPath, JSON.stringify(truncated, null, 2), 'utf8');
    } catch (error) {
      console.error('Error writing history file:', error);
      throw error;
    }
  }

  /**
   * Add entry to activity history
   */
  public addHistoryEntry(entry: Omit<HistoryEntry, 'time'>): void {
    try {
      const fullEntry: HistoryEntry = {
        ...entry,
        time: new Date().toISOString(),
      };

      const history = this.readHistory();
      history.unshift(fullEntry); // Add to beginning (most recent first)
      this.writeHistoryFile(history);

      console.log('Added history entry:', fullEntry.type);
    } catch (error) {
      console.error('Error adding history entry:', error);
    }
  }

  /**
   * Read violations history from disk
   */
  public readViolations(): ViolationEvent[] {
    try {
      if (!fs.existsSync(this.violationsPath)) {
        return [];
      }

      const raw = fs.readFileSync(this.violationsPath, 'utf8');
      const data = JSON.parse(raw || '[]');
      
      // Validate and sanitize violation entries
      return this.validateViolationEntries(data);
    } catch (error) {
      console.error('Error reading violations:', error);
      return [];
    }
  }

  /**
   * Write violations history to disk
   */
  private writeViolationsFile(violations: ViolationEvent[]): void {
    try {
      const sanitized = this.validateViolationEntries(violations);
      const truncated = sanitized.slice(0, this.maxViolationEntries);
      fs.writeFileSync(this.violationsPath, JSON.stringify(truncated, null, 2), 'utf8');
    } catch (error) {
      console.error('Error writing violations file:', error);
      throw error;
    }
  }

  /**
   * Add violation to history
   */
  public addViolation(violation: ViolationEvent): void {
    try {
      const violations = this.readViolations();
      violations.unshift(violation); // Add to beginning (most recent first)
      this.writeViolationsFile(violations);

      console.log('Added violation:', violation.trigger);
    } catch (error) {
      console.error('Error adding violation:', error);
    }
  }

  /**
   * Get combined activity log (history + violations)
   */
  public getActivityLog(options: {
    startDate?: Date;
    endDate?: Date;
    type?: string;
    limit?: number;
  } = {}): Array<HistoryEntry | ViolationEvent> {
    try {
      const history = this.readHistory();
      const violations = this.readViolations();

      // Convert violations to history-like format for unified display
      const violationEntries: HistoryEntry[] = violations.map(v => ({
        type: 'violation',
        reason: `${v.type}: ${v.trigger}`,
        time: v.timestamp.toISOString(),
        details: {
          id: v.id,
          windowTitle: v.windowTitle,
          action: v.action,
          severity: v.severity,
        },
      }));

      // Combine and sort by time (most recent first)
      let combined = [...history, ...violationEntries];
      combined.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      // Apply filters
      if (options.startDate) {
        combined = combined.filter(entry => new Date(entry.time) >= options.startDate!);
      }

      if (options.endDate) {
        combined = combined.filter(entry => new Date(entry.time) <= options.endDate!);
      }

      if (options.type) {
        combined = combined.filter(entry => entry.type === options.type);
      }

      // Apply limit
      if (options.limit && options.limit > 0) {
        combined = combined.slice(0, options.limit);
      }

      return combined;
    } catch (error) {
      console.error('Error getting activity log:', error);
      return [];
    }
  }

  /**
   * Clear all history
   */
  public clearHistory(): boolean {
    try {
      this.writeHistoryFile([]);
      console.log('Activity history cleared');
      return true;
    } catch (error) {
      console.error('Error clearing history:', error);
      return false;
    }
  }

  /**
   * Clear all violations
   */
  public clearViolations(): boolean {
    try {
      this.writeViolationsFile([]);
      console.log('Violations history cleared');
      return true;
    } catch (error) {
      console.error('Error clearing violations:', error);
      return false;
    }
  }

  /**
   * Clear all activity data
   */
  public clearAll(): boolean {
    try {
      const historyCleared = this.clearHistory();
      const violationsCleared = this.clearViolations();
      
      return historyCleared && violationsCleared;
    } catch (error) {
      console.error('Error clearing all activity data:', error);
      return false;
    }
  }

  /**
   * Export activity data to file
   */
  public async exportToFile(filePath: string, options: {
    includeHistory?: boolean;
    includeViolations?: boolean;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<boolean> {
    try {
      const exportData: any = {
        exportDate: new Date().toISOString(),
        version: app.getVersion(),
        options,
      };

      if (options.includeHistory !== false) {
        exportData.history = this.readHistory();
      }

      if (options.includeViolations !== false) {
        exportData.violations = this.readViolations();
      }

      // Apply date filters if specified
      if (options.startDate || options.endDate) {
        if (exportData.history) {
          exportData.history = exportData.history.filter((entry: HistoryEntry) => {
            const entryDate = new Date(entry.time);
            if (options.startDate && entryDate < options.startDate) return false;
            if (options.endDate && entryDate > options.endDate) return false;
            return true;
          });
        }

        if (exportData.violations) {
          exportData.violations = exportData.violations.filter((violation: ViolationEvent) => {
            const violationDate = new Date(violation.timestamp);
            if (options.startDate && violationDate < options.startDate) return false;
            if (options.endDate && violationDate > options.endDate) return false;
            return true;
          });
        }
      }

      fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
      console.log('Activity data exported to:', filePath);
      return true;
    } catch (error) {
      console.error('Error exporting activity data:', error);
      return false;
    }
  }

  /**
   * Get statistics about activity data
   */
  public getStatistics(): {
    totalHistory: number;
    totalViolations: number;
    violationsByType: Record<string, number>;
    violationsBySeverity: Record<string, number>;
    firstEntry?: Date;
    lastEntry?: Date;
  } {
    try {
      const history = this.readHistory();
      const violations = this.readViolations();

      const violationsByType: Record<string, number> = {};
      const violationsBySeverity: Record<string, number> = {};

      violations.forEach(violation => {
        violationsByType[violation.type] = (violationsByType[violation.type] || 0) + 1;
        if (violation.severity) {
          violationsBySeverity[violation.severity] = (violationsBySeverity[violation.severity] || 0) + 1;
        }
      });

      // Find first and last entries
      const allEntries = [...history, ...violations];
      const timestamps = allEntries.map(entry => 
        new Date('time' in entry ? entry.time : entry.timestamp)
      ).sort((a, b) => a.getTime() - b.getTime());

      return {
        totalHistory: history.length,
        totalViolations: violations.length,
        violationsByType,
        violationsBySeverity,
        firstEntry: timestamps[0] || undefined,
        lastEntry: timestamps[timestamps.length - 1] || undefined,
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      return {
        totalHistory: 0,
        totalViolations: 0,
        violationsByType: {},
        violationsBySeverity: {},
      };
    }
  }

  /**
   * Validate history entries
   */
  private validateHistoryEntries(data: any[]): HistoryEntry[] {
    if (!Array.isArray(data)) return [];

    return data.filter(entry => {
      return (
        entry &&
        typeof entry === 'object' &&
        typeof entry.type === 'string' &&
        typeof entry.time === 'string' &&
        (entry.reason === undefined || typeof entry.reason === 'string')
      );
    });
  }

  /**
   * Validate violation entries
   */
  private validateViolationEntries(data: any[]): ViolationEvent[] {
    if (!Array.isArray(data)) return [];

    return data.filter(entry => {
      return (
        entry &&
        typeof entry === 'object' &&
        typeof entry.id === 'string' &&
        (entry.timestamp instanceof Date || typeof entry.timestamp === 'string') &&
        typeof entry.type === 'string' &&
        typeof entry.trigger === 'string' &&
        typeof entry.windowTitle === 'string' &&
        typeof entry.action === 'string'
      );
    }).map(entry => ({
      ...entry,
      timestamp: entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp),
    }));
  }

  /**
   * Backup current data
   */
  public createBackup(): string | null {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(app.getPath('userData'), 'backups');
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const backupPath = path.join(backupDir, `backup-${timestamp}.json`);
      
      const backupData = {
        timestamp: new Date().toISOString(),
        version: app.getVersion(),
        history: this.readHistory(),
        violations: this.readViolations(),
      };

      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
      console.log('Backup created:', backupPath);
      
      return backupPath;
    } catch (error) {
      console.error('Error creating backup:', error);
      return null;
    }
  }

  /**
   * Set maximum number of history entries to keep
   */
  public setMaxHistoryEntries(max: number): void {
    this.maxHistoryEntries = Math.max(100, max);
  }

  /**
   * Set maximum number of violation entries to keep
   */
  public setMaxViolationEntries(max: number): void {
    this.maxViolationEntries = Math.max(100, max);
  }
}