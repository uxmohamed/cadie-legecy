import { NextRequest } from "next/server";
import { UpdateLinkHandler, DeleteLinkHandler } from "@/features/links/api/handlers";

export const runtime = 'edge';
/**
 * PUT /api/links/[id]
 * Update a link
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const handler = new UpdateLinkHandler();
  return handler.handle(request, id);
}

/**
 * DELETE /api/links/[id]
 * Delete a link
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const handler = new DeleteLinkHandler();
  return handler.handle(request, id);
}
