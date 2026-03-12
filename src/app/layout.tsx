import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToasterProvider } from "@/components/toaster-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { PostHogPageView } from "@/components/posthog-pageview";
import { ThemeProvider } from "@/components/theme-provider";
import { Suspense } from "react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "arial"],
  preload: true,
  adjustFontFallback: true,
});

const customFont = Inter({
  subsets: ["latin"],
  variable: "--font-custom",
  display: "swap",
  fallback: ["system-ui", "arial"],
  preload: true,
  adjustFontFallback: true,
});

// Force production URL for OG images - never use localhost
const SITE_URL = "https://cadie.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Cadie",
  description: "Your personal library for the internet",
  icons: {
    icon: [
      { url: `${SITE_URL}/icon.svg`, type: "image/svg+xml" },
      { url: `${SITE_URL}/icon.png`, type: "image/png" },
    ],
    apple: `${SITE_URL}/icon.png`,
    shortcut: `${SITE_URL}/icon.png`,
  },
  openGraph: {
    title: "Cadie",
    description: "Your personal library for the internet",
    type: "website",
    url: SITE_URL,
    siteName: "Cadie",
    locale: "en_US",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Cadie - Your personal library for the internet",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cadie",
    description: "Your personal library for the internet",
    site: "@caaboray",
    creator: "@caaboray",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Cadie - Your personal library for the internet",
      },
    ],
  },
};

import { ShortcutProvider } from "@/components/shortcut-context";
import { ShortcutsHelpModal } from "@/components/shortcuts-help-modal";
import { QueryProvider } from "@/lib/query";
import { Agentation } from "agentation";
import { Analytics } from "@vercel/analytics/next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#F6F4EE" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1f1f1f" media="(prefers-color-scheme: dark)" />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>
      </head>
      <body suppressHydrationWarning className={`${inter.variable} ${customFont.variable} antialiased`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-bg focus:text-fg">
          Skip to content
        </a>
        <ThemeProvider defaultTheme="system">
          <QueryProvider>
            <Suspense fallback={null}>
              <PostHogPageView />
            </Suspense>
            <ErrorBoundary>
              <ShortcutProvider>
                <Suspense fallback={null}>
                  <main id="main-content">
                    {children}
                  </main>
                </Suspense>
                <ShortcutsHelpModal />
              </ShortcutProvider>
            </ErrorBoundary>
            <ToasterProvider />
          </QueryProvider>
          {process.env.NODE_ENV === "development" && <Agentation />}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
