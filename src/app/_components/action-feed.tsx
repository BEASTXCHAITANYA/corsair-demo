"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, X, Mail, Calendar, FileText, Zap, Clock, Search, RotateCcw } from "lucide-react";

export type ActionType = "email_sent" | "email_drafted" | "event_created" | "invite_sent" | "emails_searched" | "ai_summary";

export interface FeedAction {
  id: string;
  type: ActionType;
  label: string;
  detail?: string;
  timestamp: Date;
  undoable?: boolean;
  undone?: boolean;
}

type FeedListener = (action: FeedAction) => void;
const feedListeners: FeedListener[] = [];

export const actionFeed = {
  add: (type: ActionType, label: string, detail?: string, undoable = false) => {
    const action: FeedAction = {
      id: Math.random().toString(36).slice(2),
      type, label, detail,
      timestamp: new Date(),
      undoable, undone: false,
    };
    feedListeners.forEach((l) => l(action));
    return action.id;
  },
};

export function useFeedListener(listener: FeedListener) {
  useEffect(() => {
    feedListeners.push(listener);
    return () => {
      const i = feedListeners.indexOf(listener);
      if (i > -1) feedListeners.splice(i, 1);
    };
  }, [listener]);
}

const ACTION_CONFIG: Record<ActionType, {
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
}> = {
  email_sent:      { color: "#22C55E", bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.25)",   icon: <Mail size={13} /> },
  email_drafted:   { color: "#22C55E", bg: "rgba(34,197,94,0.10)",   border: "rgba(34,197,94,0.2)",    icon: <FileText size={13} /> },
  event_created:   { color: "#06B6D4", bg: "rgba(6,182,212,0.12)",   border: "rgba(6,182,212,0.25)",   icon: <Calendar size={13} /> },
  invite_sent:     { color: "#06B6D4", bg: "rgba(6,182,212,0.10)",   border: "rgba(6,182,212,0.2)",    icon: <Calendar size={13} /> },
  emails_searched: { color: "#7C3AED", bg: "rgba(124,58,237,0.12)",  border: "rgba(124,58,237,0.25)",  icon: <Search size={13} /> },
  ai_summary:      { color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.25)",  icon: <Bot size={13} /> },
};

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

interface ActionFeedProps {
  open: boolean;
  onClose: () => void;
}

