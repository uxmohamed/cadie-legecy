import { createClient, getUser } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard-client";
import { LandingPage } from "@/components/landing-page";
import { OnboardingClient } from "@/components/onboarding-client";
import { fetchVariantPrices } from "@/lib/billing/lemon-client";
import { prefetchSpaces } from "@/lib/server/prefetch-links";
import { allChangelogs } from "contentlayer/generated";

export default async function Home(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Server-side auth check (no client-side flash)
  const {
    data: { user },
  } = await getUser();

  // Not authenticated - show landing page
  if (!user) {
    // Get latest changelog entries for the landing page
    const [latestChangelogs, pricing] = await Promise.all([
      Promise.resolve(
        [...allChangelogs]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 2)
      ),
      fetchVariantPrices(),
    ]);
    
    return <LandingPage changelogEntries={latestChangelogs} pricing={pricing} />;
  }

  // Check if user needs onboarding (server-side to prevent flash)
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("onboarding_completed")
    .eq("user_id", user.id)
    .maybeSingle();

  // If no profile or onboarding not completed, show onboarding
  const needsOnboarding = !profile || !profile.onboarding_completed;
  
  if (needsOnboarding) {
    return <OnboardingClient user={user} />;
  }

  // Prefetch spaces server-side for instant rendering
  const initialSpaces = await prefetchSpaces(user.id);

  // Render dashboard - TanStack Query handles data fetching client-side
  // Shell renders instantly, content uses cached data or shows skeleton
  return (
    <DashboardClient
      user={user}
      initialSpaces={initialSpaces}
    />
  );
}
