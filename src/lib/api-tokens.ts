import { NextResponse } from "next/server";
import type { RequestContext } from "@/lib/auth-middleware";

export const API_TOKEN_SCOPES = [
  "legacy_full_access",
  "links:read",
  "links:write",
  "spaces:read",
  "spaces:write",
  "settings:read",
  "settings:write",
  "exports:read",
  "extension:link-context:read",
] as const;

export type ApiTokenScope = (typeof API_TOKEN_SCOPES)[number];

export const LEGACY_FULL_ACCESS_SCOPE: ApiTokenScope = "legacy_full_access";

export const DEFAULT_TOKEN_SCOPES: readonly ApiTokenScope[] = [LEGACY_FULL_ACCESS_SCOPE];

export const EXTENSION_TOKEN_SCOPES: readonly ApiTokenScope[] = [
  "links:read",
  "links:write",
  "spaces:read",
  "spaces:write",
  "extension:link-context:read",
] as const;

const API_TOKEN_SCOPE_SET = new Set<ApiTokenScope>(API_TOKEN_SCOPES);

export function normalizeApiTokenScopes(input: readonly string[] | null | undefined): ApiTokenScope[] {
  if (!input || input.length === 0) {
    return [...DEFAULT_TOKEN_SCOPES];
  }

  const normalized = input.filter((scope): scope is ApiTokenScope => API_TOKEN_SCOPE_SET.has(scope as ApiTokenScope));
  if (normalized.length === 0) {
    return [...DEFAULT_TOKEN_SCOPES];
  }

  return normalized.includes(LEGACY_FULL_ACCESS_SCOPE)
    ? [LEGACY_FULL_ACCESS_SCOPE]
    : [...new Set(normalized)];
}

export function tokenHasScopes(
  tokenScopes: readonly ApiTokenScope[] | null | undefined,
  requiredScopes: readonly ApiTokenScope[]
): boolean {
  if (requiredScopes.length === 0) {
    return true;
  }

  const normalized = normalizeApiTokenScopes(tokenScopes);
  if (normalized.includes(LEGACY_FULL_ACCESS_SCOPE)) {
    return true;
  }

  return requiredScopes.every((scope) => normalized.includes(scope));
}

export function requireTokenScopes(
  context: RequestContext,
  requiredScopes: readonly ApiTokenScope[]
): NextResponse | null {
  if (context.authSource !== "api_token") {
    return null;
  }

  if (tokenHasScopes(context.token?.scopes, requiredScopes)) {
    return null;
  }

  return NextResponse.json(
    {
      error: "Token does not have the required scope",
      required_scopes: requiredScopes,
      token_scopes: context.token?.scopes ?? [],
    },
    { status: 403 }
  );
}
