import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBlockerContext } from "@/contexts/BlockerContext";
import { useSettings } from "@/hooks/useSettings";
import { AppInfo, BlockRule } from "@/types";
import { generateId } from "@/lib/helpers";
import { storage } from "@/lib/storage";

interface BlockRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BlockRuleDialog({
  open,
  onOpenChange,
}: BlockRuleDialogProps) {
  const { addRule } = useBlockerContext();
  const { settings } = useSettings();
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);

  // Rule configuration
  const [ruleType, setRuleType] = useState<"timer" | "schedule" | "permanent">(
    "permanent"
  );
  const [duration, setDuration] = useState("30");
  const [days, setDays] = useState<number[]>([]);
  const [startHour, setStartHour] = useState("9");
  const [startMinute, setStartMinute] = useState("0");
  const [endHour, setEndHour] = useState("17");
  const [endMinute, setEndMinute] = useState("0");

  useEffect(() => {
    if (open) {
      loadApps();
    }
  }, [open]);

  const loadApps = async () => {
    setLoading(true);
    try {
      // Get both running processes and installed apps
      const [runningProcesses, installedApps] = await Promise.all([
        invoke<AppInfo[]>("get_running_processes"),
        invoke<AppInfo[]>("get_installed_apps"),
      ]);

      // Filter to only include valid executable paths (.exe files)
      // This prevents adding installer/uninstaller paths or other non-executable items
      const filterValidExecutables = (apps: AppInfo[]) => {
        return apps.filter((app) => {
          const pathLower = app.path.toLowerCase();
          // Must have .exe extension and not be an uninstaller
          return (
            pathLower.endsWith(".exe") &&
            !pathLower.includes("uninstall") &&
            !pathLower.includes("uninst") &&
            app.path.trim() !== ""
          );
        });
      };

      const validRunningProcesses = filterValidExecutables(runningProcesses);
      const validInstalledApps = filterValidExecutables(installedApps);

      // Merge and deduplicate by executable path (not just name)
      // This prevents the same app from being added multiple times
      const allApps = [...validRunningProcesses, ...validInstalledApps];
      const uniqueApps = Array.from(
        new Map(allApps.map((app) => [app.path.toLowerCase(), app])).values()
      );

      // Sort alphabetically by name
      uniqueApps.sort((a, b) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );

      setApps(uniqueApps);
    } catch (error) {
      console.error("Failed to load apps:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = apps.filter((app) =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddRule = async () => {
    if (!selectedApp) return;

    const rule: BlockRule = {
      id: generateId(),
      appName: selectedApp.name,
      appPath: selectedApp.path,
      type: ruleType,
      isActive: true,
      createdAt: Date.now(),
    };

    if (ruleType === "timer") {
      rule.duration = parseInt(duration);
      rule.startTime = Date.now();
    } else if (ruleType === "schedule") {
      rule.days = days;
      rule.startHour = parseInt(startHour);
      rule.startMinute = parseInt(startMinute);
      rule.endHour = parseInt(endHour);
      rule.endMinute = parseInt(endMinute);
    }

    addRule(rule);

    // Send webhook notification if enabled
    if (
      settings.webhookEnabled &&
      settings.webhookUrl &&
      settings.sendBlockNotifications
    ) {
      try {
        let message = `🚫 **Application Blocked**\n\n**App:** ${selectedApp.name}\n**Type:** ${ruleType}`;

        if (ruleType === "timer") {
          message += `\n**Duration:** ${duration} minutes`;
        } else if (ruleType === "schedule") {
          const dayNames = days
            .map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
            .join(", ");
          message += `\n**Days:** ${dayNames}\n**Time:** ${startHour}:${startMinute.padStart(
            2,
            "0"
          )} - ${endHour}:${endMinute.padStart(2, "0")}`;
        }

        await invoke("send_discord_webhook", {
          webhookUrl: settings.webhookUrl,
          message,
        });
      } catch (error) {
        console.error("Failed to send webhook:", error);
      }
    }

    // Log event
    storage.addEvent({
      id: generateId(),
      type: "block",
      target: selectedApp.name,
      timestamp: Date.now(),
      message: `Blocked ${selectedApp.name} (${ruleType})`,
    });

    // Reset and close
    resetDialog();
    onOpenChange(false);
  };

  const toggleDay = (day: number) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const resetDialog = () => {
    setSelectedApp(null);
    setSearchTerm("");
    setRuleType("permanent");
    setDuration("30");
    setDays([]);
    setStartHour("9");
    setStartMinute("0");
    setEndHour("17");
    setEndMinute("0");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetDialog();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-8 pt-8 pb-6 border-b">
          <DialogTitle className="text-3xl font-bold">
            Add Block Rule
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Select an application and configure when it should be blocked
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="space-y-10">
            {/* App Selection */}
            <div className="space-y-5">
              <Label className="text-xl font-semibold">
                Select Application
              </Label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search apps (running or installed)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 text-base"
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16 rounded-xl bg-muted/30">
                  <p className="text-base text-muted-foreground">
                    Loading applications...
                  </p>
                </div>
              ) : (
                <div className="rounded-xl max-h-96 overflow-y-auto bg-card border shadow-sm">
                  {filteredApps.length === 0 ? (
                    <div className="p-16 text-center">
                      <p className="text-base text-muted-foreground font-medium">
                        No applications found
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Try searching for a different term
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {filteredApps.slice(0, 50).map((app) => (
                        <button
                          key={`${app.name}-${app.path}`}
                          onClick={() => setSelectedApp(app)}
                          className={`w-full px-6 py-5 text-left hover:bg-accent/50 transition-all duration-200 ${
                            selectedApp?.path === app.path
                              ? "bg-primary/10 border-l-4 border-primary"
                              : "border-l-4 border-transparent"
                          }`}
                        >
                          <p className="font-semibold text-base mb-2">
                            {app.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {app.path}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected App and Rule Configuration */}
            {selectedApp ? (
              <div className="space-y-8 animate-in fade-in-50 duration-300">
                <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-8">
                  <p className="text-xs font-bold text-muted-foreground mb-3 tracking-wide">
                    SELECTED APPLICATION
                  </p>
                  <p className="text-lg font-bold mb-2">{selectedApp.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {selectedApp.path}
                  </p>
                </div>

                {/* Rule Type */}
                <div className="space-y-5">
                  <Label className="text-xl font-semibold">Block Type</Label>
                  <Tabs
                    value={ruleType}
                    onValueChange={(v) => setRuleType(v as any)}
                  >
                    <TabsList className="grid w-full grid-cols-3 h-14 p-1">
                      <TabsTrigger
                        value="permanent"
                        className="text-base font-semibold"
                      >
                        Permanent
                      </TabsTrigger>
                      <TabsTrigger
                        value="timer"
                        className="text-base font-semibold"
                      >
                        Timer
                      </TabsTrigger>
                      <TabsTrigger
                        value="schedule"
                        className="text-base font-semibold"
                      >
                        Schedule
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent
                      value="permanent"
                      className="mt-8 min-h-[180px]"
                    >
                      <div className="rounded-xl bg-muted/50 p-8 border">
                        <p className="text-lg text-foreground">
                          🔒 Block this app permanently until manually removed
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="timer" className="mt-8 min-h-[180px]">
                      <div className="space-y-5">
                        <Label
                          htmlFor="duration"
                          className="text-base font-medium"
                        >
                          Duration (minutes)
                        </Label>
                        <Input
                          id="duration"
                          type="number"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          min="1"
                          max="1440"
                          className="text-2xl font-bold h-16 text-center"
                        />
                        <p className="text-base text-muted-foreground">
                          ⏱️ Block will automatically expire after this time
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent
                      value="schedule"
                      className="mt-8 min-h-[180px]"
                    >
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <Label className="text-base font-medium">
                            Days of the Week
                          </Label>
                          <div className="flex gap-3">
                            {["S", "M", "T", "W", "T", "F", "S"].map(
                              (day, idx) => (
                                <Button
                                  key={idx}
                                  type="button"
                                  variant={
                                    days.includes(idx) ? "default" : "outline"
                                  }
                                  size="lg"
                                  className="flex-1 h-14 text-lg font-bold"
                                  onClick={() => toggleDay(idx)}
                                >
                                  {day}
                                </Button>
                              )
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <Label className="text-base font-medium">
                              Start Time
                            </Label>
                            <div className="flex gap-3 items-center">
                              <Input
                                type="number"
                                value={startHour}
                                onChange={(e) => setStartHour(e.target.value)}
                                min="0"
                                max="23"
                                placeholder="HH"
                                className="text-center font-mono text-xl h-14"
                              />
                              <span className="text-3xl font-bold text-muted-foreground">
                                :
                              </span>
                              <Input
                                type="number"
                                value={startMinute}
                                onChange={(e) => setStartMinute(e.target.value)}
                                min="0"
                                max="59"
                                placeholder="MM"
                                className="text-center font-mono text-xl h-14"
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label className="text-base font-medium">
                              End Time
                            </Label>
                            <div className="flex gap-3 items-center">
                              <Input
                                type="number"
                                value={endHour}
                                onChange={(e) => setEndHour(e.target.value)}
                                min="0"
                                max="23"
                                placeholder="HH"
                                className="text-center font-mono text-xl h-14"
                              />
                              <span className="text-3xl font-bold text-muted-foreground">
                                :
                              </span>
                              <Input
                                type="number"
                                value={endMinute}
                                onChange={(e) => setEndMinute(e.target.value)}
                                min="0"
                                max="59"
                                placeholder="MM"
                                className="text-center font-mono text-xl h-14"
                              />
                            </div>
                          </div>
                        </div>
                        <p className="text-base text-muted-foreground">
                          📅 Block will be active during the specified time on
                          selected days
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/20 p-20 text-center min-h-[400px] flex items-center justify-center">
                <div>
                  <p className="text-lg text-muted-foreground font-semibold">
                    No application selected
                  </p>
                  <p className="text-base text-muted-foreground mt-3">
                    Search and select an app from the list above
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4 px-8 py-6 border-t bg-muted/30">
          <Button
            variant="outline"
            onClick={() => {
              resetDialog();
              onOpenChange(false);
            }}
            className="flex-1 h-14 text-base font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddRule}
            disabled={!selectedApp}
            className="flex-1 h-14 text-base font-semibold"
          >
            Add Block Rule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
