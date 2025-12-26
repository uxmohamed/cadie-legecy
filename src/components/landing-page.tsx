"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { IconMenu, IconX } from "@tabler/icons-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

export function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-l2-solid)] selection:bg-brand/10 selection:text-brand">
      {/* Header */}
      <div>
        <div className="max-w-5xl mx-auto relative">
          <div className="p-3 sm:p-4 md:p-3 flex items-center justify-between relative">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/">
                <Logo className="h-6 w-auto" />
              </Link>
            </div>
            
            {/* Desktop Navigation - Centered */}
            <div className="hidden md:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2">
              <Link href="#">
                <Button className="relative text-black/60 hover:text-black inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium text-sm outline-none transition-all duration-120 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-8 px-3 py-1.5 rounded-md bg-transparent hover:bg-[var(--bg-field-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue-primary)] focus-visible:ring-offset-2">
                  Extension
                </Button>
              </Link>
              <Link href="/changelog">
                <Button className="relative text-black/60 hover:text-black inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium text-sm outline-none transition-all duration-120 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-8 px-3 py-1.5 rounded-md bg-transparent hover:bg-[var(--bg-field-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue-primary)] focus-visible:ring-offset-2">
                  Changelog
                </Button>
              </Link>
              <a
                href="https://x.com/cadieapp_"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="relative text-black/60 hover:text-black inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium text-sm outline-none transition-all duration-120 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-8 px-3 py-1.5 rounded-md bg-transparent hover:bg-[var(--bg-field-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue-primary)] focus-visible:ring-offset-2">
                  X (Twitter)
                </Button>
              </a>
            </div>
            
            {/* Right Side - Auth Buttons + Mobile Menu */}
            <div className="flex items-center gap-3">
              {/* Get Started Button - Always visible */}
              <Link href="/auth" className="hidden sm:block">
                <Button className="relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium outline-none transition-all duration-120 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-9 px-3.5 py-2 text-base rounded-lg bg-[var(--cta-primary-default)] text-[var(--text-inverse)] hover:bg-[var(--cta-primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--cta-primary-default)] focus-visible:ring-offset-2">
                  Get Started
                </Button>
              </Link>
              
              {/* Mobile Menu */}
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button className="md:hidden py-2 px-2 bg-transparent border-0 text-[var(--text-primary)] rounded-xl shadow-none hover:bg-[var(--bg-field-hover)] transition-colors duration-150">
                    <IconMenu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  side="right" 
                  className="w-full !max-w-none p-0 inset-y-0 right-0 left-0 !transition-all !duration-[400ms] ease-in-out data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right" 
                  showCloseButton={false}
                >
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <div className="flex flex-col h-full bg-[var(--bg-l2-solid)]">
                    {/* Mobile Menu Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
                      <Link href="/" onClick={() => setIsMenuOpen(false)}>
                        <Logo className="h-6 w-auto" />
                      </Link>
                      <div className="flex items-center gap-2">
                        <Link href="/auth" onClick={() => setIsMenuOpen(false)}>
                          <Button className="relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium text-sm outline-none transition-all duration-120 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-8 px-3 py-1.5 rounded-md bg-[var(--cta-primary-default)] text-[var(--text-inverse)] hover:bg-[var(--cta-primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--cta-primary-default)] focus-visible:ring-offset-2">
                            Get Started
                          </Button>
                        </Link>
                        <Button 
                          onClick={() => setIsMenuOpen(false)}
                          className="py-2 px-2 bg-transparent border-0 text-[var(--text-secondary)] rounded-xl shadow-none hover:bg-[var(--bg-field-hover)] transition-colors duration-150"
                        >
                          <IconX className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Mobile Menu Items */}
                    <nav className="flex-1 overflow-y-auto p-6">
                      <div className="flex flex-col gap-6">
                        <Link 
                          href="#" 
                          className="text-2xl font-medium text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Extension
                        </Link>
                        <Link 
                          href="/changelog" 
                          className="text-2xl font-medium text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Changelog
                        </Link>
                        <a
                          href="https://x.com/cadieapp_"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-2xl font-medium text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          X (Twitter)
                        </a>
                        <Link 
                          href="/auth" 
                          className="text-2xl font-medium text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors sm:hidden"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Log In
                        </Link>
                      </div>
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <main className="flex-1 pt-12 sm:pt-16 md:pt-20 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--text-primary)] mb-4 sm:mb-6 font-custom leading-tight sm:leading-snug">
            The simplest way <br className="hidden sm:block" />{" "}
            to <span
              className="bg-[color-mix(in_oklab,var(--cadie-color-6)_12%,transparent)] text-[var(--text-link)] px-1"
            >save links</span>
          </h1>

          <p className="mx-auto max-w-xs sm:max-w-md text-base sm:text-lg font-medium text-[var(--text-tertiary)] mb-6 sm:mb-8 leading-6 sm:leading-7">
            Save links from anywhere and keep everything in one place.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/auth">
              <Button
                size="lg"
                className="w-full sm:w-auto inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium outline-none transition-all duration-120 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-10 px-4 py-3 text-base rounded-xl [&_svg:not([class*='size-'])]:size-4.5 bg-[var(--cta-primary-default)] text-[var(--text-inverse)] hover:bg-[var(--cta-primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--cta-primary-default)] focus-visible:ring-offset-2"
              >
                Get Started
              </Button>
            </Link>
          </div>

          {/* Product Screenshot */}
          <div className="mt-12 sm:mt-16 md:mt-20 relative mx-auto w-full max-w-4xl ">
            {/* Gradient border wrapper */}
            <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-[var(--border-primary)] from-60% to-transparent to-100%">
              <div className="relative w-full overflow-hidden rounded-2xl bg-[var(--bg-l2-solid)]">
                <Image
                  src="/product-landing.png"
                  alt="Cadie Interface"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                  priority
                />
                {/* Gradient mask overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent from-60% to-[var(--bg-l2-solid)] to-100%"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


