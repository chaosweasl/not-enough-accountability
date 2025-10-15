import { useState, useEffect } from "react";
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
import { useBlocker } from "@/hooks/useBlocker";
import { isRuleActive } from "@/lib/helpers";
import BlockRuleDialog from "./BlockRuleDialog";
import PinDialog from "./PinDialog";
import KillswitchDialog from "./KillswitchDialog";
import BlockRuleCard from "./BlockRuleCard";

export default function Dashboard() {
  const { settings, updateSettings } = useSettings();
  const { rules, setIsEnforcing, removeRule, updateRule } = useBlocker();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [showKillswitch, setShowKillswitch] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const activeRulesCount = rules.filter(isRuleActive).length;

  const handleToggleBlocking = () => {
    if (settings.blockingEnabled) {
      // Need PIN to disable
      setPendingAction(() => () => {
        updateSettings({ blockingEnabled: false });
        setIsEnforcing(false);
      });
      setShowPinDialog(true);
    } else {
      updateSettings({ blockingEnabled: true });
      setIsEnforcing(true);
    }
  };

  const handleRemoveRule = (ruleId: string) => {
    setPendingAction(() => () => removeRule(ruleId));
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
                  settings.blockingEnabled
                    ? "bg-green-100 dark:bg-green-900"
                    : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                {settings.blockingEnabled ? (
                  <Power className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <PowerOff className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">Blocking Status</CardTitle>
                <CardDescription>
                  {settings.blockingEnabled ? (
                    <span className="text-green-600 dark:text-green-400">
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
