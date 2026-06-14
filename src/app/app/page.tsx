"use client";

import { useState, useEffect } from "react";
import { Mail, Calendar, Zap, Search, Bot, Settings } from "lucide-react";
import { GmailPanel } from "@/app/_components/gmail-panel";
import { CalendarPanel } from "@/app/_components/calendar-panel";
import { AIChat } from "@/app/_components/ai-chat";
import { SettingsPanel } from "@/app/_components/settings-panel";
import { ToastProvider } from "@/app/_components/toast";
import { CommandPalette } from "@/app/_components/command-palette";
import { ComposeWindow } from "@/app/_components/compose-window";
import { ActionFeed } from "@/app/_components/action-feed";
import { TopHeader } from "@/app/_components/top-header";

type Tab = "gmail" | "calendar" | "settings";

export default function App() {
  const [tab, setTab] = useState<Tab>("gmail");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [feedOpen, setFeedOpen] = useState(false);
  const [composing, setComposing] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setAiOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <ToastProvider>
      <div className="app-shell">

        {/* Top Header */}
        <TopHeader onSearchClick={() => setCmdOpen(true)} />

        {/* App Body */}
        <div className="app-body">
          <aside className="sidebar">
            <div className="sidebar-logo" style={{ marginBottom: 8 }}>
              <Zap size={16} />
            </div>
            <button
              className={`sidebar-btn ${tab === "gmail" ? "active" : ""}`}
              onClick={() => setTab("gmail")}
              title="Inbox"
              aria-label="Inbox"
            >
              <Mail size={19} />
            </button>
            <button
              className={`sidebar-btn ${tab === "calendar" ? "active" : ""}`}
              onClick={() => setTab("calendar")}
              title="Calendar"
              aria-label="Calendar"
            >
              <Calendar size={19} />
            </button>
            <button
              className="sidebar-btn"
              onClick={() => setCmdOpen(true)}
              title="Search (⌘K)"
              aria-label="Search"
            >
              <Search size={19} />
            </button>
            <div className="sidebar-divider" style={{ marginTop: 8, marginBottom: 8 }} />
            <button
              className={`sidebar-btn ${aiOpen ? "active" : ""}`}
              onClick={() => setAiOpen((v) => !v)}
              title="AI Assistant (⌘/)"
              aria-label="AI Assistant"
            >
              <Bot size={19} />
            </button>
            <button
              className={`sidebar-btn ${feedOpen ? "active" : ""}`}
              onClick={() => setFeedOpen((v) => !v)}
              title="Action Feed"
              aria-label="Action Feed"
            >
              <Zap size={19} />
            </button>
            <div style={{ flex: 1 }} />
            <button
              className={`sidebar-btn ${tab === "settings" ? "active" : ""}`}
              onClick={() => setTab("settings")}
              title="Settings"
              aria-label="Settings"
              style={{ marginBottom: 8 }}
            >
              <Settings size={19} />
            </button>
          </aside>

          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {tab === "gmail" && (
              <GmailPanel
                externalCompose={composing}
                onComposeClose={() => setComposing(false)}
              />
            )}
            {tab === "calendar" && <CalendarPanel />}
            {tab === "settings" && <SettingsPanel />}
            <AIChat open={aiOpen} onClose={() => setAiOpen(false)} />
            <ActionFeed open={feedOpen} onClose={() => setFeedOpen(false)} />
          </div>
        </div>

        <CommandPalette
          open={cmdOpen}
          onClose={() => setCmdOpen(false)}
          onNavigate={(t) => setTab(t)}
          onCompose={() => { setTab("gmail"); setComposing(true); }}
          onOpenAI={() => setAiOpen(true)}
        />
        <ComposeWindow
          open={composing}
          onClose={() => setComposing(false)}
        />
      </div>
    </ToastProvider>
  );
}
