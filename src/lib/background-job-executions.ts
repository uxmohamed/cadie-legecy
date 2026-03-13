import { createAdminClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";

export type BackgroundJobExecutionStatus =
  | "processing"
  | "retryable"
  | "completed"
  | "terminal_failed";

export interface BackgroundJobExecution {
  id: string;
  job_type: string;
  dedupe_key: string;
  status: BackgroundJobExecutionStatus;
  attempt_count: number;
  max_attempts: number;
  active_invocation_id: string | null;
  last_error: string | null;
  last_payload: Record<string, unknown>;
  last_received_at: string;
  started_at: string | null;
  completed_at: string | null;
  terminal_failed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ClaimJobExecutionParams {
  jobType: string;
  dedupeKey: string;
  payload: Record<string, unknown>;
  attemptCount: number;
  maxAttempts: number;
}

interface CompleteJobExecutionParams {
  jobType: string;
  dedupeKey: string;
  invocationId: string;
}

interface FailJobExecutionParams extends CompleteJobExecutionParams {
  attemptCount: number;
  maxAttempts: number;
  error: unknown;
}

const MAX_ERROR_LENGTH = 1000;

function toExecution(row: unknown): BackgroundJobExecution {
  return row as BackgroundJobExecution;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, MAX_ERROR_LENGTH);
  }

  return String(error).slice(0, MAX_ERROR_LENGTH) || "Unknown background job error";
}

export function getQStashAttemptInfo(headers: Headers, maxAttempts: number): {
  attemptCount: number;
  retryCount: number;
  maxAttempts: number;
  messageId: string | null;
} {
  const retriedRaw = headers.get("upstash-retried");
  const parsedRetryCount = Number.parseInt(retriedRaw || "0", 10);
  const retryCount = Number.isFinite(parsedRetryCount) && parsedRetryCount >= 0
    ? parsedRetryCount
    : 0;

  return {
    attemptCount: retryCount + 1,
    retryCount,
    maxAttempts,
    messageId: headers.get("upstash-message-id"),
  };
}

export async function claimBackgroundJobExecution(
  params: ClaimJobExecutionParams
): Promise<{
  execution: BackgroundJobExecution;
  shouldProcess: boolean;
  duplicateState: BackgroundJobExecutionStatus | null;
  invocationId: string;
}> {
  const supabase = createAdminClient() as unknown as {
    rpc: (fn: string, args: Record<string, unknown>) => {
      single: () => Promise<{ data: unknown; error: { message: string } | null }>;
    };
  };
  const invocationId = crypto.randomUUID();
  const { data, error } = await supabase
    .rpc("claim_background_job_execution", {
      p_job_type: params.jobType,
      p_dedupe_key: params.dedupeKey,
      p_invocation_id: invocationId,
      p_payload: params.payload,
      p_attempt_count: params.attemptCount,
      p_max_attempts: params.maxAttempts,
    })
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to claim background job execution");
  }

  const execution = toExecution(data);
  const shouldProcess =
    execution.status === "processing" &&
    execution.active_invocation_id === invocationId;

  return {
    execution,
    shouldProcess,
    duplicateState: shouldProcess ? null : execution.status,
    invocationId,
  };
}

export async function markBackgroundJobCompleted(
  params: CompleteJobExecutionParams
): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("background_job_executions")
    .update({
      status: "completed",
      active_invocation_id: null,
      last_error: null,
      completed_at: new Date().toISOString(),
      terminal_failed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("job_type", params.jobType)
    .eq("dedupe_key", params.dedupeKey)
    .eq("active_invocation_id", params.invocationId)
    .eq("status", "processing")
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function markBackgroundJobFailed(
  params: FailJobExecutionParams
): Promise<{ terminal: boolean; persisted: boolean }> {
  const terminal = params.attemptCount >= params.maxAttempts;
  const now = new Date().toISOString();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("background_job_executions")
    .update({
      status: terminal ? "terminal_failed" : "retryable",
      attempt_count: params.attemptCount,
      max_attempts: params.maxAttempts,
      active_invocation_id: null,
      last_error: toErrorMessage(params.error),
      completed_at: terminal ? now : null,
      terminal_failed_at: terminal ? now : null,
      updated_at: now,
    })
    .eq("job_type", params.jobType)
    .eq("dedupe_key", params.dedupeKey)
    .eq("active_invocation_id", params.invocationId)
    .eq("status", "processing")
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return { terminal, persisted: Boolean(data) };
}

export async function safeMarkBackgroundJobFailed(
  params: FailJobExecutionParams
): Promise<{ terminal: boolean; persisted: boolean }> {
  try {
    return await markBackgroundJobFailed(params);
  } catch (error) {
    log.error("[BackgroundJobExecution] Failed to persist job failure", {
      jobType: params.jobType,
      dedupeKey: params.dedupeKey,
      error,
    });
    return {
      terminal: params.attemptCount >= params.maxAttempts,
      persisted: false,
    };
  }
}
