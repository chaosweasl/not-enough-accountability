import { AppSettings, BlockRule, WebsiteBlockRule, BlockEvent } from "@/types";

const STORAGE_KEYS = {
  SETTINGS: "neu_settings",
  BLOCK_RULES: "neu_block_rules",
  WEBSITE_RULES: "neu_website_rules",
  EVENTS: "neu_events",
  PIN_SESSION: "neu_pin_session",
} as const;

export const storage = {
  // Settings
  getSettings(): AppSettings {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!stored) {
      return {
        webhookEnabled: false,
        sendBlockNotifications: true,
        sendUnblockNotifications: true,
        sendKillswitchNotifications: true,
        isSetupComplete: false,
        blockingEnabled: false,
        websiteBlockingEnabled: true, // Enabled by default
      };
    }
    const parsed = JSON.parse(stored);
    // Add websiteBlockingEnabled default for existing users
    if (parsed.websiteBlockingEnabled === undefined) {
      parsed.websiteBlockingEnabled = true;
    }
    return parsed;
  },

  saveSettings(settings: AppSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Block Rules
  getBlockRules(): BlockRule[] {
    const stored = localStorage.getItem(STORAGE_KEYS.BLOCK_RULES);
    return stored ? JSON.parse(stored) : [];
  },

  saveBlockRules(rules: BlockRule[]): void {
    localStorage.setItem(STORAGE_KEYS.BLOCK_RULES, JSON.stringify(rules));
  },

  addBlockRule(rule: BlockRule): void {
    const rules = this.getBlockRules();
    rules.push(rule);
    this.saveBlockRules(rules);
  },

  removeBlockRule(ruleId: string): void {
    const rules = this.getBlockRules().filter((r) => r.id !== ruleId);
    this.saveBlockRules(rules);
  },

  updateBlockRule(ruleId: string, updates: Partial<BlockRule>): void {
    const rules = this.getBlockRules().map((r) =>
      r.id === ruleId ? { ...r, ...updates } : r
    );
    this.saveBlockRules(rules);
  },

  // Website Rules
  getWebsiteRules(): WebsiteBlockRule[] {
    const stored = localStorage.getItem(STORAGE_KEYS.WEBSITE_RULES);
    return stored ? JSON.parse(stored) : [];
  },

  saveWebsiteRules(rules: WebsiteBlockRule[]): void {
    localStorage.setItem(STORAGE_KEYS.WEBSITE_RULES, JSON.stringify(rules));
  },

  addWebsiteRule(rule: WebsiteBlockRule): void {
    const rules = this.getWebsiteRules();
    rules.push(rule);
    this.saveWebsiteRules(rules);
  },

  removeWebsiteRule(ruleId: string): void {
    const rules = this.getWebsiteRules().filter((r) => r.id !== ruleId);
    this.saveWebsiteRules(rules);
  },

  updateWebsiteRule(ruleId: string, updates: Partial<WebsiteBlockRule>): void {
    const rules = this.getWebsiteRules().map((r) =>
      r.id === ruleId ? { ...r, ...updates } : r
    );
    this.saveWebsiteRules(rules);
  },

  // Events
  getEvents(): BlockEvent[] {
    const stored = localStorage.getItem(STORAGE_KEYS.EVENTS);
    return stored ? JSON.parse(stored) : [];
  },

  saveEvents(events: BlockEvent[]): void {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  },

  addEvent(event: BlockEvent): void {
    const events = this.getEvents();
    events.unshift(event); // Add to beginning
    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(100);
    }
    this.saveEvents(events);
  },

  clearEvents(): void {
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
  },

  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  },

  // PIN Session Management
  // Session expires after 10 minutes of PIN verification
  PIN_SESSION_DURATION: 10 * 60 * 1000, // 10 minutes in milliseconds

  setPinSession(): void {
    const expiresAt = Date.now() + this.PIN_SESSION_DURATION;
    localStorage.setItem(STORAGE_KEYS.PIN_SESSION, expiresAt.toString());
  },

  isPinSessionValid(): boolean {
    const stored = localStorage.getItem(STORAGE_KEYS.PIN_SESSION);
    if (!stored) return false;

    const expiresAt = parseInt(stored, 10);
    return Date.now() < expiresAt;
  },

  clearPinSession(): void {
    localStorage.removeItem(STORAGE_KEYS.PIN_SESSION);
  },

  getPinSessionTimeRemaining(): number {
    const stored = localStorage.getItem(STORAGE_KEYS.PIN_SESSION);
    if (!stored) return 0;

    const expiresAt = parseInt(stored, 10);
    const remaining = expiresAt - Date.now();
    return remaining > 0 ? remaining : 0;
  },
};
