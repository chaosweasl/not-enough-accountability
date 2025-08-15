/**
 * Discord integration module for sending notifications
 */

import fetch from 'node-fetch';
import type { DiscordResult } from '../../types/shared/app.js';

export interface DiscordMessage {
  content: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  timestamp?: string;
}

export class DiscordManager {
  private webhookUrl: string = '';
  private rateLimitCache = new Map<string, number>();
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly MAX_REQUESTS_PER_WINDOW = 5;

  constructor(webhookUrl?: string) {
    if (webhookUrl) {
      this.setWebhookUrl(webhookUrl);
    }
  }

  /**
   * Set Discord webhook URL
   */
  public setWebhookUrl(url: string): void {
    this.webhookUrl = url;
  }

  /**
   * Get current webhook URL
   */
  public getWebhookUrl(): string {
    return this.webhookUrl;
  }

  /**
   * Check if Discord is configured
   */
  public isConfigured(): boolean {
    return this.isValidWebhookUrl(this.webhookUrl);
  }

  /**
   * Send a simple text message to Discord
   */
  public async sendMessage(content: string, username: string = 'Accountability Bot'): Promise<DiscordResult> {
    if (!this.isConfigured()) {
      return { ok: false, error: 'Discord webhook not configured' };
    }

    const message: DiscordMessage = {
      content: this.sanitizeContent(content),
      username,
    };

    return this.sendDiscordMessage(message);
  }

  /**
   * Send a check-in notification
   */
  public async sendCheckInNotification(isLate: boolean = false, scheduledTime?: string): Promise<DiscordResult> {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    let content = `✅ **Checked In**\nTime: ${now.toLocaleString()}`;
    
    if (isLate && scheduledTime) {
      content = `⏰ **Late Check-in**\nChecked in at ${timeString} (scheduled: ${scheduledTime})`;
    }

    return this.sendMessage(content);
  }

  /**
   * Send a check-out notification
   */
  public async sendCheckOutNotification(): Promise<DiscordResult> {
    const now = new Date();
    const content = `🏁 **Checked Out**\nTime: ${now.toLocaleString()}`;
    
    return this.sendMessage(content);
  }

  /**
   * Send a monitoring started notification
   */
  public async sendMonitoringStarted(): Promise<DiscordResult> {
    const content = `▶️ **Monitoring Started**\nTime: ${new Date().toLocaleString()}`;
    return this.sendMessage(content);
  }

  /**
   * Send a monitoring stopped notification
   */
  public async sendMonitoringStopped(reason: string = 'Manual'): Promise<DiscordResult> {
    const content = `⏹️ **Monitoring Stopped**\nReason: ${reason}\nTime: ${new Date().toLocaleString()}`;
    return this.sendMessage(content);
  }

  /**
   * Send a monitoring paused notification
   */
  public async sendMonitoringPaused(reason: string, minutes: number = 60): Promise<DiscordResult> {
    const content = `⏸️ **Monitoring Paused**\nReason: ${reason}\nDuration: ${minutes} minutes\nTime: ${new Date().toLocaleString()}`;
    return this.sendMessage(content);
  }

  /**
   * Send a violation alert
   */
  public async sendViolationAlert(violations: string[], type: 'app' | 'keyword' | 'mixed' = 'mixed'): Promise<DiscordResult> {
    let message = '🚨 **Violation Alert**\n';
    
    if (type === 'app') {
      message += `Restricted apps: ${violations.join(', ')}`;
    } else if (type === 'keyword') {
      message += `Restricted content: ${violations.join(', ')}`;
    } else {
      message += `Detected: ${violations.join(', ')}`;
    }
    
    message += `\nTime: ${new Date().toLocaleString()}`;
    
    return this.sendMessage(message);
  }

  /**
   * Send an app quit notification
   */
  public async sendAppQuitNotification(reason: string): Promise<DiscordResult> {
    const content = `🚪 **App Quit**\nReason: ${reason}\nTime: ${new Date().toLocaleString()}`;
    return this.sendMessage(content);
  }

  /**
   * Send a test notification
   */
  public async sendTestNotification(): Promise<DiscordResult> {
    const content = '🧪 **Test Notification**\nNotifications are working correctly!';
    return this.sendMessage(content);
  }

  /**
   * Send an embed message (rich formatting)
   */
  public async sendEmbed(embed: DiscordEmbed, content?: string): Promise<DiscordResult> {
    if (!this.isConfigured()) {
      return { ok: false, error: 'Discord webhook not configured' };
    }

    const message: DiscordMessage = {
      content: content || '',
      username: 'Accountability Bot',
      embeds: [embed],
    };

    return this.sendDiscordMessage(message);
  }

