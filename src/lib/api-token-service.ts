import { createAdminClient } from "@/lib/supabase/server";
import { generateToken, hashToken } from "@/lib/auth-middleware";
import {
  DEFAULT_TOKEN_SCOPES,
  normalizeApiTokenScopes,
  type ApiTokenScope,
} from "@/lib/api-tokens";

type TokenRecord = {
  id: string;
  name: string;
  created_at: string;
  expires_at: string;
  scope: string[] | null;
  client_id: string | null;
  install_id: string | null;
  install_metadata: Record<string, unknown> | null;
  rotated_from_token_id: string | null;
};

type CreateTokenInput = {
  userId: string;
  name: string;
  expiresAt: string;
  scopes?: readonly ApiTokenScope[] | readonly string[] | null;
  clientId?: string | null;
  installId?: string | null;
  installMetadata?: Record<string, unknown> | null;
  rotatedFromTokenId?: string | null;
};

export type CreatedToken = {
  plaintextToken: string;
  record: {
    id: string;
    name: string;
    createdAt: string;
    expiresAt: string;
    scopes: ApiTokenScope[];
    clientId: string | null;
    installId: string | null;
    installMetadata: Record<string, unknown>;
    rotatedFromTokenId: string | null;
  };
};

export async function createOpaqueApiToken(input: CreateTokenInput): Promise<CreatedToken> {
  const supabase = createAdminClient();
  const plaintextToken = generateToken(32);
  const tokenHash = await hashToken(plaintextToken);
  const scopes = normalizeApiTokenScopes(input.scopes ?? DEFAULT_TOKEN_SCOPES);
  const installMetadata = input.installMetadata ?? {};

  const { data, error } = await supabase
    .from("api_tokens")
    .insert({
      user_id: input.userId,
      token_hash: tokenHash,
      name: input.name.trim(),
      expires_at: input.expiresAt,
      scope: scopes,
      client_id: input.clientId ?? null,
      install_id: input.installId ?? null,
      install_metadata: installMetadata,
      rotated_from_token_id: input.rotatedFromTokenId ?? null,
    })
    .select("id, name, created_at, expires_at, scope, client_id, install_id, install_metadata, rotated_from_token_id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create token");
  }

  return {
    plaintextToken,
    record: {
      id: (data as TokenRecord).id,
      name: (data as TokenRecord).name,
      createdAt: (data as TokenRecord).created_at,
      expiresAt: (data as TokenRecord).expires_at,
      scopes: normalizeApiTokenScopes((data as TokenRecord).scope ?? scopes),
      clientId: (data as TokenRecord).client_id ?? null,
      installId: (data as TokenRecord).install_id ?? null,
      installMetadata: ((data as TokenRecord).install_metadata ?? {}) as Record<string, unknown>,
      rotatedFromTokenId: (data as TokenRecord).rotated_from_token_id ?? null,
    },
  };
}

export async function revokeApiToken(
  tokenId: string,
  userId: string,
  reason: "manual" | "rotated" | "replaced" = "manual"
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("api_tokens")
    .update({
      revoked_at: new Date().toISOString(),
      revoked_reason: reason,
      rotated_at: reason === "rotated" ? new Date().toISOString() : null,
    })
    .eq("id", tokenId)
    .eq("user_id", userId)
    .is("revoked_at", null);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getActiveApiTokenForUser(tokenId: string, userId: string): Promise<TokenRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("api_tokens")
    .select("id, name, created_at, expires_at, scope, client_id, install_id, install_metadata, rotated_from_token_id")
    .eq("id", tokenId)
    .eq("user_id", userId)
    .is("revoked_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as TokenRecord | null) ?? null;
}

export async function revokeMatchingInstallTokens(
  userId: string,
  installId: string,
  clientId?: string | null
): Promise<string[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("api_tokens")
    .select("id")
    .eq("user_id", userId)
    .eq("install_id", installId)
    .is("revoked_at", null);

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const tokenIds = (data || []).map((row) => row.id as string);
  if (tokenIds.length === 0) {
    return [];
  }

  const { error: updateError } = await supabase
    .from("api_tokens")
    .update({
      revoked_at: new Date().toISOString(),
      revoked_reason: "replaced",
    })
    .in("id", tokenIds)
    .eq("user_id", userId)
    .is("revoked_at", null);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return tokenIds;
}
