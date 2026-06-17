"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { motion, type Transition } from "framer-motion";
import { Mail, Calendar, Search, Bot, Zap, Settings } from "lucide-react";
import { useState } from "react";

const sidebarVariants = {
  open: {
    width: "15rem",
  },
  closed: {
    width: "3.05rem",
  },
};

const contentVariants = {
  open: { display: "block", opacity: 1 },
  closed: { display: "block", opacity: 1 },
};

const variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      x: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    x: -20,
    opacity: 0,
    transition: {
      x: { stiffness: 100 },
    },
  },
};

const transitionProps: Transition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2,
  staggerChildren: 0.1,
};

const staggerVariants = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
};

export type AppTab = "gmail" | "calendar" | "settings";

interface SessionNavBarProps {
  tab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onSearch: () => void;
  aiOpen: boolean;
  onToggleAI: () => void;
  feedOpen: boolean;
  onToggleFeed: () => void;
}

const navItemClass =
  "flex h-8 w-full flex-row items-center gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-muted hover:text-primary";

export function SessionNavBar({
  tab,
  onTabChange,
  onSearch,
  aiOpen,
  onToggleAI,
  feedOpen,
  onToggleFeed,
}: SessionNavBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <motion.div
      className={cn(
        "sidebar absolute left-0 top-0 z-40 h-full shrink-0 border-r border-border bg-background backdrop-blur-xl",
      )}
      initial={isCollapsed ? "closed" : "open"}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <motion.div
        className="relative z-40 flex h-full shrink-0 flex-col text-muted-foreground transition-all"
        variants={contentVariants}
      >
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          <div className="flex grow flex-col items-center">
            <div className="flex h-[54px] w-full shrink-0 items-center gap-2 border-b border-border px-3">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{ background: "linear-gradient(135deg, #B4F24A, #F28C28)" }}
              >
                <Zap className="h-3.5 w-3.5" color="#0A0A0A" />
              </div>
              <motion.li variants={variants}>
                {!isCollapsed && (
                  <p className="text-sm font-semibold text-foreground">FlowMail</p>
                )}
              </motion.li>
            </div>

            <div className="flex h-full w-full flex-col">
              <div className="flex grow flex-col gap-4">
                <ScrollArea className="h-16 grow p-2">
                  <div className="flex w-full flex-col gap-1">
                    <button
                      onClick={() => onTabChange("gmail")}
                      className={cn(navItemClass, tab === "gmail" && "bg-muted text-primary")}
                    >
                      <Mail className="h-4 w-4 shrink-0" />
                      <motion.li variants={variants}>
                        {!isCollapsed && <span className="text-sm font-medium">Inbox</span>}
                      </motion.li>
                    </button>
                    <button
                      onClick={() => onTabChange("calendar")}
                      className={cn(navItemClass, tab === "calendar" && "bg-muted text-primary")}
                    >
                      <Calendar className="h-4 w-4 shrink-0" />
                      <motion.li variants={variants}>
                        {!isCollapsed && <span className="text-sm font-medium">Calendar</span>}
                      </motion.li>
                    </button>
                    <button onClick={onSearch} className={navItemClass}>
                      <Search className="h-4 w-4 shrink-0" />
                      <motion.li variants={variants}>
                        {!isCollapsed && <span className="text-sm font-medium">Search</span>}
                      </motion.li>
                    </button>

                    <Separator className="my-1" />

                    <button
                      onClick={onToggleAI}
                      className={cn(navItemClass, aiOpen && "bg-muted text-primary")}
                    >
                      <Bot className="h-4 w-4 shrink-0" />
                      <motion.li variants={variants}>
                        {!isCollapsed && <span className="text-sm font-medium">AI Assistant</span>}
                      </motion.li>
                    </button>
                    <button
                      onClick={onToggleFeed}
                      className={cn(navItemClass, feedOpen && "bg-muted text-primary")}
                    >
                      <Zap className="h-4 w-4 shrink-0" />
                      <motion.li variants={variants}>
                        {!isCollapsed && <span className="text-sm font-medium">Action Feed</span>}
                      </motion.li>
                    </button>
                  </div>
                </ScrollArea>
              </div>
              <div className="flex flex-col p-2">
                <button
                  onClick={() => onTabChange("settings")}
                  className={cn(navItemClass, tab === "settings" && "bg-muted text-primary")}
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  <motion.li variants={variants}>
                    {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
                  </motion.li>
                </button>
              </div>
            </div>
          </div>
        </motion.ul>
      </motion.div>
    </motion.div>
  );
}
