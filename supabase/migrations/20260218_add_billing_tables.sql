-- Billing integration tables (Lemon Squeezy)

CREATE TABLE IF NOT EXISTS public.user_billing (
  user_id text PRIMARY KEY,
  plan_tier text NOT NULL DEFAULT 'starter' CHECK (plan_tier IN ('starter', 'pro', 'believer')),
  subscription_status text NOT NULL DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'active', 'past_due', 'canceled', 'expired')),
  billing_interval text NULL CHECK (billing_interval IN ('month', 'year')),
  lemon_customer_id text NULL,
  lemon_subscription_id text NULL,
  lemon_variant_id text NULL,
  current_period_end timestamptz NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  support_amount_cents integer NULL CHECK (support_amount_cents >= 0),
  last_webhook_event_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_billing_lemon_subscription_id
  ON public.user_billing(lemon_subscription_id)
  WHERE lemon_subscription_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_billing_lemon_customer_id
  ON public.user_billing(lemon_customer_id)
  WHERE lemon_customer_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.billing_webhook_events (
  id bigserial PRIMARY KEY,
  event_id text NOT NULL UNIQUE,
  event_name text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own billing" ON public.user_billing;
CREATE POLICY "Users can read own billing"
  ON public.user_billing
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Service role manages billing" ON public.user_billing;
CREATE POLICY "Service role manages billing"
  ON public.user_billing
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert webhook events" ON public.billing_webhook_events;
CREATE POLICY "Service role can insert webhook events"
  ON public.billing_webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION public.update_billing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_billing_updated_at ON public.user_billing;
CREATE TRIGGER trg_user_billing_updated_at
  BEFORE UPDATE ON public.user_billing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_billing_updated_at();

