import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Save, Key, Webhook, Bell, Globe } from "lucide-react";
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
  const [pendingAction, setPendingAction] = useState<
    "webhook" | "changePin" | null
  >(null);
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
    setPendingAction("webhook");
    setShowPinDialog(true);
  };

  const handlePinVerified = async () => {
    // Handle webhook toggle
    if (pendingAction === "webhook") {
      updateSettings({ webhookEnabled: !settings.webhookEnabled });
      setPendingAction(null);
    }

    // Handle PIN change
    if (pendingAction === "changePin" && newPin && confirmNewPin) {
      if (newPin.length < 4) {
        setPinError("PIN must be at least 4 digits");
        setShowPinDialog(false);
        return;
      }
      if (newPin !== confirmNewPin) {
        setPinError("PINs do not match");
        setShowPinDialog(false);
        return;
      }

      try {
        const hash = await invoke<string>("hash_pin", { pin: newPin });
        updateSettings({ pinHash: hash });
        setNewPin("");
        setConfirmNewPin("");
        setShowChangePin(false);
        setPinError("");
        setPendingAction(null);
      } catch (error) {
        setPinError("Failed to change PIN");
        setShowPinDialog(false);
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
  };

  const handleConfirmPinChange = () => {
    if (newPin.length < 4) {
      setPinError("PIN must be at least 4 digits");
      return;
    }
    if (newPin !== confirmNewPin) {
      setPinError("PINs do not match");
      return;
    }

    // Clear any previous errors and show PIN dialog to verify current PIN before changing
    setPinError("");
    setPendingAction("changePin");
    setShowPinDialog(true);
  };

  const handlePinDialogClose = (open: boolean) => {
    setShowPinDialog(open);
    if (!open && pendingAction !== "changePin") {
      // Only reset if we're not in the middle of a PIN change
      setPendingAction(null);
    } else if (!open && pendingAction === "changePin") {
      // If closing during PIN change without verification, reset the form
      setShowChangePin(false);
      setNewPin("");
      setConfirmNewPin("");
      setPinError("");
      setPendingAction(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground text-lg">
          Configure your accountability preferences
        </p>
      </div>

      <div className="space-y-6 max-w-4xl">
        <div className="card-animate">
          <h2 className="text-3xl font-bold gradient-text">Settings</h2>
          <p className="text-base text-muted-foreground mt-1.5">
            Configure your accountability preferences
          </p>
        </div>

        {/* PIN Settings */}
        <Card className="border-2 hover:shadow-xl transition-all duration-300 hover:border-primary/30">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 gradient-primary blur-xl opacity-20"></div>
                <div className="relative p-3 rounded-xl gradient-primary shadow-lg">
                  <Key className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">
                  PIN Protection
                </CardTitle>
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
              size="lg"
              className="gradient-primary shadow-lg shadow-primary/25 font-semibold hover:shadow-xl hover:scale-105"
            >
              <Key className="mr-2 h-5 w-5" />
              Change PIN
            </Button>

            {showChangePin && !showPinDialog && (
              <div className="space-y-4 p-6 border-2 rounded-xl bg-gradient-to-br from-muted/30 to-background shadow-inner">
                <div className="space-y-2">
                  <Label htmlFor="new-pin" className="text-base font-medium">
                    New PIN
                  </Label>
                  <Input
                    id="new-pin"
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Enter new PIN"
                    maxLength={8}
                    className="h-12 border-2 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="confirm-new-pin"
                    className="text-base font-medium"
                  >
                    Confirm New PIN
                  </Label>
                  <Input
                    id="confirm-new-pin"
                    type="password"
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value)}
                    placeholder="Re-enter new PIN"
                    maxLength={8}
                    className="h-12 border-2 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                {pinError && (
                  <div className="rounded-lg p-3.5 bg-destructive/10 border-2 border-destructive/20">
                    <p className="text-sm text-destructive font-semibold">
                      ⚠️ {pinError}
                    </p>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowChangePin(false);
                      setNewPin("");
                      setConfirmNewPin("");
                      setPinError("");
                    }}
                    className="flex-1 h-11 border-2 font-semibold hover:bg-muted hover:text-foreground"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmPinChange}
                    disabled={!newPin || !confirmNewPin}
                    className="flex-1 h-11 shadow-md bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 font-semibold"
                  >
                    Confirm Change
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Website Blocking Settings */}
        <Card className="border-2 hover:shadow-xl transition-all duration-300 hover:border-primary/30">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 gradient-primary blur-xl opacity-20"></div>
                <div className="relative p-3 rounded-xl gradient-primary shadow-lg">
                  <Globe className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">
                  Website Blocking
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Enable or disable browser-level website blocking
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-5 rounded-xl border-2 bg-gradient-to-br from-muted/20 to-background shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="space-y-1">
                <Label className="text-base font-semibold">
                  Enable Website Blocking
                </Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, browsers will be closed when website rules are
                  active
                </p>
              </div>
              <Switch
                checked={settings.websiteBlockingEnabled}
                onCheckedChange={(checked) =>
                  updateSettings({ websiteBlockingEnabled: checked })
                }
                className="scale-125 shadow-md"
              />
            </div>
            <div className="rounded-lg p-4 bg-blue-500/10 border-2 border-blue-500/20">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                ℹ️ Website blocking works by terminating browser processes when
                active rules match. This is more effective than hosts file
                blocking because modern browsers bypass the hosts file using DNS
                over HTTPS.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Discord Webhook */}
        <Card className="border-2 hover:shadow-xl transition-all duration-300 hover:border-primary/30">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 gradient-primary blur-xl opacity-20"></div>
                <div className="relative p-3 rounded-xl gradient-primary shadow-lg">
                  <Webhook className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">
                  Discord Integration
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Get notifications in Discord when apps are blocked or
                  unblocked
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between p-5 rounded-xl border-2 bg-gradient-to-br from-muted/20 to-background shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="space-y-1">
                <Label className="text-base font-semibold flex items-center gap-2">
                  Enable Discord Notifications
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    PIN Required
                  </span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Requires PIN verification to enable/disable
                </p>
              </div>
              <Switch
                checked={settings.webhookEnabled}
                onCheckedChange={handleToggleWebhook}
                className="scale-125 shadow-md"
              />
            </div>

            {settings.webhookEnabled && (
              <div className="space-y-4 p-5 rounded-xl border-2 bg-gradient-to-br from-muted/10 to-background">
                <div className="space-y-2">
                  <Label
                    htmlFor="webhook-url"
                    className="text-base font-medium"
                  >
                    Webhook URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="webhook-url"
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://discord.com/api/webhooks/..."
                      className="h-11 border-2 focus:ring-2 focus:ring-primary/20"
                    />
                    <Button
                      onClick={handleSaveWebhook}
                      className="shadow-md px-6 font-semibold"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleTestWebhook}
                  disabled={testingWebhook}
                  className="border-2 font-semibold w-full h-11"
                >
                  {testingWebhook ? "Testing..." : "Test Webhook"}
                </Button>

                {webhookTestResult && (
                  <div
                    className={`rounded-lg p-4 border shadow-sm ${
                      webhookTestResult.startsWith("✅")
                        ? "bg-success/10 border-success/30"
                        : "bg-destructive/10 border-destructive/30"
                    }`}
                  >
                    <p className="text-sm font-semibold">{webhookTestResult}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="border-2 hover:shadow-xl transition-all duration-300 hover:border-primary/30">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 gradient-primary blur-xl opacity-20"></div>
                <div className="relative p-3 rounded-xl gradient-primary shadow-lg">
                  <Bell className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Choose what events trigger Discord notifications
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-5 rounded-xl border-2 bg-gradient-to-br from-muted/20 to-background shadow-sm hover:shadow-md transition-all duration-200">
              <div className="space-y-1">
                <Label className="text-base font-semibold">
                  Block Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when apps are blocked
                </p>
              </div>
              <Switch
                checked={settings.sendBlockNotifications}
                onCheckedChange={(checked) =>
                  updateSettings({ sendBlockNotifications: checked })
                }
                className="scale-125 shadow-md"
              />
            </div>
            <div className="flex items-center justify-between p-5 rounded-xl border-2 bg-gradient-to-br from-muted/20 to-background shadow-sm hover:shadow-md transition-all duration-200">
              <div className="space-y-1">
                <Label className="text-base font-semibold">
                  Unblock Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when apps are unblocked
                </p>
              </div>
              <Switch
                checked={settings.sendUnblockNotifications}
                onCheckedChange={(checked) =>
                  updateSettings({ sendUnblockNotifications: checked })
                }
                className="scale-125 shadow-md"
              />
            </div>
            <div className="flex items-center justify-between p-5 rounded-xl border-2 bg-gradient-to-br from-muted/20 to-background shadow-sm hover:shadow-md transition-all duration-200">
              <div className="space-y-1">
                <Label className="text-base font-semibold">
                  Killswitch Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when the emergency killswitch is activated
                </p>
              </div>
              <Switch
                checked={settings.sendKillswitchNotifications}
                onCheckedChange={(checked) =>
                  updateSettings({ sendKillswitchNotifications: checked })
                }
                className="scale-125 shadow-md"
              />
            </div>
          </CardContent>
        </Card>

        <PinDialog
          open={showPinDialog}
          onOpenChange={handlePinDialogClose}
          onVerified={handlePinVerified}
        />
      </div>
    </div>
  );
}
