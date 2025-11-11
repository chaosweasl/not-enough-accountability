import { useState, useEffect } from "react";
import { Trash2, Clock, Shield, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { storage } from "@/lib/storage";
import { BlockEvent } from "@/types";

export default function EventsTab() {
  const [events, setEvents] = useState<BlockEvent[]>([]);

  useEffect(() => {
    loadEvents();

    // Refresh events every 5 seconds
    const interval = setInterval(loadEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadEvents = () => {
    const storedEvents = storage.getEvents();
    // Sort by timestamp descending (newest first)
    const sorted = storedEvents.sort((a, b) => b.timestamp - a.timestamp);
    // Limit to last 100 events
    setEvents(sorted.slice(0, 100));
  };

  const clearEvents = () => {
    if (confirm("Clear all event logs? This cannot be undone.")) {
      storage.clearEvents();
      setEvents([]);
    }
  };

  const getEventIcon = (type: BlockEvent["type"]) => {
    switch (type) {
      case "block":
        return <Shield className="h-4 w-4 text-destructive" />;
      case "unblock":
        return <XCircle className="h-4 w-4 text-success" />;
      case "violation":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventColor = (
    type: BlockEvent["type"]
  ): "destructive" | "default" | "outline" | "secondary" => {
    switch (type) {
      case "block":
        return "destructive";
      case "unblock":
        return "default";
      case "violation":
        return "secondary"; // Changed from "warning" which doesn't exist
      default:
        return "outline";
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp;

    // Less than 1 minute
    if (diff < 60000) {
      return "Just now";
    }

    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    }

    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    }

    // Same year
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }

    // Different year
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="p-4 rounded-full bg-primary/10 mb-4">
            <Clock className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No events yet</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Event logs will appear here as you use the app. This includes
            blocks, violations, and other activities.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            Showing {events.length} event{events.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={clearEvents}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Events
        </Button>
      </div>

      <div className="space-y-2">
        {events.map((event) => (
          <Card key={event.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getEventIcon(event.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getEventColor(event.type)}>
                        {event.type}
                      </Badge>
                      <span className="font-medium text-sm">
                        {event.target}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {event.message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
