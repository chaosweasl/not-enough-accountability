import { useState } from "react";
import {
  Shield,
  Settings as SettingsIcon,
  Info,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/components/ThemeProvider";
import SetupWizard from "./components/SetupWizard";
import Dashboard from "./components/Dashboard";
import Settings from "./components/Settings";
import About from "./components/About";
import "./App.css";

type View = "dashboard" | "settings" | "about";

function App() {
  const { settings } = useSettings();
  const { theme, setTheme } = useTheme();
  const [currentView, setCurrentView] = useState<View>("dashboard");

  if (!settings.isSetupComplete) {
    return <SetupWizard />;
  }

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const getThemeIcon = () => {
    if (theme === "light") return <Sun className="h-4 w-4" />;
    if (theme === "dark") return <Moon className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Clean header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">NEU</h1>
              <p className="text-xs text-muted-foreground">
                Not Enough Accountability
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={currentView === "dashboard" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView("dashboard")}
            >
              <Shield className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={currentView === "settings" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView("settings")}
            >
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button
              variant={currentView === "about" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView("about")}
            >
              <Info className="mr-2 h-4 w-4" />
              About
            </Button>

            {/* Theme Toggle */}
            <div className="ml-2 pl-2 border-l border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={cycleTheme}
                title={`Current theme: ${theme}`}
              >
                {getThemeIcon()}
              </Button>
            </div>
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
