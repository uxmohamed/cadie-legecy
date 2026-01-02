import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
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

const customFont = localFont({
  src: [
    {
      path: "./fonts/ce9ace6cc2f44efb-s.p.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/eb239f2fc2466938-s.p.otf",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-custom",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://cadie.app"),
  title: "Cadie",
  description: "Your personal library for the internet",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: "/icon.png",
    shortcut: "/icon.png",
  },
  openGraph: {
    title: "Cadie",
    description: "Your personal library for the internet",
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://cadie.app",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cadie - Your personal library for the internet",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cadie",
    description: "Your personal library for the internet",
    images: ["/og-image.png"],
  },
};

import { ShortcutProvider } from "@/components/shortcut-context";
import { ShortcutsHelpModal } from "@/components/shortcuts-help-modal";
import { SWRCacheProvider } from "@/lib/swr-cache-provider";

// ... imports

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} ${customFont.variable} antialiased`}>
        <ThemeProvider defaultTheme="system">
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          <ErrorBoundary>
            <SWRCacheProvider>
              <ShortcutProvider>
                {children}
                <ShortcutsHelpModal />
              </ShortcutProvider>
            </SWRCacheProvider>
          </ErrorBoundary>
          <ToasterProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
