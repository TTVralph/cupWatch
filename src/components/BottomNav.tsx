'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Today', icon: '◷' },
  { href: '/schedule', label: 'Schedule', icon: '📅' },
  { href: '/standings', label: 'Standings', icon: '≡' },
  { href: '/bracket', label: 'Bracket', icon: '🏆' },
  { href: '/news', label: 'News', icon: '✦' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-slate-950/92 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_35px_rgba(2,6,23,0.45)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-0 flex-col items-center rounded-2xl px-1 py-2 text-[0.66rem] font-semibold transition ${
                active ? 'bg-emerald-400 text-slate-950' : 'text-slate-400 hover:bg-white/10 hover:text-white'
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
