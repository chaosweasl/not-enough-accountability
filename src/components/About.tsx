import {
  Shield,
  Github,
  Heart,
  Lock,
  Webhook,
  Timer,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="card-animate">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          About
        </h2>
        <p className="text-base text-muted-foreground mt-1">
          Learn more about this accountability tool
        </p>
      </div>

      {/* About Card */}
      <Card className="card-animate shadow-lg border-2 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-600/5 pointer-events-none" />
        <CardHeader className="relative">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Accountability</CardTitle>
              <CardDescription className="text-base">Version 0.1.0</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          <p className="text-base text-muted-foreground leading-relaxed">
            A free, open-source application blocker and tracker designed to help
            you stay focused and productive. Built with Tauri, React, and
            Tailwind CSS.
          </p>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                // This would open the GitHub repo
                console.log("Open GitHub");
              }}
              className="transition-all duration-200 hover:scale-105 border-2"
            >
              <Github className="mr-2 h-4 w-4" />
              View on GitHub
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                console.log("Report Issue");
              }}
              className="transition-all duration-200 hover:scale-105 border-2"
            >
              Report an Issue
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Features Card */}
      <Card className="card-animate shadow-md border-2">
        <CardHeader>
          <CardTitle className="text-xl">Features</CardTitle>
          <CardDescription className="text-base">What this tool can do for you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5">
            <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border-2 border-primary/10">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <Timer className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Timer-Based Blocking</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Block apps for a specific duration (e.g., 30 minutes, 2 hours)
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-purple-600/5 to-transparent border-2 border-purple-600/10">
              <div className="p-2 rounded-lg bg-purple-600/10 h-fit">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Schedule-Based Blocking</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Block apps on specific days and times (e.g., weekdays 9-5)
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border-2 border-primary/10">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base">PIN Protection</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Prevent yourself from easily disabling blocks with PIN
                  security
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-purple-600/5 to-transparent border-2 border-purple-600/10">
              <div className="p-2 rounded-lg bg-purple-600/10 h-fit">
                <Webhook className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Discord Integration</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Get accountability notifications via Discord webhooks
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border-2 border-primary/10">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Emergency Killswitch</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Disable all blocking instantly for safety situations
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Card */}
      <Card className="card-animate shadow-md border-2 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="text-xl">Privacy & Security</CardTitle>
          <CardDescription className="text-base">Your data stays on your device</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-lg bg-pink-500/10">
              <Heart className="h-4 w-4 text-pink-500" />
            </div>
            <p className="text-sm">
              <strong className="font-semibold">100% Free & Open Source</strong> - No premium plans, no
              paywalls
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-lg bg-primary/10">
              <Lock className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm">
              <strong className="font-semibold">No Data Collection</strong> - All settings and rules
              stored locally
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Shield className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-sm">
              <strong className="font-semibold">No Accounts Required</strong> - Just download and use
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-lg bg-purple-600/10">
              <Webhook className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-sm">
              <strong className="font-semibold">Optional Discord Integration</strong> - Only sends data if
              you configure it
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Attribution */}
      <Card className="card-animate shadow-md border-2">
        <CardContent className="pt-6">
          <p className="text-xs text-center text-muted-foreground">
            Made with ❤️ for students and anyone seeking accountability
          </p>
          <p className="text-xs text-center text-muted-foreground mt-1">
            Built with Tauri, React, Tailwind CSS, and shadcn/ui
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
