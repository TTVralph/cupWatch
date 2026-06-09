'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Today', icon: '◷' },
  { href: '/schedule', label: 'Schedule', icon: '▦' },
  { href: '/standings', label: 'Tables', icon: '≡' },
  { href: '/bracket', label: 'Bracket', icon: '◇' },
  { href: '/news', label: 'News', icon: '✦' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#030712]/86 px-2 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-18px_55px_rgba(0,0,0,0.5)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-[26rem] grid-cols-5 gap-1 rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-1">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[3.25rem] min-w-0 flex-col items-center justify-center rounded-[1.15rem] px-1 py-2 text-[0.66rem] sm:text-[0.68rem] font-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cw-primary)] ${
                active ? 'bg-[linear-gradient(135deg,var(--cw-primary),var(--cw-cyan))] text-slate-950 shadow-[var(--cw-glow-green)]' : 'text-slate-300 hover:bg-white/10 hover:text-white'
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
