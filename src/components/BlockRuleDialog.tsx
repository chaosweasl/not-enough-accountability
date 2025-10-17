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
      const processes = await invoke<AppInfo[]>("get_running_processes");
      setApps(processes);
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
    setSelectedApp(null);
    setSearchTerm("");
    onOpenChange(false);
  };

  const toggleDay = (day: number) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Block Rule</DialogTitle>
          <DialogDescription>
            Select an application and configure when it should be blocked
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* App Selection */}
          <div className="space-y-2">
            <Label>Select Application</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search running apps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">
                Loading applications...
              </p>
            ) : (
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {filteredApps.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground text-center">
                    No applications found
                  </p>
                ) : (
                  <div className="divide-y">
                    {filteredApps.slice(0, 20).map((app) => (
                      <button
                        key={`${app.name}-${app.path}`}
                        onClick={() => setSelectedApp(app)}
                        className={`w-full p-3 text-left hover:bg-accent transition-colors ${
                          selectedApp?.path === app.path ? "bg-accent" : ""
                        }`}
                      >
                        <p className="font-medium text-sm">{app.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {app.path}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected App and Rule Configuration - Fixed height to prevent jumping */}
          <div className="min-h-[300px]">
            {selectedApp && (
              <>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium">
                    Selected: {selectedApp.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedApp.path}
                  </p>
                </div>

                {/* Rule Type */}
                <Tabs
                  value={ruleType}
                  onValueChange={(v) => setRuleType(v as any)}
                  className="mt-4"
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="permanent">Permanent</TabsTrigger>
                    <TabsTrigger value="timer">Timer</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="permanent"
                    className="space-y-2 min-h-[150px]"
                  >
                    <p className="text-sm text-muted-foreground">
                      Block this app permanently until manually removed
                    </p>
                  </TabsContent>

                  <TabsContent
                    value="timer"
                    className="space-y-3 min-h-[150px]"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        min="1"
                        max="1440"
                      />
                      <p className="text-xs text-muted-foreground">
                        Block will automatically expire after this time
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="schedule"
                    className="space-y-3 min-h-[150px]"
                  >
                    <div className="space-y-2">
                      <Label>Days</Label>
                      <div className="flex gap-2">
                        {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                          <Button
                            key={idx}
                            type="button"
                            variant={days.includes(idx) ? "default" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={() => toggleDay(idx)}
                          >
                            {day}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={startHour}
                            onChange={(e) => setStartHour(e.target.value)}
                            min="0"
                            max="23"
                            placeholder="HH"
                          />
                          <Input
                            type="number"
                            value={startMinute}
                            onChange={(e) => setStartMinute(e.target.value)}
                            min="0"
                            max="59"
                            placeholder="MM"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={endHour}
                            onChange={(e) => setEndHour(e.target.value)}
                            min="0"
                            max="23"
                            placeholder="HH"
                          />
                          <Input
                            type="number"
                            value={endMinute}
                            onChange={(e) => setEndMinute(e.target.value)}
                            min="0"
                            max="59"
                            placeholder="MM"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddRule}
              disabled={!selectedApp}
              className="flex-1"
            >
              Add Rule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
