import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeAgentFlow",
  description: "Intent-driven orchestration UI for PR-based coding agent workflow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 min-h-screen font-sans">
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-14 items-center">
              <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-gray-900">
                <span className="text-blue-600">⚡</span> CodeAgentFlow
              </Link>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <Link href="/" className="hover:text-gray-900 transition">Dashboard</Link>
                <Link href="/epics/new" className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition text-sm font-medium">
                  + New Epic
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
