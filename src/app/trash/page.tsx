import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { prefetchTrashLinks } from "@/lib/server/prefetch-links";
import { getQueryClient, queryKeys } from "@/lib/query";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trash | Cadie",
  description: "View deleted links",
};

export default async function TrashPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not authenticated - redirect to auth
  if (!user) {
    redirect("/auth");
  }

  // Create query client for this request
  const queryClient = getQueryClient();

  // Prefetch trash links and hydrate the query cache
  const filters = { is_deleted: true };
  await queryClient.prefetchQuery({
    queryKey: queryKeys.links.list(filters),
    queryFn: () => prefetchTrashLinks(user.id),
  });

  // Render dashboard with trash view and hydrated query cache
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient
        user={JSON.parse(JSON.stringify(user))}
        initialView="trash"
      />
    </HydrationBoundary>
  );
}
