import { z } from "zod";

import {
  encodeRawEmail,
  extractBodyFromPayload,
  getHeader,
} from "@/server/lib/email";
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

function messageTimestamp(internalDate?: string | null): number {
  if (internalDate) return Number(internalDate);
  return 0;
}

function mapMessage(message: {
  entity_id: string;
  data: {
    threadId?: string;
    snippet?: string;
    subject?: string;
    from?: string;
    to?: string;
    body?: string;
    internalDate?: string;
  };
}) {
  return {
    id: message.entity_id,
    threadId: message.data.threadId ?? "",
    snippet: message.data.snippet ?? "",
    subject: message.data.subject ?? "",
    from: message.data.from ?? "",
    to: message.data.to ?? "",
    date: message.data.internalDate ?? null,
    timestamp: messageTimestamp(message.data.internalDate),
  };
}

function sortMessagesNewestFirst<T extends { timestamp: number }>(
  messages: T[],
): T[] {
  return [...messages].sort((a, b) => b.timestamp - a.timestamp);
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

export const gmailRouter = createTRPCRouter({
  searchEmails: publicProcedure
    .input(paginationSchema.extend({ query: z.string() }))
    .query(async ({ input }) => {
      const tenant = getTenant();

      const result = await run<{ messages?: { id?: string; threadId?: string }[] }>(
        tenant,
        "gmail.api.messages.list",
        {
          maxResults: input.limit,
          q: input.query.trim() || undefined,
        },
      );

      const ids = (result.messages ?? []).map((m) => m.id).filter(Boolean) as string[];

      const detailed = [];
      for (const id of ids.slice(0, 10)) {
        try {
          const msg = await run<{
            id?: string;
            threadId?: string;
            snippet?: string;
            internalDate?: string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            payload?: any;
          }>(tenant, "gmail.api.messages.get", { id, format: "full" });

          const headers = msg.payload?.headers as { name?: string; value?: string }[] | undefined;
          const getH = (name: string) =>
            headers?.find((h) => h.name === name)?.value ?? "";

          detailed.push({
            id: msg.id ?? id,
            threadId: msg.threadId ?? "",
            snippet: msg.snippet ?? "",
            subject: getH("Subject"),
            from: getH("From"),
            to: getH("To"),
            date: msg.internalDate ?? null,
            timestamp: msg.internalDate ? Number(msg.internalDate) : 0,
          });
        } catch (e) {
          console.error("Failed to fetch message", id, e);
        }
      }

      return detailed.sort((a, b) => b.timestamp - a.timestamp);
    }),

  getMessage: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      const tenant = getTenant();

      const message = await run<{
        id?: string;
        threadId?: string;
        snippet?: string;
        internalDate?: string | number;
        payload?: any;
        
      }>(tenant, "gmail.api.messages.get", {
        id: input.id,
        format: "full",
      });

      const headers = message.payload?.headers;
      const body = extractBodyFromPayload(message.payload) || message.snippet || "";

      return {
        id: message.id ?? input.id,
        threadId: message.threadId ?? "",
        subject: getHeader(headers, "Subject"),
        from: getHeader(headers, "From"),
        to: getHeader(headers, "To"),
        body,
        snippet: message.snippet ?? "",
        date: message.internalDate != null ? String(message.internalDate) : null,
      };
    }),

  refreshInbox: publicProcedure.mutation(async () => {
    const tenant = getTenant();
    const result = await run<{ threads?: unknown[] }>(
      tenant,
      "gmail.api.threads.list",
      { maxResults: 50 },
    );
    return { synced: result.threads?.length ?? 0 };
  }),

  sendEmail: publicProcedure
    .input(
      z.object({
        to: z.string().email(),
        subject: z.string().min(1),
        body: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const tenant = getTenant();
      const raw = encodeRawEmail(input);
      const message = await run<{ id?: string; threadId?: string }>(
        tenant,
        "gmail.api.messages.send",
        { raw },
      );
      return { id: message.id ?? "", threadId: message.threadId ?? "" };
    }),

  createDraft: publicProcedure
    .input(
      z.object({
        to: z.string().email(),
        subject: z.string().min(1),
        body: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const tenant = getTenant();
      const raw = encodeRawEmail(input);
      const draft = await run<{ id?: string; message?: { id?: string } }>(
        tenant,
        "gmail.api.drafts.create",
        { draft: { message: { raw } } },
      );
      return { id: draft.id ?? "", messageId: draft.message?.id ?? "" };
    }),

  listDrafts: publicProcedure
    .input(paginationSchema)
    .query(async ({ input }) => {
      const tenant = getTenant();
      const drafts = await run<{ entity_id: string; data: Record<string, unknown> }[]>(
        tenant,
        "gmail.db.drafts.list",
        { limit: input.limit, offset: input.offset },
      );
      return dedupeByEntityId(drafts).map((draft) => ({
        id: draft.entity_id,
        messageId: (draft.data.messageId as string) ?? "",
      }));
    }),

  sendDraft: publicProcedure
    .input(z.object({ draftId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const tenant = getTenant();
      const message = await run<{ id?: string; threadId?: string }>(
        tenant,
        "gmail.api.drafts.send",
        { id: input.draftId },
      );
      return { id: message.id ?? "", threadId: message.threadId ?? "" };
    }),
});