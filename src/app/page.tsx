'use client';

import { useEffect, useMemo, useState } from 'react';
import { MotionCard } from '@/components/MotionCard';
import { PageShell } from '@/components/PageShell';
import type { Match, MatchStatus } from '@/types/match';

type MatchesApiResponse = {
  data: Match[];
  source: 'espn' | 'mock';
  fallback: boolean;
  message?: string;
};

type MatchGroup = {
  title: string;
  description: string;
  status: MatchStatus;
  emptyText: string;
};

const matchGroups: MatchGroup[] = [
  { title: 'Live', description: 'Matches happening right now.', status: 'live', emptyText: 'No live matches right now.' },
  { title: 'Upcoming', description: 'Kickoffs still ahead.', status: 'pre', emptyText: 'No upcoming matches listed.' },
  { title: 'Finished', description: 'Final scores from completed matches.', status: 'post', emptyText: 'No finished matches yet.' },
];

const statusLabels: Record<MatchStatus, string> = {
  live: 'Live now',
  pre: 'Upcoming',
  post: 'Finished',
};

const statusStyles: Record<MatchStatus, string> = {
  live: 'bg-red-50 text-red-700 ring-red-100',
  pre: 'bg-blue-50 text-blue-700 ring-blue-100',
  post: 'bg-slate-100 text-slate-700 ring-slate-200',
};

function formatKickoff(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(date));
}

function scoreOrTime(match: Match) {
  if (match.status === 'pre') return formatKickoff(match.date);
  return `${match.homeTeam.score ?? 0} - ${match.awayTeam.score ?? 0}`;
}

function locationText(match: Match) {
  return [match.venue, match.city, match.country].filter(Boolean).join(' · ');
}

function TeamLogo({ logo, name }: { logo?: string; name: string }) {
  if (!logo) {
    return <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500">{name.slice(0, 1)}</div>;
  }

  return <img src={logo} alt={`${name} crest`} className="size-10 rounded-full object-contain" loading="lazy" />;
}

function MatchCard({ match, index }: { match: Match; index: number }) {
  return (
    <MotionCard delay={index * 0.04} className="rounded-[1.5rem] border border-white/80 bg-white p-4 shadow-sm shadow-slate-200/80 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ring-1 ${statusStyles[match.status]}`}>{statusLabels[match.status]}</span>
        <span className="text-right text-xs font-bold text-slate-500">{match.round ?? match.statusText}</span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div>
          <TeamLogo logo={match.homeTeam.logo} name={match.homeTeam.name} />
          <h3 className="mt-2 text-base font-black text-slate-950">{match.homeTeam.name}</h3>
          <p className="text-xs font-bold text-slate-400">{match.homeTeam.abbreviation}</p>
        </div>
        <div className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-lg font-black text-white shadow-lg shadow-slate-950/10">
          {scoreOrTime(match)}
        </div>
        <div className="flex flex-col items-end text-right">
          <TeamLogo logo={match.awayTeam.logo} name={match.awayTeam.name} />
          <h3 className="mt-2 text-base font-black text-slate-950">{match.awayTeam.name}</h3>
          <p className="text-xs font-bold text-slate-400">{match.awayTeam.abbreviation}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
        <p>{match.statusText}</p>
        {locationText(match) ? <p>{locationText(match)}</p> : null}
        {match.broadcasts?.length ? <p>TV: {match.broadcasts.join(', ')}</p> : null}
      </div>
    </MotionCard>
  );
}

function LoadingCard() {
  return <div className="h-48 animate-pulse rounded-[1.5rem] bg-white/80 shadow-sm shadow-slate-200/80" />;
}

export default function TodayPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMatches() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/matches?today=true');
        if (!response.ok) {
          throw new Error(`Matches request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as MatchesApiResponse;
        if (!isMounted) return;

        setMatches(payload.data);
        setFallbackMessage(payload.fallback ? payload.message ?? 'Showing fallback matches while live data is unavailable.' : null);
      } catch (fetchError) {
        if (!isMounted) return;
        console.error('Unable to load matches:', fetchError);
        setMatches([]);
        setError('Unable to load matches right now. Please refresh in a moment.');
        setFallbackMessage(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadMatches();

    return () => {
      isMounted = false;
    };
  }, []);

  const groupedMatches = useMemo(() => {
    return matchGroups.map((group) => ({
      ...group,
      matches: matches.filter((match) => match.status === group.status),
    }));
  }, [matches]);

  return (
    <PageShell eyebrow="Today" title="What games are on today?" description="Live, upcoming, and finished matches in one calm view — no login and no cluttered feeds.">
      {fallbackMessage ? <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">{fallbackMessage}</div> : null}
      {error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <LoadingCard />
          <LoadingCard />
        </div>
      ) : (
        <div className="space-y-6">
          {groupedMatches.map((group) => (
            <section key={group.status}>
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-950">{group.title}</h2>
                  <p className="text-sm font-semibold text-slate-500">{group.description}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 shadow-sm shadow-slate-200/80">{group.matches.length}</span>
              </div>

              {group.matches.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {group.matches.map((match, index) => <MatchCard key={match.id} match={match} index={index} />)}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-sm font-bold text-slate-500">{group.emptyText}</div>
              )}
            </section>
          ))}
        </div>
      )}
    </PageShell>
  );
}
