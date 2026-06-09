'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MatchCard as BrandedMatchCard } from '@/components/Brand';
import { matchInvolvesFavoriteTeam } from '@/lib/favorite-teams';
import { PageShell } from '@/components/PageShell';
import { deriveStageLabel, locationText, scoreText, tournamentDateKey } from '@/lib/match-utils';
import { useFavoriteTeams } from '@/hooks/use-favorite-teams';
import type { Match, MatchStatus } from '@/types/match';

type MatchesApiResponse = {
  data: Match[];
  source: 'espn' | 'mock';
  fallback: boolean;
  message?: string;
};

type ScheduleFilter = 'all' | 'favorites' | 'canada' | 'usa' | 'mexico' | 'knockout';

type DateGroup = {
  key: string;
  title: string;
  matches: Match[];
};

const filters: Array<{ id: ScheduleFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'favorites', label: 'Favorites' },
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
  live: 'cw-status-live',
  pre: 'cw-status-pre',
  post: 'cw-status-post',
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

function teamMatches(match: Match, filter: Exclude<ScheduleFilter, 'all' | 'favorites' | 'knockout'>) {
  const aliases: Record<Exclude<ScheduleFilter, 'all' | 'favorites' | 'knockout'>, string[]> = {
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

function filterMatches(matches: Match[], activeFilter: ScheduleFilter, favorites: string[]) {
  if (activeFilter === 'all') return matches;
  if (activeFilter === 'favorites') return matches.filter((match) => matchInvolvesFavoriteTeam(match, favorites));
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
  return <div className="h-40 animate-pulse cw-card" />;
}

function MatchCard({ match, index }: { match: Match; index: number }) {
  const score = scoreText(match);
  const location = locationText(match);

  return (
    <Link href={`/match/${match.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2" aria-label={`View details for ${match.homeTeam.name} vs ${match.awayTeam.name}`}>
      <BrandedMatchCard delay={Math.min(index * 0.02, 0.18)} className="p-3.5 text-slate-100 sm:p-4">
      <div className="mb-3 flex items-start justify-between gap-2 sm:gap-3">
        <div>
          <p className="text-base font-black text-white sm:text-lg">{formatLocalTime(match.date)}</p>
          <p className="text-xs font-black uppercase tracking-wide text-emerald-300">{deriveStageLabel(match)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ring-1 ${statusStyles[match.status]}`}>{statusLabels[match.status]}</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.06] px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">{match.homeTeam.name}</p>
            <p className="text-xs font-bold text-slate-400">{match.homeTeam.abbreviation}</p>
          </div>
          {score ? <span className="text-base font-black text-white">{match.homeTeam.score ?? 0}</span> : null}
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.06] px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">{match.awayTeam.name}</p>
            <p className="text-xs font-bold text-slate-400">{match.awayTeam.abbreviation}</p>
          </div>
          {score ? <span className="text-base font-black text-white">{match.awayTeam.score ?? 0}</span> : null}
        </div>
      </div>

      <div className="mt-3 space-y-1 text-sm font-semibold leading-5 text-slate-200">
        {score ? <p className="font-black text-white">Score: {score}</p> : null}
        <p>Status: {match.statusText}</p>
        {location ? <p>{location}</p> : null}
        {match.broadcasts?.length ? <p>Broadcasts: {match.broadcasts.join(', ')}</p> : null}
      </div>
      </BrandedMatchCard>
    </Link>
  );
}

export default function SchedulePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeFilter, setActiveFilter] = useState<ScheduleFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const { favorites } = useFavoriteTeams();

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
        setFallbackMessage(payload.fallback ? payload.message ?? 'Showing saved fixtures while live match data is unavailable.' : null);
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

  const filteredMatches = useMemo(() => filterMatches(matches, activeFilter, favorites), [matches, activeFilter, favorites]);
  const groupedMatches = useMemo(() => groupMatchesByLocalDate(filteredMatches), [filteredMatches]);

  return (
    <PageShell eyebrow="Schedule" title="Every World Cup match, day by day" description="Browse the full tournament schedule in your local timezone, with quick filters for favorites, hosts, and the knockout rounds.">
      {fallbackMessage ? <div className="mb-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-100">{fallbackMessage}</div> : null}
      {error ? <div className="mb-4 rounded-2xl border border-red-300/30 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-100">{error}</div> : null}

      <div className="-mx-1 mb-5 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2">
          {filters.map((filter) => {
            const active = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`cw-pill px-4 py-2 text-sm ${active ? 'cw-pill-active' : ''}`}
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
              <div className="sticky top-[72px] z-20 mb-3 rounded-2xl border border-white/10 bg-[#030712]/88 px-3 py-2.5 sm:px-4 sm:py-3 shadow-[var(--cw-shadow-soft)] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-black text-white sm:text-xl">{group.title}</h2>
                  <span className="rounded-full bg-[var(--cw-primary)] px-3 py-1 text-xs font-black text-slate-950 shadow-[var(--cw-glow-green)]">{group.matches.length}</span>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.matches.map((match, index) => <MatchCard key={match.id} match={match} index={index} />)}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.06] px-4 py-8 text-center text-sm font-bold text-slate-400">
          {activeFilter === 'favorites' && !favorites.length ? 'Follow teams from the homepage or match pages to use the Favorites filter.' : 'No matches found for this filter.'}
        </div>
      )}
    </PageShell>
  );
}
