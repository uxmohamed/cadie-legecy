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
        <div className="p-3 flex items-center justify-between relative">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <Logo className="h-6 w-auto" />
            </Link>
          </div>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2">
            <Link href="#">
              <Button className="py-2 px-4 bg-transparent border-0 text-[var(--text-secondary)] text-sm font-medium rounded-xl shadow-none hover:bg-[var(--bg-field-hover)] transition-colors duration-150">
                Extension
              </Button>
            </Link>
            <Link href="/changelog">
              <Button className="py-2 px-4 bg-transparent border-0 text-[var(--text-secondary)] text-sm font-medium rounded-xl shadow-none hover:bg-[var(--bg-field-hover)] transition-colors duration-150">
                Changelog
              </Button>
            </Link>
            <a
              href="https://x.com/caddyapp_"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="py-2 px-4 bg-transparent border-0 text-[var(--text-secondary)] text-sm font-medium rounded-xl shadow-none hover:bg-[var(--bg-field-hover)] transition-colors duration-150">
                X (Twitter)
              </Button>
            </a>
          </div>

          {/* Right Side - Auth Buttons + Mobile Menu */}
          <div className="flex items-center gap-3">
            {/* Desktop Auth Buttons */}
            <div className="hidden sm:flex items-center gap-3">
              {!authChecked ? (
                <div className="w-[100px]" />
              ) : user ? (
                <Link href="/">
                  <Button className="py-2 px-4 bg-[var(--bg-inverse-primary)] border-0 text-[var(--text-inverse)] text-sm font-medium rounded-xl shadow-none hover:bg-[var(--bg-inverse-strong)] transition-colors duration-150">
                    Back to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth">
                    <Button className="py-2 px-4 bg-transparent border-0 text-[var(--text-secondary)] text-sm font-medium rounded-xl shadow-none hover:bg-[var(--bg-field-hover)] transition-colors duration-150">
                      Log In
                    </Button>
                  </Link>
                  <Link href="/auth">
                    <Button className="py-2 px-4 bg-[var(--bg-inverse-primary)] border-0 text-[var(--text-inverse)] text-sm font-medium rounded-xl shadow-none hover:bg-[var(--bg-inverse-strong)] transition-colors duration-150">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>

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
                <div className="flex flex-col h-full bg-[var(--bg-l0-solid)]">
                  {/* Mobile Menu Header */}
                  <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
                    <Link href="/" onClick={() => setIsMenuOpen(false)}>
                      <Logo className="h-6 w-auto" />
                    </Link>
                    <div className="flex items-center gap-2">
                      {!authChecked ? (
                        <div className="w-[100px]" />
                      ) : user ? (
                        <Link href="/" onClick={() => setIsMenuOpen(false)}>
                          <Button className="py-2 px-4 bg-[var(--bg-inverse-primary)] border-0 text-[var(--text-inverse)] text-sm font-medium rounded-xl shadow-none hover:bg-[var(--bg-inverse-strong)] transition-colors duration-150">
                            Back to Dashboard
                          </Button>
                        </Link>
                      ) : (
                        <Link href="/auth" onClick={() => setIsMenuOpen(false)}>
                          <Button className="py-2 px-4 bg-[var(--bg-inverse-primary)] border-0 text-[var(--text-inverse)] text-sm font-medium rounded-xl shadow-none hover:bg-[var(--bg-inverse-strong)] transition-colors duration-150">
                            Get Started
                          </Button>
                        </Link>
                      )}
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
                        href="https://x.com/caddyapp_"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-2xl font-medium text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        X (Twitter)
                      </a>
                      {!user && (
                        <Link 
                          href="/auth" 
                          className="text-2xl font-medium text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors sm:hidden"
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
