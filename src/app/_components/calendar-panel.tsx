"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft, ChevronRight, RefreshCw,
  Plus, X, Calendar, Clock, MapPin, Users
} from "lucide-react";
import { api } from "@/trpc/react";
import { useToast } from "@/app/_components/toast";
import { Calendar as DatePicker } from "@/components/ui/calendar";

function getWeekBounds(offset: number) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 7);
  return { start: monday, end: sunday };
}

function formatWeekLabel(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString([], opts)} – ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${start.toLocaleDateString([], opts)} – ${end.toLocaleDateString([], opts)}, ${end.getFullYear()}`;
}

function formatEventTime(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const GRID_START_HOUR = 8;
const GRID_END_HOUR = 20;
const GRID_ROW_HEIGHT = 48;
const GRID_HOURS = Array.from(
  { length: GRID_END_HOUR - GRID_START_HOUR + 1 },
  (_, i) => GRID_START_HOUR + i,
);

function getEventGridOffsets(startStr: string, endStr: string): { top: number; height: number } {
  const start = new Date(startStr);
  const startHour = start.getHours() + start.getMinutes() / 60;
  const top = (startHour - GRID_START_HOUR) * GRID_ROW_HEIGHT;

  let durationHours = 1;
  if (endStr) {
    const end = new Date(endStr);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs > 0) durationHours = diffMs / (1000 * 60 * 60);
  }
  const height = Math.max(durationHours * GRID_ROW_HEIGHT, 20);

  return { top, height };
}

function LoadingDots() {
  return (
    <div className="loading-dots">
      <span /><span /><span />
    </div>
  );
}

interface CalendarPanelProps {
  listOnly?: boolean;
  externalCreate?: boolean;
  onCreateClose?: () => void;
}

export function CalendarPanel({ listOnly = false, externalCreate, onCreateClose }: CalendarPanelProps = {}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  useEffect(() => {
    if (externalCreate) {
      setCreating(true);
      onCreateClose?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalCreate]);

  const defaultStart = new Date();
  defaultStart.setMinutes(0, 0, 0);
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setHours(defaultEnd.getHours() + 1);

  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [start, setStart] = useState(toDatetimeLocal(defaultStart));
  const [end, setEnd] = useState(toDatetimeLocal(defaultEnd));
  const [attendees, setAttendees] = useState("");

  const week = useMemo(() => getWeekBounds(weekOffset), [weekOffset]);
  const weekLabel = formatWeekLabel(week.start, week.end);

  const { addToast } = useToast();
  const utils = api.useUtils();

  const events = api.calendar.searchEvents.useQuery({
    query: activeSearch,
    weekStart: week.start.toISOString(),
    weekEnd: week.end.toISOString(),
    limit: 50,
    offset: 0,
  });

  const refreshEvents = api.calendar.refreshEvents.useMutation({
    onSuccess: async (data) => {
      await utils.calendar.searchEvents.invalidate();
      addToast("success", "Calendar synced!", `Synced ${data.synced} events.`);
    },
    onError: (err) => {
      addToast("error", "Sync failed", err.message);
    },
  });

  const sendInvite = api.calendar.sendInvite.useMutation({
    onSuccess: async () => {
      await utils.calendar.searchEvents.invalidate();
      resetForm();
      addToast("success", "Invite sent!", "Calendar invite delivered to attendees.");
    },
    onError: (err) => {
      addToast("error", "Failed to send invite", err.message);
    },
  });

  const createDraft = api.calendar.createDraft.useMutation({
    onSuccess: async () => {
      await utils.calendar.searchEvents.invalidate();
      resetForm();
      addToast("info", "Event saved!", "Your event has been added to calendar.");
    },
  });

  function resetForm() {
    setSummary(""); setDescription(""); setLocation("");
    setAttendees(""); setCreating(false);
  }

  function parseAttendees() {
    return attendees.split(",").map((a) => a.trim()).filter(Boolean);
  }

  function toIso(val: string) {
    return new Date(val).toISOString();
  }

  // Group events by day of week (0=Mon ... 6=Sun)
  const eventsByDay = useMemo(() => {
    const groups: Record<number, typeof events.data> = {};
    for (let i = 0; i < 7; i++) groups[i] = [];
    events.data?.forEach((event) => {
      if (!event.start) return;
      const d = new Date(event.start);
      const dow = (d.getDay() + 6) % 7; // Mon=0
      groups[dow]?.push(event);
    });
    return groups;
  }, [events.data]);

  // Day dates for the week
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(week.start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [week.start]);

  const today = new Date();

  const selectedEventData = events.data?.find((e) => e.id === selectedEvent);

  return (
    <>
      {/* List Pane — week navigation + event list */}
      <div className="list-pane" style={listOnly ? { width: "100%" } : undefined}>
        {/* Header */}
        <div className="pane-header">
          <span className="pane-title">Calendar</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              className="btn-icon"
              onClick={() => refreshEvents.mutate({
                weekStart: week.start.toISOString(),
                weekEnd: week.end.toISOString(),
              })}
              disabled={refreshEvents.isPending}
              title="Refresh"
              aria-label="Refresh calendar"
            >
              <RefreshCw
                size={14}
                style={{
                  animation: refreshEvents.isPending
                    ? "spin 1s linear infinite"
                    : "none",
                }}
              />
            </button>
            <button
              className="btn-icon"
              onClick={() => setCreating(true)}
              title="New event"
              aria-label="Create event"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Week navigation */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          borderBottom: "1px solid var(--border)",
        }}>
          <button
            className="btn-icon"
            onClick={() => setWeekOffset((w) => w - 1)}
            aria-label="Previous week"
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{
            flex: 1,
            textAlign: "center",
            fontSize: 12,
            color: "var(--text-2)",
            fontWeight: 500,
          }}>
            {weekLabel}
          </span>
          <button
            className="btn-icon"
            onClick={() => setWeekOffset((w) => w + 1)}
            aria-label="Next week"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {weekOffset !== 0 && (
          <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--border)" }}>
            <button
              className="btn btn-ghost"
              style={{ width: "100%", justifyContent: "center", fontSize: 12 }}
              onClick={() => setWeekOffset(0)}
            >
              Back to this week
            </button>
          </div>
        )}

        {/* Search */}
        <form
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            borderBottom: "1px solid var(--border)",
          }}
          onSubmit={(e) => {
            e.preventDefault();
            setActiveSearch(search);
          }}
        >
          <input
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-1)",
              fontSize: 13,
              fontFamily: "inherit",
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events…"
            aria-label="Search events"
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

        {/* Date picker */}
        <div style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <DatePicker mode="single" selected={date} onSelect={setDate} />
        </div>

        {/* Event list */}
        <div className="email-list" role="list">
          {events.isLoading && (
            <div className="empty-state">
              <LoadingDots />
              <span className="empty-state-sub">Loading events…</span>
            </div>
          )}

          {events.data?.length === 0 && !events.isLoading && (
            <div className="empty-state">
              <Calendar size={32} className="empty-state-icon" />
              <span className="empty-state-text">No events this week</span>
              <span className="empty-state-sub">Refresh to sync from Google Calendar</span>
            </div>
          )}

          {DAYS.map((dayName, i) => {
            const dayEvents = eventsByDay[i] ?? [];
            if (dayEvents.length === 0) return null;
            const date = weekDates[i]!;
            const isToday = date.toDateString() === today.toDateString();

            return (
              <div key={dayName}>
                {/* Day label */}
                <div style={{
                  padding: "8px 16px 4px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: isToday ? "var(--accent)" : "var(--text-3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}>
                    {dayName} {date.getDate()}
                  </span>
                  {isToday && (
                    <span className="badge badge-purple" style={{ fontSize: 10 }}>
                      Today
                    </span>
                  )}
                </div>

                {dayEvents.map((event) => (
                  <button
                    key={event.id}
                    className={`email-item ${selectedEvent === event.id ? "selected" : ""}`}
                    onClick={() => setSelectedEvent(
                      selectedEvent === event.id ? null : event.id
                    )}
                    role="listitem"
                    aria-label={event.summary}
                  >
                    <div className="email-item-header">
                      <span className="email-sender">
                        {event.summary || "Untitled"}
                      </span>
                      <span className="email-date">
                        {formatEventTime(event.start)}
                      </span>
                    </div>
                    {event.location && (
                      <div className="email-snippet">
                        📍 {event.location}
                      </div>
                    )}
                    {event.attendees.length > 0 && (
                      <div className="email-snippet">
                        {event.attendees.length} attendee{event.attendees.length > 1 ? "s" : ""}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Pane */}
      {!listOnly && (
      <div className="detail-pane">
        {!selectedEvent ? (
          <div style={{ height: "100%", overflowY: "auto" }}>
            {/* Day header row */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width: 48, flexShrink: 0 }} />
              {weekDates.map((d, i) => {
                const isToday = d.toDateString() === today.toDateString();
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "8px 0",
                      fontSize: 11,
                      fontWeight: 600,
                      color: isToday ? "var(--accent)" : "var(--text-3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      background: isToday ? "rgba(255,255,255,0.02)" : "transparent",
                    }}
                  >
                    {DAYS[i]} {d.getDate()}
                  </div>
                );
              })}
            </div>

            {/* Time grid */}
            <div style={{ display: "flex" }}>
              {/* Hour labels */}
              <div style={{ width: 48, flexShrink: 0 }}>
                {GRID_HOURS.map((h) => (
                  <div
                    key={h}
                    style={{
                      height: GRID_ROW_HEIGHT,
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      fontSize: 11,
                      color: "#444",
                      textAlign: "right",
                      paddingRight: 6,
                      boxSizing: "border-box",
                    }}
                  >
                    {String(h).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDates.map((d, dayIndex) => {
                const isToday = d.toDateString() === today.toDateString();
                const dayEvents = eventsByDay[dayIndex] ?? [];
                return (
                  <div
                    key={dayIndex}
                    style={{
                      flex: 1,
                      position: "relative",
                      background: isToday ? "rgba(255,255,255,0.02)" : "transparent",
                    }}
                  >
                    {GRID_HOURS.map((h) => (
                      <div
                        key={h}
                        style={{
                          height: GRID_ROW_HEIGHT,
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          boxSizing: "border-box",
                        }}
                      />
                    ))}
                    {dayEvents.map((event) => {
                      const { top, height } = getEventGridOffsets(event.start, event.end);
                      return (
                        <div
                          key={event.id}
                          style={{
                            position: "absolute",
                            left: 2,
                            right: 2,
                            top,
                            height,
                            background: "rgba(180,242,74,0.12)",
                            border: "1px solid rgba(180,242,74,0.25)",
                            borderRadius: 6,
                            padding: "4px 8px",
                            fontSize: 12,
                            color: "#B4F24A",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {event.summary || "Untitled"}
                          </div>
                          <div style={{ fontSize: 10, opacity: 0.85 }}>{formatEventTime(event.start)}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        ) : selectedEventData ? (
          <>
            <div className="detail-header">
              <button
                className="btn-icon"
                onClick={() => setSelectedEvent(null)}
                aria-label="Back"
              >
                <ChevronLeft size={16} />
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--text-1)",
                }}>
                  {selectedEventData.summary || "Untitled Event"}
                </div>
              </div>
              {selectedEventData.htmlLink && (
                <a
                
                  href={selectedEventData.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost"
                >
                  Open in Google
                </a>
              )}
            </div>

            <div className="detail-content">
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Time */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <Clock size={16} style={{ color: "var(--accent)", marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, color: "var(--text-1)", fontWeight: 500 }}>
                      {selectedEventData.start
                        ? new Date(selectedEventData.start).toLocaleDateString([], {
                            weekday: "long", month: "long", day: "numeric",
                          })
                        : "No date"}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>
                      {formatEventTime(selectedEventData.start)}
                      {selectedEventData.end && ` – ${formatEventTime(selectedEventData.end)}`}
                    </div>
                  </div>
                </div>

                {/* Location */}
                {selectedEventData.location && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <MapPin size={16} style={{ color: "var(--accent)", marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: "var(--text-1)" }}>
                      {selectedEventData.location}
                    </span>
                  </div>
                )}

                {/* Attendees */}
                {selectedEventData.attendees.length > 0 && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <Users size={16} style={{ color: "var(--accent)", marginTop: 2, flexShrink: 0 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {selectedEventData.attendees.map((a) => (
                        <span key={a} style={{ fontSize: 13, color: "var(--text-2)" }}>
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedEventData.description && (
                  <div style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    padding: 16,
                    fontSize: 14,
                    color: "var(--text-1)",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                  }}>
                    {selectedEventData.description}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
      )}

      {/* Create Event Drawer */}
      {creating && (
        <div className="compose-drawer" role="dialog" aria-label="Create event">
          <div className="compose-header">
            <span>New Event</span>
            <button className="btn-icon" onClick={resetForm} aria-label="Close">
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", flex: 1 }}>
            <div className="form-field">
              <label className="form-label" htmlFor="event-title">Title</label>
              <input
                id="event-title"
                className="form-input"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Event title"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div className="form-field">
                <label className="form-label" htmlFor="event-start">Start</label>
                <input
                  id="event-start"
                  className="form-input"
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="event-end">End</label>
                <input
                  id="event-end"
                  className="form-input"
                  type="datetime-local"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="event-location">Location</label>
              <input
                id="event-location"
                className="form-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location"
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="event-attendees">
                Attendees (comma-separated)
              </label>
              <input
                id="event-attendees"
                className="form-input"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="email@example.com, ..."
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="event-desc">Description</label>
              <textarea
                id="event-desc"
                className="form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add description"
                rows={3}
                style={{ resize: "none" }}
              />
            </div>
          </div>

          <div className="compose-footer">
            <button
              className="btn btn-primary"
              onClick={() => sendInvite.mutate({
                summary, description: description || undefined,
                location: location || undefined,
                start: toIso(start), end: toIso(end),
                attendees: parseAttendees(),
              })}
              disabled={
                sendInvite.isPending || !summary || !start || !end ||
                parseAttendees().length === 0
              }
            >
              <Users size={13} />
              {sendInvite.isPending ? "Sending…" : "Send Invite"}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => createDraft.mutate({
                summary, description: description || undefined,
                location: location || undefined,
                start: toIso(start), end: toIso(end),
                attendees: parseAttendees(),
              })}
              disabled={createDraft.isPending || !summary || !start || !end}
            >
              {createDraft.isPending ? "Saving…" : "Save Draft"}
            </button>
            {(sendInvite.error ?? createDraft.error) && (
              <span style={{ fontSize: 12, color: "var(--danger)" }}>
                {(sendInvite.error ?? createDraft.error)?.message}
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