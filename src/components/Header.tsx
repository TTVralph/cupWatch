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
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-slate-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-600 text-lg font-black text-white shadow-lg shadow-emerald-600/20">CW</span>
          <div>
            <p className="text-lg font-black tracking-tight text-slate-950">CupWatch</p>
            <p className="text-xs font-medium text-slate-500">World Cup 2026, simplified</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-slate-950 hover:shadow-sm">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
