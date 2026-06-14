import { z } from "zod";

import { getTenant } from "@/server/lib/tenant";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

const paginationSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

type RunResult<T> = { success: boolean; data?: T; error?: unknown };

async function run<T>(
  tenant: ReturnType<typeof getTenant>,
  path: string,
  input?: Record<string, unknown>,
): Promise<T> {
  const result = (await tenant.run(path, input)) as RunResult<T>;
  if (!result.success) {
    throw new Error(
      typeof result.error === "string"
        ? result.error
        : `Corsair operation failed: ${path}`,
    );
  }
  return result.data as T;
}

function eventStartTimestamp(event: {
  data: { start?: { date?: string; dateTime?: string } };
}): number {
  const start = event.data.start?.dateTime ?? event.data.start?.date;
  if (!start) return 0;
  return new Date(start).getTime();
}

function mapEvent(event: {
  entity_id: string;
  data: {
    summary?: string;
    description?: string;
    location?: string;
    status?: string;
    start?: { date?: string; dateTime?: string; timeZone?: string };
    end?: { date?: string; dateTime?: string; timeZone?: string };
    attendees?: { email?: string; displayName?: string }[];
    htmlLink?: string;
  };
}) {
  return {
    id: event.entity_id,
    summary: event.data.summary ?? "",
    description: event.data.description ?? "",
    location: event.data.location ?? "",
    status: event.data.status ?? "",
    start: event.data.start?.dateTime ?? event.data.start?.date ?? "",
    end: event.data.end?.dateTime ?? event.data.end?.date ?? "",
    attendees:
      event.data.attendees
        ?.map((a) => {
          if (a.displayName && a.email) return `${a.displayName} <${a.email}>`;
          return a.email ?? a.displayName ?? "";
        })
        .filter(Boolean) ?? [],
    htmlLink: event.data.htmlLink ?? "",
    timestamp: eventStartTimestamp(event),
  };
}

function dedupeByEntityId<T extends { entity_id: string }>(items: T[]): T[] {
  const byEntityId = new Map<string, T>();
  for (const item of items) {
    if (!byEntityId.has(item.entity_id)) {
      byEntityId.set(item.entity_id, item);
    }
  }
  return Array.from(byEntityId.values());
}

function filterEventsByWeek<T extends { timestamp: number; start: string }>(
  events: T[],
  weekStart: Date,
  weekEnd: Date,
): T[] {
  const startMs = weekStart.getTime();
  const endMs = weekEnd.getTime();
  return events
    .filter((event) => {
      if (event.timestamp > 0) {
        return event.timestamp >= startMs && event.timestamp < endMs;
      }
      if (!event.start) return false;
      const ts = new Date(event.start).getTime();
      return ts >= startMs && ts < endMs;
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}

export const calendarRouter = createTRPCRouter({
  searchEvents: publicProcedure
    .input(
      paginationSchema.extend({
        query: z.string(),
        weekStart: z.string().datetime(),
        weekEnd: z.string().datetime(),
      }),
    )
    .query(async ({ input }) => {
      const tenant = getTenant();
      const weekStart = new Date(input.weekStart);
      const weekEnd = new Date(input.weekEnd);

      const result = await run<{ items?: {
        id?: string;
        summary?: string;
        description?: string;
        location?: string;
        status?: string;
        start?: { date?: string; dateTime?: string; timeZone?: string };
        end?: { date?: string; dateTime?: string; timeZone?: string };
        attendees?: { email?: string; displayName?: string }[];
        htmlLink?: string;
      }[] }>(
        tenant,
        "googlecalendar.api.events.getMany",
        {
          calendarId: "primary",
          timeMin: input.weekStart,
          timeMax: input.weekEnd,
          maxResults: 100,
          singleEvents: true,
          orderBy: "startTime",
          q: input.query.trim() || undefined,
        },
      );

      return (result.items ?? []).map((e) => ({
        id: e.id ?? "",
        summary: e.summary ?? "",
        description: e.description ?? "",
        location: e.location ?? "",
        status: e.status ?? "",
        start: e.start?.dateTime ?? e.start?.date ?? "",
        end: e.end?.dateTime ?? e.end?.date ?? "",
        attendees: (e.attendees ?? [])
          .map((a) => {
            if (a.displayName && a.email) return `${a.displayName} <${a.email}>`;
            return a.email ?? a.displayName ?? "";
          })
          .filter(Boolean),
        htmlLink: e.htmlLink ?? "",
        timestamp: e.start?.dateTime ? new Date(e.start.dateTime).getTime() : 0,
      }));
    }),

  refreshEvents: publicProcedure
    .input(
      z.object({
        weekStart: z.string().datetime(),
        weekEnd: z.string().datetime(),
      }),
    )
    .mutation(async ({ input }) => {
      const tenant = getTenant();
      const result = await run<{ items?: unknown[] }>(
        tenant,
        "googlecalendar.api.events.getMany",
        {
          calendarId: "primary",
          timeMin: input.weekStart,
          timeMax: input.weekEnd,
          maxResults: 100,
          singleEvents: true,
          orderBy: "startTime",
        },
      );
      return { synced: result.items?.length ?? 0 };
    }),

  createDraft: publicProcedure
    .input(
      z.object({
        summary: z.string().min(1),
        description: z.string().optional(),
        location: z.string().optional(),
        start: z.string().datetime(),
        end: z.string().datetime(),
        attendees: z.array(z.string().email()).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const tenant = getTenant();
      const event = await run<{ id?: string; htmlLink?: string }>(
        tenant,
        "googlecalendar.api.events.create",
        {
          calendarId: "primary",
          sendUpdates: "none",
          event: {
            summary: input.summary,
            description: input.description,
            location: input.location,
            status: "tentative",
            start: { dateTime: input.start },
            end: { dateTime: input.end },
            attendees: input.attendees?.map((email) => ({ email })),
          },
        },
      );
      return { id: event.id ?? "", htmlLink: event.htmlLink ?? "" };
    }),

  sendInvite: publicProcedure
    .input(
      z.object({
        summary: z.string().min(1),
        description: z.string().optional(),
        location: z.string().optional(),
        start: z.string().datetime(),
        end: z.string().datetime(),
        attendees: z.array(z.string().email()).min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const tenant = getTenant();
      const event = await run<{ id?: string; htmlLink?: string }>(
        tenant,
        "googlecalendar.api.events.create",
        {
          calendarId: "primary",
          sendUpdates: "all",
          event: {
            summary: input.summary,
            description: input.description,
            location: input.location,
            start: { dateTime: input.start },
            end: { dateTime: input.end },
            attendees: input.attendees.map((email) => ({ email })),
          },
        },
      );
      return { id: event.id ?? "", htmlLink: event.htmlLink ?? "" };
    }),
});