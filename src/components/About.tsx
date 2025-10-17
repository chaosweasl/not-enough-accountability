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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          About
        </h1>
        <p className="text-muted-foreground text-lg">
          Learn more about this accountability tool
        </p>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* About Card */}
        <Card className="relative border-2 overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-primary/30">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <CardHeader className="relative pb-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 gradient-primary blur-2xl opacity-40"></div>
                <div className="relative p-5 rounded-2xl gradient-primary shadow-lg animate-float">
                  <Shield className="h-12 w-12 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-4xl font-bold mb-1 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  NEU
                </CardTitle>
                <CardDescription className="text-lg">
                  Not Enough Accountability • Version 0.1.0
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 relative">
            <p className="text-base text-muted-foreground leading-relaxed">
              A free, open-source application blocker and accountability tracker
              designed to help you stay focused and productive. Built with
              Tauri, React, and Tailwind CSS.
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  // This would open the GitHub repo
                  console.log("Open GitHub");
                }}
                className="border-2 font-semibold shadow-md hover:shadow-lg"
              >
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  console.log("Report Issue");
                }}
                className="border-2 font-semibold shadow-md hover:shadow-lg"
              >
                Report an Issue
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features Card */}
        <Card className="card-animate shadow-modern border-2 hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold">Features</CardTitle>
            <CardDescription className="text-base mt-1">
              What this tool can do for you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex gap-4 p-5 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border-2 border-primary/10 hover:border-primary/20 transition-all duration-300 hover:shadow-md">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 h-fit shadow-sm">
                  <Timer className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-base mb-1">
                    Timer-Based Blocking
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Block apps for a specific duration (e.g., 30 minutes, 2
                    hours)
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-xl bg-gradient-to-br from-accent/5 to-transparent border-2 border-accent/10 hover:border-accent/20 transition-all duration-300 hover:shadow-md">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 h-fit shadow-sm">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-base mb-1">
                    Schedule-Based Blocking
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Block apps on specific days and times (e.g., weekdays 9-5)
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border-2 border-primary/10 hover:border-primary/20 transition-all duration-300 hover:shadow-md">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 h-fit shadow-sm">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-base mb-1">PIN Protection</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Prevent yourself from easily disabling blocks with PIN
                    security
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-xl bg-gradient-to-br from-accent/5 to-transparent border-2 border-accent/10 hover:border-accent/20 transition-all duration-300 hover:shadow-md">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 h-fit shadow-sm">
                  <Webhook className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-base mb-1">
                    Discord Integration
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Get accountability notifications via Discord webhooks
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border-2 border-primary/10 hover:border-primary/20 transition-all duration-300 hover:shadow-md">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 h-fit shadow-sm">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-base mb-1">
                    Emergency Killswitch
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Disable all blocking instantly for safety situations
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Card */}
        <Card className="card-animate shadow-modern border-2 overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 pointer-events-none" />
          <CardHeader className="relative pb-6">
            <CardTitle className="text-2xl font-bold">
              Privacy & Security
            </CardTitle>
            <CardDescription className="text-base mt-1">
              Your data stays on your device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 relative">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-pink-500/5 to-transparent border-2 border-pink-500/10 hover:border-pink-500/20 transition-all duration-300">
              <div className="p-2.5 rounded-xl bg-pink-500/10 shadow-sm">
                <Heart className="h-5 w-5 text-pink-500" />
              </div>
              <p className="text-sm leading-relaxed">
                <strong className="font-bold">100% Free & Open Source</strong> -
                No premium plans, no paywalls
              </p>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border-2 border-primary/10 hover:border-primary/20 transition-all duration-300">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 shadow-sm">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm leading-relaxed">
                <strong className="font-bold">No Data Collection</strong> - All
                settings and rules stored locally
              </p>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-500/5 to-transparent border-2 border-blue-500/10 hover:border-blue-500/20 transition-all duration-300">
              <div className="p-2.5 rounded-xl bg-blue-500/10 shadow-sm">
                <Shield className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-sm leading-relaxed">
                <strong className="font-bold">No Accounts Required</strong> -
                Just download and use
              </p>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-accent/5 to-transparent border-2 border-accent/10 hover:border-accent/20 transition-all duration-300">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 shadow-sm">
                <Webhook className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm leading-relaxed">
                <strong className="font-bold">
                  Optional Discord Integration
                </strong>{" "}
                - Only sends data if you configure it
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Attribution */}
        <Card className="border-2 hover:shadow-xl transition-all duration-300 hover:border-primary/30">
          <CardContent className="pt-6 pb-6 text-center space-y-3">
            <p className="text-base text-muted-foreground font-medium flex items-center justify-center gap-2">
              Made with{" "}
              <Heart className="h-4 w-4 text-red-500 fill-red-500 animate-pulse" />{" "}
              for students and anyone seeking accountability
            </p>
            <p className="text-sm text-muted-foreground">
              Built with Tauri, React, Tailwind CSS, and shadcn/ui
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
