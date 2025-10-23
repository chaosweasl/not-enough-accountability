import {
  Shield,
  Github,
  Heart,
  Lock,
  Webhook,
  Timer,
  Calendar,
  BookOpen,
  Plus,
  RefreshCw,
  Search,
  Eye,
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

        {/* Tutorial Section */}
        <Card className="card-animate shadow-modern border-2 hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 shadow-sm">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">
                  How to Use This App
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Step-by-step guide to blocking applications
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-lg">
                  1
                </div>
                <h3 className="font-bold text-lg">
                  Finding Applications to Block
                </h3>
              </div>
              <div className="ml-11 space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The app discovers applications in three ways:
                </p>
                <div className="space-y-2 bg-muted/30 rounded-lg p-4 border">
                  <div className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">
                        Currently Running Apps
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Any application that is currently open on your computer
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Search className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">
                        Installed Applications
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Apps found in common directories like Program Files,
                        Program Files (x86), and Steam game folders
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Plus className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Windows Registry</p>
                      <p className="text-xs text-muted-foreground">
                        Applications registered in Windows' installed programs
                        list
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-500/10 border-2 border-blue-500/20 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                    💡 Pro Tip: Use the Refresh Button
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    If you don't see an app in the list, try opening it first,
                    then click the <RefreshCw className="inline h-3 w-3" />{" "}
                    <strong>Refresh</strong> button in the "Add Block Rule"
                    dialog. This will reload the app list and include any newly
                    opened applications.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-lg">
                  2
                </div>
                <h3 className="font-bold text-lg">Adding a Block Rule</h3>
              </div>
              <div className="ml-11 space-y-3">
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">•</span>
                    <span>
                      Go to the{" "}
                      <strong className="text-foreground">Dashboard</strong> tab
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">•</span>
                    <span>
                      Click the{" "}
                      <strong className="text-foreground">
                        "Add Block Rule"
                      </strong>{" "}
                      button
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">•</span>
                    <span>
                      Search for your application in the list (you can use the
                      search bar)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">•</span>
                    <span>
                      If you don't see it, open the app on your computer and
                      click <strong className="text-foreground">Refresh</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">•</span>
                    <span>Click on the application to select it</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">•</span>
                    <span>
                      Choose your block type (Permanent, Timer, or Schedule)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">•</span>
                    <span>
                      Click{" "}
                      <strong className="text-foreground">
                        "Add Block Rule"
                      </strong>
                    </span>
                  </li>
                </ol>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-lg">
                  3
                </div>
                <h3 className="font-bold text-lg">Understanding Block Types</h3>
              </div>
              <div className="ml-11 space-y-3">
                <div className="space-y-3">
                  <div className="border-2 border-primary/20 rounded-lg p-4 bg-gradient-to-br from-primary/5 to-transparent">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">Permanent Block</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Blocks the app indefinitely until you manually remove the
                      rule
                    </p>
                  </div>
                  <div className="border-2 border-accent/20 rounded-lg p-4 bg-gradient-to-br from-accent/5 to-transparent">
                    <div className="flex items-center gap-2 mb-2">
                      <Timer className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">Timer Block</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Blocks the app for a specific duration (e.g., 30 minutes,
                      2 hours). The timer starts when you create the rule.
                    </p>
                  </div>
                  <div className="border-2 border-blue-500/20 rounded-lg p-4 bg-gradient-to-br from-blue-500/5 to-transparent">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">Schedule Block</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Blocks the app on specific days and times (e.g., weekdays
                      from 9 AM to 5 PM). Perfect for blocking games during work
                      hours!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-lg">
                  4
                </div>
                <h3 className="font-bold text-lg">
                  What Happens When an App is Blocked?
                </h3>
              </div>
              <div className="ml-11 space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  When you try to run a blocked application:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">✓</span>
                    <span>The app will be immediately closed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">✓</span>
                    <span>
                      You'll see a notification explaining why it was blocked
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">✓</span>
                    <span>
                      If Discord webhooks are enabled, a notification will be
                      sent
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">✓</span>
                    <span>
                      The event is logged in your accountability history
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-amber-500/10 border-2 border-amber-500/20 rounded-lg p-5 space-y-2">
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                ⚠️ Important Notes
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    •
                  </span>
                  <span>
                    The app must be running in the background to monitor and
                    block applications
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    •
                  </span>
                  <span>
                    If you can't find an app, make sure it's currently running
                    and use the Refresh button
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    •
                  </span>
                  <span>
                    Enable PIN protection in Settings to prevent yourself from
                    easily disabling blocks
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    •
                  </span>
                  <span>
                    Use the Emergency Killswitch (in Settings) to disable all
                    blocks instantly if needed
                  </span>
                </li>
              </ul>
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
