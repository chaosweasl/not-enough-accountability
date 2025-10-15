import { Clock, Calendar, Infinity, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { BlockRule } from "@/types";
import {
  isRuleActive,
  formatDuration,
  formatTimeRange,
  getDayName,
} from "@/lib/helpers";

interface BlockRuleCardProps {
  rule: BlockRule;
  onRemove: () => void;
  onToggle: (active: boolean) => void;
}

export default function BlockRuleCard({
  rule,
  onRemove,
  onToggle,
}: BlockRuleCardProps) {
  const active = isRuleActive(rule);

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
    <Card className="overflow-hidden card-animate shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.01] border-2">
      <CardContent className="flex items-center justify-between p-5">
        <div className="flex items-center gap-4 flex-1">
          <div className={`p-3 rounded-xl ${active ? 'bg-gradient-to-br from-primary/20 to-purple-600/20' : 'bg-muted'}`}>
            {getIcon()}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base">{rule.appName}</h3>
              <Badge 
                variant={active ? "default" : "secondary"}
                className={active ? "bg-gradient-to-r from-primary to-purple-600" : ""}
              >
                {rule.type}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              {getRuleDescription()}
            </p>
            <p className="text-xs text-muted-foreground/70 truncate mt-1">
              {rule.appPath}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge 
              variant={active ? "default" : "secondary"}
              className={`px-3 py-1 ${active ? 'bg-green-500 hover:bg-green-600' : ''}`}
            >
              {active ? "● Active" : "○ Inactive"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-6">
          <Switch 
            checked={rule.isActive} 
            onCheckedChange={onToggle}
            className="scale-110"
          />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onRemove}
            className="hover:bg-destructive/10 transition-all duration-200 hover:scale-110"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
