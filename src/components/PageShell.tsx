import type { ReactNode } from 'react';
import { GlassPanel } from '@/components/Brand';

type PageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function PageShell({ eyebrow, title, description, children }: PageShellProps) {
  return (
    <main className="page-container cw-page text-slate-100">
      <div className="cw-shell">
        <GlassPanel className="mb-5 p-4 sm:p-5 md:mb-6 md:p-8 lg:p-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="cw-kicker">{eyebrow}</p>
              <h1 className="cw-title mt-3 max-w-3xl text-2xl sm:text-3xl md:text-5xl">{title}</h1>
              <p className="cw-muted mt-3 max-w-2xl text-sm leading-6 md:text-base md:leading-7">{description}</p>
            </div>
            <div className="hidden rounded-full border border-[var(--cw-border)] bg-white/[0.06] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--cw-primary)] md:block">
              Command center
            </div>
          </div>
        </GlassPanel>
        {children}
      </div>
    </main>
  );
}
