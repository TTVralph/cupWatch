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
    <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(0.55rem+env(safe-area-inset-bottom))] pt-2 md:hidden" aria-label="Primary">
      <div className="mx-auto grid max-w-[26rem] grid-cols-5 gap-1 rounded-[1.55rem] border border-[rgba(245,197,91,0.18)] bg-[#090909]/88 p-1.5 shadow-[0_-18px_55px_rgba(0,0,0,0.62)] backdrop-blur-xl">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[3.35rem] min-w-0 flex-col items-center justify-center rounded-[1.2rem] px-1 py-2 text-[0.65rem] font-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cw-primary)] ${
                active ? 'bg-[linear-gradient(135deg,var(--cw-primary),var(--cw-amber))] text-[#120d03] shadow-[var(--cw-glow-green)]' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="mb-1 text-lg leading-none" aria-hidden="true">{icon}</span>
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
