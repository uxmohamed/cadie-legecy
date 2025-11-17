import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vault - Read it Later",
  description: "Personal read-it-later app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <ErrorBoundary>
          <ToastProvider>
        {children}
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
