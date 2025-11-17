"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CaptureInput } from "@/components/capture-input";
import { LinkList } from "@/components/link-list";
import { LinkListSkeleton } from "@/components/link-list-skeleton";
import { UserMenu } from "@/components/user-menu";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import type { Link } from "@/types";
import type { User } from "@supabase/supabase-js";

export default function Home() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [links, setLinks] = React.useState<Link[]>([]);
  const [fetchingLinks, setFetchingLinks] = React.useState(true);
  const [user, setUser] = React.useState<User | null>(null);
  const { showToast } = useToast();
  const router = useRouter();

  React.useEffect(() => {
    const supabase = createClient();
    
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/auth");
        return;
      }
      
      setUser(user);
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  React.useEffect(() => {
    if (!user) return;

    async function fetchLinks() {
      try {
        const response = await fetch("/api/links");
        if (response.ok) {
          const data = await response.json();
          setLinks(data.links || []);
        } else {
          showToast("Failed to load links", "error");
        }
      } catch (error) {
        console.error("Error fetching links:", error);
        showToast("Failed to load links", "error");
      } finally {
        setFetchingLinks(false);
      }
    }

    fetchLinks();
  }, [user, showToast]);

  const handleSubmit = async (value: string, type: "url" | "color" | "text") => {
    setIsLoading(true);
    
    try {
      // Extract metadata if it's a URL
      let metadata = null;
      if (type === "url") {
        const metadataResponse = await fetch("/api/metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: value }),
        });
        
        if (metadataResponse.ok) {
          const data = await metadataResponse.json();
          metadata = data.metadata;
        }
      }

      // Create the link
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: value,
          title: metadata?.title || value,
          content_type: type,
          favicon_url: metadata?.favicon,
          og_image_url: metadata?.ogImage,
          description: metadata?.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create link");
      }

      const { link } = await response.json();
      
      // Add the new link to the list
      setLinks((prev) => [link, ...prev]);
      showToast("Link saved successfully", "success");
    } catch (error) {
      console.error("Error creating link:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to save link",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <p className="text-sm text-neutral-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-24 items-center justify-between border-b border-neutral-200 px-8">
          <div className="flex-1 max-w-4xl">
            <CaptureInput onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
          <div className="ml-6">
            <UserMenu user={user} />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl px-8 pt-12">
            {fetchingLinks ? (
              <LinkListSkeleton />
            ) : (
              <LinkList links={links} />
            )}
        </div>
        </div>
      </main>
    </div>
  );
}
