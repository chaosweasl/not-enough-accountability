import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AppInfo, WebsiteBlockRule } from "@/types";
import { isRuleActive, generateId } from "@/lib/helpers";
import { storage } from "@/lib/storage";
import { useSettings } from "@/hooks/useSettings";

/**
 * Hook that enforces website blocking by killing browser processes
 * when website rules are active.
 *
 * This is more effective than hosts file modification because modern browsers
 * use DNS over HTTPS (DoH) which bypasses the hosts file entirely.
 *
 * IMPORTANT: This implementation kills browsers when rules are active because
 * we cannot reliably detect which specific websites are open in browser tabs.
 * This is intentionally aggressive to prevent circumvention.
 *
 * Implements a 30-second cooldown after killing browsers to:
 * - Give user time to disable blocking if needed
 * - Prevent infinite kill/restart loops
 * - Allow browser to fully close before checking again
 */
export function useWebsiteBlocker(
  websiteRules: WebsiteBlockRule[],
  isEnforcing: boolean
) {
  const { settings } = useSettings();
  // Track when we last killed a browser (path -> timestamp)
  const lastKillTime = useRef<Map<string, number>>(new Map());
  // Track if we've warned the user about browser kills
  const hasWarned = useRef(false);
  const KILL_COOLDOWN = 30000; // 30 seconds (increased from 10s)

  useEffect(() => {
    if (!isEnforcing || !settings.websiteBlockingEnabled) {
      // Clear kill times when enforcement stops or website blocking is disabled
      lastKillTime.current.clear();
      hasWarned.current = false;
      return;
    }

    const activeRules = websiteRules.filter(isRuleActive);

    // Reset warning when no active rules
    if (activeRules.length === 0) {
      hasWarned.current = false;
      return;
    }

    // Show warning on first activation
    if (!hasWarned.current && activeRules.length > 0) {
      hasWarned.current = true;
      console.warn(
        `⚠️ WEBSITE BLOCKING ACTIVE: ${activeRules.length} rule(s) active. Browsers will be closed in 30 seconds if they remain open.`
      );

      // Log warning event
      storage.addEvent({
        id: generateId(),
        type: "violation",
        target: "Website Blocker",
        timestamp: Date.now(),
        message: `Website blocking activated: ${activeRules.length} rule(s) active. Browsers will be monitored.`,
      });
    }

    // Check for active rules and kill browsers if any are active
    const enforceBlocking = async () => {
      const currentActiveRules = websiteRules.filter(isRuleActive);

      if (currentActiveRules.length === 0) {
        return;
      }

      try {
        // Get all running browser processes
        const browsers = await invoke<AppInfo[]>("get_browser_processes");
        const now = Date.now();

        if (browsers.length === 0) {
          return; // No browsers running, nothing to do
        }

        // Kill all browser processes when websites are blocked
        // NOTE: We cannot detect specific tabs/URLs, so we must kill ALL browsers
        // This is intentionally aggressive to prevent accessing blocked sites
        for (const browser of browsers) {
          if (!browser.pid || !browser.path) continue;

          // Check if we recently killed this browser
          const lastKill = lastKillTime.current.get(browser.path) || 0;
          const timeSinceLastKill = now - lastKill;

          // Skip if we killed this browser recently (cooldown period)
          if (timeSinceLastKill < KILL_COOLDOWN) {
            continue;
          }

          try {
            await invoke("kill_process", { pid: browser.pid });
            lastKillTime.current.set(browser.path, now);

            // Log the event
            const blockedDomains = currentActiveRules
              .map((r) => r.domain)
              .join(", ");
            storage.addEvent({
              id: generateId(),
              type: "block",
              target: browser.name,
              timestamp: now,
              message: `Browser blocked due to ${currentActiveRules.length} active website rule(s): ${blockedDomains}`,
            });

            // Send webhook if enabled
            if (
              settings.webhookEnabled &&
              settings.webhookUrl &&
              settings.sendBlockNotifications
            ) {
              try {
                await invoke("send_discord_webhook", {
                  webhookUrl: settings.webhookUrl,
                  message: `🌐 **Browser Blocked**\n\n**Browser:** ${browser.name}\n**Blocked Sites:** ${blockedDomains}\n**Active Rules:** ${currentActiveRules.length}\n\n_Browser will not be killed again for 30 seconds._`,
                });
              } catch (webhookError) {
                console.error("Failed to send webhook:", webhookError);
              }
            }

            console.log(
              `Killed browser ${browser.name} (PID: ${browser.pid}) - ${currentActiveRules.length} website rule(s) active. Cooldown: 30s`
            );
          } catch (error) {
            console.error(`Failed to kill browser ${browser.name}:`, error);
          }
        }
      } catch (error) {
        console.error("Failed to enforce website blocking:", error);
      }
    };

    // Initial warning period - don't check immediately
    // Give user 30 seconds to close browser voluntarily or disable blocking
    const warningTimeout = setTimeout(() => {
      enforceBlocking();
    }, 30000); // Wait 30 seconds before first check

    // Then check every 30 seconds (less frequent than before)
    const interval = setInterval(() => {
      enforceBlocking();
    }, 30000);

    return () => {
      clearTimeout(warningTimeout);
      clearInterval(interval);
    };
  }, [
    isEnforcing,
    websiteRules,
    settings.websiteBlockingEnabled,
    settings.webhookEnabled,
    settings.webhookUrl,
    settings.sendBlockNotifications,
  ]);
}
