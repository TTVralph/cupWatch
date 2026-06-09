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

type ScheduleFilter = 'all' | 'canada' | 'usa' | 'mexico' | 'knockout';

type DateGroup = {
  key: string;
  title: string;
  matches: Match[];
};

const filters: Array<{ id: ScheduleFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'canada', label: 'Canada' },
  { id: 'usa', label: 'USA' },
  { id: 'mexico', label: 'Mexico' },
  { id: 'knockout', label: 'Knockout' },
];

const statusLabels: Record<MatchStatus, string> = {
  live: 'Live',
  pre: 'Upcoming',
  post: 'Final',
};

const statusStyles: Record<MatchStatus, string> = {
  live: 'bg-red-50 text-red-700 ring-red-100',
  pre: 'bg-blue-50 text-blue-700 ring-blue-100',
  post: 'bg-slate-100 text-slate-700 ring-slate-200',
};

const localDateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

const localTimeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
});

const localDateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function formatLocalDate(date: string) {
  return localDateFormatter.format(new Date(date));
}

function formatLocalTime(date: string) {
  return localTimeFormatter.format(new Date(date));
}

function localDateKey(date: string) {
  const parts = localDateKeyFormatter.formatToParts(new Date(date));
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

function tournamentDateKey(date: string) {
  return date.slice(0, 10);
}

function isBetween(value: string, start: string, end: string) {
  return value >= start && value <= end;
}

function deriveStageLabel(match: Match) {
  const tournamentDate = tournamentDateKey(match.date);

  if (tournamentDate < '2026-06-28') return 'Group Stage';
  if (isBetween(tournamentDate, '2026-06-28', '2026-07-03')) return 'Round of 32';
  if (isBetween(tournamentDate, '2026-07-04', '2026-07-07')) return 'Round of 16';
  if (isBetween(tournamentDate, '2026-07-09', '2026-07-12')) return 'Quarter-finals';
  if (isBetween(tournamentDate, '2026-07-14', '2026-07-15')) return 'Semi-finals';
  if (tournamentDate === '2026-07-18') return 'Third-place match';
  if (tournamentDate === '2026-07-19') return 'Final';

  return cleanRoundLabel(match.round) ?? 'World Cup';
}

function cleanRoundLabel(round?: string) {
  if (!round) return null;
  if (round.includes('@')) return null;
  if (/\bRD\d+\b/i.test(round)) return null;
  return round;
}

function hasScore(match: Match) {
  return match.homeTeam.score !== undefined || match.awayTeam.score !== undefined;
}

function scoreText(match: Match) {
  if (!hasScore(match)) return null;
  return `${match.homeTeam.score ?? 0} - ${match.awayTeam.score ?? 0}`;
}

function locationText(match: Match) {
  return [match.venue, [match.city, match.country].filter(Boolean).join(', ')].filter(Boolean).join(' · ');
}

function teamMatches(match: Match, filter: Exclude<ScheduleFilter, 'all' | 'knockout'>) {
  const aliases: Record<Exclude<ScheduleFilter, 'all' | 'knockout'>, string[]> = {
    canada: ['canada', 'can'],
    usa: ['usa', 'united states', 'united states of america'],
    mexico: ['mexico', 'mex'],
  };
  const teamText = [match.homeTeam.name, match.homeTeam.abbreviation, match.awayTeam.name, match.awayTeam.abbreviation]
    .join(' ')
    .toLowerCase();
  const teamTokens = teamText.split(/[^a-z0-9]+/).filter(Boolean);

  return aliases[filter].some((alias) => (alias.includes(' ') ? teamText.includes(alias) : teamTokens.includes(alias)));
}

function isKnockout(match: Match) {
  return tournamentDateKey(match.date) >= '2026-06-28';
}

function filterMatches(matches: Match[], activeFilter: ScheduleFilter) {
  if (activeFilter === 'all') return matches;
  if (activeFilter === 'knockout') return matches.filter(isKnockout);
  return matches.filter((match) => teamMatches(match, activeFilter));
}

function groupMatchesByLocalDate(matches: Match[]): DateGroup[] {
  const groups = new Map<string, DateGroup>();

  [...matches]
    .sort((first, second) => new Date(first.date).getTime() - new Date(second.date).getTime())
    .forEach((match) => {
      const key = localDateKey(match.date);
      const existingGroup = groups.get(key);

      if (existingGroup) {
        existingGroup.matches.push(match);
        return;
      }

      groups.set(key, {
        key,
        title: formatLocalDate(match.date),
        matches: [match],
      });
    });

  return Array.from(groups.values());
}

function LoadingCard() {
  return <div className="h-40 animate-pulse rounded-[1.5rem] bg-white/80 shadow-sm shadow-slate-200/80" />;
}

function MatchCard({ match, index }: { match: Match; index: number }) {
  const score = scoreText(match);
  const location = locationText(match);

  return (
    <MotionCard delay={Math.min(index * 0.02, 0.18)} className="rounded-[1.5rem] border border-white/80 bg-white p-4 shadow-sm shadow-slate-200/80">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-black text-slate-950">{formatLocalTime(match.date)}</p>
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{deriveStageLabel(match)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ring-1 ${statusStyles[match.status]}`}>{statusLabels[match.status]}</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-950">{match.homeTeam.name}</p>
            <p className="text-xs font-bold text-slate-400">{match.homeTeam.abbreviation}</p>
          </div>
          {score ? <span className="text-base font-black text-slate-950">{match.homeTeam.score ?? 0}</span> : null}
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-950">{match.awayTeam.name}</p>
            <p className="text-xs font-bold text-slate-400">{match.awayTeam.abbreviation}</p>
          </div>
          {score ? <span className="text-base font-black text-slate-950">{match.awayTeam.score ?? 0}</span> : null}
        </div>
      </div>

      <div className="mt-3 space-y-1 text-sm font-semibold text-slate-600">
        {score ? <p className="font-black text-slate-950">Score: {score}</p> : null}
        <p>Status: {match.statusText}</p>
        {location ? <p>{location}</p> : null}
        {match.broadcasts?.length ? <p>Broadcasts: {match.broadcasts.join(', ')}</p> : null}
      </div>
    </MotionCard>
  );
}

export default function SchedulePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeFilter, setActiveFilter] = useState<ScheduleFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSchedule() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/matches');
        if (!response.ok) {
          throw new Error(`Schedule request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as MatchesApiResponse;
        if (!isMounted) return;

        setMatches(payload.data);
        setFallbackMessage(payload.fallback ? payload.message ?? 'Showing fallback matches while live data is unavailable.' : null);
      } catch (fetchError) {
        if (!isMounted) return;
        console.error('Unable to load schedule:', fetchError);
        setMatches([]);
        setError('Unable to load the schedule right now. Please refresh in a moment.');
        setFallbackMessage(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSchedule();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredMatches = useMemo(() => filterMatches(matches, activeFilter), [matches, activeFilter]);
  const groupedMatches = useMemo(() => groupMatchesByLocalDate(filteredMatches), [filteredMatches]);

  return (
    <PageShell eyebrow="Schedule" title="Every World Cup match, day by day" description="Browse the full tournament schedule in your local timezone, with quick filters for hosts and the knockout rounds.">
      {fallbackMessage ? <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">{fallbackMessage}</div> : null}
      {error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      <div className="mb-5 overflow-x-auto pb-1">
        <div className="flex min-w-max gap-2">
          {filters.map((filter) => {
            const active = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-white text-slate-600 shadow-sm shadow-slate-200/80 hover:text-slate-950'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
      ) : groupedMatches.length ? (
        <div className="space-y-7">
          {groupedMatches.map((group) => (
            <section key={group.key}>
              <div className="sticky top-[73px] z-20 mb-3 rounded-2xl border border-slate-200/80 bg-slate-50/95 px-4 py-3 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black text-slate-950">{group.title}</h2>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 shadow-sm shadow-slate-200/80">{group.matches.length}</span>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.matches.map((match, index) => <MatchCard key={match.id} match={match} index={index} />)}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 px-4 py-8 text-center text-sm font-bold text-slate-500">No matches found for this filter.</div>
      )}
    </PageShell>
  );
}
