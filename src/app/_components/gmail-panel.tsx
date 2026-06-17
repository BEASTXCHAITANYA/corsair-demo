"use client";

import { useState, useEffect, useMemo, type Dispatch, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import {
  Search, RefreshCw, PenSquare, X, Send, ArrowLeft, ArrowRight, Archive,
  Mail, FileText, ChevronDown, Inbox, Star, Clock, AlertTriangle,
  MoreVertical, ChevronRight,
} from "lucide-react";
import { api } from "@/trpc/react";
import { useToast } from "@/app/_components/toast";

function SkeletonEmail() {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "10px 14px",
      borderLeft: "2px solid transparent",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}>
      {/* Avatar skeleton */}
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: "rgba(255,255,255,0.05)",
        flexShrink: 0,
        overflow: "hidden", position: "relative",
      }}>
        <div className="skeleton-shimmer" />
      </div>
      {/* Content skeleton */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ height: 12, borderRadius: 6, background: "rgba(255,255,255,0.06)", overflow: "hidden", position: "relative", width: "45%" }}>
            <div className="skeleton-shimmer" />
          </div>
          <div style={{ height: 10, borderRadius: 4, background: "rgba(255,255,255,0.04)", overflow: "hidden", position: "relative", width: "15%" }}>
            <div className="skeleton-shimmer" />
          </div>
        </div>
        <div style={{ height: 11, borderRadius: 5, background: "rgba(255,255,255,0.05)", overflow: "hidden", position: "relative", width: "75%" }}>
          <div className="skeleton-shimmer" />
        </div>
        <div style={{ height: 10, borderRadius: 4, background: "rgba(255,255,255,0.03)", overflow: "hidden", position: "relative", width: "60%" }}>
          <div className="skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}

const SKELETON_WIDTHS = ["45%", "55%", "40%", "50%", "35%"];

