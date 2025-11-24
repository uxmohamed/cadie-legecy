"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Menu, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

export function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white selection:bg-brand/10 selection:text-brand">
      {/* Header */}
      <div>
        <div className="max-w-5xl mx-auto relative">
          <div className="p-3 flex items-center justify-between relative">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/">
                <Logo className="h-6 w-auto" />
              </Link>
            </div>
            
            {/* Desktop Navigation - Centered */}
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
            
            {/* Right Side - Auth Buttons + Mobile Menu */}
            <div className="flex items-center gap-3">
              {/* Get Started Button - Always visible */}
              <Link href="/auth" className="hidden sm:block">
                <Button className="py-2 px-4 bg-neutral-800 border-0 text-white text-sm font-medium rounded-xl shadow-none hover:bg-neutral-700 transition-colors duration-150">
                  Get Started
                </Button>
              </Link>
              
              {/* Mobile Menu */}
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button className="md:hidden py-2 px-2 bg-transparent border-0 text-neutral-900 rounded-xl shadow-none hover:bg-neutral-100 transition-colors duration-150">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  side="right" 
                  className="w-full !max-w-none p-0 inset-y-0 right-0 left-0 !transition-all !duration-[400ms] ease-in-out data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right" 
                  showCloseButton={false}
                >
                  <div className="flex flex-col h-full bg-white">
                    {/* Mobile Menu Header */}
                    <div className="flex items-center justify-between p-4 border-b border-neutral-100">
                      <Link href="/" onClick={() => setIsMenuOpen(false)}>
                        <Logo className="h-6 w-auto" />
                      </Link>
                      <div className="flex items-center gap-2">
                        <Link href="/auth" onClick={() => setIsMenuOpen(false)}>
                          <Button className="py-2 px-4 bg-neutral-800 border-0 text-white text-sm font-medium rounded-xl shadow-none hover:bg-neutral-700 transition-colors duration-150">
                            Get Started
                          </Button>
                        </Link>
                        <Button 
                          onClick={() => setIsMenuOpen(false)}
                          className="py-2 px-2 bg-transparent border-0 text-neutral-600 rounded-xl shadow-none hover:bg-neutral-100 transition-colors duration-150"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Mobile Menu Items */}
                    <nav className="flex-1 overflow-y-auto p-6">
                      <div className="flex flex-col gap-6">
                        <Link 
                          href="/changelog" 
                          className="text-2xl font-medium text-neutral-900 hover:text-neutral-600 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Changelog
                        </Link>
                        <a
                          href="https://x.com/caddyapp_"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-2xl font-medium text-neutral-900 hover:text-neutral-600 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          X (Twitter)
                        </a>
                        <Link 
                          href="/auth" 
                          className="text-2xl font-medium text-neutral-900 hover:text-neutral-600 transition-colors sm:hidden"
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


