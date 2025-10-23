import { invoke } from "@tauri-apps/api/core";
import { Clock, Calendar, Infinity, Trash2, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { WebsiteBlockRule } from "@/types";
import {
  isRuleActive,
  formatDuration,
  formatTimeRange,
  getDayName,
  generateId,
} from "@/lib/helpers";
import { useSettings } from "@/hooks/useSettings";
import { storage } from "@/lib/storage";

interface WebsiteRuleCardProps {
  rule: WebsiteBlockRule;
  onRemove: () => void;
  onToggle: (active: boolean) => void;
}

export default function WebsiteRuleCard({
  rule,
  onRemove,
  onToggle,
}: WebsiteRuleCardProps) {
  const { settings } = useSettings();
  const active = isRuleActive(rule);

  const handleToggle = async (checked: boolean) => {
    onToggle(checked);

    // Send webhook notification if enabled
    if (
      settings.webhookEnabled &&
      settings.webhookUrl &&
      ((checked && settings.sendBlockNotifications) ||
        (!checked && settings.sendUnblockNotifications))
    ) {
      try {
        const action = checked ? "enabled" : "disabled";
        const emoji = checked ? "🌐" : "🔓";
        let message = `${emoji} **Website Block Rule ${
          action.charAt(0).toUpperCase() + action.slice(1)
        }**\n\n**Domain:** ${rule.domain}\n**Type:** ${rule.type}`;

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

    // Log event
    storage.addEvent({
      id: generateId(),
      type: checked ? "block" : "unblock",
      target: rule.domain,
      timestamp: Date.now(),
      message: `${checked ? "Enabled" : "Disabled"} website block for ${
        rule.domain
      }`,
    });
  };

  const getRuleDescription = () => {
    if (rule.type === "permanent") {
      return "Blocked permanently";
    }
    if (rule.type === "timer") {
      if (!rule.duration || !rule.startTime) return "Timer not configured";
      const endTime = rule.startTime + rule.duration * 60 * 1000;
      const remaining = Math.max(0, endTime - Date.now());
      const remainingMinutes = Math.floor(remaining / 60000);

      if (remaining > 0) {
        return `${formatDuration(remainingMinutes)} remaining`;
      }
      return `Timer expired (${formatDuration(rule.duration)})`;
    }
    if (rule.type === "schedule") {
      if (!rule.days || !rule.days.length) return "No days selected";
      const dayNames = rule.days.map(getDayName).join(", ");
      const timeRange = formatTimeRange(
        rule.startHour || 0,
        rule.startMinute || 0,
        rule.endHour || 0,
        rule.endMinute || 0
      );
      return `${dayNames} • ${timeRange}`;
    }
    return "";
  };

  const getIcon = () => {
    if (rule.type === "permanent") return <Infinity className="h-4 w-4" />;
    if (rule.type === "timer") return <Clock className="h-4 w-4" />;
    if (rule.type === "schedule") return <Calendar className="h-4 w-4" />;
    return null;
  };

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 flex-1">
          <div
            className={`p-2 rounded-lg ${
              active ? "bg-blue-500/10" : "bg-muted"
            }`}
          >
            <Globe className={`h-4 w-4 ${active ? "text-blue-500" : ""}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{rule.domain}</h3>
              <Badge
                variant={active ? "default" : "secondary"}
                className="capitalize"
              >
                {rule.type}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              {getIcon()}
              <span>{getRuleDescription()}</span>
            </p>
          </div>

          <Badge variant={active ? "default" : "secondary"}>
            {active ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="flex items-center gap-3 ml-4 pl-4 border-l border-border">
          <Switch checked={rule.isActive} onCheckedChange={handleToggle} />
          <Button variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
