import "dotenv/config";
import { createHmac } from "node:crypto";
// import fetch from "node-fetch"; // Use global fetch in Node 18+

// Load env vars
// Note: This script assumes you run it from project root where .env.local exists
// or have loaded env vars some other way.
// Ideally usage: node -r dotenv/config scripts/simulate-webhook.js

const SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
const WEBHOOK_URL = process.env.WEBHOOK_URL || "http://localhost:3000/api/webhooks/lemonsqueezy";

if (!SECRET) {
  console.error("Error: Lemon Squeezy Webhook Secret (LEMONSQUEEZY_WEBHOOK_SECRET) is missing from environment.");
  process.exit(1);
}

const eventType = process.argv[2] || "subscription_created";
const userId = process.argv[3] || "user_123";

console.log(`Simulating event: ${eventType} for user: ${userId}`);

// Construct payload based on event type
function getPayload(event: string, uid: string) {
  const base = {
    meta: {
      event_name: event,
      custom_data: { user_id: uid },
    },
    data: {
      type: event === "order_created" ? "orders" : "subscriptions",
      id: "sub_" + Math.random().toString(36).substr(2, 9),
      attributes: {
        store_id: 112233,
        customer_id: 445566,
        order_id: 778899,
        status: "active",
        user_email: `${uid}@example.com`,
      } as Record<string, unknown>,
    },
  };

  const attrs = base.data.attributes;

  if (event === "order_created") {
    // Simulate Believer / Lifetime order
    attrs.first_order_item = {
      variant_id: "variant_believer", // This will be mapped in your app logic or resolver mock
      product_name: "Cadie Pro (Believer)",
    };
    attrs.status = "paid";
    attrs.total = 5000;
  } else {
    // Subscription defaults
    attrs.variant_id = "variant_pro_monthly"; // Mock ID
    attrs.card_brand = "visa";
    attrs.card_last_four = "4242";
    attrs.status = event === "subscription_cancelled" ? "cancelled" : "active";
    attrs.billing_interval = "monthly";
    
    // Dates
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(now.getMonth() + 1);
    
    attrs.created_at = now.toISOString();
    attrs.updated_at = now.toISOString();
    attrs.renews_at = nextMonth.toISOString();
    
    if (event === "subscription_cancelled") {
        attrs.cancelled = true;
        attrs.ends_at = nextMonth.toISOString(); // Cancel at period end
    }
  }

  return JSON.stringify(base);
}

const payload = getPayload(eventType, userId);
const signature = createHmac("sha256", SECRET).update(payload).digest("hex");

async function sendWebhook() {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Signature": signature,
      },
      body: payload,
    });

    const text = await response.text();
    console.log(`Response Status: ${response.status}`);
    console.log(`Response Body: ${text}`);
    
    if (response.ok) {
        console.log("✅ Webhook simulated successfully.");
    } else {
        console.log("❌ Webhook simulation failed.");
    }
  } catch (err) {
    console.error("Failed to send webhook:", err);
  }
}

sendWebhook();
