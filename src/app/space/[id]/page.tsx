import { createClient, getUser } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { prefetchSpaces } from "@/lib/server/prefetch-links";
import type { Metadata } from "next";

interface SpacePageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: SpacePageProps): Promise<Metadata> {
  const { id } = await params;

  const {
    data: { user },
  } = await getUser();

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
  const supabase = await createClient();
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

  const {
    data: { user },
  } = await getUser();

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
  const supabase = await createClient();
  const { data: space, error: spaceError } = await supabase
    .from("spaces")
    .select("id, name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (spaceError || !space) {
    notFound();
  }

  // Prefetch spaces server-side for instant rendering
  const initialSpaces = await prefetchSpaces(user.id);

  // Render dashboard with space view
  // Shell renders instantly, TanStack Query handles data client-side
  return (
    <DashboardClient
      user={user}
      initialView={id}
      initialSpaces={initialSpaces}
    />
  );
}
