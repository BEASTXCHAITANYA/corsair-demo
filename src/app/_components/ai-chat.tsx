"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, Bot, User, Zap, Loader2 } from "lucide-react";
import { api } from "@/trpc/react";
import { useToast } from "@/app/_components/toast";
import { actionFeed } from "@/app/_components/action-feed";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  result?: string | null;
  type?: "text" | "action";
}

const SUGGESTIONS = [
  "Search emails from Google",
  "Create an event for tomorrow at 3pm",
  "Send a test email to myself",
  "What emails did I get today?",
];

interface AIChatProps {
  open: boolean;
  onClose: () => void;
  hideHeader?: boolean;
  initialInput?: string;
}

export function AIChat({ open, onClose, hideHeader = false, initialInput }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm FlowMail AI powered by Corsair. I can help you send emails, search your inbox, create calendar events, and send invites. What would you like to do?",
      type: "text",
    },
  ]);
  const [input, setInput] = useState(initialInput ?? "");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chat = api.ai.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: data.message,
          result: data.result,
          type: data.type,
        },
      ]);
      if (data.type === "action" && data.action && data.message) {
        const typeMap: Record<string, "email_sent" | "email_drafted" | "event_created" | "invite_sent" | "emails_searched"> = {
          send_email: "email_sent",
          create_draft: "email_drafted",
          create_event: "event_created",
          send_invite: "invite_sent",
          search_emails: "emails_searched",
        };
        const feedType = typeMap[data.action] ?? "email_sent";
        actionFeed.add(feedType, data.message, data.result ?? undefined, false);
      }
    },
    onError: (err) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `Sorry, something went wrong: ${err.message}`,
          type: "text",
        },
      ]);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  function handleSend() {
    if (!input.trim() || chat.isPending) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      type: "text",
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    chat.mutate({
      messages: newMessages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content })),
    });
  }

  function handleSuggestion(suggestion: string) {
    setInput(suggestion);
    inputRef.current?.focus();
  }

  if (!open) return null;

  return (
    <div style={{
      width: hideHeader ? "100%" : 360,
      height: "100%",
      background: "rgba(12, 12, 12, 0.85)",
      backdropFilter: "blur(20px) saturate(180%)",
      WebkitBackdropFilter: "blur(20px) saturate(180%)",
      borderLeft: hideHeader ? "none" : "1px solid rgba(255,255,255,0.08)",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
    }}>
      {/* Header */}
      {!hideHeader && (
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: "1px solid rgba(99,179,237,0.07)",
        flexShrink: 0,
      }}>
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: "linear-gradient(135deg, #B4F24A, #F28C28)",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 12px rgba(180,242,74,0.4)",
            flexShrink: 0,
          }}>
            <Bot size={16} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0" }}>FlowMail AI</div>
            <div style={{ fontSize: 10, color: "#475569" }}>Intelligent email assistant</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent", border: "none",
              cursor: "pointer", color: "#475569", padding: 4, borderRadius: 4,
              display: "flex", alignItems: "center",
              transition: "color 150ms",
            }}
            aria-label="Close AI chat"
          >
            <X size={15} />
          </button>
        </div>

        {/* Powered by Corsair MCP badge */}
        <div style={{
          position: "relative",
          borderRadius: 8,
          padding: "1px",
          background: "conic-gradient(from var(--angle, 0deg), #B4F24A, #F28C28, #B4F24A, #F28C28)",
          animation: "rotateBorder 3s linear infinite",
          boxShadow: "0 0 16px rgba(180,242,74,0.25), 0 0 32px rgba(245,140,40,0.1)",
        }}>
          <div style={{
            background: "rgba(8,11,20,0.95)",
            borderRadius: 7,
            padding: "7px 12px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            {/* Live dot */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "#B4F24A",
                boxShadow: "0 0 6px rgba(180,242,74,0.8)",
                animation: "livePulse 2s ease-in-out infinite",
              }} />
              <div style={{
                position: "absolute", inset: -3,
                borderRadius: "50%",
                border: "1px solid rgba(180,242,74,0.3)",
                animation: "liveRing 2s ease-in-out infinite",
              }} />
            </div>

            {/* Text */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 10, fontWeight: 600,
                color: "#94A3B8", letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}>
                Powered by
              </div>
              <div style={{
                fontSize: 11, fontWeight: 700,
                background: "linear-gradient(90deg, #B4F24A, #F28C28)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "0.01em",
              }}>
                Corsair MCP
              </div>
            </div>

            {/* Corsair icon */}
            <div style={{
              width: 20, height: 20, borderRadius: 5,
              background: "linear-gradient(135deg, #B4F24A, #F28C28)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 0 8px rgba(180,242,74,0.4)",
            }}>
              <Zap size={11} color="#fff" />
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "16px 12px",
        display: "flex", flexDirection: "column", gap: 12,
        scrollbarWidth: "thin", scrollbarColor: "#1C1C1C transparent",
      }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{
            display: "flex",
            flexDirection: "column",
            alignItems: msg.role === "user" ? "flex-end" : "flex-start",
            gap: 4,
          }}>
            {/* Avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {msg.role === "assistant" && (
                <div style={{
                  width: 20, height: 20, borderRadius: 4,
                  background: "linear-gradient(135deg, #B4F24A, #F28C28)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Zap size={10} color="#fff" />
                </div>
              )}
              <span style={{ fontSize: 11, color: "#555" }}>
                {msg.role === "user" ? "You" : "FlowMail AI"}
              </span>
              {msg.role === "user" && (
                <div style={{
                  width: 20, height: 20, borderRadius: 4,
                  background: "#B4F24A",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <User size={10} color="#fff" />
                </div>
              )}
            </div>

            {/* Bubble */}
            <div style={{
              maxWidth: "85%",
              background: msg.role === "user"
                ? "linear-gradient(135deg, #B4F24A, #A3E635)"
                : "rgba(255,255,255,0.04)",
              backdropFilter: msg.role === "assistant" ? "blur(12px)" : "none",
              WebkitBackdropFilter: msg.role === "assistant" ? "blur(12px)" : "none",
              border: msg.role === "user"
                ? "none"
                : "1px solid rgba(255,255,255,0.08)",
              borderRadius: msg.role === "user"
                ? "12px 12px 2px 12px"
                : "12px 12px 12px 2px",
              padding: "10px 14px",
              fontSize: 13,
              lineHeight: 1.6,
              color: msg.role === "user" ? "#0A0A0A" : "#F1F1F1",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {(() => {
                try {
                  const parsed = JSON.parse(msg.content) as { message?: string };
                  return parsed.message ?? msg.content;
                } catch {
                  return msg.content;
                }
              })()}
            </div>

            {/* Action result */}
            {msg.result && (
              <div style={{
                maxWidth: "85%",
                background: "rgba(180,242,74,0.1)",
                border: "1px solid rgba(180,242,74,0.2)",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12,
                color: "#B4F24A",
                fontWeight: 500,
              }}>
                {msg.result}
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {chat.isPending && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
            <div style={{
              width: 20, height: 20, borderRadius: 4,
              background: "linear-gradient(135deg, #B4F24A, #F28C28)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Zap size={10} color="#fff" />
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <Loader2 size={12} color="#B4F24A" style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 12, color: "#555" }}>Thinking…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div style={{
          padding: "0 12px 12px",
          display: "flex", flexWrap: "wrap", gap: 6,
        }}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSuggestion(s)}
              style={{
                background: "rgba(180,242,74,0.08)",
                border: "1px solid rgba(180,242,74,0.15)",
                borderRadius: 999,
                padding: "5px 12px",
                fontSize: 11,
                color: "#B4F24A",
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{
          position: "relative",
          background: "rgba(18,18,18,0.9)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: "12px 48px 12px 16px",
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask FlowMail AI anything..."
            rows={1}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: 13,
              color: "#F1F1F1",
              fontFamily: "inherit",
              lineHeight: "1.6",
              maxHeight: "120px",
              overflowY: "auto",
            }}
            aria-label="AI chat input"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || chat.isPending}
            style={{
              position: "absolute",
              right: 10,
              bottom: 10,
              width: 32,
              height: 32,
              borderRadius: 10,
              background: input.trim() ? "#B4F24A" : "rgba(255,255,255,0.05)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: input.trim() ? "pointer" : "not-allowed",
            }}
            aria-label="Send message"
          >
            <Send size={13} color={input.trim() ? "#0A0A0A" : "#555"} />
          </button>
        </div>
        <p style={{ fontSize: 10, color: "#333", textAlign: "center", marginTop: 8 }}>
          AI can send emails and create calendar events on your behalf
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
