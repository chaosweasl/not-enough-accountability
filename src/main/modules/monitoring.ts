/**
 * Process monitoring module for system activity tracking
 */

import { exec } from 'child_process';
import * as path from 'node:path';
import type { ProcessInfo, ViolationEvent, AppSettings } from '../../types/shared/app.js';

export interface MonitoringCallbacks {
  onViolationDetected: (violation: ViolationEvent) => void;
  onMonitoringStarted: () => void;
  onMonitoringStopped: (reason: string) => void;
  onError: (error: Error) => void;
}

export class ProcessMonitor {
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastWarningTime = new Map<string, number>();
  private violationCounter = 0;

  constructor(
    private settings: AppSettings,
    private callbacks: MonitoringCallbacks
  ) {}

  /**
   * Start process monitoring
   */
  public start(): boolean {
    if (this.isMonitoring) {
      console.warn('Process monitoring is already active');
      return false;
    }

    try {
      this.isMonitoring = true;
      this.startMonitoringLoop();
      this.callbacks.onMonitoringStarted();
      console.log('Process monitoring started');
      return true;
    } catch (error) {
      console.error('Failed to start process monitoring:', error);
      this.isMonitoring = false;
      this.callbacks.onError(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Stop process monitoring
   */
  public stop(reason: string = 'manual'): boolean {
    if (!this.isMonitoring) {
      console.warn('Process monitoring is not active');
      return false;
    }

    try {
      this.isMonitoring = false;
      
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = null;
      }

      this.callbacks.onMonitoringStopped(reason);
      console.log('Process monitoring stopped:', reason);
      return true;
    } catch (error) {
      console.error('Error stopping process monitoring:', error);
      this.callbacks.onError(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Check if monitoring is active
   */
  public isActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * Update settings
   */
  public updateSettings(newSettings: AppSettings): void {
    this.settings = newSettings;
    console.log('Process monitor settings updated');
  }

  /**
   * Get monitoring statistics
   */
  public getStatistics(): { isActive: boolean; violations: number; uptime: number } {
    return {
      isActive: this.isMonitoring,
      violations: this.violationCounter,
      uptime: 0, // Could track uptime if needed
    };
  }

  /**
   * Start the monitoring loop
   */
  private startMonitoringLoop(): void {
    // Check every 5 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performMonitoringCheck();
      } catch (error) {
        console.error('Error in monitoring loop:', error);
        this.callbacks.onError(error instanceof Error ? error : new Error(String(error)));
      }
    }, 5000);
  }

  /**
   * Perform a single monitoring check
   */
  private async performMonitoringCheck(): Promise<void> {
    if (!this.isMonitoring) return;

    const [restrictedApps, restrictedKeywords] = await Promise.all([
      this.checkForRestrictedApps(),
      this.checkForRestrictedKeywords(),
    ]);

    const allViolations = [...restrictedApps, ...restrictedKeywords];

    if (allViolations.length > 0) {
      this.handleViolations(allViolations, restrictedApps, restrictedKeywords);
    }
  }

  /**
   * Handle detected violations
   */
  private handleViolations(
    allViolations: string[],
    restrictedApps: string[],
    restrictedKeywords: string[]
  ): void {
    const now = Date.now();
    const violationsToWarnAbout: string[] = [];

    // Rate limiting: only warn about the same violation once per minute
    allViolations.forEach((violation) => {
      const lastWarned = this.lastWarningTime.get(violation) || 0;
      const oneMinuteAgo = now - 60 * 1000;

      if (lastWarned < oneMinuteAgo) {
        violationsToWarnAbout.push(violation);
        this.lastWarningTime.set(violation, now);
      }
    });

    if (violationsToWarnAbout.length > 0) {
      this.createViolationEvents(violationsToWarnAbout, restrictedApps, restrictedKeywords);
    }
  }

  /**
   * Create violation events for detected violations
   */
  private createViolationEvents(
    violations: string[],
    restrictedApps: string[],
    restrictedKeywords: string[]
  ): void {
    violations.forEach((violation) => {
      const violationEvent: ViolationEvent = {
        id: `violation-${++this.violationCounter}-${Date.now()}`,
        timestamp: new Date(),
        type: restrictedApps.includes(violation) ? 'app' : 'keyword',
        trigger: violation,
        windowTitle: '', // Will be populated by window monitoring if available
        action: 'warned',
        severity: this.getViolationSeverity(violation),
      };

      this.callbacks.onViolationDetected(violationEvent);
    });
  }

  /**
   * Determine violation severity
   */
  private getViolationSeverity(violation: string): 'low' | 'medium' | 'high' {
    // You could implement logic to determine severity based on violation type
    const highSeverityTerms = ['steam', 'games', 'entertainment'];
    const mediumSeverityTerms = ['youtube', 'social', 'reddit'];

    const lowerViolation = violation.toLowerCase();

    if (highSeverityTerms.some(term => lowerViolation.includes(term))) {
      return 'high';
    }
    
    if (mediumSeverityTerms.some(term => lowerViolation.includes(term))) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Get list of running processes
   */
  private async getRunningProcesses(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      let command: string;

      if (process.platform === 'win32') {
        command = 'tasklist /fo csv /nh';
      } else if (process.platform === 'darwin') {
        command = 'ps aux';
      } else {
        command = 'ps aux';
      }

      exec(command, (error, stdout) => {
        if (error) {
          console.error('Error running process list command:', error);
          reject(error);
          return;
        }

        try {
          let processes: string[] = [];

          if (process.platform === 'win32') {
            const lines = stdout.split('\n').filter((line) => line.trim());
            processes = lines
              .map((line) => {
                const parts = line.split(',');
                return parts[0] ? parts[0].replace(/"/g, '').toLowerCase() : '';
              })
              .filter((name) => name);
          } else {
            const lines = stdout.split('\n').slice(1);
            processes = lines
              .map((line) => {
                const parts = line.trim().split(/\s+/);
                return parts[parts.length - 1]
                  ? path.basename(parts[parts.length - 1]).toLowerCase()
                  : '';
              })
              .filter((name) => name);
          }

          resolve(processes);
        } catch (parseError) {
          console.error('Error parsing process list:', parseError);
          reject(parseError);
        }
      });
    });
  }

  /**
   * Check for restricted applications
   */
  private async checkForRestrictedApps(): Promise<string[]> {
    try {
      const runningProcesses = await this.getRunningProcesses();
      const restrictedFound: string[] = [];

      this.settings.restrictedApps.forEach((appNameRaw) => {
        const appName = appNameRaw.toLowerCase();
        if (
          runningProcesses.some((process) =>
            process.includes(appName.replace('.exe', ''))
          )
        ) {
          restrictedFound.push(appNameRaw);
        }
      });

      return restrictedFound;
    } catch (error) {
      console.error('Error checking processes:', error);
      return [];
    }
  }

  /**
   * Check for restricted keywords in window titles
   */
  private async checkForRestrictedKeywords(): Promise<string[]> {
    return new Promise((resolve) => {
      let command: string;

      if (process.platform === 'win32') {
        command =
          'powershell "Get-Process | Where-Object {$_.MainWindowTitle -ne \'\'} | Select-Object ProcessName,MainWindowTitle | ConvertTo-Json"';
      } else if (process.platform === 'darwin') {
        command =
          'osascript -e "tell application \\"System Events\\" to get {name, title of window 1} of every application process whose frontmost is true"';
      } else {
        command = 'xdotool getwindowfocus getwindowname 2>/dev/null || echo ""';
      }

      exec(command, (error, stdout) => {
        if (error) {
          console.error('Error running window title command:', error);
          resolve([]);
          return;
        }

        const keywordsFound: string[] = [];

        try {
          if (process.platform === 'win32') {
            if (!stdout.trim()) {
              resolve([]);
              return;
            }

            const processes = JSON.parse(stdout);
            interface WinProcess {
              ProcessName: string;
              MainWindowTitle: string;
            }

            const processArray: WinProcess[] = Array.isArray(processes)
              ? processes
              : [processes];

            processArray.forEach((proc: WinProcess) => {
              if (proc.MainWindowTitle) {
                const title = proc.MainWindowTitle.toLowerCase();
                this.settings.monitoringKeywords.forEach((keyword) => {
                  if (title.includes(keyword.toLowerCase())) {
                    keywordsFound.push(`${keyword} (in ${proc.ProcessName})`);
                  }
                });
              }
            });
          } else {
            const title = stdout.toLowerCase();
            this.settings.monitoringKeywords.forEach((keyword) => {
              if (title.includes(keyword.toLowerCase())) {
                keywordsFound.push(keyword);
              }
            });
          }
        } catch (parseError) {
          console.error('Error parsing window titles:', parseError);
        }

        const uniqueKeywords = [...new Set(keywordsFound)];
        resolve(uniqueKeywords);
      });
    });
  }

  /**
   * Get active window information (platform-specific)
   */
  private async getActiveWindowInfo(): Promise<ProcessInfo | null> {
    return new Promise((resolve) => {
      let command: string;

      if (process.platform === 'win32') {
        command = 'powershell "Get-Process | Where-Object {$_.MainWindowTitle -ne \'\'} | Select-Object Id,ProcessName,MainWindowTitle | ConvertTo-Json"';
      } else if (process.platform === 'darwin') {
        command = 'osascript -e "tell application \\"System Events\\" to get {name, title of window 1} of every application process whose frontmost is true"';
      } else {
        resolve(null);
        return;
      }

      exec(command, (error, stdout) => {
        if (error) {
          console.error('Error getting active window info:', error);
          resolve(null);
          return;
        }

        try {
          if (process.platform === 'win32' && stdout.trim()) {
            const processes = JSON.parse(stdout);
            const processArray = Array.isArray(processes) ? processes : [processes];
            
            if (processArray.length > 0) {
              const proc = processArray[0];
              resolve({
                name: proc.ProcessName,
                pid: proc.Id,
                windowTitle: proc.MainWindowTitle,
              });
              return;
            }
          }
          resolve(null);
        } catch (parseError) {
          console.error('Error parsing active window info:', parseError);
          resolve(null);
        }
      });
    });
  }

  /**
   * Clear warning history (useful for testing)
   */
  public clearWarningHistory(): void {
    this.lastWarningTime.clear();
    console.log('Warning history cleared');
  }

  /**
   * Get current warning history
   */
  public getWarningHistory(): Map<string, number> {
    return new Map(this.lastWarningTime);
  }
}