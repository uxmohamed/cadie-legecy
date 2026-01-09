import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
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

  // Render dashboard with trash view
  // Shell renders instantly, TanStack Query handles data client-side
  return (
    <DashboardClient
      user={JSON.parse(JSON.stringify(user))}
      initialView="trash"
    />
  );
}
