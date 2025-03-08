import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../lib/theme-context";
import StatusBanner from "@/components/ui/status-banner";
import { ThemeAwareToaster } from "@/components/ui/theme-aware-toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fly.io Machines Dashboard",
  description: "A dashboard for managing Fly.io applications, machines, and volumes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
      >
        <ThemeProvider>
          <StatusBanner />
          {children}
          <ThemeAwareToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
