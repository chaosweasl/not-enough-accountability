import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { BlockRule } from "@/types";
import { storage } from "@/lib/storage";
import { isRuleActive } from "@/lib/helpers";

export function useBlocker() {
  const [rules, setRulesState] = useState<BlockRule[]>(storage.getBlockRules());
  const [isEnforcing, setIsEnforcing] = useState(false);

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
          const matchingProcesses = processes.filter(
            (p) =>
              p.name.toLowerCase().includes(rule.appName.toLowerCase()) ||
              p.path.toLowerCase().includes(rule.appPath.toLowerCase())
          );

          for (const process of matchingProcesses) {
            if (process.pid) {
              await invoke("kill_process", { pid: process.pid });
              console.log(
                `Blocked and killed: ${process.name} (PID: ${process.pid})`
              );
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
