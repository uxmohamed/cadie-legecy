"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { IconMenu, IconX } from "@tabler/icons-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

export function ChangelogHeader() {
  const { user, authChecked } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
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
            <a
              href="https://chromewebstore.google.com/detail/cadie/efcdfndkolpokgobbejhcegfgodfepdd"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="relative text-fg-muted hover:text-fg inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium text-sm outline-none transition-[background-color,color,box-shadow,transform,opacity] duration-120 ease-out motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-8 px-3 py-1.5 rounded-md bg-transparent hover:bg-bg-hover focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2">
                Extension
              </Button>
            </a>
            <Link href="/changelog">
              <Button className="relative text-fg-muted hover:text-fg inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium text-sm outline-none transition-[background-color,color,box-shadow,transform,opacity] duration-120 ease-out motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-8 px-3 py-1.5 rounded-md bg-transparent hover:bg-bg-hover focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2">
                Changelog
              </Button>
            </Link>
            <a
              href="https://x.com/cadieapp_"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="relative text-fg-muted hover:text-fg inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium text-sm outline-none transition-[background-color,color,box-shadow,transform,opacity] duration-120 ease-out motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-8 px-3 py-1.5 rounded-md bg-transparent hover:bg-bg-hover focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2">
                X (Twitter)
              </Button>
            </a>
          </div>

          {/* Right Side - Auth Buttons + Mobile Menu */}
          <div className="flex items-center gap-3">
            {/* Get Started Button - Always visible on desktop */}
            <div className="hidden sm:block">
              {!authChecked ? (
                <div className="w-[100px]" />
              ) : user ? (
                <Link href="/">
                  <Button className="relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium outline-none transition-[background-color,color,box-shadow,transform,opacity] duration-120 ease-out motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-9 px-3.5 py-2 text-sm rounded-lg bg-[var(--btn-primary)] text-fg-on-accent hover:bg-[var(--btn-primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--btn-primary)] focus-visible:ring-offset-2">
                    Open app
                  </Button>
                </Link>
              ) : (
                <Link href="/auth">
                  <Button className="relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium outline-none transition-[background-color,color,box-shadow,transform,opacity] duration-120 ease-out motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-9 px-3.5 py-2 text-sm rounded-lg bg-[var(--btn-primary)] text-fg-on-accent hover:bg-[var(--btn-primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--btn-primary)] focus-visible:ring-offset-2">
                    Get Started
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger
                render={
                  <Button className="md:hidden py-2 px-2 bg-transparent border-0 text-fg rounded-xl shadow-none hover:bg-bg-hover transition-colors duration-150" />
                }
              >
                <IconMenu className="h-6 w-6" />
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-full !max-w-none p-0 inset-y-0 right-0 left-0 !transition-[transform,opacity] !ease-out data-[state=closed]:!duration-[180ms] data-[state=open]:!duration-[240ms] motion-reduce:!transition-none motion-reduce:animate-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right" 
                showCloseButton={false}
              >
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full bg-bg">
                  {/* Mobile Menu Header */}
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <Link href="/" onClick={() => setIsMenuOpen(false)}>
                      <Logo className="h-6 w-auto" />
                    </Link>
                    <div className="flex items-center gap-2">
                      {!authChecked ? (
                        <div className="w-[100px]" />
                      ) : user ? (
                        <Link href="/" onClick={() => setIsMenuOpen(false)}>
                          <Button className="relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium text-sm outline-none transition-[background-color,color,box-shadow,transform,opacity] duration-120 ease-out motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-8 px-3 py-1.5 rounded-md bg-[var(--btn-primary)] text-fg-on-accent hover:bg-[var(--btn-primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--btn-primary)] focus-visible:ring-offset-2">
                            Open app
                          </Button>
                        </Link>
                      ) : (
                        <Link href="/auth" onClick={() => setIsMenuOpen(false)}>
                          <Button className="relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium text-sm outline-none transition-[background-color,color,box-shadow,transform,opacity] duration-120 ease-out motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-8 px-3 py-1.5 rounded-md bg-[var(--btn-primary)] text-fg-on-accent hover:bg-[var(--btn-primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--btn-primary)] focus-visible:ring-offset-2">
                            Get Started
                          </Button>
                        </Link>
                      )}
                      <Button 
                        onClick={() => setIsMenuOpen(false)}
                        className="py-2 px-2 bg-transparent border-0 text-fg-muted rounded-xl shadow-none hover:bg-bg-hover transition-colors duration-150"
                      >
                        <IconX className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Mobile Menu Items */}
                  <nav className="flex-1 overflow-y-auto p-6">
                    <div className="flex flex-col gap-6">
                      <a
                        href="https://chromewebstore.google.com/detail/cadie/efcdfndkolpokgobbejhcegfgodfepdd"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-2xl font-medium text-fg hover:text-fg-muted transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Extension
                      </a>
                      <Link 
                        href="/changelog" 
                        className="text-2xl font-medium text-fg hover:text-fg-muted transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Changelog
                      </Link>
                      <a
                        href="https://x.com/cadieapp_"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-2xl font-medium text-fg hover:text-fg-muted transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        X (Twitter)
                      </a>
                      {!user && (
                        <Link 
                          href="/auth" 
                          className="text-2xl font-medium text-fg hover:text-fg-muted transition-colors sm:hidden"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Log In
                        </Link>
                      )}
                    </div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );
}
