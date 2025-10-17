import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { BlockRule } from "@/types";
import { storage } from "@/lib/storage";
import { isRuleActive } from "@/lib/helpers";

export function useBlocker() {
  const [rules, setRulesState] = useState<BlockRule[]>([]);
  const [isEnforcing, setIsEnforcing] = useState(false);

  // Load rules on mount and when localStorage changes
  useEffect(() => {
    const loadRules = () => {
      const storedRules = storage.getBlockRules();
      setRulesState(storedRules);
    };

    // Load initial rules
    loadRules();

    // Listen for storage changes (e.g., from other tabs or components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "neu_block_rules") {
        loadRules();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const setRules = useCallback(
    (newRules: BlockRule[] | ((prev: BlockRule[]) => BlockRule[])) => {
      setRulesState((prev) => {
        const updated =
          typeof newRules === "function" ? newRules(prev) : newRules;
        storage.saveBlockRules(updated);
        return updated;
      });
    },
    []
  );

  const addRule = useCallback(
    (rule: BlockRule) => {
      setRules((prev) => [...prev, rule]);
    },
    [setRules]
  );

  const removeRule = useCallback(
    (ruleId: string) => {
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    },
    [setRules]
  );

  const updateRule = useCallback(
    (ruleId: string, updates: Partial<BlockRule>) => {
      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, ...updates } : r))
      );
    },
    [setRules]
  );

  // Enforcement loop
  useEffect(() => {
    if (!isEnforcing) return;

    const interval = setInterval(async () => {
      const activeRules = rules.filter(isRuleActive);

      if (activeRules.length === 0) return;

      try {
        const processes = await invoke<any[]>("get_running_processes");

        for (const rule of activeRules) {
          // Improved matching logic:
          // 1. Compare normalized executable paths directly for exact matches
          // 2. As fallback, check if process name matches app name (for running processes without full path)
          const rulePathNormalized = rule.appPath
            .toLowerCase()
            .replace(/\\/g, "/");
          const ruleNameNormalized = rule.appName.toLowerCase();

          const matchingProcesses = processes.filter((p) => {
            const processPath = (p.path || "")
              .toLowerCase()
              .replace(/\\/g, "/");
            const processName = (p.name || "").toLowerCase();

            // Primary match: exact executable path match
            if (
              processPath &&
              rulePathNormalized &&
              processPath === rulePathNormalized
            ) {
              return true;
            }

            // Secondary match: executable filename match (last part of path)
            // This handles cases where the full path might differ slightly
            const ruleExeName = rulePathNormalized.split("/").pop() || "";
            const processExeName = processPath.split("/").pop() || "";

            if (
              ruleExeName &&
              processExeName &&
              ruleExeName === processExeName
            ) {
              return true;
            }

            // Tertiary match: process name match (for processes without full path info)
            // Only match if names are very similar (not just contains)
            if (processName && ruleNameNormalized) {
              // Remove .exe extension for comparison
              const cleanProcessName = processName.replace(".exe", "");
              const cleanRuleName = ruleNameNormalized.replace(".exe", "");

              if (cleanProcessName === cleanRuleName) {
                return true;
              }
            }

            return false;
          });

          for (const process of matchingProcesses) {
            if (process.pid) {
              try {
                await invoke("kill_process", { pid: process.pid });
                console.log(
                  `Blocked and killed: ${process.name} (PID: ${process.pid}) - matched rule: ${rule.appName}`
                );
              } catch (error) {
                console.error(`Failed to kill process ${process.pid}:`, error);
              }
            }
          }
        }
      } catch (error) {
        console.error("Enforcement error:", error);
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [isEnforcing, rules]);

  return {
    rules,
    setRules,
    addRule,
    removeRule,
    updateRule,
    isEnforcing,
    setIsEnforcing,
  };
}
