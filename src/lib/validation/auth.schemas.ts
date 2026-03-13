import { z } from "zod";
import { API_TOKEN_SCOPES } from "@/lib/api-tokens";

const apiTokenScopeSchema = z.enum(API_TOKEN_SCOPES);

/**
 * Schema for creating a new API token
 */
export const createTokenSchema = z.object({
  name: z.string()
    .min(1, "Token name is required")
    .max(100, "Token name must be 100 characters or less")
    .trim(),
  expires_at: z.string().datetime().optional(),
  scope: z.array(apiTokenScopeSchema).min(1, "At least one scope is required").optional(),
});

/**
 * TypeScript type inferred from schema
 */
export type CreateTokenInput = z.infer<typeof createTokenSchema>;
