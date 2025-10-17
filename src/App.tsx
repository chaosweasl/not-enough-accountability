import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  Shield,
  Settings as SettingsIcon,
  Info,
  Sun,
  Moon,
  Monitor,
  LayoutGrid,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "next-themes";
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

  // Listen for app closing event and send webhook
  useEffect(() => {
    const unlisten = listen("app-closing", async () => {
      if (
        settings.webhookEnabled &&
        settings.webhookUrl &&
        settings.sendKillswitchNotifications
      ) {
        try {
          await invoke("send_discord_webhook", {
            webhookUrl: settings.webhookUrl,
            message:
              "⚠️ **Accountability App Closing**\n\nThe accountability app is being minimized to system tray. Monitoring continues in the background.",
          });
        } catch (error) {
          console.error("Failed to send close webhook:", error);
        }
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [
    settings.webhookEnabled,
    settings.webhookUrl,
    settings.sendKillswitchNotifications,
  ]);

  if (!settings.isSetupComplete) {
    return <SetupWizard />;
  }

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const getThemeIcon = () => {
    if (theme === "light") return <Sun className="h-5 w-5" />;
    if (theme === "dark") return <Moon className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "settings", label: "Settings", icon: SettingsIcon },
    { id: "about", label: "About", icon: Info },
  ] as const;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-72 border-r border-border bg-card flex flex-col shadow-2xl h-screen sticky top-0"
      >
        {/* Logo Section */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="p-6 border-b border-border"
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 gradient-primary blur-xl opacity-50 rounded-xl"></div>
              <div className="relative p-3 rounded-xl gradient-primary shadow-lg glow-primary">
                <Shield className="h-6 w-6 text-white" />
              </div>
            </motion.div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-gradient">
                Not Enough Accountability
              </h1>
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Stay Focused
              </p>
            </div>
          </div>
        </motion.div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <motion.button
                key={item.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
                onClick={() => setCurrentView(item.id as View)}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200 group relative overflow-hidden
                  ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg glow-primary"
                      : "hover:bg-muted text-foreground hover-lift"
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 gradient-primary"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}
                <Icon
                  className={`h-5 w-5 relative z-10 ${
                    isActive ? "text-white" : ""
                  }`}
                />
                <span
                  className={`font-semibold relative z-10 ${
                    isActive ? "text-white" : ""
                  }`}
                >
                  {item.label}
                </span>
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.3 }}
                      className="ml-auto relative z-10"
                    >
                      <Sparkles className="h-4 w-4 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </nav>

        {/* Theme Toggle at Bottom */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="p-4 border-t border-border"
        >
          <Button
            variant="outline"
            className="w-full justify-start gap-3 hover:bg-muted hover-lift"
            onClick={cycleTheme}
          >
            <motion.div
              key={theme}
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              {getThemeIcon()}
            </motion.div>
            <span className="font-medium">
              {theme === "light"
                ? "Light"
                : theme === "dark"
                ? "Dark"
                : "System"}
            </span>
          </Button>
        </motion.div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="p-8 max-w-7xl mx-auto"
        >
          <AnimatePresence mode="wait">
            {currentView === "dashboard" && <Dashboard />}
            {currentView === "settings" && <Settings />}
            {currentView === "about" && <About />}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}

export default App;
