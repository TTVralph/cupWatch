'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Today' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/standings', label: 'Standings' },
  { href: '/bracket', label: 'Bracket' },
  { href: '/news', label: 'News' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#030712]/80 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl supports-[backdrop-filter]:bg-[#030712]/65">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
        <Link href="/" className="flex min-w-0 items-center gap-3 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cw-primary)]">
          <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(135deg,var(--cw-primary),var(--cw-cyan))] text-sm font-black text-slate-950 shadow-[var(--cw-glow-green)]">
            CW
            <span className="absolute inset-x-2 top-1/2 h-px bg-slate-950/25" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-lg font-black tracking-tight text-white">CupWatch</p>
            <p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-slate-300">Midnight match control</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.055] p-1 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`rounded-full px-4 py-2 text-sm font-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cw-primary)] ${active ? 'bg-white text-slate-950 shadow-[var(--cw-glow-cyan)]' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
