import { AppSettings, BlockRule, WebsiteBlockRule, BlockEvent } from "@/types";

const STORAGE_KEYS = {
  SETTINGS: "accountability_settings",
  BLOCK_RULES: "accountability_block_rules",
  WEBSITE_RULES: "accountability_website_rules",
  EVENTS: "accountability_events",
} as const;

export const storage = {
  // Settings
  getSettings(): AppSettings {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!stored) {
      return {
        webhookEnabled: false,
        sendBlockNotifications: false,
        sendUnblockNotifications: false,
        sendKillswitchNotifications: true,
        isSetupComplete: false,
        blockingEnabled: false,
      };
    }
    return JSON.parse(stored);
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

  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  },
};
