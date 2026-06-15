import { z } from "zod";
import OpenAI from "openai";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { getTenant } from "@/server/lib/tenant";
import { encodeRawEmail } from "@/server/lib/email";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type RunResult<T> = { success: boolean; data?: T; error?: unknown };

async function run<T>(
  tenant: ReturnType<typeof getTenant>,
  path: string,
  input?: Record<string, unknown>,
): Promise<T> {
  const result = (await tenant.run(path, input)) as RunResult<T>;
  if (!result.success) {
    throw new Error(
      typeof result.error === "string" ? result.error : `Corsair operation failed: ${path}`,
    );
  }
  return result.data as T;
}

const SYSTEM_PROMPT = `You are FlowMail AI, an email and calendar assistant powered by Corsair.

CRITICAL RULES:
1. When the user asks you to perform ANY action, respond with ONLY a JSON object. No explanation. No markdown. No extra text.
2. Execute ONE action per response. For multiple actions, execute the first one. The conversation will continue for the next.
3. For conversational messages (greetings, questions), respond with plain text only.

JSON format (respond with ONLY this, nothing else):
{"action":"action_name","params":{...},"message":"brief description"}

Available actions:
- send_email: {"action":"send_email","params":{"to":"email","subject":"text","body":"text"},"message":"..."}
- send_invite: {"action":"send_invite","params":{"summary":"title","start":"2026-06-18T09:00:00","end":"2026-06-18T10:00:00","attendees":["email"]},"message":"..."}
- create_event: {"action":"create_event","params":{"summary":"title","start":"ISO datetime","end":"ISO datetime"},"message":"..."}
- search_emails: {"action":"search_emails","params":{"query":"search term"},"message":"..."}

Current date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
Next Thursday: ${(() => { const d = new Date(); const day = d.getDay(); const diff = (4 - day + 7) % 7 || 7; d.setDate(d.getDate() + diff); return d.toISOString().split("T")[0]; })()}

REMEMBER: For action requests, output ONLY the JSON. Nothing before it. Nothing after it.`;
export const aiRouter = createTRPCRouter({
  chat: publicProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const tenant = getTenant();

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...input.messages,
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const content = completion.choices[0]?.message?.content ?? "";
      console.log("[AI RAW]", content);
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      // Try to parse as action
      try {
        const parsed = JSON.parse(cleaned) as {
          action: string;
          params: Record<string, unknown>;
          message: string;
        };

        if (parsed.action && parsed.params) {
          // Execute the action
          switch (parsed.action) {
            case "send_email": {
              const { to, subject, body } = parsed.params as {
                to: string; subject: string; body: string;
              };
              const raw = encodeRawEmail({ to, subject, body });
              await run(tenant, "gmail.api.messages.send", { raw });
              return {
                type: "action" as const,
                action: "send_email",
                message: parsed.message,
                result: `✅ Email sent to ${to}`,
              };
            }

            case "search_emails": {
              const { query } = parsed.params as { query: string };
              const result = await run<{ messages?: { id?: string }[] }>(
                tenant, "gmail.api.messages.list", { maxResults: 5, q: query }
              );
              const count = result.messages?.length ?? 0;
              return {
                type: "action" as const,
                action: "search_emails",
                message: parsed.message,
                result: `📧 Found ${count} emails matching "${query}"`,
              };
            }

            case "create_event": {
              const { summary, start, end, description } = parsed.params as {
                summary: string; start: string; end: string; description?: string;
              };
              await run(tenant, "googlecalendar.api.events.create", {
                calendarId: "primary",
                sendUpdates: "none",
                event: { summary, description, start: { dateTime: start }, end: { dateTime: end } },
              });
              return {
                type: "action" as const,
                action: "create_event",
                message: parsed.message,
                result: `✅ Event "${summary}" created`,
              };
            }

            case "send_invite": {
              console.log("[send_invite] executing with params:", parsed.params);
              const { summary, start, end, attendees, description } = parsed.params as {
                summary: string; start: string; end: string;
                attendees: string[]; description?: string;
              };
              try {
                const result = await run<{ id?: string }>(tenant, "googlecalendar.api.events.create", {
                  calendarId: "primary",
                  sendUpdates: "all",
                  event: {
                    summary, description,
                    start: { dateTime: start, timeZone: "Asia/Kolkata" },
                    end: { dateTime: end, timeZone: "Asia/Kolkata" },
                    attendees: attendees.map((email: string) => ({ email })),
                  },
                });
                console.log("[send_invite] success:", result);
              } catch (err) {
                console.error("[send_invite] FAILED:", err);
                return {
                  type: "action" as const,
                  action: "send_invite",
                  message: parsed.message,
                  result: `❌ Failed to send invite: ${String(err)}`,
                };
              }
              return {
                type: "action" as const,
                action: "send_invite",
                message: parsed.message,
                result: `✅ Invite sent to ${attendees.join(", ")}`,
              };
            }

            default:
              return { type: "text" as const, message: cleaned, result: null };
          }
        }
      } catch {
        // Not JSON — return as plain text
      }

      return { type: "text" as const, message: cleaned, result: null };
    }),
});

export const semanticSearchRouter = createTRPCRouter({
  search: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const tenant = getTenant();

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a Gmail search expert. Convert natural language to Gmail search syntax. Return ONLY the search query, nothing else.
Examples:
"emails from my boss" → from:boss@company.com
"unread emails about meetings" → is:unread subject:meeting
"emails from last week about invoices" → subject:invoice newer_than:7d`,
          },
          { role: "user", content: input.query },
        ],
        max_tokens: 60,
        temperature: 0,
      });

      const gmailQuery = completion.choices[0]?.message?.content?.trim() ?? input.query;

      const result = await run<{ messages?: { id?: string }[] }>(
        tenant, "gmail.api.messages.list",
        { maxResults: 8, q: gmailQuery },
      );

      const ids = (result.messages ?? []).map((m) => m.id).filter(Boolean) as string[];
      const detailed = [];

      for (const id of ids.slice(0, 5)) {
        try {
          const msg = await run<{
            id?: string; snippet?: string; internalDate?: string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            payload?: any;
          }>(tenant, "gmail.api.messages.get", { id, format: "full" });

          const headers = msg.payload?.headers as { name?: string; value?: string }[] | undefined;
          const getH = (name: string) => headers?.find((h) => h.name === name)?.value ?? "";

          detailed.push({
            id: msg.id ?? id,
            subject: getH("Subject"),
            from: getH("From"),
            snippet: msg.snippet ?? "",
            date: msg.internalDate ?? null,
            gmailQuery,
          });
        } catch { /* skip */ }
      }

      return { results: detailed, gmailQuery, totalFound: ids.length };
    }),
});
