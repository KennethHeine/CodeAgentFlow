'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGitHubConfig } from '@/lib/use-store';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard' },
  { href: '/epics', label: 'Epics' },
  { href: '/settings', label: 'Settings' },
];

export function Nav() {
  const pathname = usePathname();
  const [config] = useGitHubConfig();

  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          CodeAgentFlow
        </Link>
        <div className="flex items-center gap-6">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors ${
                pathname === href
                  ? 'text-foreground'
                  : 'text-zinc-500 hover:text-foreground'
              }`}
            >
              {label}
            </Link>
          ))}
          {config && (
            <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-green-500" title="Connected" />
          )}
        </div>
      </div>
    </nav>
  );
}
