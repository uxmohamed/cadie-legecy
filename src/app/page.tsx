import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard-client";
import { LandingPage } from "@/components/landing-page";
import { OnboardingClient } from "@/components/onboarding-client";
import { allChangelogs } from "contentlayer/generated";

export default async function Home(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  // Server-side auth check (no client-side flash)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not authenticated - show landing page
  if (!user) {
    // Get latest changelog entries for the landing page
    const latestChangelogs = [...allChangelogs]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 2);
    
    return <LandingPage changelogEntries={latestChangelogs} />;
  }

  // Check if user needs onboarding (server-side to prevent flash)
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("onboarding_completed")
    .eq("user_id", user.id)
    .maybeSingle();

  // If no profile or onboarding not completed, show onboarding
  const needsOnboarding = !profile || !profile.onboarding_completed;
  
  if (needsOnboarding) {
    return <OnboardingClient user={JSON.parse(JSON.stringify(user))} />;
  }

  // Render dashboard - TanStack Query handles data fetching client-side
  // Shell renders instantly, content uses cached data or shows skeleton
  return (
    <DashboardClient
      user={JSON.parse(JSON.stringify(user))}
    />
  );
}
