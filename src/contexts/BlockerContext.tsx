import { createContext, useContext, ReactNode } from "react";
import { useBlocker } from "@/hooks/useBlocker";
import { useWebsiteBlocker } from "@/hooks/useWebsiteBlocker";
import { BlockRule, WebsiteBlockRule } from "@/types";

interface BlockerContextType {
  rules: BlockRule[];
  setRules: (
    newRules: BlockRule[] | ((prev: BlockRule[]) => BlockRule[])
  ) => void;
  addRule: (rule: BlockRule) => void;
  removeRule: (ruleId: string) => void;
  updateRule: (ruleId: string, updates: Partial<BlockRule>) => void;

  websiteRules: WebsiteBlockRule[];
  setWebsiteRules: (
    newRules:
      | WebsiteBlockRule[]
      | ((prev: WebsiteBlockRule[]) => WebsiteBlockRule[])
  ) => void;
  addWebsiteRule: (rule: WebsiteBlockRule) => void;
  removeWebsiteRule: (ruleId: string) => void;
  updateWebsiteRule: (
    ruleId: string,
    updates: Partial<WebsiteBlockRule>
  ) => void;

  isEnforcing: boolean;
  setIsEnforcing: (enforcing: boolean) => void;
}

const BlockerContext = createContext<BlockerContextType | undefined>(undefined);

export function BlockerProvider({ children }: { children: ReactNode }) {
  const blocker = useBlocker();

  // Apply website blocking based on active rules
  useWebsiteBlocker(blocker.websiteRules, blocker.isEnforcing);

  return (
    <BlockerContext.Provider value={blocker}>
      {children}
    </BlockerContext.Provider>
  );
}

export function useBlockerContext() {
  const context = useContext(BlockerContext);
  if (context === undefined) {
    throw new Error("useBlockerContext must be used within a BlockerProvider");
  }
  return context;
}
