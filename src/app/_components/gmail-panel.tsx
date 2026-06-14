"use client";

import { useState, useEffect } from "react";
import {
  Search, RefreshCw, PenSquare, X, Send, ArrowLeft,
  Mail, FileText, ChevronDown
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
            rgba(124,58,237,0.08) 50%,
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
  { bg: "rgba(124,58,237,0.25)", color: "#A78BFA" },
  { bg: "rgba(6,182,212,0.2)", color: "#67E8F9" },
  { bg: "rgba(34,197,94,0.2)", color: "#86EFAC" },
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

function isUnread(index: number): boolean {
  return index < 3;
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

interface GmailPanelProps {
  externalCompose?: boolean;
  onComposeClose?: () => void;
}

export function GmailPanel({ externalCompose, onComposeClose }: GmailPanelProps = {}) {
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);


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
  const utils = api.useUtils();

  const emails = api.gmail.searchEmails.useQuery({
    query: activeSearch,
    limit: 50,
    offset: 0,
  },
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

  return (
    <>
      {/* List Pane */}
      <div className="list-pane">
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

          {emails.data?.length === 0 && (
            <div className="empty-state">
              <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
              <span className="empty-state-text">All caught up!</span>
              <span className="empty-state-sub">No emails found. Try refreshing to sync from Gmail.</span>
              <button
                className="btn btn-ghost"
                style={{ marginTop: 12, fontSize: 12 }}
                onClick={() => refreshInbox.mutate()}
                disabled={refreshInbox.isPending}
              >
                {refreshInbox.isPending ? "Syncing..." : "↻ Refresh inbox"}
              </button>
            </div>
          )}

          {emails.data?.map((email, index) => {
            const sender = formatSender(email.from) || "Unknown";
            const initials = getInitials(email.from || sender);
            const avatarColor = getAvatarColor(sender);
            const unread = isUnread(index);
            const isSelected = selectedId === email.id;

            return (
              <button
                key={email.id}
                className={`email-item ${isSelected ? "selected" : ""} ${unread && !isSelected ? "unread" : ""}`}
                onClick={() => setSelectedId(email.id)}
                role="listitem"
                aria-label={`Email from ${email.from}: ${email.subject}`}
                style={{
                  borderLeftColor: unread && !isSelected ? "rgba(124,58,237,0.5)" : undefined,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 14px",
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
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                      <span style={{
                        fontSize: 13,
                        fontWeight: unread ? 600 : 400,
                        color: unread ? "#E2E8F0" : "#475569",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        maxWidth: 140,
                      }}>
                        {sender}
                      </span>
                      {unread && (
                        <div style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: "#7C3AED", flexShrink: 0,
                          boxShadow: "0 0 4px rgba(124,58,237,0.6)",
                        }} />
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: "#334155", flexShrink: 0, marginLeft: 4 }}>
                      {formatDate(email.date)}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 13,
                    fontWeight: unread ? 500 : 400,
                    color: unread ? "#94A3B8" : "#334155",
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
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail Pane */}
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
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity="0"/>
                  </radialGradient>
                  <linearGradient id="envGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7C3AED"/>
                    <stop offset="100%" stopColor="#06B6D4"/>
                  </linearGradient>
                </defs>
                {/* Glow */}
                <circle cx="60" cy="60" r="55" fill="url(#glow)"/>
                {/* Envelope body */}
                <rect x="20" y="35" width="80" height="55" rx="6" fill="rgba(124,58,237,0.15)" stroke="rgba(124,58,237,0.4)" strokeWidth="1.5"/>
                {/* Envelope flap */}
                <path d="M20 41 L60 68 L100 41" stroke="rgba(124,58,237,0.5)" strokeWidth="1.5" fill="none"/>
                {/* Lines inside */}
                <rect x="32" y="72" width="30" height="2" rx="1" fill="rgba(255,255,255,0.1)"/>
                <rect x="32" y="78" width="20" height="2" rx="1" fill="rgba(255,255,255,0.07)"/>
                {/* Floating dots */}
                <circle cx="18" cy="30" r="3" fill="#7C3AED" opacity="0.6"/>
                <circle cx="102" cy="80" r="2" fill="#06B6D4" opacity="0.5"/>
                <circle cx="95" cy="25" r="4" fill="#7C3AED" opacity="0.3"/>
                <circle cx="25" cy="88" r="2.5" fill="#06B6D4" opacity="0.4"/>
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
              background: "rgba(124,58,237,0.08)",
              border: "1px solid rgba(124,58,237,0.15)",
              borderRadius: 10, fontSize: 12, color: "#8A8A8A",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ color: "#7C3AED" }}>⌘K</span>
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
          <>
            {/* Email detail header */}
            <div className="detail-header">
              <button
                className="btn-icon"
                onClick={() => setSelectedId(null)}
                aria-label="Back to inbox"
              >
                <ArrowLeft size={16} />
              </button>

              {selectedEmail.isLoading && <LoadingDots />}

              {selectedEmail.data && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--text-1)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {selectedEmail.data.subject || "(no subject)"}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: "var(--text-3)",
                    marginTop: 2,
                  }}>
                    {selectedEmail.data.from}
                  </div>
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{ marginLeft: "auto" }}
                onClick={() => {
                  if (selectedEmail.data) {
                    setTo(selectedEmail.data.from);
                    setSubject(`Re: ${selectedEmail.data.subject}`);
                    setComposing(true);
                  }
                }}
              >
                <Send size={13} />
                Reply
              </button>
            </div>

            {/* Email body */}
            <div className="detail-content">
              {selectedEmail.isLoading && (
                <div className="empty-state">
                  <LoadingDots />
                </div>
              )}

              {selectedEmail.data && (
                <div>
                  {/* Meta */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 24,
                    paddingBottom: 16,
                    borderBottom: "1px solid var(--border)",
                  }}>
                    <div style={{
                      width: 40, height: 40,
                      borderRadius: "50%",
                      background: "var(--accent-dim)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--accent)",
                      fontWeight: 600,
                      fontSize: 16,
                      flexShrink: 0,
                    }}>
                      {(formatSender(selectedEmail.data.from)[0] ?? "?").toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, color: "var(--text-1)", fontSize: 14 }}>
                        {formatSender(selectedEmail.data.from)}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                        {selectedEmail.data.from}
                      </div>
                      {selectedEmail.data.to && (
                        <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                          To: {selectedEmail.data.to}
                        </div>
                      )}
                    </div>
                    <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-3)" }}>
                      {formatDate(selectedEmail.data.date)}
                    </div>
                  </div>

                  {/* Body */}
                  
                  {selectedEmail.data.body?.trim().startsWith("<") ? (
                    <iframe
                      srcDoc={selectedEmail.data.body}
                      style={{
                        width: "100%",
                        minHeight: 400,
                        border: "none",
                        borderRadius: "var(--radius-md)",
                        background: "#fff",
                      }}
                      title="Email content"
                      sandbox="allow-same-origin"
                    />
                  ) : (
                    <div style={{
                      fontSize: 14,
                      lineHeight: 1.7,
                      color: "var(--text-1)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}>
                      {selectedEmail.data.body ||
                       selectedEmail.data.snippet ||
                       "(empty message)"}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

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