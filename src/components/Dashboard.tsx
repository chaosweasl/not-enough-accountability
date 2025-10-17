import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Power, PowerOff, Plus, AlertTriangle } from "lucide-react";
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
import { useSettings } from "@/hooks/useSettings";
import { useBlockerContext } from "@/contexts/BlockerContext";
import { isRuleActive } from "@/lib/helpers";
import BlockRuleDialog from "./BlockRuleDialog";
import PinDialog from "./PinDialog";
import KillswitchDialog from "./KillswitchDialog";
import BlockRuleCard from "./BlockRuleCard";

export default function Dashboard() {
  const { settings, updateSettings } = useSettings();
  const { rules, setIsEnforcing, removeRule, updateRule } = useBlockerContext();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [showKillswitch, setShowKillswitch] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const activeRulesCount = rules.filter(isRuleActive).length;

  const handleToggleBlocking = async () => {
    if (settings.blockingEnabled) {
      // Need PIN to disable
      setPendingAction(() => async () => {
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
      setShowPinDialog(true);
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
    setPendingAction(() => async () => {
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
    setShowPinDialog(true);
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
                      Active • {activeRulesCount} rule
                      {activeRulesCount !== 1 ? "s" : ""} enforced
                    </span>
                  ) : (
                    "Protection is currently disabled"
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
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Block Rule
          </Button>
        </div>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Power className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No block rules yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
              Create your first block rule to start managing distracting apps
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Rule
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

      {/* Dialogs */}
      <BlockRuleDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
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
