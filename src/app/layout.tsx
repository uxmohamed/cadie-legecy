import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/toaster";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${customFont.variable} antialiased`}>
        <Suspense fallback={null}>
          <PostHogPageView />
        </Suspense>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
