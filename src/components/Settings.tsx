import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Save, Key, Webhook, Bell } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/hooks/useSettings";
import PinDialog from "./PinDialog";

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const [webhookUrl, setWebhookUrl] = useState(settings.webhookUrl || "");
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<
    Partial<typeof settings>
  >({});
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<string>("");

  const [showChangePin, setShowChangePin] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [pinError, setPinError] = useState("");

  const handleSaveWebhook = () => {
    updateSettings({ webhookUrl });
  };

  const handleToggleWebhook = () => {
    setPendingChanges({ webhookEnabled: !settings.webhookEnabled });
    setShowPinDialog(true);
  };

  const handlePinVerified = async () => {
    if (pendingChanges.webhookEnabled !== undefined) {
      updateSettings(pendingChanges);
      setPendingChanges({});
    }

    if (showChangePin && newPin) {
      if (newPin.length < 4) {
        setPinError("PIN must be at least 4 digits");
        return;
      }
      if (newPin !== confirmNewPin) {
        setPinError("PINs do not match");
        return;
      }

      try {
        const hash = await invoke<string>("hash_pin", { pin: newPin });
        updateSettings({ pinHash: hash });
        setNewPin("");
        setConfirmNewPin("");
        setShowChangePin(false);
        setPinError("");
      } catch (error) {
        setPinError("Failed to change PIN");
      }
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      setWebhookTestResult("Please enter a webhook URL first");
      return;
    }

    setTestingWebhook(true);
    setWebhookTestResult("");

    try {
      await invoke("send_discord_webhook", {
        webhookUrl,
        message:
          "✅ **Test Message**\n\nYour Discord webhook is working correctly!",
      });
      setWebhookTestResult("✅ Webhook test successful!");
    } catch (error) {
      setWebhookTestResult("❌ Webhook test failed. Check your URL.");
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleChangePinClick = () => {
    setShowChangePin(true);
    setShowPinDialog(true);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="card-animate">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Settings
        </h2>
        <p className="text-base text-muted-foreground mt-1">
          Configure your accountability preferences
        </p>
      </div>

      {/* PIN Settings */}
      <Card className="card-animate shadow-md border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">PIN Protection</CardTitle>
              <CardDescription className="text-base mt-1">
                Your PIN is required to disable blocking or modify sensitive
                settings
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleChangePinClick}
            className="shadow-md transition-all duration-200 hover:scale-105"
          >
            Change PIN
          </Button>

          {showChangePin && !showPinDialog && (
            <div className="space-y-4 p-5 border-2 rounded-xl bg-gradient-to-br from-muted/50 to-background">
              <div className="space-y-2">
                <Label htmlFor="new-pin" className="text-base">New PIN</Label>
                <Input
                  id="new-pin"
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Enter new PIN"
                  maxLength={8}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-pin" className="text-base">Confirm New PIN</Label>
                <Input
                  id="confirm-new-pin"
                  type="password"
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value)}
                  placeholder="Re-enter new PIN"
                  maxLength={8}
                  className="h-11"
                />
              </div>
              {pinError && (
                <p className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-lg">{pinError}</p>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowChangePin(false);
                    setNewPin("");
                    setConfirmNewPin("");
                    setPinError("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => setShowPinDialog(true)}
                  className="flex-1 shadow-md"
                >
                  Confirm Change
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discord Webhook */}
      <Card className="card-animate shadow-md border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Webhook className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Discord Integration</CardTitle>
              <CardDescription className="text-base mt-1">
                Get notifications in Discord when apps are blocked or unblocked
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border-2 bg-card">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Enable Discord Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Requires PIN verification to enable/disable
              </p>
            </div>
            <Switch
              checked={settings.webhookEnabled}
              onCheckedChange={handleToggleWebhook}
              className="scale-110"
            />
          </div>

          {settings.webhookEnabled && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="webhook-url" className="text-base">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-url"
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                  />
                  <Button onClick={handleSaveWebhook}>
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleTestWebhook}
                disabled={testingWebhook}
              >
                {testingWebhook ? "Testing..." : "Test Webhook"}
              </Button>

              {webhookTestResult && (
                <p className="text-sm">{webhookTestResult}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
          <CardDescription>
            Choose what events trigger Discord notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Block Notifications</Label>
            <Switch
              checked={settings.sendBlockNotifications}
              onCheckedChange={(checked) =>
                updateSettings({ sendBlockNotifications: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Unblock Notifications</Label>
            <Switch
              checked={settings.sendUnblockNotifications}
              onCheckedChange={(checked) =>
                updateSettings({ sendUnblockNotifications: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Killswitch Notifications</Label>
            <Switch
              checked={settings.sendKillswitchNotifications}
              onCheckedChange={(checked) =>
                updateSettings({ sendKillswitchNotifications: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <PinDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        onVerified={handlePinVerified}
      />
    </div>
  );
}
