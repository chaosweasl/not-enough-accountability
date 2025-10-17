// UI Components Demo - Copy these patterns to enhance your components

import { motion, AnimatePresence } from "framer-motion";
import { Zap, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// 1. ANIMATED CARD WITH GLOW
export function GlowingCard() {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="border-2 border-primary/50 shadow-2xl glow-primary">
        <div className="p-6">
          <div className="gradient-primary p-4 rounded-xl w-fit glow-primary">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-black mt-4">Protected</h3>
          <p className="text-muted-foreground font-medium">
            Your apps are now blocked
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

// 2. ANIMATED BUTTON
export function AnimatedButton() {
  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button className="gradient-primary shadow-lg glow-primary font-bold">
        <Zap className="mr-2 h-5 w-5" />
        Click Me!
      </Button>
    </motion.div>
  );
}

// 3. STAGGERED LIST ANIMATION
export function StaggeredList({ items }: { items: string[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <motion.div
          key={item}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
          whileHover={{ x: 8, scale: 1.02 }}
          className="p-4 rounded-lg bg-card border-2 hover:border-primary transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="gradient-success p-2 rounded-lg">
              <Check className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">{item}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// 4. PAGE TRANSITION WRAPPER
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

// 5. FLOATING ICON
export function FloatingIcon() {
  return (
    <motion.div
      animate={{ y: [-5, 5, -5] }}
      transition={{ duration: 3, repeat: Infinity }}
      className="relative"
    >
      <div className="absolute inset-0 gradient-primary blur-2xl opacity-50"></div>
      <div className="relative gradient-primary p-6 rounded-2xl glow-primary">
        <Shield className="h-12 w-12 text-white" />
      </div>
    </motion.div>
  );
}

// 6. GRADIENT ANIMATED TEXT
export function GradientText({ children }: { children: string }) {
  return (
    <h1 className="text-5xl font-black bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient text-glow">
      {children}
    </h1>
  );
}

// 7. STATUS INDICATOR
export function StatusIndicator({ online }: { online: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-3 w-3">
        {online && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        )}
        <span
          className={`relative inline-flex rounded-full h-3 w-3 ${
            online ? "bg-green-500 shadow-lg" : "bg-gray-400"
          }`}
        ></span>
      </span>
      <span className="font-bold">{online ? "Active" : "Inactive"}</span>
    </div>
  );
}

// 8. PULSING GLOW CARD
export function PulsingGlowCard() {
  return (
    <Card className="relative overflow-hidden border-2">
      <motion.div
        className="absolute inset-0 gradient-success"
        animate={{ opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 2, repeat: Infinity }}
      ></motion.div>
      <div className="relative p-6">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="gradient-success p-4 rounded-xl w-fit glow-success">
            <Shield className="h-8 w-8 text-white" />
          </div>
        </motion.div>
        <h3 className="text-2xl font-black mt-4">System Active</h3>
      </div>
    </Card>
  );
}

// 9. SLIDE-IN PANEL
export function SlideInPanel({
  show,
  children,
}: {
  show: boolean;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed left-0 top-0 h-full w-80 bg-card border-r shadow-2xl p-6"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 10. ROTATING ICON
export function RotatingIcon({ active }: { active: boolean }) {
  return (
    <motion.div
      animate={{ rotate: active ? 360 : 0 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    >
      <div
        className={`p-4 rounded-2xl ${
          active ? "gradient-success glow-success" : "bg-gray-400"
        }`}
      >
        <Shield className="h-8 w-8 text-white" />
      </div>
    </motion.div>
  );
}

// USAGE EXAMPLES:
/*
// In your component:
import { GlowingCard, AnimatedButton, PageTransition } from './UIDemo';

function MyComponent() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <GlowingCard />
        <AnimatedButton />
      </div>
    </PageTransition>
  );
}
*/
