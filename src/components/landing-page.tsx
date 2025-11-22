"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ChevronDown } from "lucide-react";

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white selection:bg-brand/10 selection:text-brand">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-6 bg-white">
        <div className="flex items-center gap-8">
          <Logo className="h-6 w-auto text-neutral-900" />
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600">
            <Link href="#" className="hover:text-neutral-900 transition-colors">
              Changelog
            </Link>
            <a
              href="https://x.com/caddyapp_"
              target="_blank"
              className="hover:text-neutral-900 transition-colors"
            >
              X (Twitter)
            </a>
          </div>
        </div>
        <div className="flex items-center gap-3">
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
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl mb-6 font-custom leading-snug">
            Simple way to <br />{" "}
            <span className="bg-brand/10 text-brand px-1">save links</span>
          </h1>

          <p className="mx-auto max-w-xs text-lg font-medium text-neutral-400 mb-8 leading-7">
            Save links from anywhere and keep everything in one place.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/auth">
              <Button
                size="lg"
                className="h-12 bg-neutral-800 border-0 text-white text-base rounded-xl shadow-none hover:bg-neutral-700 transition-colors duration-150 px-8"
              >
                Get Started
              </Button>
            </Link>
          </div>

          {/* Product Screenshot */}
          <div className="mt-20 relative mx-auto w-full max-w-4xl ">
            {/* Gradient border wrapper */}
            <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-neutral-200 from-60% to-transparent to-100%">
              <div className="relative w-full overflow-hidden rounded-2xl bg-white">
                <Image
                  src="/product-landing.png"
                  alt="Caddy Interface"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                  priority
                />
                {/* Gradient mask overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent from-60% to-white to-100%"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
