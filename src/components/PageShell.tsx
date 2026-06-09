import type { ReactNode } from 'react';

type PageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function PageShell({ eyebrow, title, description, children }: PageShellProps) {
  return (
    <main className="page-container mx-auto min-h-screen max-w-6xl overflow-x-hidden px-4 pt-5 text-slate-100 md:px-6 md:pt-8">
      <section className="mb-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-slate-950/30 backdrop-blur md:p-10">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-emerald-300">{eyebrow}</p>
        <h1 className="max-w-3xl text-3xl font-black tracking-tight text-white md:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">{description}</p>
      </section>
      {children}
    </main>
  );
}
