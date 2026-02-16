import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-middleware";
import {
  rateLimitSearch,
  getIdentifier,
  getRateLimitHeaders,
} from "@/lib/rate-limit";
import { validateRequestBody } from "@/lib/validation/validate";
import { searchInterpretRequestSchema } from "@/lib/validation/search.schemas";
import { QueryInterpreterService } from "@/features/search/services/query-interpreter.service";
import { log } from "@/lib/logger";

const queryInterpreterService = new QueryInterpreterService();

export async function POST(request: NextRequest) {
  const userId = await authenticateRequest(request);
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const identifier = getIdentifier(request, userId);
  const { success, limit, reset, remaining } = await rateLimitSearch.limit(identifier);

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: getRateLimitHeaders(limit, remaining, reset),
      }
    );
  }

  const { data, error } = await validateRequestBody(request, searchInterpretRequestSchema);
  if (error) {
    Object.entries(getRateLimitHeaders(limit, remaining, reset)).forEach(([key, value]) => {
      error.headers.set(key, value);
    });
    return error;
  }

  const scopeType =
    data.currentScope.selectedCategoryId === null
      ? "all"
      : data.currentScope.selectedCategoryId === "trash"
        ? "trash"
        : "space";
  const startedAt = Date.now();

  const result = await queryInterpreterService.interpretQuery(data);
  const latencyMs = Date.now() - startedAt;

  if (result.mode === "literal") {
    log.warn("[Smart Search] Planner fallback", {
      userId,
      reason: result.reason,
      latencyMs,
      scopeType,
      queryLength: data.query.length,
    });
  } else {
    log.info("[Smart Search] Planner success", {
      userId,
      latencyMs,
      scopeType,
      confidence: result.plan.confidence,
      chipKinds: result.plan.chips.map((chip) => chip.kind),
    });
  }

  const response = NextResponse.json(result);
  Object.entries(getRateLimitHeaders(limit, remaining, reset)).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  response.headers.set("Cache-Control", "no-store");

  return response;
}
