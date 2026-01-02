import { NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

/**
 * Validates request body against a Zod schema
 * Returns validated data or error response
 */
export async function validateRequest<T>(
  body: unknown,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const data = schema.parse(body);
    return { data, error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        data: null,
        error: NextResponse.json(
          {
            error: "Validation failed",
            details: error.issues.map((e) => ({
              field: e.path.join(".") || "root",
              message: e.message,
            })),
          },
          { status: 400 }
        ),
      };
    }
    
    // Non-Zod error
    return {
      data: null,
      error: NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      ),
    };
  }
}

/**
 * Helper to validate JSON body from request
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await request.json();
    return validateRequest(body, schema);
  } catch (error) {
    return {
      data: null,
      error: NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      ),
    };
  }
}
