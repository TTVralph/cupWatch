import Link from 'next/link';
import type { ReactNode } from 'react';
import type { HTMLMotionProps } from 'framer-motion';
import { MotionCard } from '@/components/MotionCard';

type CupCardProps = HTMLMotionProps<'article'> & {
  children: ReactNode;
  delay?: number;
  hover?: boolean;
};

export function CupCard({ children, className = '', delay = 0, hover = false, ...props }: CupCardProps) {
  return (
    <MotionCard delay={delay} className={`cw-card ${hover ? 'cw-card-hover' : ''} ${className}`} {...props}>
      {children}
    </MotionCard>
  );
}

export function GlassPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`cw-panel ${className}`}>{children}</div>;
}

export function MatchCard({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return <MotionCard delay={delay} className={`cw-match-card cw-card-hover ${className}`}>{children}</MotionCard>;
}

type PillProps = {
  active?: boolean;
  className?: string;
  children: ReactNode;
};

export function Pill({ active = false, className = '', children }: PillProps) {
  return (
    <span className={`cw-pill ${active ? 'cw-pill-active' : ''} ${className}`}>
      {children}
    </span>
  );
}

export function SectionHeader({ eyebrow, title, href, linkText }: { eyebrow: string; title: string; href?: string; linkText?: string }) {
  return (
    <div className="mb-2.5 flex items-end justify-between gap-3 px-0.5">
      <div>
        <p className="sr-only">{eyebrow}</p>
        <h2 className="cw-title text-xl uppercase md:text-2xl">{title}</h2>
      </div>
      {href && linkText ? (
        <Link href={href} className="shrink-0 rounded-full px-2 py-1 text-sm font-black text-[var(--cw-primary)] transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cw-primary)]">
          {linkText}
        </Link>
      ) : null}
    </div>
  );
}
