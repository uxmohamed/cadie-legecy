"use client";

import { useAuth } from "@/hooks/use-auth";
import { Dashboard } from "@/components/dashboard";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, authChecked } = useAuth();
  const router = useRouter();

  // Redirect unauthenticated users to /homepage
  useEffect(() => {
    if (authChecked && !user) {
      router.push("/homepage");
    }
  }, [authChecked, user, router]);

  // Show loading state while checking auth
  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <p className="text-sm text-neutral-400">Loading...</p>
      </div>
    );
  }

  // Show loading state while redirecting unauthenticated users
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <p className="text-sm text-neutral-400">Loading...</p>
      </div>
    );
  }

  return <Dashboard user={user} />;
}
