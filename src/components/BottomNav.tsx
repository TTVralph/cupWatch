'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Today', icon: '⌂' },
  { href: '/schedule', label: 'Schedule', icon: '▦' },
  { href: '/standings', label: 'Standings', icon: '♜' },
  { href: '/bracket', label: 'Bracket', icon: '◇' },
  { href: '/news', label: 'News', icon: '✦' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-1.5 md:hidden" aria-label="Primary">
      <div className="mx-auto grid max-w-[25rem] grid-cols-5 gap-0.5 rounded-[1.35rem] border border-[rgba(245,197,91,0.18)] bg-[#090909]/90 p-1 shadow-[0_-18px_55px_rgba(0,0,0,0.62)] backdrop-blur-xl">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[2.85rem] min-w-0 flex-col items-center justify-center rounded-[1rem] px-1 py-1.5 text-[0.62rem] font-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cw-primary)] ${
                active ? 'bg-[linear-gradient(135deg,var(--cw-primary),var(--cw-amber))] text-[#120d03] shadow-[var(--cw-glow-green)]' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="mb-0.5 text-base leading-none" aria-hidden="true">{icon}</span>
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
