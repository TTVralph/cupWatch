'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MotionCard } from '@/components/MotionCard';
import { PageShell } from '@/components/PageShell';
import { isBetween, tournamentDateKey } from '@/lib/match-utils';
import type { Match, MatchStatus } from '@/types/match';

type MatchesApiResponse = {
  data: Match[];
  source: 'espn' | 'mock';
  fallback: boolean;
  message?: string;
};

type BracketStageId = 'round-of-32' | 'round-of-16' | 'quarter-finals' | 'semi-finals' | 'third-place' | 'final';

type BracketStage = {
  id: BracketStageId;
  label: string;
};

const stages: BracketStage[] = [
  { id: 'round-of-32', label: 'Round of 32' },
  { id: 'round-of-16', label: 'Round of 16' },
  { id: 'quarter-finals', label: 'Quarter-finals' },
  { id: 'semi-finals', label: 'Semi-finals' },
  { id: 'third-place', label: 'Third-place' },
  { id: 'final', label: 'Final' },
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

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
});

function getStageId(match: Match): BracketStageId | null {
  const tournamentDate = tournamentDateKey(match.date);

  if (isBetween(tournamentDate, '2026-06-28', '2026-07-03')) return 'round-of-32';
  if (isBetween(tournamentDate, '2026-07-04', '2026-07-07')) return 'round-of-16';
  if (isBetween(tournamentDate, '2026-07-09', '2026-07-12')) return 'quarter-finals';
  if (isBetween(tournamentDate, '2026-07-14', '2026-07-15')) return 'semi-finals';
  if (tournamentDate === '2026-07-18') return 'third-place';
  if (tournamentDate === '2026-07-19') return 'final';

  return null;
}

function getStageLabel(stageId: BracketStageId) {
  return stages.find((stage) => stage.id === stageId)?.label ?? 'Knockout';
}

function isPlaceholderTeamName(value: string) {
  const normalized = value.trim().toLowerCase();

  return (
    normalized.length === 0 ||
    normalized === 'tbd' ||
    normalized === 'to be determined' ||
    normalized.includes('@') ||
    /\brd\d+\b/i.test(normalized) ||
    /\b(winner|loser)\s+of\b/i.test(value)
  );
}

function displayTeamName(match: Match, side: 'home' | 'away') {
  const team = side === 'home' ? match.homeTeam : match.awayTeam;
  if (!isPlaceholderTeamName(team.name)) return team.name;
  if (!isPlaceholderTeamName(team.abbreviation)) return team.abbreviation;

  const stageLabel = getStageId(match) ? getStageLabel(getStageId(match)!) : 'Knockout';
  return `${stageLabel} team TBA`;
}

function displayTeamCode(match: Match, side: 'home' | 'away') {
  const team = side === 'home' ? match.homeTeam : match.awayTeam;
  return isPlaceholderTeamName(team.abbreviation) ? 'TBA' : team.abbreviation;
}

function locationText(match: Match) {
  const cityCountry = [match.city, match.country].filter(Boolean).join(', ');
  return [match.venue, cityCountry].filter(Boolean).join(' · ');
}

function formatDate(date: string) {
  return dateFormatter.format(new Date(date));
}

function formatTime(date: string) {
  return timeFormatter.format(new Date(date));
}

function LoadingCard() {
  return <div className="h-56 animate-pulse rounded-[1.5rem] bg-white/80 shadow-sm shadow-slate-200/80" />;
}

function EmptyStage({ label }: { label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 px-4 py-8 text-center text-sm font-bold text-slate-500">
      {label} matches are not available yet.
    </div>
  );
}

