"use client";

import { useState, useRef } from "react";
import { X, Minus, Maximize2, Send, FileText, ChevronDown } from "lucide-react";
import { api } from "@/trpc/react";
import { useToast } from "@/app/_components/toast";

interface ComposeWindowProps {
  open: boolean;
  onClose: () => void;
  defaultTo?: string;
  defaultSubject?: string;
}

export function ComposeWindow({ open, onClose, defaultTo = "", defaultSubject = "" }: ComposeWindowProps) {
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState("");
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const { addToast } = useToast();
  const utils = api.useUtils();

  const sendEmail = api.gmail.sendEmail.useMutation({
    onSuccess: async () => {
      await utils.gmail.searchEmails.invalidate();
      addToast("success", "Email sent!", "Your message was delivered.");
      onClose();
      setTo(""); setSubject(""); setBody("");
    },
    onError: (err) => {
      addToast("error", "Failed to send", err.message);
    },
  });

  const createDraft = api.gmail.createDraft.useMutation({
    onSuccess: () => {
      addToast("info", "Draft saved", "Your draft has been saved.");
      onClose();
      setTo(""); setSubject(""); setBody("");
    },
  });

  if (!open) return null;

  const width = maximized ? "100vw" : 520;
  const height = maximized ? "100vh" : minimized ? 48 : 480;
  const bottom = maximized ? 0 : 0;
  const right = maximized ? 0 : 24;
  const borderRadius = maximized ? 0 : "12px 12px 0 0";

  return (
    <div style={{
      position: "fixed",
      bottom, right,
      width, height,
      background: "rgba(18,18,18,0.97)",
      backdropFilter: "blur(24px) saturate(180%)",
      WebkitBackdropFilter: "blur(24px) saturate(180%)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderBottom: "none",
      borderRadius,
      boxShadow: "0 -8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
      display: "flex",
      flexDirection: "column",
      zIndex: 500,
      transition: "width 200ms, height 200ms",
      overflow: "hidden",
      fontFamily: "Inter, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: minimized ? "none" : "1px solid rgba(255,255,255,0.06)",
        cursor: minimized ? "pointer" : "default",
        flexShrink: 0,
      }}
        onClick={() => minimized && setMinimized(false)}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: "#F1F1F1" }}>
          {subject || "New Message"}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setMinimized((v) => !v)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#555", padding: 4, borderRadius: 4, display: "flex", alignItems: "center" }} title="Minimize">
            {minimized ? <ChevronDown size={14} /> : <Minus size={14} />}
          </button>
          <button onClick={() => setMaximized((v) => !v)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#555", padding: 4, borderRadius: 4, display: "flex", alignItems: "center" }} title="Maximize">
            <Maximize2 size={13} />
          </button>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#555", padding: 4, borderRadius: 4, display: "flex", alignItems: "center" }} title="Close">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body — hidden when minimized */}
      {!minimized && (
        <>
          {/* To field */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: "#555", width: 52, flexShrink: 0 }}>To</span>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              type="email"
              autoFocus
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: "#F1F1F1", fontFamily: "inherit", caretColor: "#B4F24A" }}
            />
          </div>

          {/* Subject field */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: "#555", width: 52, flexShrink: 0 }}>Subject</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: "#F1F1F1", fontFamily: "inherit", caretColor: "#B4F24A" }}
            />
          </div>

          {/* Body */}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message..."
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                if (to && subject && body) sendEmail.mutate({ to, subject, body });
              }
            }}
            style={{
              flex: 1, padding: "14px 16px",
              background: "transparent", border: "none", outline: "none",
              fontSize: 14, color: "#F1F1F1", fontFamily: "inherit",
              resize: "none", lineHeight: 1.7, caretColor: "#B4F24A",
            }}
          />

          {/* Footer */}
          <div style={{
            padding: "12px 16px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", gap: 8,
            flexShrink: 0,
          }}>
            <button
              onClick={() => { if (to && subject && body) sendEmail.mutate({ to, subject, body }); }}
              disabled={sendEmail.isPending || !to || !subject || !body}
              style={{
                background: to && subject && body ? "linear-gradient(135deg, #B4F24A, #A3E635)" : "rgba(255,255,255,0.05)",
                color: to && subject && body ? "#fff" : "#555",
                border: "none", borderRadius: 8, padding: "8px 16px",
                fontSize: 13, fontWeight: 600, cursor: to && subject && body ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "inherit", transition: "background 150ms",
              }}
            >
              <Send size={13} />
              {sendEmail.isPending ? "Sending..." : "Send"}
            </button>
            <button
              onClick={() => { if (to && subject && body) createDraft.mutate({ to, subject, body }); }}
              disabled={createDraft.isPending || !to || !subject || !body}
              style={{
                background: "rgba(255,255,255,0.05)", color: "#8A8A8A",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
                padding: "8px 14px", fontSize: 13, fontWeight: 500,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                fontFamily: "inherit",
              }}
            >
              <FileText size={13} />
              {createDraft.isPending ? "Saving..." : "Save Draft"}
            </button>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "#333" }}>
              ⌘↵ to send
            </span>
          </div>
        </>
      )}
    </div>
  );
}
