import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import { storage } from "@/lib/storage";
import { generateId } from "@/lib/helpers";

interface KillswitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function KillswitchDialog({
  open,
  onOpenChange,
}: KillswitchDialogProps) {
  const { settings, updateSettings } = useSettings();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleKillswitch = async () => {
    setLoading(true);

    // Disable all blocking
    updateSettings({ blockingEnabled: false });

    // Send webhook if enabled
    if (
      settings.webhookEnabled &&
      settings.webhookUrl &&
      settings.sendKillswitchNotifications
    ) {
      try {
        await invoke("send_discord_webhook", {
          webhookUrl: settings.webhookUrl,
          message:
            "🚨 **KILLSWITCH ACTIVATED** 🚨\n\nAll blocking has been disabled for safety reasons.",
        });
      } catch (error) {
        console.error("Failed to send webhook:", error);
      }
    }

    // Log event
    storage.addEvent({
      id: generateId(),
      type: "killswitch",
      target: "System",
      timestamp: Date.now(),
      message: "Killswitch activated - all blocking disabled",
    });

    setLoading(false);
    setConfirming(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <DialogTitle>Killswitch</DialogTitle>
          </div>
          <DialogDescription>
            This will immediately disable all blocking without requiring a PIN
          </DialogDescription>
        </DialogHeader>

        {!confirming ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-destructive/10 p-4 text-sm">
              <p className="font-medium text-destructive mb-2">
                Emergency Use Only
              </p>
              <p className="text-muted-foreground">
                The killswitch is for safety and emergency situations. Using it
                will:
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• Disable all blocking immediately</li>
                <li>
                  • Send a notification to your Discord webhook (if configured)
                </li>
                <li>• Log the event</li>
              </ul>
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
                variant="destructive"
                onClick={() => setConfirming(true)}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you absolutely sure? This action will notify your
              accountability partner (if configured) that you used the
              killswitch.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirming(false)}
                className="flex-1"
              >
                Go Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleKillswitch}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Activating..." : "Activate Killswitch"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
