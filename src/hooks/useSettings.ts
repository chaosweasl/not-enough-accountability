import { useState, useCallback } from "react";
import { AppSettings } from "@/types";
import { storage } from "@/lib/storage";

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(
    storage.getSettings()
  );

  const setSettings = useCallback(
    (newSettings: AppSettings | ((prev: AppSettings) => AppSettings)) => {
      setSettingsState((prev) => {
        const updated =
          typeof newSettings === "function" ? newSettings(prev) : newSettings;
        storage.saveSettings(updated);
        return updated;
      });
    },
    []
  );

  const updateSettings = useCallback(
    (updates: Partial<AppSettings>) => {
      setSettings((prev) => ({ ...prev, ...updates }));
    },
    [setSettings]
  );

  return { settings, setSettings, updateSettings };
}