function BracketMatchCard({ match, index }: { match: Match; index: number }) {
  const location = locationText(match);
  const hasScore = match.homeTeam.score !== undefined || match.awayTeam.score !== undefined;

  return (
    <Link href={`/match/${match.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2" aria-label={`View details for ${displayTeamName(match, 'home')} vs ${displayTeamName(match, 'away')}`}>
      <MotionCard delay={index * 0.04} className="rounded-[1.5rem] border border-white/80 bg-white p-4 shadow-sm shadow-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-300/70">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-950">{formatDate(match.date)}</p>
          <p className="text-xs font-bold text-slate-500">{formatTime(match.date)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[0.68rem] font-black uppercase tracking-wide ring-1 ${statusStyles[match.status]}`}>{statusLabels[match.status]}</span>
      </div>

      <div className="space-y-2">
        <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
          <div className="min-w-0">
            <p className="break-words text-sm font-black text-slate-900">{displayTeamName(match, 'home')}</p>
            <p className="text-xs font-bold text-slate-400">{displayTeamCode(match, 'home')}</p>
          </div>
          {hasScore ? <span className="shrink-0 text-lg font-black text-slate-950">{match.homeTeam.score ?? 0}</span> : null}
        </div>
        <div className="px-2 text-xs font-black uppercase tracking-wide text-emerald-600">vs</div>
        <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
          <div className="min-w-0">
            <p className="break-words text-sm font-black text-slate-900">{displayTeamName(match, 'away')}</p>
            <p className="text-xs font-bold text-slate-400">{displayTeamCode(match, 'away')}</p>
          </div>
          {hasScore ? <span className="shrink-0 text-lg font-black text-slate-950">{match.awayTeam.score ?? 0}</span> : null}
        </div>
      </div>

      <div className="mt-4 space-y-1 text-sm font-semibold text-slate-600">
        <p className="font-black text-slate-950">{match.statusText}</p>
        {location ? <p>{location}</p> : null}
      </div>
      </MotionCard>
    </Link>
  );
}

export default function BracketPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedStage, setSelectedStage] = useState<BracketStageId>('round-of-32');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMatches() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/matches');
        if (!response.ok) {
          throw new Error(`Bracket matches request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as MatchesApiResponse;
        if (!isMounted) return;

        setMatches(payload.data);
        setFallbackMessage(payload.fallback ? payload.message ?? 'Showing fallback matches while live data is unavailable.' : null);
      } catch (fetchError) {
        if (!isMounted) return;
        console.error('Unable to load bracket matches:', fetchError);
        setMatches([]);
        setError('Unable to load knockout matches right now. Please refresh in a moment.');
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

  const matchesByStage = useMemo(() => {
    const grouped = new Map<BracketStageId, Match[]>();

    for (const stage of stages) grouped.set(stage.id, []);

    matches
      .filter((match) => getStageId(match) !== null)
      .sort((first, second) => new Date(first.date).getTime() - new Date(second.date).getTime())
      .forEach((match) => {
        const stageId = getStageId(match);
        if (stageId) grouped.get(stageId)?.push(match);
      });

    return grouped;
  }, [matches]);

  const selectedMatches = matchesByStage.get(selectedStage) ?? [];

  return (
    <PageShell eyebrow="Bracket" title="Knockout path, one stage at a time" description="Real ESPN knockout fixtures power each card while clean stage tabs keep the mobile bracket readable.">
      {fallbackMessage ? <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">{fallbackMessage}</div> : null}
      {error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      <div className="mb-5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2">
          {stages.map((stage) => {
            const active = selectedStage === stage.id;
            const count = matchesByStage.get(stage.id)?.length ?? 0;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setSelectedStage(stage.id)}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-white text-slate-600 shadow-sm shadow-slate-200/80 hover:text-slate-950'
                }`}
              >
                {stage.label}
                {count ? <span className="ml-2 opacity-70">{count}</span> : null}
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
      ) : (
        <>
          <section className="md:hidden">
            <h2 className="mb-3 px-1 text-sm font-black uppercase tracking-[0.2em] text-slate-500">{getStageLabel(selectedStage)}</h2>
            <div className="space-y-3">
              {selectedMatches.length ? selectedMatches.map((match, index) => <BracketMatchCard key={match.id} match={match} index={index} />) : <EmptyStage label={getStageLabel(selectedStage)} />}
            </div>
          </section>

          <div className="hidden gap-4 overflow-x-auto pb-3 snap-x md:flex">
            {stages.map((stage, stageIndex) => {
              const stageMatches = matchesByStage.get(stage.id) ?? [];

              return (
                <section key={stage.id} className="min-w-[300px] flex-1 snap-start">
                  <h2 className="mb-3 px-1 text-sm font-black uppercase tracking-[0.2em] text-slate-500">{stage.label}</h2>
                  <div className="space-y-3">
                    {stageMatches.length ? stageMatches.map((match, matchIndex) => <BracketMatchCard key={match.id} match={match} index={stageIndex + matchIndex} />) : <EmptyStage label={stage.label} />}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </PageShell>
  );
}