function EmailListSkeleton() {
  return (
    <>
      {SKELETON_WIDTHS.map((_, i) => (
        <SkeletonEmail key={i} />
      ))}
      <style>{`
        .skeleton-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,0.06) 40%,
            rgba(180,242,74,0.08) 50%,
            rgba(255,255,255,0.06) 60%,
            transparent 100%
          );
          animation: shimmer 1.8s infinite;
          transform: translateX(-100%);
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </>
  );
}

const AVATAR_COLORS = [
  { bg: "rgba(180,242,74,0.25)", color: "#B4F24A" },
  { bg: "rgba(245,140,40,0.2)", color: "#67E8F9" },
  { bg: "rgba(180,242,74,0.2)", color: "#86EFAC" },
  { bg: "rgba(245,158,11,0.2)", color: "#FCD34D" },
  { bg: "rgba(236,72,153,0.2)", color: "#F9A8D4" },
  { bg: "rgba(59,130,246,0.2)", color: "#93C5FD" },
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

function getInitials(from: string): string {
  const clean = from.replace(/<.*?>/g, "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return (words[0]![0] ?? "?").toUpperCase();
  return ((words[0]![0] ?? "") + (words[words.length - 1]![0] ?? "")).toUpperCase();
}


function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(Number(dateStr));
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatSender(from: string): string {
  const match = /^(.+?)\s*</.exec(from);
  return match?.[1]?.trim() ?? from.split("@")[0] ?? from;
}

function LoadingDots() {
  return (
    <div className="loading-dots">
      <span /><span /><span />
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function plainTextToHtml(text: string): string {
  const URL_RE = /https?:\/\/[^\s<>"']+/g;
  const out: string[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = URL_RE.exec(text)) !== null) {
    if (m.index > last) out.push(escapeHtml(text.slice(last, m.index)));
    // Strip trailing punctuation that isn't part of the URL
    const raw = m[0].replace(/[.,;:!?)'"]+$/, "");
    const trailing = m[0].slice(raw.length);
    const safeHref = raw.replace(/"/g, "&quot;");
    if (raw.length > 60) {
      let label = raw;
      try { label = new URL(raw).hostname + "/…"; } catch { label = raw.slice(0, 57) + "…"; }
      out.push(`<a href="${safeHref}" target="_blank" rel="noopener noreferrer" style="color:#B4F24A;opacity:0.7">${escapeHtml(label)}</a>`);
    } else {
      out.push(`<a href="${safeHref}" target="_blank" rel="noopener noreferrer" style="color:#B4F24A">${escapeHtml(raw)}</a>`);
    }
    if (trailing) out.push(escapeHtml(trailing));
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(escapeHtml(text.slice(last)));
  return out.join("").replace(/\n/g, "<br>");
}

const SNOOZE_OPTIONS = [
  { key: "snooze-1h",       label: "1 hour" },
  { key: "snooze-tomorrow", label: "Tomorrow" },
  { key: "snooze-nextweek", label: "Next week" },
];

interface GmailPanelProps {
  externalCompose?: boolean;
  onComposeClose?: () => void;
  listOnly?: boolean;
  requestedCategory?: string;
  onCompose?: () => void;
  readIds: Set<string>;
  setReadIds: Dispatch<SetStateAction<Set<string>>>;
  starredIds: Set<string>;
  setStarredIds: Dispatch<SetStateAction<Set<string>>>;
  snoozedIds: Set<string>;
  setSnoozedIds: Dispatch<SetStateAction<Set<string>>>;
  spamIds: Set<string>;
  setSpamIds: Dispatch<SetStateAction<Set<string>>>;
  archivedIds: Set<string>;
  setArchivedIds: Dispatch<SetStateAction<Set<string>>>;
}

export function GmailPanel({ externalCompose, onComposeClose, listOnly = false, requestedCategory, onCompose, readIds, setReadIds, starredIds, setStarredIds, snoozedIds, setSnoozedIds, spamIds, setSpamIds, archivedIds, setArchivedIds }: GmailPanelProps) {
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [hoveredMenuOpt, setHoveredMenuOpt] = useState<string | null>(null);
  const [snoozeSubmenu, setSnoozeSubmenu] = useState(false);
  const [menuTriggerRect, setMenuTriggerRect] = useState<DOMRect | null>(null);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const { addToast } = useToast();

  useEffect(() => {
    if (externalCompose) {
      setComposing(true);
      onComposeClose?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalCompose]);

  useEffect(() => {
    if (requestedCategory) setActiveCategory(requestedCategory);
  }, [requestedCategory]);

  useEffect(() => {
    if (!openMenuId) return;
    const close = () => { setOpenMenuId(null); setSnoozeSubmenu(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openMenuId]);

  const utils = api.useUtils();

  const emailQuery = (() => {
    if (activeCategory === "all") return activeSearch;
    // snoozed/archive are local-only features — filter client-side against local Sets
    if (["snoozed", "archive"].includes(activeCategory)) return "";
    // everything else maps to a Gmail API query
    const queryMap: Record<string, string> = {
      unread:  "is:unread",
      starred: "is:starred",
      spam:    "in:spam",
    };
    return queryMap[activeCategory] ?? "";
  })();

  const emails = api.gmail.searchEmails.useQuery({
    query: emailQuery,
    limit: 50,
    offset: 0,
  }, { staleTime: 0 });

  const unreadEmails = api.gmail.searchEmails.useQuery(
    { query: "is:unread", limit: 50, offset: 0 },
    { staleTime: 0 }
  );

  const starredEmails = api.gmail.searchEmails.useQuery(
    { query: "is:starred", limit: 50, offset: 0 },
    { staleTime: 0 }
  );

  const spamEmails = api.gmail.searchEmails.useQuery(
    { query: "in:spam", limit: 50, offset: 0 },
    { staleTime: 0 }
  );

  const selectedEmail = api.gmail.getMessage.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId },
  );

  const refreshInbox = api.gmail.refreshInbox.useMutation({
    onSuccess: async (data) => {
      await utils.gmail.searchEmails.invalidate();
      addToast("success", "Inbox refreshed!", `Synced ${data.synced} threads from Gmail.`);
    },
    onError: (err) => {
      addToast("error", "Refresh failed", err.message);
    },
  });

  const sendEmail = api.gmail.sendEmail.useMutation({
    onSuccess: async () => {
      await utils.gmail.searchEmails.invalidate();
      setComposing(false);
      setTo(""); setSubject(""); setBody("");
      addToast("success", "Email sent!", "Your message was delivered successfully.");
    },
    onError: (err) => {
      addToast("error", "Failed to send", err.message);
    },
  });

  const createDraft = api.gmail.createDraft.useMutation({
    onSuccess: () => {
      setComposing(false);
      setTo(""); setSubject(""); setBody("");
      addToast("info", "Draft saved", "Your draft has been saved.");
    },
  });

  // Build a Set of IDs the API considers unread, then exclude any locally-read ones.
  const unreadIdSet = useMemo(
    () => new Set((unreadEmails.data ?? []).map(e => e.id)),
    [unreadEmails.data],
  );
  const isEffectivelyUnread = (e: { id: string }) => unreadIdSet.has(e.id) && !readIds.has(e.id);

  const NAV_ITEMS = [
    { key: "all",     label: "All Mail",     icon: Inbox,         count: undefined },
    { key: "unread",  label: "Unread",        icon: Mail,          count: unreadEmails.data?.filter(isEffectivelyUnread).length },
    { key: "starred", label: "Starred",       icon: Star,          count: starredEmails.data?.length },
    { key: "snoozed", label: "Snoozed",       icon: Clock,         count: snoozedIds.size > 0 ? snoozedIds.size : undefined },
    { key: "spam",    label: "Spam",          icon: AlertTriangle, count: spamEmails.data?.length },
    { key: "archive", label: "Archive",       icon: Archive,       count: archivedIds.size > 0 ? archivedIds.size : undefined },
  ];

  const activeNavItem = NAV_ITEMS.find(item => item.key === activeCategory)!;

  const displayedEmails = useMemo(() => {
    const data = emails.data ?? [];
    let filtered: typeof data;
    switch (activeCategory) {
      case "unread":
        // emailQuery already fetches "is:unread"; exclude locally-read emails
        filtered = data.filter(isEffectivelyUnread);
        break;
      case "starred":
        // emailQuery already fetches "is:starred"; pass through API result
        filtered = data;
        break;
      case "snoozed":
        // local-only feature; emailQuery fetches "" so filter by local Set
        filtered = data.filter(e => snoozedIds.has(e.id));
        break;
      case "spam":
        // emailQuery already fetches "in:spam"; pass through API result
        filtered = data;
        break;
      case "archive":
        // local-only feature; emailQuery fetches "" so filter by local Set
        filtered = data.filter(e => archivedIds.has(e.id));
        break;
      default:
        filtered = data;
    }
    // Archive view shows archived emails; all other views hide them
    return filtered.filter(e => activeCategory === "archive" || !archivedIds.has(e.id));
  }, [emails.data, activeCategory, unreadIdSet, readIds, snoozedIds, archivedIds]);

  const menuItemStyle = (key: string) => ({
    display: "flex" as const,
    alignItems: "center" as const,
    gap: 8,
    padding: "9px 12px",
    borderRadius: 6,
    fontSize: 13,
    color: "#E2E8F0",
    cursor: "pointer" as const,
    background: hoveredMenuOpt === key ? "rgba(180,242,74,0.08)" : "transparent",
    transition: "background 0.1s ease",
    userSelect: "none" as const,
    border: "none",
  });

  const EmailActionsDropdown = ({ emailId }: { emailId: string }) => {
    const isEmailStarred = starredIds.has(emailId);
    const isEmailSpam = spamIds.has(emailId);
    if (!menuTriggerRect) return null;
    const dropdownJsx = (
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: menuTriggerRect.bottom + 8,
          right: window.innerWidth - menuTriggerRect.right,
          background: "#1A1A1A",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10,
          padding: 6,
          minWidth: 180,
          whiteSpace: "nowrap",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          zIndex: 9999,
        }}
      >
        <div
          onMouseEnter={() => setHoveredMenuOpt("star")}
          onMouseLeave={() => setHoveredMenuOpt(null)}
          onClick={() => {
            setStarredIds(prev => {
              const next = new Set(prev);
              if (next.has(emailId)) { next.delete(emailId); addToast("info", "Unstarred", "Email removed from starred."); }
              else { next.add(emailId); addToast("success", "Email starred", "Added to starred."); }
              return next;
            });
            setOpenMenuId(null);
          }}
          style={menuItemStyle("star")}
        >
          <Star size={13} fill={isEmailStarred ? "#B4F24A" : "none"} stroke={isEmailStarred ? "#B4F24A" : "currentColor"} style={{ flexShrink: 0 }} />
          {isEmailStarred ? "Unmark star" : "Mark as star"}
        </div>
        <div>
          <div
            onMouseEnter={() => setHoveredMenuOpt("snooze")}
            onMouseLeave={() => setHoveredMenuOpt(null)}
            onClick={() => setSnoozeSubmenu(s => !s)}
            style={menuItemStyle("snooze")}
          >
            <Clock size={13} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>Snooze</span>
            <ChevronRight size={11} style={{
              color: "#666",
              transform: snoozeSubmenu ? "rotate(90deg)" : "none",
              transition: "transform 0.15s ease",
              flexShrink: 0,
            }} />
          </div>
          {snoozeSubmenu && (
            <div style={{ paddingLeft: 4 }}>
              {SNOOZE_OPTIONS.map(({ key, label }) => (
                <div
                  key={key}
                  onMouseEnter={() => setHoveredMenuOpt(key)}
                  onMouseLeave={() => setHoveredMenuOpt(null)}
                  onClick={() => {
                    setSnoozedIds(prev => new Set(prev).add(emailId));
                    addToast("info", "Email snoozed", `Snoozed until ${label.toLowerCase()}.`);
                    setOpenMenuId(null);
                    setSnoozeSubmenu(false);
                  }}
                  style={menuItemStyle(key)}
                >
                  <Clock size={12} style={{ color: "#666", flexShrink: 0 }} />
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>
        <div
          onMouseEnter={() => setHoveredMenuOpt("spam")}
          onMouseLeave={() => setHoveredMenuOpt(null)}
          onClick={() => {
            setSpamIds(prev => {
              const next = new Set(prev);
              if (next.has(emailId)) { next.delete(emailId); addToast("info", "Not spam", "Email removed from spam."); }
              else { next.add(emailId); addToast("info", "Marked as spam", "Email moved to spam."); }
              return next;
            });
            setOpenMenuId(null);
          }}
          style={menuItemStyle("spam")}
        >
          <AlertTriangle size={13} style={{ color: isEmailSpam ? "#F59E0B" : undefined, flexShrink: 0 }} />
          {isEmailSpam ? "Not spam" : "Report spam"}
        </div>
        <div
          onMouseEnter={() => setHoveredMenuOpt("archive")}
          onMouseLeave={() => setHoveredMenuOpt(null)}
          onClick={() => {
            setArchivedIds(prev => new Set(prev).add(emailId));
            if (selectedId === emailId) setSelectedId(null);
            addToast("info", "Email archived", "Email moved to archive.");
            setOpenMenuId(null);
          }}
          style={menuItemStyle("archive")}
        >
          <Archive size={13} style={{ flexShrink: 0 }} />
          Archive
        </div>
      </div>
    );
    return createPortal(dropdownJsx, document.body);
  };

  return (
    <>
      {/* Gmail Sub-sidebar */}
      <div style={{
        width: 180,
        flexShrink: 0,
        borderRight: "1px solid rgba(255,255,255,0.06)",
        padding: "16px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}>
        <button
          onClick={() => onCompose?.()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "10px 20px",
            marginBottom: 12,
            background: "#B4F24A",
            color: "#0A0A0A",
            fontWeight: 600,
            fontSize: 13,
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(180,242,74,0.25)",
            fontFamily: "inherit",
          }}
        >
          <PenSquare size={14} />
          Compose
        </button>
        {NAV_ITEMS.map(({ key, label, icon: Icon, count }) => {
          const isActive = activeCategory === key;
          const isHovered = hoveredNav === key;
          return (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              onMouseEnter={() => setHoveredNav(key)}
              onMouseLeave={() => setHoveredNav(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 13,
                cursor: "pointer",
                width: "100%",
                border: "none",
                textAlign: "left",
                background: isActive ? "rgba(180,242,74,0.1)" : "transparent",
                color: isActive ? "#B4F24A" : isHovered ? "#E2E8F0" : "#666",
                transition: "color 0.15s ease, background 0.15s ease",
              }}
            >
              <Icon size={14} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {(count ?? 0) > 0 && (
                <span style={{
                  background: "rgba(180,242,74,0.15)",
                  color: "#B4F24A",
                  borderRadius: 999,
                  padding: "1px 7px",
                  fontSize: 11,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List Pane */}
      <div className="list-pane" style={listOnly ? { width: "100%" } : undefined}>
        {/* Header */}
        <div className="pane-header">
          <span className="pane-title">Inbox</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              className="btn-icon"
              onClick={() => refreshInbox.mutate()}
              disabled={refreshInbox.isPending}
              title="Refresh"
              aria-label="Refresh inbox"
            >
              <RefreshCw
                size={14}
                style={{
                  animation: refreshInbox.isPending
                    ? "spin 1s linear infinite"
                    : "none",
                }}
              />
            </button>
            <button
              className="btn-icon"
              onClick={() => setComposing(true)}
              title="Compose"
              aria-label="Compose email"
            >
              <PenSquare size={14} />
            </button>
          </div>
        </div>

        {/* Search */}
        <form
          className="search-bar"
          onSubmit={(e) => {
            e.preventDefault();
            setActiveSearch(search);
          }}
        >
          <Search size={14} color="var(--text-3)" />
          <input
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emails..."
            aria-label="Search emails"
          />
          {search && (
            <button
              type="button"
              className="btn-icon"
              onClick={() => { setSearch(""); setActiveSearch(""); }}
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </form>

        {/* Category heading */}
        <div style={{
          padding: "8px 14px 0",
          fontSize: 11,
          fontWeight: 600,
          color: "#555",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 12,
        }}>
          {activeNavItem?.label}
        </div>

        {/* Email List */}
        <div className="email-list" role="list">
          {emails.isLoading && <EmailListSkeleton />}

          {emails.error && (
            <div className="empty-state">
              <span className="empty-state-text" style={{ color: "var(--danger)" }}>
                {emails.error.message}
              </span>
            </div>
          )}

          {!emails.isLoading && !emails.error && displayedEmails.length === 0 && (
            <div className="empty-state" style={{ gap: 8 }}>
              {activeNavItem && (
                <activeNavItem.icon size={28} style={{ color: "#444", marginBottom: 4 }} />
              )}
              <span style={{ fontSize: 13, color: "#444" }}>
                {activeCategory === "snoozed" ? "No snoozed emails" : "No emails here"}
              </span>
            </div>
          )}

          {displayedEmails.map((email, index) => {
            const sender = formatSender(email.from) || "Unknown";
            const initials = getInitials(email.from || sender);
            const avatarColor = getAvatarColor(sender);
            const effectiveUnread = isEffectivelyUnread(email);
            const isSelected = selectedId === email.id;
            const isStarred = starredIds.has(email.id);
            const isSpam = spamIds.has(email.id);
            const menuOpen = openMenuId === email.id;
            const rowHovered = hoveredRow === email.id;

            return (
              <div
                key={email.id}
                className={`email-item ${isSelected ? "selected" : ""} ${effectiveUnread && !isSelected ? "unread" : ""}`}
                onClick={() => {
                  setSelectedId(email.id);
                  setReadIds(prev => new Set(prev).add(email.id));
                }}
                onMouseEnter={() => setHoveredRow(email.id)}
                onMouseLeave={() => setHoveredRow(null)}
                role="listitem"
                aria-label={`Email from ${email.from}: ${email.subject}`}
                style={{
                  borderLeftColor: effectiveUnread && !isSelected ? "rgba(180,242,74,0.5)" : undefined,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 14px",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: avatarColor.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: avatarColor.color,
                  flexShrink: 0, marginTop: 1,
                  border: `1px solid ${avatarColor.color}30`,
                }}>
                  {initials}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, overflow: "hidden" }}>
                      <span style={{
                        fontSize: 13,
                        fontWeight: effectiveUnread ? 600 : 400,
                        color: effectiveUnread ? "#E2E8F0" : "#475569",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        maxWidth: 120,
                      }}>
                        {sender}
                      </span>
                      {effectiveUnread && (
                        <div style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: "#B4F24A", flexShrink: 0,
                          boxShadow: "0 0 4px rgba(180,242,74,0.6)",
                        }} />
                      )}
                    </div>

                    {/* Timestamp fades out, three-dot fades in on row hover */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <span style={{
                        fontSize: 11, color: "#334155",
                        opacity: rowHovered || menuOpen ? 0 : 1,
                        transition: "opacity 150ms",
                        pointerEvents: "none",
                        display: "block",
                        lineHeight: "24px",
                      }}>
                        {formatDate(email.date)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!menuOpen) setMenuTriggerRect(e.currentTarget.getBoundingClientRect());
                          setOpenMenuId(menuOpen ? null : email.id);
                          setSnoozeSubmenu(false);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        aria-label="More options"
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          opacity: rowHovered || menuOpen ? 1 : 0,
                          transition: "opacity 150ms",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 24,
                          height: 24,
                          borderRadius: 4,
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          color: "#777",
                          padding: 0,
                        }}
                      >
                        <MoreVertical size={13} />
                      </button>
                      {menuOpen && <EmailActionsDropdown emailId={email.id} />}
                    </div>
                  </div>

                  <div style={{
                    fontSize: 13,
                    fontWeight: effectiveUnread ? 500 : 400,
                    color: effectiveUnread ? "#94A3B8" : "#334155",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    marginBottom: 2,
                  }}>
                    {email.subject || "(no subject)"}
                  </div>
                  <div style={{
                    fontSize: 12, color: "#334155",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {email.snippet}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Pane */}
      {!listOnly && (
      <div className="detail-pane">
        {!selectedId ? (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: 48, gap: 0, height: "100%",
            animation: "fadeIn 0.4s ease",
          }}>
            {/* SVG Illustration */}
            <div style={{ marginBottom: 32, animation: "float 3s ease-in-out infinite" }}>
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#B4F24A" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#B4F24A" stopOpacity="0"/>
                  </radialGradient>
                  <linearGradient id="envGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#B4F24A"/>
                    <stop offset="100%" stopColor="#F28C28"/>
                  </linearGradient>
                </defs>
                {/* Glow */}
                <circle cx="60" cy="60" r="55" fill="url(#glow)"/>
                {/* Envelope body */}
                <rect x="20" y="35" width="80" height="55" rx="6" fill="rgba(180,242,74,0.15)" stroke="rgba(180,242,74,0.4)" strokeWidth="1.5"/>
                {/* Envelope flap */}
                <path d="M20 41 L60 68 L100 41" stroke="rgba(180,242,74,0.5)" strokeWidth="1.5" fill="none"/>
                {/* Lines inside */}
                <rect x="32" y="72" width="30" height="2" rx="1" fill="rgba(255,255,255,0.1)"/>
                <rect x="32" y="78" width="20" height="2" rx="1" fill="rgba(255,255,255,0.07)"/>
                {/* Floating dots */}
                <circle cx="18" cy="30" r="3" fill="#B4F24A" opacity="0.6"/>
                <circle cx="102" cy="80" r="2" fill="#F28C28" opacity="0.5"/>
                <circle cx="95" cy="25" r="4" fill="#B4F24A" opacity="0.3"/>
                <circle cx="25" cy="88" r="2.5" fill="#F28C28" opacity="0.4"/>
                {/* Star sparkles */}
                <path d="M105 45 L106.5 48 L110 48 L107.5 50 L108.5 53.5 L105 51.5 L101.5 53.5 L102.5 50 L100 48 L103.5 48 Z" fill="#F59E0B" opacity="0.6"/>
              </svg>
            </div>

            {/* Headline */}
            <h2 style={{
              fontSize: 22, fontWeight: 700, color: "#F1F1F1",
              letterSpacing: "-0.02em", marginBottom: 10, textAlign: "center",
            }}>
              Your inbox awaits
            </h2>

            {/* Subtext */}
            <p style={{
              fontSize: 14, color: "#555", textAlign: "center",
              lineHeight: 1.6, maxWidth: 280, marginBottom: 28,
            }}>
              Select an email to start reading, or compose something new with FlowMail AI
            </p>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <button
                className="btn btn-primary"
                onClick={() => setComposing(true)}
              >
                <PenSquare size={14} />
                Compose Email
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => refreshInbox.mutate()}
                disabled={refreshInbox.isPending}
              >
                <RefreshCw size={14} />
                {refreshInbox.isPending ? "Syncing…" : "Refresh Inbox"}
              </button>
            </div>

            {/* Tip */}
            <div style={{
              marginTop: 32, padding: "10px 16px",
              background: "rgba(180,242,74,0.08)",
              border: "1px solid rgba(180,242,74,0.15)",
              borderRadius: 10, fontSize: 12, color: "#8A8A8A",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ color: "#B4F24A" }}>⌘K</span>
              Press to open command palette
            </div>

            <style>{`
              @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
              }
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", animation: "fadeIn 0.2s ease" }}>
            {/* Action bar */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              padding: "10px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
            }}>
              {(["reply", "forward"] as const).map(key => {
                const icons = { reply: ArrowLeft, forward: ArrowRight } as const;
                const Icon = icons[key];
                const actions = {
                  reply:   () => { if (selectedEmail.data) { setTo(selectedEmail.data.from); setSubject(`Re: ${selectedEmail.data.subject ?? ""}`); setComposing(true); } },
                  forward: () => { if (selectedEmail.data) { setSubject(`Fwd: ${selectedEmail.data.subject ?? ""}`); setComposing(true); } },
                };
                return (
                  <button
                    key={key}
                    onClick={actions[key]}
                    onMouseEnter={() => setHoveredAction(key)}
                    onMouseLeave={() => setHoveredAction(null)}
                    aria-label={key}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 32, height: 32, borderRadius: 6, border: "none",
                      cursor: "pointer",
                      background: hoveredAction === key ? "rgba(255,255,255,0.06)" : "transparent",
                      color: hoveredAction === key ? "#E2E8F0" : "#555",
                      transition: "background 0.15s ease, color 0.15s ease",
                    }}
                  >
                    <Icon size={15} />
                  </button>
                );
              })}
              <div style={{ position: "relative" }}>
                <button
                  onClick={(e) => {
                    if (openMenuId !== "__panel__") setMenuTriggerRect(e.currentTarget.getBoundingClientRect());
                    setOpenMenuId(openMenuId === "__panel__" ? null : "__panel__");
                    setSnoozeSubmenu(false);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseEnter={() => setHoveredAction("actions")}
                  onMouseLeave={() => setHoveredAction(null)}
                  aria-label="More actions"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 32, height: 32, borderRadius: 6, border: "none",
                    cursor: "pointer",
                    background: (hoveredAction === "actions" || openMenuId === "__panel__") ? "rgba(255,255,255,0.06)" : "transparent",
                    color: (hoveredAction === "actions" || openMenuId === "__panel__") ? "#E2E8F0" : "#555",
                    transition: "background 0.15s ease, color 0.15s ease",
                  }}
                >
                  <MoreVertical size={15} />
                </button>
                {openMenuId === "__panel__" && selectedId && <EmailActionsDropdown emailId={selectedId} />}
              </div>
              <button
                onClick={() => setSelectedId(null)}
                onMouseEnter={() => setHoveredAction("close")}
                onMouseLeave={() => setHoveredAction(null)}
                aria-label="Close"
                style={{
                  marginLeft: "auto",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 32, height: 32, borderRadius: 6, border: "none",
                  cursor: "pointer",
                  background: hoveredAction === "close" ? "rgba(255,255,255,0.06)" : "transparent",
                  color: hoveredAction === "close" ? "#E2E8F0" : "#555",
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Loading */}
            {selectedEmail.isLoading && (
              <div className="empty-state"><LoadingDots /></div>
            )}

            {/* Reading content */}
            {selectedEmail.data && (
              <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
                {/* Subject */}
                <h2 style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#E2E8F0",
                  marginBottom: 8,
                  lineHeight: 1.3,
                }}>
                  {selectedEmail.data.subject || "(no subject)"}
                </h2>

                {/* From / date row */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: "#B4F24A" }}>
                    {formatSender(selectedEmail.data.from)}
                  </span>
                  <span style={{ fontSize: 12, color: "#555" }}>
                    {formatDate(selectedEmail.data.date)}
                  </span>
                </div>

                {/* Badge */}
                <span style={{
                  display: "inline-block",
                  background: "rgba(180,242,74,0.08)",
                  border: "1px solid rgba(180,242,74,0.15)",
                  borderRadius: 999,
                  padding: "3px 10px",
                  fontSize: 11,
                  color: "#B4F24A",
                }}>
                  via Gmail API · Corsair MCP
                </span>

                {/* Body */}
                {selectedEmail.data.body?.trim().startsWith("<") ? (
                  <iframe
                    srcDoc={selectedEmail.data.body}
                    style={{ width: "100%", minHeight: 400, marginTop: 20, border: "none", borderRadius: 8, background: "#fff" }}
                    title="Email content"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div
                    style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.8, marginTop: 20, wordBreak: "break-word", overflowWrap: "break-word" }}
                    dangerouslySetInnerHTML={{ __html: plainTextToHtml(selectedEmail.data.body || selectedEmail.data.snippet || "(empty message)") }}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Reading Modal — used in listOnly mode (detail-pane is hidden there) */}
      {listOnly && selectedId && (
        <div
          onClick={() => setSelectedId(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 700,
              maxWidth: "90vw",
              maxHeight: "85vh",
              background: "#0B0E16",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
            }}
          >
            {/* Modal action bar */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              padding: "10px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
            }}>
              {(["m-reply", "m-forward"] as const).map(key => {
                const icons = { "m-reply": ArrowLeft, "m-forward": ArrowRight } as const;
                const Icon = icons[key];
                const actions = {
                  "m-reply":   () => { if (selectedEmail.data) { setTo(selectedEmail.data.from); setSubject(`Re: ${selectedEmail.data.subject ?? ""}`); setComposing(true); } },
                  "m-forward": () => { if (selectedEmail.data) { setSubject(`Fwd: ${selectedEmail.data.subject ?? ""}`); setComposing(true); } },
                };
                return (
                  <button
                    key={key}
                    onClick={actions[key]}
                    onMouseEnter={() => setHoveredAction(key)}
                    onMouseLeave={() => setHoveredAction(null)}
                    aria-label={key}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 32, height: 32, borderRadius: 6, border: "none",
                      cursor: "pointer",
                      background: hoveredAction === key ? "rgba(255,255,255,0.06)" : "transparent",
                      color: hoveredAction === key ? "#E2E8F0" : "#555",
                      transition: "background 0.15s ease, color 0.15s ease",
                    }}
                  >
                    <Icon size={15} />
                  </button>
                );
              })}
              <div style={{ position: "relative" }}>
                <button
                  onClick={(e) => {
                    if (openMenuId !== "__panel__") setMenuTriggerRect(e.currentTarget.getBoundingClientRect());
                    setOpenMenuId(openMenuId === "__panel__" ? null : "__panel__");
                    setSnoozeSubmenu(false);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseEnter={() => setHoveredAction("actions")}
                  onMouseLeave={() => setHoveredAction(null)}
                  aria-label="More actions"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 32, height: 32, borderRadius: 6, border: "none",
                    cursor: "pointer",
                    background: (hoveredAction === "actions" || openMenuId === "__panel__") ? "rgba(255,255,255,0.06)" : "transparent",
                    color: (hoveredAction === "actions" || openMenuId === "__panel__") ? "#E2E8F0" : "#555",
                    transition: "background 0.15s ease, color 0.15s ease",
                  }}
                >
                  <MoreVertical size={15} />
                </button>
                {openMenuId === "__panel__" && selectedId && <EmailActionsDropdown emailId={selectedId} />}
              </div>
              <button
                onClick={() => setSelectedId(null)}
                onMouseEnter={() => setHoveredAction("m-close")}
                onMouseLeave={() => setHoveredAction(null)}
                aria-label="Close"
                style={{
                  marginLeft: "auto",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 32, height: 32, borderRadius: 6, border: "none",
                  cursor: "pointer",
                  background: hoveredAction === "m-close" ? "rgba(255,255,255,0.06)" : "transparent",
                  color: hoveredAction === "m-close" ? "#E2E8F0" : "#555",
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Loading */}
            {selectedEmail.isLoading && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
                <LoadingDots />
              </div>
            )}

            {/* Email content */}
            {selectedEmail.data && (
              <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#E2E8F0", marginBottom: 8, lineHeight: 1.3 }}>
                  {selectedEmail.data.subject || "(no subject)"}
                </h2>

                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: "#B4F24A" }}>
                    {formatSender(selectedEmail.data.from)}
                  </span>
                  <span style={{ fontSize: 12, color: "#555" }}>
                    {formatDate(selectedEmail.data.date)}
                  </span>
                </div>

                <span style={{
                  display: "inline-block",
                  background: "rgba(180,242,74,0.08)",
                  border: "1px solid rgba(180,242,74,0.15)",
                  borderRadius: 999,
                  padding: "3px 10px",
                  fontSize: 11,
                  color: "#B4F24A",
                }}>
                  via Gmail API · Corsair MCP
                </span>

                {selectedEmail.data.body?.trim().startsWith("<") ? (
                  <iframe
                    srcDoc={selectedEmail.data.body}
                    style={{ width: "100%", minHeight: 400, marginTop: 20, border: "none", borderRadius: 8, background: "#fff" }}
                    title="Email content"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div
                    style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.8, marginTop: 20, wordBreak: "break-word", overflowWrap: "break-word" }}
                    dangerouslySetInnerHTML={{ __html: plainTextToHtml(selectedEmail.data.body || selectedEmail.data.snippet || "(empty message)") }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compose Drawer */}
      {composing && (
        <div className="compose-drawer" role="dialog" aria-label="Compose email" style={{ background: "rgba(18,18,18,0.9)", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 -8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
          <div className="compose-header">
            <span>New Message</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button className="btn-icon" onClick={() => setComposing(false)} aria-label="Close compose">
                <ChevronDown size={16} />
              </button>
              <button className="btn-icon" onClick={() => setComposing(false)} aria-label="Discard">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="compose-field">
            <span className="compose-label">To</span>
            <input
              className="compose-input"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              aria-label="To"
            />
          </div>

          <div className="compose-field">
            <span className="compose-label">Subject</span>
            <input
              className="compose-input"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              aria-label="Subject"
            />
          </div>

          <textarea
            className="compose-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message…"
            aria-label="Message body"
          />

          <div className="compose-footer">
            <button
              className="btn btn-primary"
              onClick={() => sendEmail.mutate({ to, subject, body })}
              disabled={sendEmail.isPending || !to || !subject || !body}
            >
              <Send size={13} />
              {sendEmail.isPending ? "Sending…" : "Send"}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => createDraft.mutate({ to, subject, body })}
              disabled={createDraft.isPending || !to || !subject || !body}
            >
              <FileText size={13} />
              {createDraft.isPending ? "Saving…" : "Save Draft"}
            </button>
            {sendEmail.error && (
              <span style={{ fontSize: 12, color: "var(--danger)", marginLeft: 8 }}>
                {sendEmail.error.message}
              </span>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}