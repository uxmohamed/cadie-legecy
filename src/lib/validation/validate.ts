import { NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

/**
 * UUID v4 validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Check if a string is a valid UUID v4
 * 
 * @param id - The string to validate
 * @returns true if the string is a valid UUID
 */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Validate a UUID and return an error response if invalid
 * 
 * @param id - The ID to validate
 * @param paramName - Name of the parameter for error message (default: "ID")
 * @returns null if valid, NextResponse error if invalid
 */
export function validateUUID(id: string | null | undefined, paramName: string = "ID"): NextResponse | null {
  if (!id) {
    return NextResponse.json(
      { error: `${paramName} is required` },
      { status: 400 }
    );
  }
  
  if (!isValidUUID(id)) {
    return NextResponse.json(
      { error: `Invalid ${paramName} format` },
      { status: 400 }
    );
  }
  
  return null;
}

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
