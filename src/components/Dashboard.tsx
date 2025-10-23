import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Power, PowerOff, Plus, AlertTriangle, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettings } from "@/hooks/useSettings";
import { useBlockerContext } from "@/contexts/BlockerContext";
import { isRuleActive } from "@/lib/helpers";
import { storage } from "@/lib/storage";
import BlockRuleDialog from "./BlockRuleDialog";
import WebsiteRuleDialog from "./WebsiteRuleDialog";
import PinDialog from "./PinDialog";
import KillswitchDialog from "./KillswitchDialog";
import BlockRuleCard from "./BlockRuleCard";
import WebsiteRuleCard from "./WebsiteRuleCard";

export default function Dashboard() {
  const { settings, updateSettings } = useSettings();
  const {
    rules,
    websiteRules,
    setIsEnforcing,
    removeRule,
    removeWebsiteRule,
    updateRule,
    updateWebsiteRule,
  } = useBlockerContext();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddWebsiteDialog, setShowAddWebsiteDialog] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [showKillswitch, setShowKillswitch] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const activeRulesCount = rules.filter(isRuleActive).length;
  const activeWebsiteRulesCount = websiteRules.filter(isRuleActive).length;

  // Helper to execute action with PIN check
  const executeWithPinCheck = (action: () => void) => {
    if (storage.isPinSessionValid()) {
      // PIN session is still valid, execute immediately
      action();
    } else {
      // Need PIN verification
      setPendingAction(() => action);
      setShowPinDialog(true);
    }
  };

  const handleToggleBlocking = async () => {
    if (settings.blockingEnabled) {
      // Need PIN to disable
      executeWithPinCheck(async () => {
        updateSettings({ blockingEnabled: false });
        setIsEnforcing(false);

        // Send webhook notification if enabled
        if (
          settings.webhookEnabled &&
          settings.webhookUrl &&
          settings.sendUnblockNotifications
        ) {
          try {
            await invoke("send_discord_webhook", {
              webhookUrl: settings.webhookUrl,
              message:
                "🔓 **Blocking Disabled**\n\nAll application blocking has been disabled.",
            });
          } catch (error) {
            console.error("Failed to send webhook:", error);
          }
        }
      });
    } else {
      updateSettings({ blockingEnabled: true });
      setIsEnforcing(true);

      // Send webhook notification if enabled
      if (
        settings.webhookEnabled &&
        settings.webhookUrl &&
        settings.sendBlockNotifications
      ) {
        try {
          await invoke("send_discord_webhook", {
            webhookUrl: settings.webhookUrl,
            message:
              "🔒 **Blocking Enabled**\n\nAll application blocking has been enabled.",
          });
        } catch (error) {
          console.error("Failed to send webhook:", error);
        }
      }
    }
  };

  const handleRemoveRule = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    executeWithPinCheck(async () => {
      removeRule(ruleId);

      // Send webhook notification if enabled
      if (
        rule &&
        settings.webhookEnabled &&
        settings.webhookUrl &&
        settings.sendUnblockNotifications
      ) {
        try {
          let message = `🗑️ **Block Rule Deleted**\n\n**App:** ${rule.appName}\n**Type:** ${rule.type}`;

          if (rule.type === "timer" && rule.duration) {
            message += `\n**Duration:** ${rule.duration} minutes`;
          } else if (rule.type === "schedule" && rule.days) {
            const dayNames = rule.days
              .map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
              .join(", ");
            message += `\n**Days:** ${dayNames}\n**Time:** ${
              rule.startHour || 0
            }:${String(rule.startMinute || 0).padStart(2, "0")} - ${
              rule.endHour || 0
            }:${String(rule.endMinute || 0).padStart(2, "0")}`;
          }

          await invoke("send_discord_webhook", {
            webhookUrl: settings.webhookUrl,
            message,
          });
        } catch (error) {
          console.error("Failed to send webhook:", error);
        }
      }
    });
  };

  const handleRemoveWebsiteRule = (ruleId: string) => {
    const rule = websiteRules.find((r) => r.id === ruleId);
    executeWithPinCheck(async () => {
      removeWebsiteRule(ruleId);

      // Send webhook notification if enabled
      if (
        rule &&
        settings.webhookEnabled &&
        settings.webhookUrl &&
        settings.sendUnblockNotifications
      ) {
        try {
          let message = `🗑️ **Website Block Rule Deleted**\n\n**Domain:** ${rule.domain}\n**Type:** ${rule.type}`;

          if (rule.type === "timer" && rule.duration) {
            message += `\n**Duration:** ${rule.duration} minutes`;
          } else if (rule.type === "schedule" && rule.days) {
            const dayNames = rule.days
              .map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
              .join(", ");
            message += `\n**Days:** ${dayNames}\n**Time:** ${
              rule.startHour || 0
            }:${String(rule.startMinute || 0).padStart(2, "0")} - ${
              rule.endHour || 0
            }:${String(rule.endMinute || 0).padStart(2, "0")}`;
          }

          await invoke("send_discord_webhook", {
            webhookUrl: settings.webhookUrl,
            message,
          });
        } catch (error) {
          console.error("Failed to send webhook:", error);
        }
      }
    });
  };

  const handlePinVerified = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  useEffect(() => {
    if (settings.blockingEnabled) {
      setIsEnforcing(true);
    }
  }, [settings.blockingEnabled, setIsEnforcing]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  settings.blockingEnabled ? "bg-success/10" : "bg-muted"
                }`}
              >
                {settings.blockingEnabled ? (
                  <Power className="h-5 w-5 text-success" />
                ) : (
                  <PowerOff className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">Blocking Status</CardTitle>
                <CardDescription>
                  {settings.blockingEnabled ? (
                    <span className="text-success">
                      Active • {activeRulesCount} app rule
                      {activeRulesCount !== 1 ? "s" : ""},{" "}
                      {activeWebsiteRulesCount} website rule
                      {activeWebsiteRulesCount !== 1 ? "s" : ""} enforced
                    </span>
                  ) : (
                    "Protection is currently disabled"
                  )}
                  {storage.isPinSessionValid() && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      🔓 PIN session active
                    </Badge>
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Label htmlFor="blocking-toggle" className="text-sm">
                {settings.blockingEnabled ? "Enabled" : "Disabled"}
              </Label>
              <Switch
                id="blocking-toggle"
                checked={settings.blockingEnabled}
                onCheckedChange={handleToggleBlocking}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Block Rules</h2>
          <p className="text-sm text-muted-foreground">
            Manage applications and websites you want to block
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowKillswitch(true)}
            className="text-destructive hover:text-destructive"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Killswitch
          </Button>
        </div>
      </div>

      {/* Rules Tabs */}
      <Tabs defaultValue="apps" className="space-y-4">
        <TabsList>
          <TabsTrigger value="apps">Applications ({rules.length})</TabsTrigger>
          <TabsTrigger value="websites">
            Websites ({websiteRules.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apps" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add App Rule
            </Button>
          </div>

          {rules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                  <Power className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  No app block rules yet
                </h3>
                <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
                  Create your first block rule to start managing distracting
                  apps
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First App Rule
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <BlockRuleCard
                  key={rule.id}
                  rule={rule}
                  onRemove={() => handleRemoveRule(rule.id)}
                  onToggle={(active: boolean) =>
                    updateRule(rule.id, { isActive: active })
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="websites" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddWebsiteDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Website Rule
            </Button>
          </div>

          {websiteRules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-4 rounded-full bg-blue-500/10 mb-4">
                  <Globe className="h-12 w-12 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  No website block rules yet
                </h3>
                <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
                  Block distracting websites by category or add custom domains
                </p>
                <Button onClick={() => setShowAddWebsiteDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Website Rule
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {websiteRules.map((rule) => (
                <WebsiteRuleCard
                  key={rule.id}
                  rule={rule}
                  onRemove={() => handleRemoveWebsiteRule(rule.id)}
                  onToggle={(active: boolean) =>
                    updateWebsiteRule(rule.id, { isActive: active })
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <BlockRuleDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      <WebsiteRuleDialog
        open={showAddWebsiteDialog}
        onOpenChange={setShowAddWebsiteDialog}
      />
      <PinDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        onVerified={handlePinVerified}
      />
      <KillswitchDialog
        open={showKillswitch}
        onOpenChange={setShowKillswitch}
      />
    </div>
  );
}
