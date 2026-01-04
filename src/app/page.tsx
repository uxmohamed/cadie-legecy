import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard-client";
import { LandingPage } from "@/components/landing-page";
import { prefetchDashboardLinks } from "@/lib/server/prefetch-links";

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

  // Prefetch initial links on server for instant render
  // This eliminates the network waterfall (page load → client fetch)
  const initialData = await prefetchDashboardLinks(user.id);

  // Render dashboard with prefetched data
  return (
    <DashboardClient
      user={JSON.parse(JSON.stringify(user))}
      initialLinks={initialData}
    />
  );
}
