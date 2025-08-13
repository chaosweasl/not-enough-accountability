import { clsx, type ClassValue } from 'clsx';

/**
 * Utility for combining CSS classes with conditional logic
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format time duration in a human-readable format
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Convert time string (HH:MM) to minutes
 */
export function timeToMinutes(timeStr: string): number {
  const [hours = 0, minutes = 0] = (timeStr || '0:0').split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes to time string (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Check if a URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if currently within work hours
 */
export function isWorkHours(startTime: string, endTime: string): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Debounce function to limit API calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  waitFor: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };
}

/**
 * Throttle function to limit API calls
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Safe JSON parse with default value
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(unsafe: string): string {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Create unique array
 */
export function uniqueArray<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/**
 * Check if app is running in Electron
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
}

/**
 * Get status display text and color
 */
export function getStatusDisplay(status: string): { text: string; color: string } {
  switch (status) {
    case 'checked-out':
      return { text: 'Not Checked In', color: 'text-gray-500' };
    case 'checked-in':
      return { text: 'Checked In', color: 'text-success-600' };
    case 'monitoring':
      return { text: 'Monitoring Active', color: 'text-primary-600' };
    case 'paused':
      return { text: 'Monitoring Paused', color: 'text-warning-600' };
    default:
      return { text: 'Unknown', color: 'text-gray-500' };
  }
}

/**
 * Format violation severity with color
 */
export function getViolationSeverityDisplay(severity: string): { text: string; color: string } {
  switch (severity) {
    case 'low':
      return { text: 'Low', color: 'text-green-600 bg-green-100' };
    case 'medium':
      return { text: 'Medium', color: 'text-yellow-600 bg-yellow-100' };
    case 'high':
      return { text: 'High', color: 'text-red-600 bg-red-100' };
    default:
      return { text: 'Unknown', color: 'text-gray-600 bg-gray-100' };
  }
}

/**
 * Calculate productivity score based on violations and work time
 */
export function calculateProductivityScore(
  violations: number,
  workMinutes: number,
  baseScore: number = 100
): number {
  if (workMinutes === 0) return baseScore;
  
  const violationPenalty = Math.min(violations * 5, 80); // Max 80% penalty
  const timePenalty = Math.max(0, (240 - workMinutes) * 0.1); // Penalty for working less than 4 hours
  
  return Math.max(0, baseScore - violationPenalty - timePenalty);
}

/**
 * Get appropriate icon for app category
 */
export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'productivity':
      return '💼';
    case 'social':
      return '👥';
    case 'gaming':
      return '🎮';
    case 'entertainment':
      return '🍿';
    default:
      return '📱';
  }
}

/**
 * Storage utilities for localStorage with type safety
 */
export const storage = {
  get<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  },
};

/**
 * Theme utilities
 */
export const theme = {
  isDark(): boolean {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  },

  setDark(dark: boolean): void {
    if (typeof window === 'undefined') return;
    
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    storage.set('theme', dark ? 'dark' : 'light');
  },

  toggle(): void {
    this.setDark(!this.isDark());
  },

  init(): void {
    if (typeof window === 'undefined') return;
    
    const savedTheme = storage.get<'light' | 'dark' | 'auto'>('theme', 'auto');
    
    if (savedTheme === 'dark') {
      this.setDark(true);
    } else if (savedTheme === 'light') {
      this.setDark(false);
    } else {
      // Auto - use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setDark(prefersDark);
    }
  },
};