export function ActionFeed({ open, onClose }: ActionFeedProps) {
  const [actions, setActions] = useState<FeedAction[]>([
    {
      id: "demo-1", type: "email_sent",
      label: "Sent greeting email",
      detail: "to chaitanyapal14@gmail.com",
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      undoable: false,
    },
    {
      id: "demo-2", type: "invite_sent",
      label: "Sent calendar invite",
      detail: "to friend@corsair.dev",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      undoable: false,
    },
    {
      id: "demo-3", type: "emails_searched",
      label: "Searched inbox",
      detail: "query: Google",
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      undoable: false,
    },
  ]);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [, setTicker] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTicker((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const addAction = useCallback((action: FeedAction) => {
    setActions((prev) => [action, ...prev].slice(0, 20));
  }, []);

  useFeedListener(addAction);

  const handleUndo = (id: string) => {
    setActions((prev) => prev.map((a) => a.id === id ? { ...a, undone: true } : a));
  };

  const clearAll = () => setActions([]);

  if (!open) return null;

  return (
    <div style={{
      width: 280, height: "100%",
      background: "rgba(8,11,20,0.95)",
      backdropFilter: "blur(20px) saturate(200%)",
      WebkitBackdropFilter: "blur(20px) saturate(200%)",
      borderLeft: "1px solid rgba(99,179,237,0.07)",
      display: "flex", flexDirection: "column",
      flexShrink: 0, fontFamily: "Inter, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px",
        borderBottom: "1px solid rgba(99,179,237,0.07)",
        display: "flex", alignItems: "center", gap: 8,
        flexShrink: 0,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 12px rgba(124,58,237,0.4)",
          flexShrink: 0,
        }}>
          <Zap size={13} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#E2E8F0" }}>AI Action Feed</div>
          <div style={{ fontSize: 10, color: "#475569" }}>Live · Corsair MCP</div>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {actions.length > 0 && (
            <button onClick={clearAll} style={{
              background: "transparent", border: "none", cursor: "pointer",
              color: "#475569", fontSize: 10, fontFamily: "inherit",
              padding: "2px 6px", borderRadius: 4,
              transition: "color 150ms",
            }}>
              Clear
            </button>
          )}
          <button onClick={onClose} style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: "#475569", padding: 4, display: "flex", alignItems: "center",
          }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Live indicator */}
      <div style={{
        padding: "8px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.03)",
        display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "#22C55E",
          boxShadow: "0 0 6px rgba(34,197,94,0.6)",
          animation: "pulse 2s infinite",
        }} />
        <span style={{ fontSize: 11, color: "#475569" }}>
          {actions.length} action{actions.length !== 1 ? "s" : ""} today
        </span>
      </div>

      {/* Actions */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px", scrollbarWidth: "thin", scrollbarColor: "#1A2438 transparent" }}>
        {actions.length === 0 ? (
          <div style={{
            padding: "48px 16px", textAlign: "center",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
          }}>
            <div style={{ opacity: 0.15 }}><Bot size={40} color="#E2E8F0" /></div>
            <div style={{ fontSize: 13, color: "#475569" }}>No actions yet</div>
            <div style={{ fontSize: 11, color: "#334155", lineHeight: 1.6, maxWidth: 180 }}>
              AI agent actions will appear here in real-time
            </div>
          </div>
        ) : (
          actions.map((action, index) => {
            const config = ACTION_CONFIG[action.type];
            const isHovered = hoveredId === action.id;

            return (
              <div
                key={action.id}
                onMouseEnter={() => setHoveredId(action.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  borderRadius: 8, marginBottom: 4,
                  padding: "10px 10px 10px 12px",
                  display: "flex", alignItems: "flex-start", gap: 10,
                  background: isHovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isHovered ? config.border : "rgba(255,255,255,0.04)"}`,
                  borderLeft: `2px solid ${action.undone ? "rgba(255,255,255,0.06)" : config.color}`,
                  opacity: action.undone ? 0.45 : 1,
                  transition: "all 200ms ease",
                  animation: `slideInFeed 0.3s ease ${Math.min(index * 0.06, 0.3)}s both`,
                  cursor: "default",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Colored icon */}
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: isHovered ? config.bg : "rgba(255,255,255,0.04)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: action.undone ? "#334155" : config.color,
                  flexShrink: 0, marginTop: 1,
                  transition: "background 200ms, color 200ms",
                  boxShadow: isHovered ? `0 0 8px ${config.color}30` : "none",
                }}>
                  {config.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 500,
                    color: action.undone ? "#334155" : "#E2E8F0",
                    textDecoration: action.undone ? "line-through" : "none",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    marginBottom: 2,
                  }}>
                    {action.label}
                  </div>
                  {action.detail && (
                    <div style={{
                      fontSize: 11, color: "#475569",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      marginBottom: 4,
                    }}>
                      {action.detail}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={9} color="#334155" />
                    <span style={{
                      fontSize: 10, color: "#334155",
                      fontFamily: "var(--font-mono, monospace)",
                    }}>
                      {timeAgo(action.timestamp)}
                    </span>
                    {action.undone && (
                      <span style={{ fontSize: 10, color: "#F59E0B", marginLeft: 4 }}>↩ undone</span>
                    )}
                  </div>
                </div>

                {/* Undo button — slides in on hover */}
                {action.undoable && !action.undone && (
                  <button
                    onClick={() => handleUndo(action.id)}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: `1px solid ${config.border}`,
                      borderRadius: 6, padding: "3px 8px",
                      fontSize: 10, color: config.color,
                      cursor: "pointer", fontFamily: "inherit",
                      display: "flex", alignItems: "center", gap: 4,
                      flexShrink: 0, whiteSpace: "nowrap",
                      opacity: isHovered ? 1 : 0,
                      transform: isHovered ? "translateX(0)" : "translateX(8px)",
                      transition: "opacity 150ms ease, transform 150ms ease",
                      pointerEvents: isHovered ? "all" : "none",
                    }}
                  >
                    <RotateCcw size={9} />
                    Undo
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes slideInFeed {
          from { transform: translateX(16px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(34,197,94,0.6); }
          50% { opacity: 0.5; box-shadow: 0 0 10px rgba(34,197,94,0.3); }
        }
      `}</style>
    </div>
  );
}
