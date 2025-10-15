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
      {/* Status Card with gradient */}
      <Card className="overflow-hidden card-animate shadow-lg border-2">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-600/5 pointer-events-none" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <div className={`p-2 rounded-lg ${settings.blockingEnabled ? 'bg-green-500/10' : 'bg-muted'}`}>
                  {settings.blockingEnabled ? (
                    <Power className="h-5 w-5 text-green-500" />
                  ) : (
                    <PowerOff className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                Blocking Status
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {settings.blockingEnabled ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    ✓ {activeRulesCount} active rule{activeRulesCount !== 1 ? "s" : ""} running
                  </span>
                ) : (
                  "Blocking is currently disabled"
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <Label htmlFor="blocking-toggle" className="cursor-pointer text-base font-medium">
                  {settings.blockingEnabled ? "Enabled" : "Disabled"}
                </Label>
              </div>
              <Switch
                id="blocking-toggle"
                checked={settings.blockingEnabled}
                onCheckedChange={handleToggleBlocking}
                className="scale-110"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between card-animate">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Block Rules
          </h2>
          <p className="text-base text-muted-foreground mt-1">
            Manage applications and websites you want to block
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="default"
            onClick={() => setShowKillswitch(true)}
            className="text-destructive hover:text-destructive border-2 transition-all duration-200 hover:scale-105"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Killswitch
          </Button>
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="shadow-lg transition-all duration-200 hover:scale-105"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Block Rule
          </Button>
        </div>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <Card className="card-animate shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-gradient-to-br from-primary/10 to-purple-600/10 mb-4">
              <Power className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No block rules yet</h3>
            <p className="text-base text-muted-foreground text-center mb-6 max-w-md">
              Add your first block rule to start controlling your apps and stay focused
            </p>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="shadow-lg transition-all duration-200 hover:scale-105"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
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
