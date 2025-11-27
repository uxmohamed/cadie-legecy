import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { ToasterProvider } from "@/components/toaster-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { PostHogPageView } from "@/components/posthog-pageview";
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
      path: "./fonts/ce9ace6cc2f33efb-s.p.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/eb239f2fc2488938-s.p.otf",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-custom",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Caddy",
  description: "Personal read-it-later app",
  icons: {
    icon: "/icon.png",
  },
};

import { ShortcutProvider } from "@/components/shortcut-context";
import { ShortcutsHelpModal } from "@/components/shortcuts-help-modal";
import { ThemeProvider } from "@/providers/theme-provider";

// ... imports

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${inter.variable} ${customFont.variable} antialiased`}>
        <Suspense fallback={null}>
          <PostHogPageView />
        </Suspense>
        <ThemeProvider>
          <ErrorBoundary>
            <ShortcutProvider>
              {children}
              <ShortcutsHelpModal />
            </ShortcutProvider>
          </ErrorBoundary>
          <ToasterProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
