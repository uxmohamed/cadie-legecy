import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { prefetchSpaceLinks } from "@/lib/server/prefetch-links";
import { getQueryClient, queryKeys } from "@/lib/query";
import type { Metadata } from "next";

interface SpacePageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: SpacePageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not authenticated, return default metadata
  if (!user) {
    return {
      title: "Cadie",
    };
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return {
      title: "Cadie",
    };
  }

  // Fetch space name for metadata
  const { data: space } = await supabase
    .from("spaces")
    .select("name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!space) {
    return {
      title: "Cadie",
    };
  }

  return {
    title: `${space.name} | Cadie`,
    description: `View links in ${space.name} space`,
  };
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

  // Create query client for this request
  const queryClient = getQueryClient();

  // Prefetch space links and hydrate the query cache
  const filters = { space_id: id, is_deleted: false, is_archived: false };
  await queryClient.prefetchQuery({
    queryKey: queryKeys.links.list(filters),
    queryFn: () => prefetchSpaceLinks(user.id, id),
  });

  // Render dashboard with space view and hydrated query cache
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient
        user={JSON.parse(JSON.stringify(user))}
        initialView={id}
      />
    </HydrationBoundary>
  );
}
