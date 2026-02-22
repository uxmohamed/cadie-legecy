import { createAdminClient } from "./src/lib/supabase/server";
async function upgrade() {
  const supabase = createAdminClient();
  const { data: users } = await supabase.auth.admin.listUsers();
  for (const user of users.users) {
    const res = await supabase.from("user_billing").upsert({
      user_id: user.id,
      plan_tier: "pro",
      subscription_status: "active",
      billing_interval: "month",
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    });
    console.log("Upgraded user:", user.email, res.error ? res.error : "Success");
  }
}
upgrade();
