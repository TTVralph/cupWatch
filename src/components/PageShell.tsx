import type { ReactNode } from 'react';

type PageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function PageShell({ eyebrow, title, description, children }: PageShellProps) {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-28 pt-6 md:px-6 md:pb-12 md:pt-10">
      <section className="mb-6 rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/10 md:p-10">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-emerald-300">{eyebrow}</p>
        <h1 className="max-w-3xl text-3xl font-black tracking-tight md:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">{description}</p>
      </section>
      {children}
    </main>
  );
}
