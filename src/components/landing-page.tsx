"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-2xl space-y-12 text-center">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo className="h-12 w-auto text-neutral-900" />
        </div>

        {/* Hero Section */}
        <div className="space-y-6">
          <h1 className="text-5xl font-bold tracking-tight text-neutral-900 sm:text-6xl">
            Save and organize everything that matters
          </h1>
          <p className="mx-auto max-w-xl text-xl text-neutral-600">
            Caddy helps you capture links, colors, and notes in one beautiful place. Simple, fast, and always at your fingertips.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/auth" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full bg-brand text-white hover:bg-brand-hover rounded-lg font-medium px-8 py-3 text-base sm:w-auto"
            >
              Get Started
            </Button>
          </Link>
          <Button
            size="lg"
            className="w-full bg-transparent border-0 shadow-none text-neutral-700 hover:bg-neutral-100 rounded-lg font-medium px-8 py-3 text-base sm:w-auto"
            onClick={() => {
              // Scroll to features or show more info
              window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
            }}
          >
            Learn More
          </Button>
        </div>

        {/* Optional: Features Preview */}
        <div className="pt-12 text-sm text-neutral-500">
          <p>Free to get started • No credit card required</p>
        </div>
      </div>
    </div>
  );
}
