import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import { storage } from "@/lib/storage";

interface PinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
}

export default function PinDialog({
  open,
  onOpenChange,
  onVerified,
}: PinDialogProps) {
  const { settings } = useSettings();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!settings.pinHash) {
      setError("No PIN configured");
      return;
    }

    setLoading(true);
    try {
      const isValid = await invoke<boolean>("verify_pin", {
        storedHash: settings.pinHash,
        inputPin: pin,
      });

      if (isValid) {
        setError("");
        setPin("");
        // Set PIN session (valid for 10 minutes)
        storage.setPinSession();
        onVerified();
        onOpenChange(false);
      } else {
        setError("Incorrect PIN");
      }
    } catch (err) {
      setError("Failed to verify PIN");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPin("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter PIN</DialogTitle>
          <DialogDescription>
            Enter your PIN to perform this action. You won't need to enter it
            again for 10 minutes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin-input">PIN</Label>
            <Input
              id="pin-input"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                // Only allow numeric input
                const value = e.target.value.replace(/\D/g, "");
                setPin(value);
              }}
              placeholder="Enter PIN (numbers only)"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleVerify();
                }
                // Prevent non-numeric keys (except special keys like Backspace, Delete, etc.)
                if (
                  !/[0-9]/.test(e.key) &&
                  !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
                ) {
                  e.preventDefault();
                }
              }}
            />
          </div>
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 border border-destructive/20">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={loading || !pin}
              className="flex-1"
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
