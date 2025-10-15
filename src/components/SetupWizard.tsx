import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Shield, Lock, Webhook, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/hooks/useSettings";

export default function SetupWizard() {
  const { updateSettings } = useSettings();
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [enableWebhook, setEnableWebhook] = useState(false);
  const [error, setError] = useState("");

  const handlePinSetup = async () => {
    if (pin.length < 4) {
      setError("PIN must be at least 4 digits");
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    try {
      const hash = await invoke<string>("hash_pin", { pin });
      updateSettings({ pinHash: hash });
      setError("");
      setStep(2);
    } catch (err) {
      setError("Failed to create PIN");
    }
  };

  const handleWebhookSetup = () => {
    if (enableWebhook && !webhookUrl.trim()) {
      setError("Please enter a webhook URL or disable webhook integration");
      return;
    }

    updateSettings({
      webhookUrl: enableWebhook ? webhookUrl : undefined,
      webhookEnabled: enableWebhook,
    });
    setError("");
    setStep(3);
  };

  const handleComplete = () => {
    updateSettings({
      isSetupComplete: true,
      blockingEnabled: true,
    });
    // Force a page reload to pick up the new settings
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-600/10 pointer-events-none" />
      <Card className="w-full max-w-md shadow-2xl border-2 relative card-animate">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold">Welcome to NEU</CardTitle>
          </div>
          <CardDescription className="text-base">
            Not Enough Accountability - Let's set up your accountability tool in
            a few simple steps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: PIN Setup */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Lock className="h-4 w-4" />
                </div>
                <span>Step 1 of 3: Create a PIN</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-base">
                  Create PIN
                </Label>
                <Input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter 4+ digit PIN"
                  maxLength={8}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPin" className="text-base">
                  Confirm PIN
                </Label>
                <Input
                  id="confirmPin"
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Re-enter PIN"
                  maxLength={8}
                  className="h-11"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-lg">
                  {error}
                </p>
              )}
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                💡 This PIN will be required to disable blocking or modify
                settings. Keep it safe!
              </p>
              <Button
                onClick={handlePinSetup}
                className="w-full h-11 shadow-lg"
              >
                Continue →
              </Button>
            </div>
          )}

          {/* Step 2: Webhook Setup */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Webhook className="h-4 w-4" />
                </div>
                <span>Step 2 of 3: Discord Webhook (Optional)</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border-2 bg-card">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">
                    Enable Discord Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when apps are blocked or unblocked
                  </p>
                </div>
                <Switch
                  checked={enableWebhook}
                  onCheckedChange={setEnableWebhook}
                  className="scale-110"
                />
              </div>
              {enableWebhook && (
                <div className="space-y-2">
                  <Label htmlFor="webhook" className="text-base">
                    Discord Webhook URL
                  </Label>
                  <Input
                    id="webhook"
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="h-11"
                  />
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    💡 Create a webhook in Discord: Server Settings →
                    Integrations → Webhooks
                  </p>
                </div>
              )}
              {error && (
                <p className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-lg">
                  {error}
                </p>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-11"
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleWebhookSetup}
                  className="flex-1 h-11 shadow-lg"
                >
                  Continue →
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                <div className="p-1.5 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <span>Step 3 of 3: You're all set!</span>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl bg-gradient-to-br from-primary/10 to-purple-600/10 p-5 border-2">
                  <h3 className="font-semibold text-lg mb-3">
                    What you can do:
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>Block applications on a timer or schedule</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>Monitor running processes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>
                        Block websites (requires browser processes to be killed)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>Get Discord notifications (if enabled)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>Use the killswitch for emergencies</span>
                    </li>
                  </ul>
                </div>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  🔒 This is a free, open-source tool. No data is collected or
                  sent anywhere except to your Discord webhook (if configured).
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1 h-11"
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleComplete}
                  className="flex-1 h-11 shadow-lg"
                >
                  Start Using NEU 🚀
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
