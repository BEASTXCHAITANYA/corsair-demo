"use client";

import React, { useState, useEffect, useMemo, type ReactNode } from "react";
import { Mail, Calendar, Bot, Zap, Settings, Plus, Clock, Users, MailOpen } from "lucide-react";
import { AnimatedGlowingSearchBar } from "@/components/ui/animated-glowing-search-bar";
import { HighlightCard } from "@/components/ui/highlight-card";
import { api } from "@/trpc/react";
import { GmailPanel } from "@/app/_components/gmail-panel";
import { CalendarPanel } from "@/app/_components/calendar-panel";
import { AIChat } from "@/app/_components/ai-chat";
import { SettingsPanel } from "@/app/_components/settings-panel";
import { ToastProvider } from "@/app/_components/toast";
import { CommandPalette } from "@/app/_components/command-palette";
import { ComposeWindow } from "@/app/_components/compose-window";
import { ActionFeed } from "@/app/_components/action-feed";

type Tab = "gmail" | "calendar" | "settings" | "ai";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatEventTime(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function SidebarNavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "10px 12px",
        marginBottom: 2,
        background: active ? "rgba(180,242,74,0.1)" : "transparent",
        color: active ? "#B4F24A" : hovered ? "#E2E8F0" : "#666",
        border: "none",
        borderLeft: active ? "2px solid #B4F24A" : "2px solid transparent",
        borderRadius: 8,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 500,
        textAlign: "left",
        transition: "color 150ms, background 150ms",
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}


function TodaysEventsPanel({
  onNewEvent,
  onCreateWithAI,
}: {
  onNewEvent: () => void;
  onCreateWithAI: (text: string) => void;
}) {
  const [quickInput, setQuickInput] = useState("");

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayEnd = useMemo(() => {
    const d = new Date(todayStart);
    d.setDate(d.getDate() + 1);
    return d;
  }, [todayStart]);

  const todaysEvents = api.calendar.searchEvents.useQuery({
    query: "",
    weekStart: todayStart.toISOString(),
    weekEnd: todayEnd.toISOString(),
    limit: 50,
    offset: 0,
  });

  const eventCount = todaysEvents.data?.length ?? 0;

  const dateLabel = useMemo(() => {
    const weekday = todayStart.toLocaleDateString("en-US", { weekday: "long" });
    const month = todayStart.toLocaleDateString("en-US", { month: "short" });
    return `${weekday}, ${todayStart.getDate()} ${month}`;
  }, [todayStart]);

  function handleQuickInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey && quickInput.trim()) {
      e.preventDefault();
      onCreateWithAI(quickInput.trim());
      setQuickInput("");
    }
  }

  return (
    <div
      style={{
        width: 320,
        flexShrink: 0,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Date header */}
      <div style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0" }}>{dateLabel}</div>
      <div style={{ fontSize: 11, color: "#555", marginBottom: 16 }}>
        {eventCount} event{eventCount === 1 ? "" : "s"} today
      </div>

      <button
        onClick={onNewEvent}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          width: "100%",
          background: "#B4F24A",
          color: "#0A0A0A",
          border: "none",
          borderRadius: 10,
          padding: "10px 0",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
          marginBottom: 16,
          flexShrink: 0,
        }}
      >
        <Plus size={14} />
        New Event
      </button>

      {/* Scrollable event list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {todaysEvents.isLoading && <div style={{ color: "#666", fontSize: 12 }}>Loading…</div>}
        {!todaysEvents.isLoading && eventCount === 0 && (
          <div style={{ color: "#666", fontSize: 12 }}>No events today.</div>
        )}
        {todaysEvents.data?.map((event) => (
          <div
            key={event.id}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: "#E2E8F0", marginBottom: 6 }}>
              {event.summary || "Untitled"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <Clock size={12} color="#B4F24A" />
              <span style={{ fontSize: 12, color: "#B4F24A" }}>{formatEventTime(event.start)}</span>
            </div>
            {event.attendees.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Users size={12} color="#555" />
                <span style={{ fontSize: 12, color: "#555" }}>
                  {event.attendees.length} attendee{event.attendees.length === 1 ? "" : "s"}
                </span>
              </div>
            )}
            <span
              style={{
                display: "inline-block",
                fontSize: 10,
                color: "#B4F24A",
                background: "rgba(180,242,74,0.08)",
                border: "1px solid rgba(180,242,74,0.15)",
                borderRadius: 999,
                padding: "2px 8px",
              }}
            >
              via Corsair MCP
            </span>
          </div>
        ))}
      </div>

      {/* Quick AI input */}
      <div
        style={{
          marginTop: 12,
          flexShrink: 0,
          background: "rgba(18,18,18,0.9)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12,
          padding: "8px 12px",
        }}
      >
        <input
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          onKeyDown={handleQuickInputKeyDown}
          placeholder="Create event with AI..."
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#F1F1F1",
            fontSize: 13,
            fontFamily: "inherit",
          }}
        />
      </div>
    </div>
  );
}

