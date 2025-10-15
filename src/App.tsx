import { useState } from "react";
import { Shield, Settings as SettingsIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import SetupWizard from "./components/SetupWizard";
import Dashboard from "./components/Dashboard";
import Settings from "./components/Settings";
import About from "./components/About";
import "./App.css";

type View = "dashboard" | "settings" | "about";

function App() {
  const { settings } = useSettings();
  const [currentView, setCurrentView] = useState<View>("dashboard");

  if (!settings.isSetupComplete) {
    return <SetupWizard />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with gradient */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Accountability
              </h1>
              <p className="text-sm text-muted-foreground">
                Stay focused, stay productive
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={currentView === "dashboard" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView("dashboard")}
              className="transition-all duration-200 hover:scale-105"
            >
              <Shield className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={currentView === "settings" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView("settings")}
              className="transition-all duration-200 hover:scale-105"
            >
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button
              variant={currentView === "about" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView("about")}
              className="transition-all duration-200 hover:scale-105"
            >
              <Info className="mr-2 h-4 w-4" />
              About
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {currentView === "dashboard" && <Dashboard />}
        {currentView === "settings" && <Settings />}
        {currentView === "about" && <About />}
      </main>
    </div>
  );
}

export default App;
