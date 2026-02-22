import { NextRequest, NextResponse } from "next/server";
import { processLemonWebhook, verifyLemonWebhookSignature } from "@/lib/billing/webhook-handler";
import { log } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-signature");
    const rawBody = await request.text();
    const parsed = JSON.parse(rawBody) as {
      meta?: {
        event_name?: string;
        webhook_id?: string;
      };
    };
    const eventName = parsed.meta?.event_name ?? "unknown";
    const webhookId = parsed.meta?.webhook_id ?? null;

    log.info("[BillingWebhook] Received Lemon Squeezy webhook", {
      eventName,
      webhookId,
    });

    if (!verifyLemonWebhookSignature(rawBody, signature)) {
      log.warn("[BillingWebhook] Signature verification failed", {
        eventName,
        webhookId,
        metric: "billing_webhook_signature_invalid",
      });
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    const result = await processLemonWebhook(rawBody);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof SyntaxError) {
      log.warn("[BillingWebhook] Invalid JSON payload", {
        metric: "billing_webhook_bad_json",
      });
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    log.error("[BillingWebhook] Processing failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}
