import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AppInfo, WebsiteBlockRule } from "@/types";
import { isRuleActive } from "@/lib/helpers";

/**
 * Hook that enforces website blocking by killing browser processes
 * when website rules are active.
 *
 * This is more effective than hosts file modification because modern browsers
 * use DNS over HTTPS (DoH) which bypasses the hosts file entirely.
 *
 * Implements a 10-second cooldown after killing browsers to prevent them from
 * immediately reopening with saved sessions/tabs.
 */
export function useWebsiteBlocker(
  websiteRules: WebsiteBlockRule[],
  isEnforcing: boolean
) {
  // Track when we last killed a browser (path -> timestamp)
  const lastKillTime = useRef<Map<string, number>>(new Map());
  const KILL_COOLDOWN = 10000; // 10 seconds

  useEffect(() => {
    if (!isEnforcing) {
      // Clear kill times when enforcement stops
      lastKillTime.current.clear();
      return;
    }

    // Check for active rules and kill browsers if any are active
    const enforceBlocking = async () => {
      const activeRules = websiteRules.filter(isRuleActive);

      if (activeRules.length === 0) {
        return;
      }

      try {
        // Get all running browser processes
        const browsers = await invoke<AppInfo[]>("get_browser_processes");
        const now = Date.now();

        // Kill all browser processes when websites are blocked
        // This is aggressive but effective - modern browsers bypass hosts file
        for (const browser of browsers) {
          if (!browser.pid || !browser.path) continue;

          // Check if we recently killed this browser
          const lastKill = lastKillTime.current.get(browser.path) || 0;
          const timeSinceLastKill = now - lastKill;

          // Skip if we killed this browser recently (cooldown period)
          if (timeSinceLastKill < KILL_COOLDOWN) {
            console.log(
              `Skipping ${browser.name} - cooldown active (${Math.round(
                (KILL_COOLDOWN - timeSinceLastKill) / 1000
              )}s remaining)`
            );
            continue;
          }

          try {
            await invoke("kill_process", { pid: browser.pid });
            lastKillTime.current.set(browser.path, now);
            console.log(
              `Killed browser ${browser.name} (PID: ${browser.pid}) - ${activeRules.length} website rule(s) active`
            );
          } catch (error) {
            console.error(`Failed to kill browser ${browser.name}:`, error);
          }
        }
      } catch (error) {
        console.error("Failed to enforce website blocking:", error);
      }
    };

    // Check immediately
    enforceBlocking();

    // Check every 2 seconds (same as app blocking)
    const interval = setInterval(() => {
      enforceBlocking();
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [isEnforcing, websiteRules]);
}
