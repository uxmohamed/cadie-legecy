import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { validateUUID, validateRequestBody } from "@/lib/validation/validate";
import { BookmarkImportService } from "@/features/imports/services/bookmark-import.service";
import type { StartImportRequest } from "@/features/imports/types/import.types";

const service = new BookmarkImportService();

const startImportSchema = z.object({
  folder_mode: z.enum(["single_space", "manual_map", "auto_create_spaces"]),
  single_space_id: z.string().uuid().nullable(),
  folder_to_space_map: z.record(z.string(), z.string().uuid()).default({}),
  fallback_space_id: z.string().uuid().nullable(),
});

/**
 * POST /api/imports/[id]/start
 * Starts an import job in the background queue.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const uuidError = validateUUID(id, "Import job ID");
    if (uuidError) return uuidError;

    const { data, error } = await validateRequestBody(request, startImportSchema);
    if (error) return error;

    const payload: StartImportRequest = {
      folder_mode: data.folder_mode,
      single_space_id: data.single_space_id,
      folder_to_space_map: data.folder_to_space_map,
      fallback_space_id: data.fallback_space_id,
    };

    const job = await service.startJob(user.id, id, payload, request.nextUrl.origin);
    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start import";
    const status = message.includes("queue is unavailable") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

