"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { IconMenu, IconX, IconConfettiFilled, IconChevronDown, IconArrowRight } from "@tabler/icons-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { Footer } from "@/components/footer";
import type { ChangelogEntry } from "@/types/changelog";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";

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

interface LandingPageProps {
  changelogEntries?: ChangelogEntry[];
}

export function LandingPage({ changelogEntries = [] }: LandingPageProps) {
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
        <div className="max-w-5xl mx-auto space-y-12 md:space-y-16">
          
          {/* Feature 1: Save with one click - Text Left, Image Right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-medium text-[var(--text-primary)] font-custom">
                Save with one click
              </h2>
              <p className="text-md font-[470] text-[var(--text-secondary)] leading-relaxed max-w-md">
                Click the Cadie Chrome extension and the current page is saved instantly to your library.
              </p>
              <a
                href="https://chromewebstore.google.com/detail/cadie/efcdfndkolpokgobbejhcegfgodfepdd"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--cadie-color-6)] hover:text-[var(--cadie-color-5)] transition-colors mt-2"
              >
                Get extension
                <IconArrowRight className="size-4" />
              </a>
            </div>
            <div className="rounded-xl bg-[color-mix(in_oklab,var(--grey-100)_60%,transparent)] dark:bg-[color-mix(in_oklab,var(--grey-800)_60%,transparent)] pt-12 pr-12">
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <video
                  src="/vid-section01.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover object-right-top rounded-tr-[6px] rounded-br-[6px]"
                />
              </div>
            </div>
          </div>

          {/* Feature 2: Clean links by default - Image Left, Text Right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="rounded-xl bg-[color-mix(in_oklab,var(--grey-100)_60%,transparent)] dark:bg-[color-mix(in_oklab,var(--grey-800)_60%,transparent)] pt-12 px-12 pb-0 md:order-1 flex flex-col justify-end overflow-hidden">
              <video
                src="/vid-section02.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full aspect-[4/3] object-cover object-center block rounded-t-[6px] border-t border-x border-[color-mix(in_oklab,var(--border-primary)_40%,transparent)]"
              />
            </div>
            <div className="space-y-4 md:order-2">
              <h2 className="text-xl sm:text-2xl font-medium text-[var(--text-primary)] font-custom">
                Clean links by default
              </h2>
              <p className="text-md font-[470] text-[var(--text-secondary)] leading-relaxed max-w-md">
                Cadie removes tracking and extra parameters when you save a link. You don&apos;t need to do anything.
              </p>
            </div>
          </div>

          {/* Feature 3: Keyboard-first - Text Left, Image Right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-medium text-[var(--text-primary)] font-custom">
                Keyboard-first
              </h2>
              <p className="text-md font-[470] text-[var(--text-secondary)] leading-relaxed max-w-md">
                You can navigate and manage your links using the keyboard instead of the mouse.
              </p>
            </div>
            <div className="rounded-xl bg-[color-mix(in_oklab,var(--grey-100)_60%,transparent)] dark:bg-[color-mix(in_oklab,var(--grey-800)_60%,transparent)] pt-12 px-12 pb-0 overflow-hidden">
              <KeyboardShortcuts />
            </div>
          </div>

        </div>
      </section>

      {/* What's New Section */}
      {changelogEntries.length > 0 && (
        <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-4xl font-medium text-[var(--text-primary)] mb-6 font-custom">
                What&apos;s New
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {changelogEntries.map((entry) => {
                const date = new Date(entry.date);
                const formattedDate = date.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
                
                return (
                  <Link
                    key={entry._id}
                    href={`/changelog#${entry._raw.flattenedPath.replace("changelog/", "")}`}
                    className="group block"
                  >
                    <article className="h-full bg-[color-mix(in_oklab,var(--grey-100)_60%,transparent)] dark:bg-[color-mix(in_oklab,var(--grey-800)_60%,transparent)] rounded-xl p-6 transition-all duration-200 hover:bg-[var(--grey-200)] dark:hover:bg-[var(--grey-700)]">
                      <div className="flex flex-col gap-3">
                        {/* Date */}
                        <time className="text-sm font-medium text-[var(--text-tertiary)]">
                          {formattedDate}
                        </time>
                        
                        {/* Title */}
                        <h3 className="text-lg font-[570] text-[var(--text-primary)]">
                          {entry.title}
                        </h3>
                        
                        {/* Description */}
                        <p className="text-base font-[470] text-[var(--text-secondary)] line-clamp-2">
                          {entry.description}
                        </p>
                        
                        {/* Tags */}
                        {entry.tags && Array.isArray(entry.tags) && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {entry.tags.map((tag) => (
                              <span
                                key={tag}
                                className="h-6 w-fit px-2 text-xs font-medium bg-[var(--bg-l1-solid)] text-[var(--text-secondary)] rounded-full border border-[var(--border-primary)] flex items-center justify-center"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
            
            {/* View All Link */}
            <div className="text-center mt-8">
              <Link
                href="/changelog"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                View all updates
                <IconArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-medium text-[var(--text-primary)] mb-6 font-custom">
             FAQs
            </h2>
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
      <section className="bg-[color-mix(in_oklab,var(--grey-100)_60%,transparent)] dark:bg-[color-mix(in_oklab,var(--grey-800)_60%,transparent)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 md:gap-12">
            <h2 className="text-4xl sm:text-5xl font-medium text-[var(--text-primary)] font-custom">
              Try Cadie
            </h2>
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <Link href="/auth">
                <Button className="w-full sm:w-auto inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium outline-none transition-all duration-120 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-10 px-6 py-3 text-base rounded-lg [&_svg:not([class*='size-'])]:size-4.5 bg-[var(--cta-primary-default)] text-[var(--text-always-white)] hover:bg-[var(--cta-primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--cta-primary-default)] focus-visible:ring-offset-2">
                  Start now for free
                </Button>
              </Link>
              <a
                href="https://chromewebstore.google.com/detail/cadie/efcdfndkolpokgobbejhcegfgodfepdd"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full sm:w-auto inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium outline-none transition-all duration-120 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-10 px-6 py-3 text-base rounded-lg [&_svg:not([class*='size-'])]:size-4.5 bg-[var(--bg-field-light)] text-[var(--text-primary)] hover:bg-[var(--bg-field-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue-primary)] focus-visible:ring-offset-2">
                  Get Extension
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}


