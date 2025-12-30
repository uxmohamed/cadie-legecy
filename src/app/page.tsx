import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard-client";
import { LandingPage } from "@/components/landing-page";
import { OnboardingClient } from "@/components/onboarding-client";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/skeletons";

export const runtime = 'edge';

async function DashboardWrapper() {
  const supabase = await createClient();

  // Server-side auth check (no client-side flash)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not authenticated - show landing page
  if (!user) {
    return <LandingPage />;
  }

  // Check onboarding status
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Show onboarding for new users (no profile or hasn't completed onboarding)
  if (!profile || profile.needs_onboarding) {
    return <OnboardingClient user={JSON.parse(JSON.stringify(user))} />;
  }

  // Render dashboard (static shell renders immediately, content streams)
  return <DashboardClient user={JSON.parse(JSON.stringify(user))} />;
}

export default function Home() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardWrapper />
    </Suspense>
  );
}
