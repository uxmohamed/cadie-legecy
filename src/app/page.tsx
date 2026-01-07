import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard-client";
import { LandingPage } from "@/components/landing-page";

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

  // Render dashboard - TanStack Query handles data fetching client-side
  // Shell renders instantly, content uses cached data or shows skeleton
  return (
    <DashboardClient
      user={JSON.parse(JSON.stringify(user))}
    />
  );
}
