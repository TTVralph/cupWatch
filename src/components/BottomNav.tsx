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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/90 px-2 py-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center rounded-2xl px-1 py-2 text-[0.68rem] font-semibold transition ${
                active ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="mb-1 text-lg leading-none" aria-hidden="true">{icon}</span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
