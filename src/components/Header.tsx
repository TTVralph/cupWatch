import Link from 'next/link';

const navItems = [
  { href: '/', label: 'Today' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/standings', label: 'Standings' },
  { href: '/bracket', label: 'Bracket' },
  { href: '/news', label: 'News' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur supports-[backdrop-filter]:bg-slate-950/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
        <Link href="/" className="flex min-w-0 items-center gap-2 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500 text-lg font-black text-slate-950 shadow-lg shadow-emerald-500/20">CW</span>
          <div className="min-w-0">
            <p className="text-lg font-black tracking-tight text-white">CupWatch</p>
            <p className="truncate text-xs font-medium text-slate-400">World Cup 2026, simplified</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-full px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
