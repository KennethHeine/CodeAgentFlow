import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeAgentFlow",
  description: "Intent-driven orchestration UI for PR-based coding tasks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div>
              <h1 className="text-lg font-semibold">CodeAgentFlow</h1>
              <p className="text-xs text-slate-500">Intent-driven PR workflow orchestration</p>
            </div>
            <nav className="flex items-center gap-2 text-sm">
              <Link className="rounded-md px-3 py-1.5 hover:bg-slate-100" href="/">
                Dashboard
              </Link>
              <Link className="rounded-md bg-slate-900 px-3 py-1.5 font-medium text-white hover:bg-slate-700" href="/epics/new">
                Create Epic
              </Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