function Dashboard({
  onOpenSearch, setTab, onCompose,
  readIds, setReadIds, starredIds, setStarredIds,
  snoozedIds, setSnoozedIds, spamIds, setSpamIds,
  archivedIds, setArchivedIds,
}: {
  onOpenSearch: () => void;
  setTab: (t: Tab) => void;
  onCompose: () => void;
  readIds: Set<string>;
  setReadIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  starredIds: Set<string>;
  setStarredIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  snoozedIds: Set<string>;
  setSnoozedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  spamIds: Set<string>;
  setSpamIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  archivedIds: Set<string>;
  setArchivedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const [gmailCategory, setGmailCategory] = useState<string | undefined>(undefined);

  const allEmails = api.gmail.searchEmails.useQuery({ query: "", limit: 50, offset: 0 });
  const unreadEmails = api.gmail.searchEmails.useQuery({ query: "is:unread", limit: 50, offset: 0 });

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayEnd = useMemo(() => {
    const d = new Date(todayStart);
    d.setDate(d.getDate() + 1);
    return d;
  }, [todayStart]);

  const todaysEvents = api.calendar.searchEvents.useQuery({
    query: "",
    weekStart: todayStart.toISOString(),
    weekEnd: todayEnd.toISOString(),
    limit: 50,
    offset: 0,
  });

  const totalCount = allEmails.data?.filter(e => !archivedIds.has(e.id)).length ?? 0;
  const unreadCount = unreadEmails.data?.filter(e => !readIds.has(e.id)).length ?? 0;
  const eventsTodayCount = todaysEvents.data?.length ?? 0;

  function openCategory(cat: string) {
    setTab("gmail");
    setGmailCategory(cat);
  }

  return (
    <div style={{ flex: 1, background: "#0A0A0A", padding: 24, overflowY: "auto" }}>
      {/* Greeting + search */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 44, fontWeight: 800, color: "#F1F1F1", letterSpacing: "-0.02em", marginBottom: 16, fontFamily: "inherit" }}>
          {getGreeting()}
        </h1>
        <div style={{ maxWidth: 690, width: "100%", margin: "0 auto" }}>
          <AnimatedGlowingSearchBar onClick={onOpenSearch} />
        </div>
      </div>

      {/* Highlight cards */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, justifyContent: "center" }}>
        <div style={{ maxWidth: 320, flex: 1 }}>
          <HighlightCard
            title="Total Emails"
            value={totalCount}
            description="All messages in your inbox"
            icon={<Mail size={22} />}
            accentColor="#B4F24A"
            onClick={() => openCategory("all")}
          />
        </div>
        <div style={{ maxWidth: 320, flex: 1 }}>
          <HighlightCard
            title="Unread"
            value={unreadCount}
            description="Messages awaiting your attention"
            icon={<MailOpen size={22} />}
            accentColor="#B4F24A"
            onClick={() => openCategory("unread")}
          />
        </div>
        <div style={{ maxWidth: 320, flex: 1 }}>
          <HighlightCard
            title="Events Today"
            value={eventsTodayCount}
            description="Calendar events scheduled today"
            icon={<Calendar size={22} />}
            accentColor="#F28C28"
            onClick={() => setTab("calendar")}
          />
        </div>
      </div>

      {/* Recent emails, full width */}
      <div
        style={{
          height: 480,
          display: "flex",
          flexDirection: "column",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0", padding: "16px 16px 0" }}>
          Recent Emails
        </div>
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <GmailPanel
            listOnly
            requestedCategory={gmailCategory}
            onCompose={onCompose}
            readIds={readIds}
            setReadIds={setReadIds}
            starredIds={starredIds}
            setStarredIds={setStarredIds}
            snoozedIds={snoozedIds}
            setSnoozedIds={setSnoozedIds}
            spamIds={spamIds}
            setSpamIds={setSpamIds}
            archivedIds={archivedIds}
            setArchivedIds={setArchivedIds}
          />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("gmail");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [feedOpen, setFeedOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [pendingAIInput, setPendingAIInput] = useState<string | undefined>(undefined);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [snoozedIds, setSnoozedIds] = useState<Set<string>>(new Set());
  const [spamIds, setSpamIds] = useState<Set<string>>(new Set());
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setTab("ai");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Consume the AI prefill once it's been picked up by AIChat's initial mount.
  useEffect(() => {
    if (tab === "ai") setPendingAIInput(undefined);
  }, [tab]);

  return (
    <ToastProvider>
      <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
        {/* Sidebar */}
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: 220,
            height: "100%",
            background: "#111111",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            zIndex: 40,
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "20px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, #B4F24A, #F28C28)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Zap size={16} color="#0A0A0A" />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#E2E8F0" }}>FlowMail</span>
          </div>

          {/* Nav items */}
          <div style={{ padding: 16, flex: 1, overflowY: "auto" }}>
            <SidebarNavItem
              icon={<Mail size={18} />}
              label="Inbox"
              active={tab === "gmail"}
              onClick={() => setTab("gmail")}
            />
            <SidebarNavItem
              icon={<Calendar size={18} />}
              label="Calendar"
              active={tab === "calendar"}
              onClick={() => setTab("calendar")}
            />
            <SidebarNavItem
              icon={<Bot size={18} />}
              label="AI Chat"
              active={tab === "ai"}
              onClick={() => setTab("ai")}
            />
            <SidebarNavItem
              icon={<Zap size={18} />}
              label="Action Feed"
              active={feedOpen}
              onClick={() => setFeedOpen((v) => !v)}
            />
          </div>

          {/* Bottom: settings + user avatar */}
          <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <SidebarNavItem
              icon={<Settings size={18} />}
              label="Settings"
              active={tab === "settings"}
              onClick={() => setTab("settings")}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 8,
                padding: "8px 12px",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #B4F24A, #F28C28)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#0A0A0A",
                  flexShrink: 0,
                }}
              >
                FM
              </div>
              <span style={{ fontSize: 12, color: "#666" }}>My Account</span>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", marginLeft: 220 }}>
          {tab === "gmail" && (
            <Dashboard
              onOpenSearch={() => setCmdOpen(true)}
              setTab={setTab}
              onCompose={() => setComposing(true)}
              readIds={readIds}
              setReadIds={setReadIds}
              starredIds={starredIds}
              setStarredIds={setStarredIds}
              snoozedIds={snoozedIds}
              setSnoozedIds={setSnoozedIds}
              spamIds={spamIds}
              setSpamIds={setSpamIds}
              archivedIds={archivedIds}
              setArchivedIds={setArchivedIds}
            />
          )}
          {tab === "calendar" && (
            <div style={{ flex: 1, display: "flex", gap: 16, padding: 24, overflow: "hidden" }}>
              <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                <CalendarPanel
                  externalCreate={creatingEvent}
                  onCreateClose={() => setCreatingEvent(false)}
                />
              </div>
              <TodaysEventsPanel
                onNewEvent={() => setCreatingEvent(true)}
                onCreateWithAI={(text) => {
                  setPendingAIInput(text);
                  setTab("ai");
                }}
              />
            </div>
          )}
          {tab === "settings" && <SettingsPanel />}
          {tab === "ai" && (
            <div style={{ flex: 1, background: "#0A0A0A", padding: 24, overflow: "hidden", display: "flex" }}>
              <div
                style={{
                  maxWidth: 720,
                  width: "100%",
                  margin: "0 auto",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexShrink: 0 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "linear-gradient(135deg, #B4F24A, #F28C28)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Bot size={20} color="#0A0A0A" />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#E2E8F0" }}>FlowMail AI</div>
                    <div style={{ fontSize: 12, color: "#666" }}>Powered by Corsair MCP</div>
                  </div>
                </div>

                {/* Messages + input, full remaining height */}
                <div style={{ flex: 1, display: "flex", overflow: "hidden", borderRadius: 16 }}>
                  <AIChat hideHeader open={true} onClose={() => undefined} initialInput={pendingAIInput} />
                </div>
              </div>
            </div>
          )}
        </div>

        <ActionFeed open={feedOpen} onClose={() => setFeedOpen(false)} />

        <CommandPalette
          open={cmdOpen}
          onClose={() => setCmdOpen(false)}
          onNavigate={(t) => setTab(t)}
          onCompose={() => {
            setTab("gmail");
            setComposing(true);
          }}
          onOpenAI={() => setTab("ai")}
        />
        <ComposeWindow open={composing} onClose={() => setComposing(false)} />
      </div>
    </ToastProvider>
  );
}
