import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ToastProvider } from "@/components/ui/toast";
import { PostHogPageView } from "@/features/analytics/components/posthog-pageview";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { Suspense } from "react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
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
        <ToastProvider position="bottom-right">
          <ErrorBoundary>{children}</ErrorBoundary>
        </ToastProvider>
      </body>
    </html>
  );
}
