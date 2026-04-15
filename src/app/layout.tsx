import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NexEra AI Prototypes",
  description:
    "AI-powered 3D learning tools and interactive avatar training systems",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-semibold tracking-tight">
                NexEra
              </span>
            </Link>
            <div className="flex items-center gap-1">
              <Link
                href="/test1"
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-surface-light hover:text-foreground"
              >
                3D Asset Pipeline
              </Link>
              <Link
                href="/test2"
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-surface-light hover:text-foreground"
              >
                Avatar Animation
              </Link>
            </div>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
