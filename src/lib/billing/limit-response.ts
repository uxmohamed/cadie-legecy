import { NextResponse } from "next/server";
import type { LimitKey, PlanLimitPayload, PlanTier } from "@/lib/billing/types";

interface BuildLimitPayloadInput {
  plan: PlanTier;
  limitKey: LimitKey;
  current: number | null;
  max: number | null;
  message: string;
}

export function buildPlanLimitPayload(input: BuildLimitPayloadInput): PlanLimitPayload {
  return {
    code: "PLAN_LIMIT_REACHED",
    limit_key: input.limitKey,
    current: input.current,
    max: input.max,
    upgrade_required: true,
    plan: input.plan,
    message: input.message,
  };
}

export function createPlanLimitResponse(input: BuildLimitPayloadInput, status: number = 402): NextResponse {
  const payload = buildPlanLimitPayload(input);
  return NextResponse.json(
    {
      error: payload.message,
      ...payload,
    },
    { status }
  );
}
