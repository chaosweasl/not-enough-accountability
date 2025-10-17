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
import { useBlocker } from "@/hooks/useBlocker";
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
  const { addRule } = useBlocker();
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border-2">
        <DialogHeader className="space-y-3 pb-2">
          <DialogTitle className="text-2xl font-bold">
            Add Block Rule
          </DialogTitle>
          <DialogDescription className="text-base">
            Select an application and configure when it should be blocked
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 overflow-y-auto flex-1 pr-2 py-2">
          {/* App Selection */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Select Application</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search apps (running or installed)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base border-2"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12 border-2 rounded-lg bg-muted/30">
                <p className="text-base text-muted-foreground">
                  Loading applications...
                </p>
              </div>
            ) : (
              <div className="border-2 rounded-lg max-h-72 overflow-y-auto bg-background">
                {filteredApps.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-base text-muted-foreground">
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
                        className={`w-full p-5 text-left hover:bg-accent/50 transition-all duration-200 ${
                          selectedApp?.path === app.path
                            ? "bg-primary/10 border-l-4 border-primary"
                            : "border-l-4 border-transparent"
                        }`}
                      >
                        <p className="font-medium text-base mb-1.5">
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
            <div className="space-y-6 animate-in fade-in-50 duration-300">
              <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-5">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  SELECTED APP
                </p>
                <p className="text-base font-bold">{selectedApp.name}</p>
                <p className="text-sm text-muted-foreground truncate mt-1.5">
                  {selectedApp.path}
                </p>
              </div>

              {/* Rule Type */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Block Type</Label>
                <Tabs
                  value={ruleType}
                  onValueChange={(v) => setRuleType(v as any)}
                >
                  <TabsList className="grid w-full grid-cols-3 h-12">
                    <TabsTrigger value="permanent" className="text-base">
                      Permanent
                    </TabsTrigger>
                    <TabsTrigger value="timer" className="text-base">
                      Timer
                    </TabsTrigger>
                    <TabsTrigger value="schedule" className="text-base">
                      Schedule
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="permanent"
                    className="space-y-2 mt-6 min-h-[140px]"
                  >
                    <div className="rounded-lg border-2 bg-muted/50 p-6">
                      <p className="text-base text-muted-foreground">
                        🔒 Block this app permanently until manually removed
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="timer"
                    className="space-y-3 mt-6 min-h-[140px]"
                  >
                    <div className="space-y-3">
                      <Label htmlFor="duration" className="text-base">
                        Duration (minutes)
                      </Label>
                      <Input
                        id="duration"
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        min="1"
                        max="1440"
                        className="text-xl font-semibold h-14 border-2"
                      />
                      <p className="text-sm text-muted-foreground">
                        ⏱️ Block will automatically expire after this time
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="schedule"
                    className="space-y-5 mt-6 min-h-[140px]"
                  >
                    <div className="space-y-3">
                      <Label className="text-base">Days of the Week</Label>
                      <div className="flex gap-2">
                        {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                          <Button
                            key={idx}
                            type="button"
                            variant={days.includes(idx) ? "default" : "outline"}
                            size="sm"
                            className="flex-1 transition-all h-11 text-base font-semibold"
                            onClick={() => toggleDay(idx)}
                          >
                            {day}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-3">
                        <Label className="text-base">Start Time</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            value={startHour}
                            onChange={(e) => setStartHour(e.target.value)}
                            min="0"
                            max="23"
                            placeholder="HH"
                            className="text-center font-mono text-lg h-12 border-2"
                          />
                          <span className="text-2xl font-bold text-muted-foreground">
                            :
                          </span>
                          <Input
                            type="number"
                            value={startMinute}
                            onChange={(e) => setStartMinute(e.target.value)}
                            min="0"
                            max="59"
                            placeholder="MM"
                            className="text-center font-mono text-lg h-12 border-2"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base">End Time</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            value={endHour}
                            onChange={(e) => setEndHour(e.target.value)}
                            min="0"
                            max="23"
                            placeholder="HH"
                            className="text-center font-mono text-lg h-12 border-2"
                          />
                          <span className="text-2xl font-bold text-muted-foreground">
                            :
                          </span>
                          <Input
                            type="number"
                            value={endMinute}
                            onChange={(e) => setEndMinute(e.target.value)}
                            min="0"
                            max="59"
                            placeholder="MM"
                            className="text-center font-mono text-lg h-12 border-2"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      📅 Block will be active during the specified time on
                      selected days
                    </p>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/20 p-12 text-center min-h-[350px] flex items-center justify-center">
              <div>
                <p className="text-base text-muted-foreground font-medium">
                  No application selected
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Search and select an app from the list above
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-6 border-t-2 mt-2">
          <Button
            variant="outline"
            onClick={() => {
              resetDialog();
              onOpenChange(false);
            }}
            className="flex-1 h-12 text-base font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddRule}
            disabled={!selectedApp}
            className="flex-1 h-12 text-base font-semibold"
          >
            Add Block Rule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
