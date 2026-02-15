import { z } from "zod";

/**
 * Schema for creating a new API token
 */
export const createTokenSchema = z.object({
  name: z.string()
    .min(1, "Token name is required")
    .max(100, "Token name must be 100 characters or less")
    .trim(),
  expires_at: z.string().datetime().optional(),
});

/**
 * TypeScript type inferred from schema
 */
export type CreateTokenInput = z.infer<typeof createTokenSchema>;
