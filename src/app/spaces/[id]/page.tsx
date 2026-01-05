import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { prefetchSpaceLinks } from "@/lib/server/prefetch-links";

interface SpacePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SpacePage({ params }: SpacePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not authenticated - redirect to auth
  if (!user) {
    redirect("/auth");
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  // Verify space exists and belongs to user
  const { data: space, error: spaceError } = await supabase
    .from("spaces")
    .select("id, name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (spaceError || !space) {
    notFound();
  }

  // Prefetch space links on server for instant render
  const initialData = await prefetchSpaceLinks(user.id, id);

  // Render dashboard with space view and prefetched data
  return (
    <DashboardClient
      user={JSON.parse(JSON.stringify(user))}
      initialView={id}
      initialLinks={initialData}
    />
  );
}
