"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { IconMenu, IconX, IconConfettiFilled, IconChevronDown, IconArrowRight, IconCheck, IconCrown } from "@tabler/icons-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Footer } from "@/components/footer";
import type { ChangelogEntry } from "@/types/changelog";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";

function FaqItem({ question, children, isOpen, onToggle }: { question: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void }) {
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useLayoutEffect(() => {
    if (!contentRef.current) return;
    setContentHeight(contentRef.current.scrollHeight);
  }, [children, isOpen]);

  return (
    <div className="bg-bg-field-light rounded-xl transition-colors duration-150">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left gap-4 px-5 py-4 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <span className="text-sm font-medium text-fg">{question}</span>
        <IconChevronDown 
          className={`size-5 text-[var(--brand)] shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      <div
        className="overflow-hidden transition-[height,opacity] duration-200 ease-out motion-reduce:transition-none"
        style={{ height: isOpen ? `${contentHeight}px` : "0px", opacity: isOpen ? 1 : 0 }}
      >
        <p ref={contentRef} className="px-5 pb-4 text-sm text-fg-muted pr-12">
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
  const [pricingInterval, setPricingInterval] = useState<"month" | "year">("month");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-bg selection:bg-brand/10 selection:text-brand">
      {/* Header */}
      <header className={`sticky top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-200 ease-out motion-reduce:transition-none ${isScrolled ? "bg-bg/90 backdrop-blur-md border-b border-border" : "bg-transparent"}`}>
        <div className="max-w-5xl mx-auto relative">
          <div className="p-3 sm:p-4 md:p-3 flex items-center justify-between relative">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/">
                <Logo className="h-6 w-auto" />
              </Link>
            </div>
            
            {/* Desktop Navigation - Centered */}
            <nav className="hidden md:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2">
              <Button
                variant="ghost"
                className="text-fg-muted hover:text-fg"
                render={<a href="#pricing" />}
              >
                Pricing
              </Button>
              <Button
                variant="ghost"
                className="text-fg-muted hover:text-fg"
                render={
                  <a
                    href="https://chromewebstore.google.com/detail/cadie/efcdfndkolpokgobbejhcegfgodfepdd"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                Extension
              </Button>
              <Button
                variant="ghost"
                className="text-fg-muted hover:text-fg"
                render={<Link href="/changelog" />}
              >
                Changelog
              </Button>
              <Button
                variant="ghost"
                className="text-fg-muted hover:text-fg"
                render={
                  <a
                    href="https://x.com/cadieapp_"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                X (Twitter)
              </Button>
            </nav>
            
            {/* Right Side - Auth Buttons + Mobile Menu */}
            <div className="flex items-center gap-3">
              {/* Get Started Button - Always visible */}
              <Button
                size="lg"
                className="hidden sm:inline-flex text-sm"
                render={<Link href="/auth" />}
              >
                Get Started
              </Button>
              
              {/* Mobile Menu */}
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger
                  render={
                    <Button
                      className="md:hidden py-2 px-2 bg-transparent border-0 text-fg rounded-xl shadow-none hover:bg-bg-hover transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      aria-label="Open menu"
                    />
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
                        <Button
                          render={<Link href="/auth" onClick={() => setIsMenuOpen(false)} />}
                        >
                          Get Started
                        </Button>
                        <Button
                          onClick={() => setIsMenuOpen(false)}
                          className="py-2 px-2 bg-transparent border-0 text-fg-muted rounded-xl shadow-none hover:bg-bg-hover transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          aria-label="Close menu"
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
                        <Link 
                          href="/auth" 
                          className="text-2xl font-medium text-fg hover:text-fg-muted transition-colors sm:hidden"
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
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-12 sm:pt-16 md:pt-20 pb-16 sm:pb-20 md:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Beta Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-bg-input mb-2 sm:mb-4">
            <IconConfettiFilled className="size-5 text-fg-muted" />
            <span className="text-sm font-medium text-fg-muted">Cadie beta is now live</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-medium tracking-[-0.05em] text-fg mb-2 sm:mb-4 font-custom leading-[1.1]">
            Your personal library <br className="hidden sm:block" />
            for the internet.
          </h1>

          <p className="mx-auto max-w-xs sm:max-w-md text-base sm:text-lg font-medium text-fg-subtle mb-6 sm:mb-8 leading-6 sm:leading-7">
            Never lose a link again. See it, save it, find it later.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              className="w-full sm:w-auto min-h-10 px-8 py-3 text-base rounded-lg"
              render={<Link href="/auth" />}
            >
              Get Started
            </Button>
            <Dialog>
              <DialogTrigger
                render={
                  <Button
                    size="lg"
                    className="w-full sm:w-auto inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium outline-none transition-[background-color,color,box-shadow,transform,opacity] duration-120 ease-out motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 min-h-10 px-8 py-3 text-base rounded-lg [&_svg:not([class*='size-'])]:size-4.5 bg-bg-muted text-fg hover:bg-bg-hover focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                  />
                }
              >
                Watch demo
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-black border-none">
                <DialogTitle className="sr-only">Cadie Demo Video</DialogTitle>
                <div className="aspect-video w-full">
                  <iframe
                    className="h-full w-full"
                    src="https://www.youtube.com/embed/l4sVPobIW0A?autoplay=1"
                    title="Cadie Demo Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
              </DialogContent>
            </Dialog>
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
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-12">
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
      <section className="pt-16 sm:pt-20 md:pt-24 pb-0 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12 md:space-y-16">
          
          {/* Feature 1: Save with one click - Text Left, Image Right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-medium text-fg font-custom">
                Save with one click
              </h2>
              <p className="text-md font-[470] text-fg-muted leading-relaxed max-w-md">
                Click the Cadie Chrome extension and the current page is saved instantly to your library.
              </p>
              <a
                href="https://chromewebstore.google.com/detail/cadie/efcdfndkolpokgobbejhcegfgodfepdd"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-hover)] transition-colors mt-2"
              >
                Get extension
                <IconArrowRight className="size-4" />
              </a>
            </div>
            <div className="rounded-xl bg-bg-muted pt-12 pr-12">
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <video
                  src="/vid-section01.mp4"
                  autoPlay={!prefersReducedMotion}
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
            <div className="space-y-4 md:order-2">
              <h2 className="text-xl sm:text-2xl font-medium text-fg font-custom">
                Clean links by default
              </h2>
              <p className="text-md font-[470] text-fg-muted leading-relaxed max-w-md">
                Cadie removes tracking and extra parameters when you save a link. You don&apos;t need to do anything.
              </p>
            </div>
            <div className="rounded-xl bg-bg-muted pt-12 px-12 pb-0 overflow-hidden md:order-1">
              <video
                src="/vid-section02.mp4"
                autoPlay={!prefersReducedMotion}
                muted
                loop
                playsInline
                className="w-full aspect-[4/3] object-cover object-center block rounded-t-[6px] border-t border-x border-[color-mix(in_oklab,var(--border)_40%,transparent)]"
              />
            </div>
          </div>

          {/* Feature 3: Keyboard-first - Text Left, Image Right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-medium text-fg font-custom">
                Keyboard-first
              </h2>
              <p className="text-md font-[470] text-fg-muted leading-relaxed max-w-md">
                You can navigate and manage your links using the keyboard instead of the mouse.
              </p>
            </div>
            <div className="rounded-xl bg-bg-muted pt-12 px-12 pb-0 overflow-hidden">
              <KeyboardShortcuts />
            </div>
          </div>

        </div>
      </section>

      {/* What's New Section */}
      {changelogEntries.length > 0 && (
        <section className="pt-16 sm:pt-20 md:pt-24 pb-0 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-4xl font-medium text-fg mb-6 font-custom">
                What&apos;s New
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {changelogEntries.map((entry) => {
                const date = new Date(entry.date);
                const formattedDate = new Intl.DateTimeFormat(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }).format(date);
                
                return (
                  <Link
                    key={entry._id}
                    href={`/changelog#${entry._raw.flattenedPath.replace("changelog/", "")}`}
                    className="group block"
                  >
                    <article className="h-full bg-bg-muted rounded-xl p-6 transition-colors duration-200 hover:bg-bg-hover">
                      <div className="flex flex-col gap-3">
                        {/* Date */}
                        <time className="text-sm font-medium text-fg-subtle">
                          {formattedDate}
                        </time>
                        
                        {/* Title */}
                        <h3 className="text-lg font-[570] text-fg">
                          {entry.title}
                        </h3>
                        
                        {/* Description */}
                        <p className="text-base font-[470] text-fg-muted line-clamp-2">
                          {entry.description}
                        </p>
                        
                        {/* Tags */}
                        {entry.tags && Array.isArray(entry.tags) && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {entry.tags.map((tag) => (
                              <span
                                key={tag}
                                className="h-6 w-fit px-2 text-xs font-medium bg-bg-surface text-fg-muted rounded-full border border-border flex items-center justify-center"
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
                className="inline-flex items-center gap-2 text-sm font-medium text-fg-muted hover:text-fg transition-colors"
              >
                View all updates
                <IconArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-medium text-fg mb-4 font-custom">
              Simple pricing
            </h2>
            <p className="text-base text-fg-muted max-w-md mx-auto">
              Start free, upgrade when you need more.
            </p>
          </div>

          {/* Monthly/Yearly Toggle */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <button
              onClick={() => setPricingInterval("month")}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${pricingInterval === "month" ? "bg-bg-emphasis text-fg-inverse" : "text-fg-muted hover:text-fg"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPricingInterval("year")}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${pricingInterval === "year" ? "bg-bg-emphasis text-fg-inverse" : "text-fg-muted hover:text-fg"}`}
            >
              Yearly
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="rounded-xl border border-border bg-bg-muted p-6 flex flex-col">
              <h3 className="text-lg font-medium text-fg mb-1">Starter</h3>
              <p className="text-sm text-fg-muted mb-4">For getting started</p>
              <div className="mb-6">
                <span className="text-3xl font-semibold text-fg">Free</span>
              </div>
              <Button
                variant="secondary"
                className="w-full mb-6"
                render={<Link href="/auth" />}
              >
                Get Started
              </Button>
              <ul className="space-y-2.5 text-sm text-fg-muted">
                <li className="flex items-start gap-2"><IconCheck className="size-4 mt-0.5 shrink-0 text-fg-subtle" /> 100 saved items</li>
                <li className="flex items-start gap-2"><IconCheck className="size-4 mt-0.5 shrink-0 text-fg-subtle" /> 3 spaces</li>
                <li className="flex items-start gap-2"><IconCheck className="size-4 mt-0.5 shrink-0 text-fg-subtle" /> 25 images, 25 documents</li>
                <li className="flex items-start gap-2"><IconCheck className="size-4 mt-0.5 shrink-0 text-fg-subtle" /> 10 MB file uploads</li>
                <li className="flex items-start gap-2"><IconCheck className="size-4 mt-0.5 shrink-0 text-fg-subtle" /> Chrome extension</li>
              </ul>
            </div>

            {/* Pro */}
            <div className="rounded-xl border-2 border-[var(--brand)] bg-bg-muted p-6 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--brand)] text-white text-xs font-medium px-3 py-1 rounded-full">
                Most popular
              </div>
              <h3 className="text-lg font-medium text-fg mb-1">Pro</h3>
              <p className="text-sm text-fg-muted mb-4">For power users</p>
              <div className="mb-6">
                <span className="text-3xl font-semibold text-fg">
                  {pricingInterval === "month" ? "$6" : "$48"}
                </span>
                <span className="text-sm text-fg-muted">
                  /{pricingInterval === "month" ? "mo" : "yr"}
                </span>
                {pricingInterval === "year" && (
                  <span className="ml-2 text-xs text-success font-medium">Save 33%</span>
                )}
              </div>
              <Button
                className="w-full mb-6"
                render={<Link href="/auth" />}
              >
                Upgrade to Pro
              </Button>
              <ul className="space-y-2.5 text-sm text-fg-muted">
                <li className="flex items-start gap-2"><IconCheck className="size-4 mt-0.5 shrink-0 text-[var(--brand)]" /> Unlimited saved items</li>
                <li className="flex items-start gap-2"><IconCheck className="size-4 mt-0.5 shrink-0 text-[var(--brand)]" /> Unlimited spaces</li>
                <li className="flex items-start gap-2"><IconCheck className="size-4 mt-0.5 shrink-0 text-[var(--brand)]" /> 2,000 images, 2,000 documents</li>
                <li className="flex items-start gap-2"><IconCheck className="size-4 mt-0.5 shrink-0 text-[var(--brand)]" /> 25 MB file uploads</li>
                <li className="flex items-start gap-2"><IconCheck className="size-4 mt-0.5 shrink-0 text-[var(--brand)]" /> Bookmark import</li>
                <li className="flex items-start gap-2 text-fg-subtle"><IconCheck className="size-4 mt-0.5 shrink-0 text-fg-subtle" /> AI search <span className="text-xs">(Coming soon)</span></li>
                <li className="flex items-start gap-2 text-fg-subtle"><IconCheck className="size-4 mt-0.5 shrink-0 text-fg-subtle" /> Sharing &amp; publishing <span className="text-xs">(Coming soon)</span></li>
              </ul>
            </div>

            {/* Believer */}
            <div className="rounded-xl border border-border bg-bg-muted p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-medium text-fg">Believer</h3>
                <IconCrown className="size-4 text-warning" />
              </div>
              <p className="text-sm text-fg-muted mb-4">Support Cadie&apos;s mission</p>
              <div className="mb-6">
                <span className="text-3xl font-semibold text-fg">Pay what you want</span>
                <span className="text-sm text-fg-muted"> /yr</span>
              </div>
              <Button
                variant="secondary"
                className="w-full mb-6"
                render={<Link href="/auth" />}
              >
                Become a Believer
              </Button>
              <ul className="space-y-2.5 text-sm text-fg-muted">
                <li className="flex items-start gap-2"><IconCheck className="size-4 mt-0.5 shrink-0 text-warning" /> Everything in Pro</li>
                <li className="flex items-start gap-2"><IconCheck className="size-4 mt-0.5 shrink-0 text-warning" /> Believer badge</li>
                <li className="flex items-start gap-2"><IconCheck className="size-4 mt-0.5 shrink-0 text-warning" /> Support indie development</li>
                <li className="flex items-start gap-2"><IconCheck className="size-4 mt-0.5 shrink-0 text-warning" /> Early access to new features</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-medium text-fg mb-6 font-custom">
             FAQs
            </h2>
          </div>
          <div className="max-w-[500px] mx-auto flex flex-col gap-1">
            <FaqItem
              question="Is Cadie free to use?"
              isOpen={openFaqId === 'free'}
              onToggle={() => setOpenFaqId(openFaqId === 'free' ? null : 'free')}
            >
              Yes! The Starter plan is free forever with up to 100 saved items and 3 spaces. Upgrade to Pro for unlimited saves, bookmark imports, and more.
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
      <section className="bg-[linear-gradient(to_bottom,var(--bg)_60%,var(--accent-muted)_100%)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="flex flex-col items-center text-center space-y-8">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-medium text-fg tracking-tight leading-[1.1]">
              Save your web, simply.
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <Button
                className="w-full sm:w-auto min-h-12 px-8 text-base rounded-lg"
                render={<Link href="/auth" />}
              >
                Open app
              </Button>
              <Button
                variant="secondary"
                className="w-full sm:w-auto min-h-12 px-8 text-base rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-fg border border-border"
                render={
                  <a
                    href="https://chromewebstore.google.com/detail/cadie/efcdfndkolpokgobbejhcegfgodfepdd"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                Get extension
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-border">
        <Footer />
      </div>
    </div>
  );
}
