import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Globe, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBlockerContext } from "@/contexts/BlockerContext";
import { useSettings } from "@/hooks/useSettings";
import { WebsiteBlockRule } from "@/types";
import { generateId } from "@/lib/helpers";
import { WEBSITE_CATEGORIES, normalizeDomain } from "@/lib/websiteCategories";

interface WebsiteRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WebsiteRuleDialog({
  open,
  onOpenChange,
}: WebsiteRuleDialogProps) {
  const { addWebsiteRule } = useBlockerContext();
  const { settings } = useSettings();

  const [step, setStep] = useState<"select" | "configure">("select");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customDomains, setCustomDomains] = useState<string[]>([]);
  const [customDomainInput, setCustomDomainInput] = useState("");

  // Rule configuration
  const [ruleType, setRuleType] = useState<"timer" | "schedule" | "permanent">(
    "permanent"
  );
  const [duration, setDuration] = useState("30");
  const [days, setDays] = useState<number[]>([]);
  const [startHour, setStartHour] = useState("9");
  const [startMinute, setStartMinute] = useState("0");
  const [endHour, setEndHour] = useState("17");
  const [endMinute, setEndMinute] = useState("0");

  const handleClose = () => {
    setStep("select");
    setSelectedCategories([]);
    setCustomDomains([]);
    setCustomDomainInput("");
    setRuleType("permanent");
    setDuration("30");
    setDays([]);
    setStartHour("9");
    setStartMinute("0");
    setEndHour("17");
    setEndMinute("0");
    onOpenChange(false);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const addCustomDomain = () => {
    if (!customDomainInput.trim()) return;

    const normalized = normalizeDomain(customDomainInput);
    if (normalized && !customDomains.includes(normalized)) {
      setCustomDomains([...customDomains, normalized]);
      setCustomDomainInput("");
    }
  };

  const removeCustomDomain = (domain: string) => {
    setCustomDomains(customDomains.filter((d) => d !== domain));
  };

  const handleNext = () => {
    if (selectedCategories.length === 0 && customDomains.length === 0) {
      return;
    }
    setStep("configure");
  };

  const handleAddRules = async () => {
    const domains: string[] = [];

    // Collect domains from selected categories
    for (const categoryId of selectedCategories) {
      const category = WEBSITE_CATEGORIES.find((c) => c.id === categoryId);
      if (category) {
        domains.push(...category.domains);
      }
    }

    // Add custom domains
    domains.push(...customDomains);

    // Remove duplicates
    const uniqueDomains = Array.from(new Set(domains));

    // Create a rule for each domain
    for (const domain of uniqueDomains) {
      const rule: WebsiteBlockRule = {
        id: generateId(),
        domain,
        type: ruleType,
        isActive: true,
        createdAt: Date.now(),
      };

      if (ruleType === "timer") {
        rule.duration = parseInt(duration);
        rule.startTime = Date.now();
      } else if (ruleType === "schedule") {
        rule.days = days;
        rule.startHour = parseInt(startHour);
        rule.startMinute = parseInt(startMinute);
        rule.endHour = parseInt(endHour);
        rule.endMinute = parseInt(endMinute);
      }

      addWebsiteRule(rule);
    }

    // Send webhook notification if enabled
    if (
      settings.webhookEnabled &&
      settings.webhookUrl &&
      settings.sendBlockNotifications
    ) {
      try {
        const categoryNames = selectedCategories
          .map((id) => WEBSITE_CATEGORIES.find((c) => c.id === id)?.name)
          .filter(Boolean)
          .join(", ");

        let message = `🌐 **Website Blocking Enabled**\n\n**Domains blocked:** ${uniqueDomains.length}\n**Type:** ${ruleType}`;

        if (categoryNames) {
          message += `\n**Categories:** ${categoryNames}`;
        }

        if (customDomains.length > 0) {
          message += `\n**Custom domains:** ${customDomains.join(", ")}`;
        }

        if (ruleType === "timer") {
          message += `\n**Duration:** ${duration} minutes`;
        } else if (ruleType === "schedule") {
          const dayNames = days
            .map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
            .join(", ");
          message += `\n**Days:** ${dayNames}\n**Time:** ${startHour}:${startMinute.padStart(
            2,
            "0"
          )} - ${endHour}:${endMinute.padStart(2, "0")}`;
        }

        await invoke("send_discord_webhook", {
          webhookUrl: settings.webhookUrl,
          message,
        });
      } catch (error) {
        console.error("Failed to send webhook:", error);
      }
    }

    handleClose();
  };

  const toggleDay = (day: number) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "select"
              ? "Select Websites to Block"
              : "Configure Blocking Rule"}
          </DialogTitle>
          <DialogDescription>
            {step === "select"
              ? "Choose predefined categories or add custom domains"
              : "Set when and how long these websites should be blocked"}
          </DialogDescription>

          {/* Warning about browser killing */}
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-600 dark:text-yellow-500">
              ⚠️ <strong>Note:</strong> Website blocking works by closing all
              browser windows (Edge, Chrome, Firefox, etc.) when active. This is
              necessary because modern browsers bypass traditional blocking
              methods.
            </p>
          </div>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-6">
            {/* Predefined Categories */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Website Categories
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {WEBSITE_CATEGORIES.map((category) => (
                  <Card
                    key={category.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedCategories.includes(category.id)
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => toggleCategory(category.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{category.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold">{category.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {category.description}
                          </p>
                          <Badge variant="secondary" className="mt-2">
                            {category.domains.length} domains
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Custom Domains */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Custom Domains
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="example.com"
                  value={customDomainInput}
                  onChange={(e) => setCustomDomainInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomDomain();
                    }
                  }}
                />
                <Button onClick={addCustomDomain} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {customDomains.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {customDomains.map((domain) => (
                    <Badge
                      key={domain}
                      variant="secondary"
                      className="px-3 py-1"
                    >
                      <Globe className="h-3 w-3 mr-1" />
                      {domain}
                      <button
                        onClick={() => removeCustomDomain(domain)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleNext}
                disabled={
                  selectedCategories.length === 0 && customDomains.length === 0
                }
              >
                Next: Configure Rule
              </Button>
            </div>
          </div>
        )}

        {step === "configure" && (
          <div className="space-y-6">
            <Tabs value={ruleType} onValueChange={(v) => setRuleType(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="permanent">Always Block</TabsTrigger>
                <TabsTrigger value="timer">Timed Block</TabsTrigger>
                <TabsTrigger value="schedule">Scheduled Block</TabsTrigger>
              </TabsList>

              <TabsContent value="permanent" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  These websites will be blocked permanently until you remove
                  the rule.
                </p>
              </TabsContent>

              <TabsContent value="timer" className="space-y-4">
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="1"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Websites will be blocked for {duration} minutes starting
                    now.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
                <div>
                  <Label>Days of the week</Label>
                  <div className="grid grid-cols-7 gap-2 mt-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day, index) => (
                        <Button
                          key={index}
                          variant={days.includes(index) ? "default" : "outline"}
                          onClick={() => toggleDay(index)}
                          className="h-10"
                        >
                          {day}
                        </Button>
                      )
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <Label className="text-xs">Hour</Label>
                        <Input
                          type="number"
                          value={startHour}
                          onChange={(e) => setStartHour(e.target.value)}
                          min="0"
                          max="23"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Minute</Label>
                        <Input
                          type="number"
                          value={startMinute}
                          onChange={(e) => setStartMinute(e.target.value)}
                          min="0"
                          max="59"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>End Time</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <Label className="text-xs">Hour</Label>
                        <Input
                          type="number"
                          value={endHour}
                          onChange={(e) => setEndHour(e.target.value)}
                          min="0"
                          max="23"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Minute</Label>
                        <Input
                          type="number"
                          value={endMinute}
                          onChange={(e) => setEndMinute(e.target.value)}
                          min="0"
                          max="59"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("select")}>
                Back
              </Button>
              <Button onClick={handleAddRules}>Add Website Blocks</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
