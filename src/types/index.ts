export interface AppInfo {
  name: string;
  path: string;
  pid?: number;
}

export interface BlockRule {
  id: string;
  appName: string;
  appPath: string;
  type: "timer" | "schedule" | "permanent";
  isActive: boolean;
  createdAt: number;

  // Timer specific
  duration?: number; // in minutes
  startTime?: number;

  // Schedule specific
  days?: number[]; // 0-6 (Sunday-Saturday)
  startHour?: number;
  startMinute?: number;
  endHour?: number;
  endMinute?: number;
}

export interface WebsiteBlockRule {
  id: string;
  domain: string;
  type: "timer" | "schedule" | "permanent";
  isActive: boolean;
  createdAt: number;

  // Timer specific
  duration?: number;
  startTime?: number;

  // Schedule specific
  days?: number[];
  startHour?: number;
  startMinute?: number;
  endHour?: number;
  endMinute?: number;
}

export interface AppSettings {
  pinHash?: string;
  webhookUrl?: string;
  webhookEnabled: boolean;
  sendBlockNotifications: boolean;
  sendUnblockNotifications: boolean;
  sendKillswitchNotifications: boolean;
  isSetupComplete: boolean;
  blockingEnabled: boolean;
  websiteBlockingEnabled: boolean;
}

export interface BlockEvent {
  id: string;
  type: "block" | "unblock" | "killswitch" | "violation";
  target: string;
  timestamp: number;
  message: string;
}
