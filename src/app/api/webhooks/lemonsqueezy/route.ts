import { NextRequest, NextResponse } from "next/server";
import { processLemonWebhook, verifyLemonWebhookSignature } from "@/lib/billing/webhook-handler";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-signature");
    const rawBody = await request.text();

    if (!verifyLemonWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    const result = await processLemonWebhook(rawBody);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}
