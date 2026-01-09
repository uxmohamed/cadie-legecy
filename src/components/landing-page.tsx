"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { IconMenu, IconX, IconConfettiFilled, IconClick, IconLayoutDashboard, IconKeyboard, IconChevronDown } from "@tabler/icons-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { Footer } from "@/components/footer";

function FaqItem({ question, children, isOpen, onToggle }: { question: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="bg-[color-mix(in_oklab,var(--grey-100)_60%,transparent)] dark:bg-[color-mix(in_oklab,var(--grey-800)_60%,transparent)] rounded-xl transition-colors duration-150">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left gap-4 px-5 py-4"
      >
        <span className="text-sm font-medium text-[var(--text-primary)]">{question}</span>
        <IconChevronDown 
          className={`size-5 text-[var(--cadie-color-6)] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-40' : 'max-h-0'}`}>
        <p className="px-5 pb-4 text-sm text-[var(--text-secondary)] pr-12">
          {children}
        </p>
      </div>
    </div>
  );
}

export function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-main-container)] selection:bg-brand/10 selection:text-brand">
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
              <a
                href="https://chromewebstore.google.com/detail/cadie/efcdfndkolpokgobbejhcegfgodfepdd"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="relative text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium text-sm outline-none transition-all duration-120 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-8 px-3 py-1.5 rounded-md bg-transparent hover:bg-[var(--bg-field-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue-primary)] focus-visible:ring-offset-2">
                  Extension
                </Button>
              </a>
              <Link href="/changelog">
                <Button className="relative text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium text-sm outline-none transition-all duration-120 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-8 px-3 py-1.5 rounded-md bg-transparent hover:bg-[var(--bg-field-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue-primary)] focus-visible:ring-offset-2">
                  Changelog
                </Button>
              </Link>
              <a
                href="https://x.com/cadieapp_"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="relative text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium text-sm outline-none transition-all duration-120 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-8 px-3 py-1.5 rounded-md bg-transparent hover:bg-[var(--bg-field-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue-primary)] focus-visible:ring-offset-2">
                  X (Twitter)
                </Button>
              </a>
            </div>
            
            {/* Right Side - Auth Buttons + Mobile Menu */}
            <div className="flex items-center gap-3">
              {/* Get Started Button - Always visible */}
              <Link href="/auth" className="hidden sm:block">
                <Button className="relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium outline-none transition-all duration-120 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-9 px-3.5 py-2 text-sm rounded-lg bg-[var(--cta-primary-default)] text-[var(--text-always-white)] hover:bg-[var(--cta-primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--cta-primary-default)] focus-visible:ring-offset-2">
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
                  <div className="flex flex-col h-full bg-[var(--bg-main-container)]">
                    {/* Mobile Menu Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
                      <Link href="/" onClick={() => setIsMenuOpen(false)}>
                        <Logo className="h-6 w-auto" />
                      </Link>
                      <div className="flex items-center gap-2">
                        <Link href="/auth" onClick={() => setIsMenuOpen(false)}>
                          <Button className="relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium text-sm outline-none transition-all duration-120 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-8 px-3 py-1.5 rounded-md bg-[var(--cta-primary-default)] text-[var(--text-always-white)] hover:bg-[var(--cta-primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--cta-primary-default)] focus-visible:ring-offset-2">
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
                        <a
                          href="https://chromewebstore.google.com/detail/cadie/efcdfndkolpokgobbejhcegfgodfepdd"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-2xl font-medium text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Extension
                        </a>
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
          {/* Beta Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-field-default)] mb-2 sm:mb-4">
            <IconConfettiFilled className="size-5 text-[var(--text-secondary)]" />
            <span className="text-sm font-medium text-[var(--text-secondary)]">Cadie beta is now live</span>
          </div>

          <h1 className="text-6xl font-medium tracking-[-0.05em] text-[var(--text-primary)] mb-2 sm:mb-4 font-custom" style={{ lineHeight: 'calc(0.25rem * 17)' }}>
            Your personal library <br className="hidden sm:block" />
            for the internet.
          </h1>

          <p className="mx-auto max-w-xs sm:max-w-md text-base sm:text-lg font-medium text-[var(--text-tertiary)] mb-6 sm:mb-8 leading-6 sm:leading-7">
            Never lose a link again. See it, save it, find it later.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/auth">
              <Button
                size="lg"
                className="w-full sm:w-auto inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium outline-none transition-all duration-120 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-10 px-8 py-3 text-base rounded-lg [&_svg:not([class*='size-'])]:size-4.5 bg-[var(--cta-primary-default)] text-[var(--text-always-white)] hover:bg-[var(--cta-primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--cta-primary-default)] focus-visible:ring-offset-2"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Full-width Product Showcase */}
      <section className="relative w-full overflow-hidden">
        {/* Artwork Background */}
        <div className="absolute inset-0">
          <Image
            src="/artwork-bg.png"
            alt=""
            fill
            className="object-cover"
            priority
          />
        </div>
        
        {/* Product Screenshot */}
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <div className="mx-auto max-w-4xl">
            <div className="relative overflow-hidden">
              <Image
                src="/product-ui.png"
                alt="Cadie Interface"
                width={1200}
                height={800}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-medium text-[var(--text-primary)] mb-6 font-custom">
              Built for simplicity
            </h2>
            <p className="text-base font-medium text-[var(--text-tertiary)] max-w-md mx-auto">
              Everything you need, nothing you don&apos;t.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <IconClick className="size-6 text-[var(--cadie-color-6)]" />
                </div>
                <p className="text-md text-[var(--text-secondary)] font-medium">
                  <span className="font-medium text-[var(--text-primary)]">One-Click Capture.</span>{" "}
                  Save any link instantly with our browser extension. No friction, just results.
                </p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <IconLayoutDashboard className="size-6 text-[var(--cadie-color-6)]" />
                </div>
                <p className="text-md text-[var(--text-secondary)] font-medium">
                  <span className="font-medium text-[var(--text-primary)]">Minimalist Interface.</span>{" "}
                  A clean, clutter-free design that puts your content first. No ads, no noise.
                </p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <IconKeyboard className="size-6 text-[var(--cadie-color-6)]" />
                </div>
                <p className="text-md text-[var(--text-secondary)] font-medium">
                  <span className="font-medium text-[var(--text-primary)]">Keyboard First.</span>{" "}
                  Navigate, organize, and search without ever touching your mouse.
                </p>
              </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-medium text-[var(--text-primary)] mb-6 font-custom">
              Frequently<br />asked questions
            </h2>
            <p className="text-base font-medium text-[var(--text-tertiary)]">
              Quick answers to common questions about Cadie.
            </p>
          </div>
          <div className="max-w-[500px] mx-auto flex flex-col gap-1">
            <FaqItem 
              question="Is Cadie free to use?" 
              isOpen={openFaqId === 'free'} 
              onToggle={() => setOpenFaqId(openFaqId === 'free' ? null : 'free')}
            >
              Yes! Cadie is completely free during the beta period. We&apos;re focused on building the best link-saving experience before introducing any paid features.
            </FaqItem>
            <FaqItem 
              question="How do I save links?" 
              isOpen={openFaqId === 'save'} 
              onToggle={() => setOpenFaqId(openFaqId === 'save' ? null : 'save')}
            >
              Manually add links from the dashboard using the input field or keyboard shortcuts. You can also use our Chrome extension for one-click saving!
            </FaqItem>
            <FaqItem 
              question="Is my data private?" 
              isOpen={openFaqId === 'privacy'} 
              onToggle={() => setOpenFaqId(openFaqId === 'privacy' ? null : 'privacy')}
            >
              Absolutely. Your links are private by default and we never share or sell your data. You have full control over your content.
            </FaqItem>
            <FaqItem 
              question="How do I organize my links?" 
              isOpen={openFaqId === 'organize'} 
              onToggle={() => setOpenFaqId(openFaqId === 'organize' ? null : 'organize')}
            >
              Use the archive feature to keep your main view clean. Quick search helps you find any link instantly, no folders needed.
            </FaqItem>
            <FaqItem 
              question="What browsers are supported?" 
              isOpen={openFaqId === 'browsers'} 
              onToggle={() => setOpenFaqId(openFaqId === 'browsers' ? null : 'browsers')}
            >
              Cadie works on any modern web browser including Chrome, Firefox, Safari, Edge, and Brave. Access your links from any device with an internet connection.
            </FaqItem>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[color-mix(in_oklab,var(--grey-100)_60%,transparent)] dark:bg-[color-mix(in_oklab,var(--grey-800)_60%,transparent)] rounded-2xl p-8 sm:p-12 md:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-medium text-[var(--text-always-black)] dark:text-[var(--text-always-white)] mb-4 font-custom">
              Start saving links<br />the simple way
            </h2>
            <p className="text-base font-medium text-[var(--grey-600)] dark:text-[var(--grey-400)] mb-8 max-w-md mx-auto">
              Join the beta today and never lose an important link again.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/auth">
                <Button className="w-full sm:w-auto inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium outline-none transition-all duration-120 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-10 px-6 py-3 text-base rounded-xl [&_svg:not([class*='size-'])]:size-4.5 bg-[var(--cta-primary-default)] text-[var(--text-always-white)] hover:bg-[var(--cta-primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--cta-primary-default)] focus-visible:ring-offset-2">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}


