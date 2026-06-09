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

function CupMark() {
  return (
    <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[rgba(245,197,91,0.35)] bg-[linear-gradient(145deg,#f5c55b,#7b4f12)] text-lg font-black text-[#120d03] shadow-[0_0_26px_rgba(245,197,91,0.18)]" aria-hidden="true">
      <span className="absolute top-2 h-5 w-4 rounded-b-full rounded-t-sm border-2 border-[#120d03]/75" />
      <span className="absolute top-3 left-2 h-3 w-2 rounded-l-full border-2 border-r-0 border-[#120d03]/60" />
      <span className="absolute top-3 right-2 h-3 w-2 rounded-r-full border-2 border-l-0 border-[#120d03]/60" />
      <span className="absolute bottom-2 h-1.5 w-5 rounded-full bg-[#120d03]/70" />
    </span>
  );
}

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(245,197,91,0.12)] bg-[#050505]/86 shadow-[0_18px_60px_rgba(0,0,0,0.42)] backdrop-blur-xl supports-[backdrop-filter]:bg-[#050505]/72">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
        <Link href="/" className="flex min-w-0 items-center gap-3 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cw-primary)]">
          <CupMark />
          <div className="min-w-0">
            <p className="text-2xl font-black tracking-tight text-white">Cup<span className="text-[var(--cw-primary)]">Watch</span></p>
            <p className="hidden truncate text-xs font-bold uppercase tracking-[0.14em] text-[var(--cw-text-dim)] sm:block">Premium match dashboard</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-1 rounded-full border border-[rgba(245,197,91,0.16)] bg-white/[0.045] p-1 md:flex">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={`rounded-full px-4 py-2 text-sm font-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cw-primary)] ${active ? 'bg-[linear-gradient(135deg,var(--cw-primary),var(--cw-amber))] text-[#120d03] shadow-[var(--cw-glow-green)]' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button type="button" aria-label="Search" className="grid size-11 place-items-center rounded-full border border-white/10 bg-white/[0.065] text-xl text-white/90 transition hover:border-[rgba(245,197,91,0.38)] hover:text-[var(--cw-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cw-primary)]">⌕</button>
          <button type="button" aria-label="Notifications" className="grid size-11 place-items-center rounded-full border border-white/10 bg-white/[0.065] text-xl text-white/90 transition hover:border-[rgba(245,197,91,0.38)] hover:text-[var(--cw-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cw-primary)]">♢</button>
        </div>
      </div>
    </header>
  );
}
