import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { prefetchSpaces } from "@/lib/server/prefetch-links";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trash | Cadie",
  description: "View deleted links",
};

export default async function TrashPage() {
  const {
    data: { user },
  } = await getUser();

  // Not authenticated - redirect to auth
  if (!user) {
    redirect("/auth");
  }

  // Prefetch spaces server-side for instant rendering
  const initialSpaces = await prefetchSpaces(user.id);

  // Render dashboard with trash view
  // Shell renders instantly, TanStack Query handles data client-side
  return (
    <DashboardClient
      user={user}
      initialView="trash"
      initialSpaces={initialSpaces}
    />
  );
}
