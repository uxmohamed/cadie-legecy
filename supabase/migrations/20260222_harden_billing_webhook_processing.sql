-- Harden billing webhook processing and ordering

-- Expand subscription status domain to preserve upstream state semantics.
ALTER TABLE public.user_billing
  DROP CONSTRAINT IF EXISTS user_billing_subscription_status_check;

ALTER TABLE public.user_billing
  ADD CONSTRAINT user_billing_subscription_status_check
  CHECK (subscription_status IN ('inactive', 'active', 'past_due', 'canceled', 'expired', 'paused', 'unpaid'));

-- Track latest provider event timestamp to prevent stale webhook overwrites.
ALTER TABLE public.user_billing
  ADD COLUMN IF NOT EXISTS lemon_last_event_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_user_billing_lemon_last_event_at
  ON public.user_billing(lemon_last_event_at)
  WHERE lemon_last_event_at IS NOT NULL;

-- Evolve billing_webhook_events into a retry-safe processing ledger.
ALTER TABLE public.billing_webhook_events
  ADD COLUMN IF NOT EXISTS provider_event_id text NULL,
  ADD COLUMN IF NOT EXISTS processing_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error text NULL,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz NULL;

ALTER TABLE public.billing_webhook_events
  DROP CONSTRAINT IF EXISTS billing_webhook_events_processing_status_check;

ALTER TABLE public.billing_webhook_events
  ADD CONSTRAINT billing_webhook_events_processing_status_check
  CHECK (processing_status IN ('pending', 'processed', 'failed'));

ALTER TABLE public.billing_webhook_events
  ALTER COLUMN attempt_count SET DEFAULT 0;

ALTER TABLE public.billing_webhook_events
  DROP CONSTRAINT IF EXISTS billing_webhook_events_attempt_count_check;

ALTER TABLE public.billing_webhook_events
  ADD CONSTRAINT billing_webhook_events_attempt_count_check
  CHECK (attempt_count >= 0);

-- processed_at is now set when processing succeeds, not on insert.
ALTER TABLE public.billing_webhook_events
  ALTER COLUMN processed_at DROP NOT NULL,
  ALTER COLUMN processed_at DROP DEFAULT;

-- Backfill old rows as already-processed records.
UPDATE public.billing_webhook_events
SET
  processing_status = 'processed',
  attempt_count = CASE WHEN attempt_count > 0 THEN attempt_count ELSE 1 END,
  last_attempt_at = COALESCE(last_attempt_at, processed_at, now()),
  processed_at = COALESCE(processed_at, now())
WHERE processing_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_billing_webhook_events_processing_status
  ON public.billing_webhook_events(processing_status);

CREATE INDEX IF NOT EXISTS idx_billing_webhook_events_provider_event_id
  ON public.billing_webhook_events(provider_event_id)
  WHERE provider_event_id IS NOT NULL;
