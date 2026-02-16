import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeAgentFlow",
  description: "GitHub-native intent-to-PR orchestration UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
