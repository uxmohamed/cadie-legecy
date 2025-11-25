"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function ChangelogHeader() {
  const { user, authChecked } = useAuth();

  return (
    <div>
      <div className="max-w-5xl mx-auto relative">
        <div className="p-3 flex items-center justify-between relative">
          <div className="flex items-center">
            <Link href="/">
              <Logo className="h-6 w-auto" />
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
            <Link href="/changelog">
              <Button className="py-2 px-4 bg-transparent border-0 text-neutral-600 text-sm font-medium rounded-xl shadow-none hover:bg-neutral-100 transition-colors duration-150">
                Changelog
              </Button>
            </Link>
            <a
              href="https://x.com/caddyapp_"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="py-2 px-4 bg-transparent border-0 text-neutral-600 text-sm font-medium rounded-xl shadow-none hover:bg-neutral-100 transition-colors duration-150">
                X (Twitter)
              </Button>
            </a>
          </div>
          <div className="flex items-center gap-3">
            {!authChecked ? (
              // Loading state or empty to prevent flash?
              // Let's show nothing or a skeleton. For now, nothing to avoid flash of wrong content.
              <div className="w-[100px]" /> 
            ) : user ? (
              <Link href="/">
                <Button className="py-2 px-4 bg-neutral-800 border-0 text-white text-sm font-medium rounded-xl shadow-none hover:bg-neutral-800 transition-colors duration-150">
                  Open App
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth">
                  <Button className="py-2 px-4 bg-transparent border-0 text-neutral-600 text-sm font-medium rounded-xl shadow-none hover:bg-neutral-100 transition-colors duration-150">
                    Log In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button className="py-2 px-4 bg-neutral-800 border-0 text-white text-sm font-medium rounded-xl shadow-none hover:bg-neutral-800 transition-colors duration-150">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
