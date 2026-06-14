"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Search, Mail, Calendar, X, Clock, ArrowRight, Send, Plus, RefreshCw, Settings, Bot } from "lucide-react";
import { api } from "@/trpc/react";
import { useToast } from "@/app/_components/toast";

interface Action {
  id: string;
  type: "action" | "email" | "event";
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: "gmail" | "calendar" | "settings") => void;
  onCompose: () => void;
  onOpenAI: () => void;
}

export function CommandPalette({ open, onClose, onNavigate, onCompose, onOpenAI }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setSelectedIndex(0);
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery(""); setDebouncedQuery(""); setSelectedIndex(0);
    }
  }, [open]);

  const utils = api.useUtils();

  const refreshInbox = api.gmail.refreshInbox.useMutation({
    onSuccess: async (data) => {
      await utils.gmail.searchEmails.invalidate();
      addToast("success", "Inbox refreshed!", `Synced ${data.synced} threads.`);
      onClose();
    },
  });

  const emailResults = api.gmail.searchEmails.useQuery(
    { query: debouncedQuery, limit: 4, offset: 0 },
    { enabled: open && debouncedQuery.length > 1 }
  );

  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
  const weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 30);

  const eventResults = api.calendar.searchEvents.useQuery(
    { query: debouncedQuery, weekStart: weekStart.toISOString(), weekEnd: weekEnd.toISOString(), limit: 3, offset: 0 },
    { enabled: open && debouncedQuery.length > 1 }
  );

  // Static actions (always shown when no query)
  const staticActions: Action[] = [
    {
      id: "compose", type: "action",
      title: "Compose new email",
      subtitle: "Open compose window",
      icon: <Send size={15} color="#7C3AED" />,
      onSelect: () => { onCompose(); onClose(); },
    },
    {
      id: "new-event", type: "action",
      title: "Create calendar event",
      subtitle: "Add a new event",
      icon: <Plus size={15} color="#22C55E" />,
      onSelect: () => { onNavigate("calendar"); onClose(); },
    },
    {
      id: "refresh", type: "action",
      title: "Refresh inbox",
      subtitle: "Sync latest emails from Gmail",
      icon: <RefreshCw size={15} color="#06B6D4" />,
      onSelect: () => refreshInbox.mutate(),
    },
    {
      id: "ai", type: "action",
      title: "Open AI Assistant",
      subtitle: "Chat with FlowMail AI (⌘/)",
      icon: <Bot size={15} color="#F59E0B" />,
      onSelect: () => { onOpenAI(); onClose(); },
    },
    {
      id: "goto-gmail", type: "action",
      title: "Go to Inbox",
      subtitle: "Switch to email view",
      icon: <Mail size={15} color="#8A8A8A" />,
      onSelect: () => { onNavigate("gmail"); onClose(); },
    },
    {
      id: "goto-calendar", type: "action",
      title: "Go to Calendar",
      subtitle: "Switch to calendar view",
      icon: <Calendar size={15} color="#8A8A8A" />,
      onSelect: () => { onNavigate("calendar"); onClose(); },
    },
    {
      id: "goto-settings", type: "action",
      title: "Go to Settings",
      subtitle: "App preferences and integrations",
      icon: <Settings size={15} color="#8A8A8A" />,
      onSelect: () => { onNavigate("settings"); onClose(); },
    },
  ];

  // Search results as actions
  const searchActions: Action[] = [
    ...(emailResults.data ?? []).slice(0, 3).map((e) => ({
      id: e.id, type: "email" as const,
      title: e.subject || "(no subject)",
      subtitle: e.from || "Unknown sender",
      icon: <Mail size={15} color="#7C3AED" />,
      onSelect: () => onClose(),
    })),
    ...(eventResults.data ?? []).slice(0, 2).map((e) => ({
      id: e.id, type: "event" as const,
      title: e.summary || "Untitled event",
      subtitle: e.start ? new Date(e.start).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) : "",
      icon: <Calendar size={15} color="#22C55E" />,
      onSelect: () => onClose(),
    })),
  ];

  const actions = debouncedQuery.length > 1 ? searchActions : staticActions;
  const isLoading = emailResults.isLoading || eventResults.isLoading;

  const handleSelect = useCallback((action: Action) => {
    action.onSelect();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, actions.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && actions[selectedIndex]) handleSelect(actions[selectedIndex]!);
  }, [actions, selectedIndex, onClose, handleSelect]);

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 1000 }} />
      <div style={{
        position: "fixed", top: "18%", left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 640,
        background: "rgba(14,14,14,0.95)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        boxShadow: "0 40px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)",
        zIndex: 1001, overflow: "hidden",
      }} onKeyDown={handleKeyDown}>

        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Search size={18} color="#555" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or type a command..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 17, color: "#F1F1F1", fontFamily: "Inter, sans-serif", caretColor: "#7C3AED" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {isLoading && <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#7C3AED", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />}
            {query && <button onClick={() => setQuery("")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#555", padding: 2 }}><X size={14} /></button>}
            <kbd style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "2px 6px", fontSize: 11, color: "#555", fontFamily: "inherit" }}>esc</kbd>
          </div>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          {!debouncedQuery && (
            <div style={{ padding: "8px 20px 4px", fontSize: 11, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Quick Actions
            </div>
          )}
          {debouncedQuery && searchActions.length === 0 && !isLoading && (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "#555", fontSize: 13 }}>
              <Clock size={24} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
              No results for "{debouncedQuery}"
            </div>
          )}
          {debouncedQuery && searchActions.length > 0 && (
            <div style={{ padding: "8px 20px 4px", fontSize: 11, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Results
            </div>
          )}

          {actions.map((action, i) => {
            const isSelected = selectedIndex === i;
            return (
              <button
                key={action.id}
                onClick={() => handleSelect(action)}
                onMouseEnter={() => setSelectedIndex(i)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 20px",
                  background: isSelected ? "rgba(124,58,237,0.1)" : "transparent",
                  borderWidth: "0 0 0 2px",
                  borderStyle: "solid",
                  borderColor: isSelected ? "#7C3AED" : "transparent",
                  cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  transition: "background 100ms",
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: isSelected ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {action.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#F1F1F1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{action.title}</div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 1 }}>{action.subtitle}</div>
                </div>
                {isSelected && <ArrowRight size={14} color="#7C3AED" />}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 16, fontSize: 11, color: "#555" }}>
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
          <div style={{ marginLeft: "auto", color: "#7C3AED", fontWeight: 600 }}>FlowMail</div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
