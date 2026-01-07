import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard-client";
import { LandingPage } from "@/components/landing-page";
import { prefetchDashboardLinks } from "@/lib/server/prefetch-links";
import { getQueryClient, queryKeys } from "@/lib/query";

export default async function Home() {
  const supabase = await createClient();

  // Server-side auth check (no client-side flash)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not authenticated - show landing page
  if (!user) {
    return <LandingPage />;
  }

  // Create query client for this request
  const queryClient = getQueryClient();

  // Prefetch links and hydrate the query cache
  const filters = { is_deleted: false, is_archived: false };
  await queryClient.prefetchQuery({
    queryKey: queryKeys.links.list(filters),
    queryFn: () => prefetchDashboardLinks(user.id),
  });

  // Render dashboard with hydrated query cache
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient
        user={JSON.parse(JSON.stringify(user))}
      />
    </HydrationBoundary>
  );
}
