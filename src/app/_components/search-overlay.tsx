"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Search, Mail, Calendar, X, Clock, ArrowRight } from "lucide-react";
import { api } from "@/trpc/react";

interface SearchResult {
  id: string;
  type: "email" | "event";
  title: string;
  subtitle: string;
  timestamp: string;
}

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  onSelectEmail?: (id: string) => void;
}

export function SearchOverlay({ open, onClose, onSelectEmail }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setSelectedIndex(0);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery(""); setDebouncedQuery(""); setSelectedIndex(0);
    }
  }, [open]);

  const emailResults = api.gmail.searchEmails.useQuery(
    { query: debouncedQuery, limit: 5, offset: 0 },
    { enabled: open && debouncedQuery.length > 1 }
  );

  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 30);
  const weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 60);

  const eventResults = api.calendar.searchEvents.useQuery(
    { query: debouncedQuery, weekStart: weekStart.toISOString(), weekEnd: weekEnd.toISOString(), limit: 5, offset: 0 },
    { enabled: open && debouncedQuery.length > 1 }
  );

  const emailList = (emailResults.data ?? []).slice(0, 4).map((e) => ({
    id: e.id, type: "email" as const,
    title: e.subject || "(no subject)",
    subtitle: e.from || "Unknown sender",
    timestamp: e.date ? new Date(Number(e.date)).toLocaleDateString([], { month: "short", day: "numeric" }) : "",
  }));

  const eventList = (eventResults.data ?? []).slice(0, 3).map((e) => ({
    id: e.id, type: "event" as const,
    title: e.summary || "Untitled event",
    subtitle: e.start ? new Date(e.start).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) : "",
    timestamp: e.start ? new Date(e.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
  }));

  const results: SearchResult[] = [...emailList, ...eventList];
  const isLoading = emailResults.isLoading || eventResults.isLoading;

  const handleSelect = useCallback((result: SearchResult) => {
    if (result.type === "email") onSelectEmail?.(result.id);
    onClose();
  }, [onSelectEmail, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[selectedIndex]) handleSelect(results[selectedIndex]!);
  }, [results, selectedIndex, onClose, handleSelect]);

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 1000 }} />
      <div style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 640, background: "#141414", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, boxShadow: "0 40px 80px rgba(0,0,0,0.6)", zIndex: 1001, overflow: "hidden" }} onKeyDown={handleKeyDown}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Search size={18} color="#8A8A8A" />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search emails and events..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 17, color: "#F1F1F1", fontFamily: "Inter, sans-serif", caretColor: "#B4F24A" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {isLoading && <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#B4F24A", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />}
            <kbd style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "2px 6px", fontSize: 11, color: "#8A8A8A", fontFamily: "inherit" }}>esc</kbd>
          </div>
        </div>

        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {!debouncedQuery && (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "#555", fontSize: 13 }}>
              <Clock size={24} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
              Start typing to search emails and calendar events
            </div>
          )}
          {debouncedQuery && !isLoading && results.length === 0 && (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "#555", fontSize: 13 }}>No results for "{debouncedQuery}"</div>
          )}

          {emailList.length > 0 && (
            <div>
              <div style={{ padding: "10px 20px 4px", fontSize: 11, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>Emails</div>
              {emailList.map((result, i) => {
                const isSelected = selectedIndex === i;
                return (
                  <button key={result.id} onClick={() => handleSelect(result)} onMouseEnter={() => setSelectedIndex(i)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", background: isSelected ? "rgba(180,242,74,0.1)" : "transparent", borderLeft: isSelected ? "2px solid #B4F24A" : "2px solid transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: isSelected ? "rgba(180,242,74,0.2)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Mail size={14} color={isSelected ? "#B4F24A" : "#8A8A8A"} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#F1F1F1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{result.title}</div>
                      <div style={{ fontSize: 12, color: "#8A8A8A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>{result.subtitle}</div>
                    </div>
                    <div style={{ fontSize: 11, color: "#555", flexShrink: 0 }}>{result.timestamp}</div>
                    {isSelected && <ArrowRight size={14} color="#B4F24A" />}
                  </button>
                );
              })}
            </div>
          )}

          {eventList.length > 0 && (
            <div>
              <div style={{ padding: "10px 20px 4px", fontSize: 11, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>Calendar Events</div>
              {eventList.map((result, i) => {
                const globalIndex = emailList.length + i;
                const isSelected = selectedIndex === globalIndex;
                return (
                  <button key={result.id} onClick={() => handleSelect(result)} onMouseEnter={() => setSelectedIndex(globalIndex)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", background: isSelected ? "rgba(180,242,74,0.1)" : "transparent", borderLeft: isSelected ? "2px solid #B4F24A" : "2px solid transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: isSelected ? "rgba(180,242,74,0.2)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Calendar size={14} color={isSelected ? "#B4F24A" : "#8A8A8A"} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#F1F1F1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{result.title}</div>
                      <div style={{ fontSize: 12, color: "#8A8A8A", marginTop: 1 }}>{result.subtitle}{result.timestamp && ` · ${result.timestamp}`}</div>
                    </div>
                    {isSelected && <ArrowRight size={14} color="#B4F24A" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: "10px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 16, fontSize: 11, color: "#555" }}>
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
            <span>Powered by</span>
            <span style={{ color: "#B4F24A", fontWeight: 600 }}>Corsair</span>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