  /**
   * Test Discord webhook connectivity
   */
  public async testWebhook(webhookUrl: string = this.webhookUrl): Promise<DiscordResult> {
    if (!this.isValidWebhookUrl(webhookUrl)) {
      return { ok: false, error: 'Invalid Discord webhook URL' };
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: '🧪 **Test Notification**\nNotifications are working correctly!',
          username: 'Accountability Bot',
        }),
      });

      const responseText = await response.text().catch(() => '');

      return {
        ok: response.ok,
        status: response.status,
        body: responseText,
        error: response.ok ? undefined : `HTTP ${response.status}: ${responseText}`,
      };
    } catch (error) {
      console.error('Error testing Discord webhook:', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Send raw Discord message
   */
  private async sendDiscordMessage(message: DiscordMessage): Promise<DiscordResult> {
    if (!this.isConfigured()) {
      return { ok: false, error: 'Discord webhook not configured' };
    }

    // Check rate limit
    if (!this.checkRateLimit()) {
      return { ok: false, error: 'Rate limit exceeded' };
    }

    try {
      console.log('Sending Discord notification...');
      
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const responseText = await response.text().catch(() => '');

      if (response.ok) {
        console.log('Discord notification sent successfully');
        this.updateRateLimit();
        return { ok: true, status: response.status };
      } else {
        console.error('Discord notification failed:', response.status, responseText);
        return {
          ok: false,
          status: response.status,
          body: responseText,
          error: `HTTP ${response.status}: ${responseText}`,
        };
      }
    } catch (error) {
      console.error('Error sending Discord notification:', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Validate Discord webhook URL
   */
  private isValidWebhookUrl(url: string): boolean {
    if (!url) return false;
    
    try {
      const parsedUrl = new URL(url);
      return (
        parsedUrl.hostname === 'discord.com' || 
        parsedUrl.hostname === 'discordapp.com'
      ) && parsedUrl.pathname.includes('/api/webhooks/');
    } catch {
      return false;
    }
  }

  /**
   * Check rate limit
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    const windowStart = now - this.RATE_LIMIT_WINDOW;
    
    // Clean old entries
    for (const [timestamp] of this.rateLimitCache) {
      if (parseInt(timestamp) < windowStart) {
        this.rateLimitCache.delete(timestamp);
      }
    }

    return this.rateLimitCache.size < this.MAX_REQUESTS_PER_WINDOW;
  }

  /**
   * Update rate limit tracker
   */
  private updateRateLimit(): void {
    const now = Date.now();
    this.rateLimitCache.set(now.toString(), now);
  }

  /**
   * Sanitize message content
   */
  private sanitizeContent(content: string): string {
    // Remove any potentially dangerous content
    return content
      .replace(/@everyone/g, '@\u200beveryone')
      .replace(/@here/g, '@\u200bhere')
      .substring(0, 2000); // Discord message limit
  }

  /**
   * Create an embed for violations
   */
  public createViolationEmbed(violations: string[], type: 'app' | 'keyword'): DiscordEmbed {
    const color = type === 'app' ? 0xFF0000 : 0xFF8800; // Red for apps, orange for keywords
    
    return {
      title: '🚨 Violation Detected',
      description: type === 'app' ? 'Restricted application detected' : 'Restricted content detected',
      color,
      fields: [
        {
          name: type === 'app' ? 'Applications' : 'Keywords',
          value: violations.join('\n'),
          inline: false,
        },
        {
          name: 'Time',
          value: new Date().toLocaleString(),
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create an embed for check-in/out events
   */
  public createCheckInEmbed(isCheckIn: boolean, isLate: boolean = false, scheduledTime?: string): DiscordEmbed {
    const now = new Date();
    const color = isCheckIn ? (isLate ? 0xFFAA00 : 0x00FF00) : 0x0066FF;
    const title = isCheckIn ? (isLate ? '⏰ Late Check-in' : '✅ Checked In') : '🏁 Checked Out';
    
    const fields = [
      {
        name: 'Time',
        value: now.toLocaleString(),
        inline: true,
      },
    ];

    if (isLate && scheduledTime) {
      fields.push({
        name: 'Scheduled Time',
        value: scheduledTime,
        inline: true,
      });
    }

    return {
      title,
      color,
      fields,
      timestamp: now.toISOString(),
    };
  }

  /**
   * Get rate limit status
   */
  public getRateLimitStatus(): { remaining: number; resetTime: number } {
    const now = Date.now();
    const windowStart = now - this.RATE_LIMIT_WINDOW;
    
    // Clean old entries
    for (const [timestamp] of this.rateLimitCache) {
      if (parseInt(timestamp) < windowStart) {
        this.rateLimitCache.delete(timestamp);
      }
    }

    return {
      remaining: this.MAX_REQUESTS_PER_WINDOW - this.rateLimitCache.size,
      resetTime: windowStart + this.RATE_LIMIT_WINDOW,
    };
  }
}