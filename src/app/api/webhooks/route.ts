import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { webhookEvents } from "@/server/db/schema";

interface CorsairWebhookEvent {
  type?: string;
  event?: string;
  data?: Record<string, unknown>;
  timestamp?: string;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type");
    let body: CorsairWebhookEvent = {};

    if (contentType?.includes("application/json")) {
      body = await request.json() as CorsairWebhookEvent;
    } else {
      const text = await request.text();
      if (text?.trim()) {
        try { body = JSON.parse(text) as CorsairWebhookEvent; } catch { body = {}; }
      }
    }

    const eventType = body.type ?? body.event ?? "unknown";
    console.info("[webhook] received:", eventType, body);

    // Store event in DB
    await db.insert(webhookEvents).values({
      eventType,
      payload: JSON.stringify(body),
      receivedAt: new Date(),
    });

    return NextResponse.json({ success: true, type: eventType });
  } catch (err) {
    console.error("[webhook] error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "FlowMail webhook endpoint active",
    timestamp: new Date().toISOString(),
  });
}
