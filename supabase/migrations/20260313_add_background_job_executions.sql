CREATE TABLE IF NOT EXISTS public.background_job_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  dedupe_key text NOT NULL,
  status text NOT NULL CHECK (status IN ('processing', 'retryable', 'completed', 'terminal_failed')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts integer NOT NULL DEFAULT 1 CHECK (max_attempts >= 1),
  active_invocation_id text NULL,
  last_error text NULL,
  last_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_received_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz NULL,
  completed_at timestamptz NULL,
  terminal_failed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT background_job_executions_job_type_dedupe_key_key UNIQUE (job_type, dedupe_key)
);

CREATE INDEX IF NOT EXISTS idx_background_job_executions_status_updated_at
  ON public.background_job_executions(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_background_job_executions_job_type_created_at
  ON public.background_job_executions(job_type, created_at DESC);

ALTER TABLE public.background_job_executions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.claim_background_job_execution(
  p_job_type text,
  p_dedupe_key text,
  p_invocation_id text,
  p_payload jsonb,
  p_attempt_count integer,
  p_max_attempts integer
)
RETURNS public.background_job_executions
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.background_job_executions (
    job_type,
    dedupe_key,
    status,
    attempt_count,
    max_attempts,
    active_invocation_id,
    last_error,
    last_payload,
    last_received_at,
    started_at,
    completed_at,
    terminal_failed_at,
    updated_at
  )
  VALUES (
    p_job_type,
    p_dedupe_key,
    'processing',
    GREATEST(COALESCE(p_attempt_count, 1), 1),
    GREATEST(COALESCE(p_max_attempts, 1), 1),
    p_invocation_id,
    NULL,
    COALESCE(p_payload, '{}'::jsonb),
    now(),
    now(),
    NULL,
    NULL,
    now()
  )
  ON CONFLICT (job_type, dedupe_key) DO UPDATE
  SET
    attempt_count = GREATEST(background_job_executions.attempt_count, EXCLUDED.attempt_count),
    max_attempts = GREATEST(background_job_executions.max_attempts, EXCLUDED.max_attempts),
    last_payload = EXCLUDED.last_payload,
    last_received_at = EXCLUDED.last_received_at,
    updated_at = now(),
    status = CASE
      WHEN background_job_executions.status = 'retryable' THEN 'processing'
      WHEN background_job_executions.status = 'processing'
        AND EXCLUDED.attempt_count > background_job_executions.attempt_count THEN 'processing'
      ELSE background_job_executions.status
    END,
    started_at = CASE
      WHEN background_job_executions.status = 'retryable' THEN now()
      WHEN background_job_executions.status = 'processing'
        AND EXCLUDED.attempt_count > background_job_executions.attempt_count THEN now()
      ELSE background_job_executions.started_at
    END,
    active_invocation_id = CASE
      WHEN background_job_executions.status = 'retryable' THEN EXCLUDED.active_invocation_id
      WHEN background_job_executions.status = 'processing'
        AND EXCLUDED.attempt_count > background_job_executions.attempt_count THEN EXCLUDED.active_invocation_id
      ELSE background_job_executions.active_invocation_id
    END,
    last_error = CASE
      WHEN background_job_executions.status = 'retryable' THEN NULL
      WHEN background_job_executions.status = 'processing'
        AND EXCLUDED.attempt_count > background_job_executions.attempt_count THEN NULL
      ELSE background_job_executions.last_error
    END,
    completed_at = CASE
      WHEN background_job_executions.status = 'retryable' THEN NULL
      WHEN background_job_executions.status = 'processing'
        AND EXCLUDED.attempt_count > background_job_executions.attempt_count THEN NULL
      ELSE background_job_executions.completed_at
    END
  RETURNING *;
$$;
