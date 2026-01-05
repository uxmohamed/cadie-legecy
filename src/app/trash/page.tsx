import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { prefetchTrashLinks } from "@/lib/server/prefetch-links";
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

  // Prefetch trash links on server for instant render
  const initialData = await prefetchTrashLinks(user.id);

  // Render dashboard with trash view and prefetched data
  return (
    <DashboardClient
      user={JSON.parse(JSON.stringify(user))}
      initialView="trash"
      initialLinks={initialData}
    />
  );
}
