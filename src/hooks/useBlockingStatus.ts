import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { BlockRule, WebsiteBlockRule, AppInfo } from "@/types";
import { isRuleActive } from "@/lib/helpers";

export interface BlockingStatus {
  blockedApps: Array<{ name: string; path: string; ruleName: string }>;
  blockedBrowsers: Array<{ name: string; path: string; domains: string[] }>;
  totalBlocked: number;
}

/**
 * Hook to track which processes are currently being blocked in real-time
 */
export function useBlockingStatus(
  rules: BlockRule[],
  websiteRules: WebsiteBlockRule[],
  isEnforcing: boolean
): BlockingStatus {
  const [status, setStatus] = useState<BlockingStatus>({
    blockedApps: [],
    blockedBrowsers: [],
    totalBlocked: 0,
  });

  useEffect(() => {
    if (!isEnforcing) {
      setStatus({ blockedApps: [], blockedBrowsers: [], totalBlocked: 0 });
      return;
    }

    const updateStatus = async () => {
      try {
        // Get active rules
        const activeAppRules = rules.filter(isRuleActive);
        const activeWebsiteRules = websiteRules.filter(isRuleActive);

        // Get running processes
        const processes = await invoke<AppInfo[]>("get_running_processes");

        // Check which apps are being blocked
        const blockedApps: Array<{
          name: string;
          path: string;
          ruleName: string;
        }> = [];

        for (const process of processes) {
          const normalizedProcessPath = process.path
            .toLowerCase()
            .replace(/\\/g, "/");
          const processName = process.name.toLowerCase().replace(".exe", "");
          const processFileName = process.path
            .split(/[\\/]/)
            .pop()
            ?.toLowerCase()
            .replace(".exe", "");

          for (const rule of activeAppRules) {
            const normalizedRulePath = rule.appPath
              .toLowerCase()
              .replace(/\\/g, "/");
            const ruleFileName = rule.appPath
              .split(/[\\/]/)
              .pop()
              ?.toLowerCase()
              .replace(".exe", "");

            // Match by path, filename, or process name
            if (
              normalizedProcessPath === normalizedRulePath ||
              processFileName === ruleFileName ||
              processName === rule.appName.toLowerCase().replace(".exe", "")
            ) {
              blockedApps.push({
                name: process.name,
                path: process.path,
                ruleName: rule.appName,
              });
              break; // Don't count same process multiple times
            }
          }
        }

        // Check for browsers
        let blockedBrowsers: Array<{
          name: string;
          path: string;
          domains: string[];
        }> = [];

        if (activeWebsiteRules.length > 0) {
          try {
            const browsers = await invoke<AppInfo[]>("get_browser_processes");
            const domains = activeWebsiteRules.map((r) => r.domain);

            blockedBrowsers = browsers.map((browser) => ({
              name: browser.name,
              path: browser.path,
              domains,
            }));
          } catch (error) {
            // Browser processes might not be available
            console.debug("Could not fetch browser processes:", error);
          }
        }

        setStatus({
          blockedApps,
          blockedBrowsers,
          totalBlocked: blockedApps.length + blockedBrowsers.length,
        });
      } catch (error) {
        console.error("Failed to update blocking status:", error);
      }
    };

    // Update immediately
    updateStatus();

    // Then update every 2 seconds
    const interval = setInterval(updateStatus, 2000);

    return () => clearInterval(interval);
  }, [rules, websiteRules, isEnforcing]);

  return status;
}
