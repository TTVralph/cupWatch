'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CupCard } from '@/components/Brand';
import { cityCountryText, deriveStageLabel, formatMatchDate, formatMatchTime, getTeamInitials, hasScore, scoreText } from '@/lib/match-utils';
import { useFavoriteTeams } from '@/hooks/use-favorite-teams';
import type { Match, MatchStatus } from '@/types/match';

type MatchesApiResponse = {
  data: Match[];
  source: 'espn' | 'mock';
  fallback: boolean;
  message?: string;
};

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

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

function TeamLogo({ name, logo }: { name: string; logo?: string }) {
  if (logo) {
    return <img src={logo} alt="" className="mx-auto size-14 rounded-full sm:size-16 bg-white/90 object-contain p-2 shadow-lg shadow-slate-950/20" loading="lazy" />;
  }

  return <span className="mx-auto grid size-14 sm:size-16 place-items-center rounded-full bg-white/10 text-lg font-black text-white ring-1 ring-white/15">{getTeamInitials(name)}</span>;
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <CupCard className="p-4 text-white">
      <h2 className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">{title}</h2>
      <div className="mt-4 space-y-3 text-sm font-semibold text-slate-300">{children}</div>
    </CupCard>
  );
}

function InfoRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-950/40 px-4 py-3">
      <span className="shrink-0 text-xs font-black uppercase tracking-wide text-slate-300">{label}</span>
      <span className="min-w-0 break-words text-right text-sm font-bold text-slate-100">{value || 'TBA'}</span>
    </div>
  );
}

function LoadingState() {
  return (
    <main className="page-container cw-page">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-10 w-32 animate-pulse rounded-full bg-white/10" />
        <div className="h-80 animate-pulse rounded-[2rem] bg-white/10" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-44 animate-pulse rounded-[1.5rem] bg-white/10" />
          <div className="h-44 animate-pulse rounded-[1.5rem] bg-white/10" />
        </div>
      </div>
    </main>
  );
}

function MatchNotFound() {
  return (
    <main className="page-container grid min-h-screen place-items-center px-4 py-10 text-white">
      <CupCard className="max-w-md p-6 text-center">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-200">Match not found</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">We could not find that fixture.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">The match may have moved, or the schedule may have refreshed. Head back to the schedule to pick another fixture.</p>
        <Link href="/schedule" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-100">
          Back to Schedule
        </Link>
      </CupCard>
    </main>
  );
}

function FollowTeamButton({ team }: { team: Match['homeTeam'] }) {
  const { isFavorite, toggleFavorite } = useFavoriteTeams();
  const following = isFavorite(team.abbreviation);

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(team.abbreviation)}
      aria-pressed={following}
      aria-label={following ? `Stop following ${team.name}` : `Follow ${team.name}`}
      title={following ? `Following ${team.name}` : `Follow ${team.name}`}
      className={`mx-auto inline-flex max-w-full rounded-full border px-3 py-2 text-xs font-black transition ${following ? 'border-emerald-300 bg-emerald-300 text-slate-950' : 'border-white/10 bg-white/10 text-slate-200 hover:bg-white/15'}`}
    >
      <span className="truncate">{following ? 'Following' : 'Follow'}</span>
    </button>
  );
}

function MatchDetail({ match }: { match: Match }) {
  const score = scoreText(match, ' – ');
  const cityCountry = cityCountryText(match);
  const matchHasScore = hasScore(match);

  return (
    <main className="page-container cw-page text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/schedule" className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-slate-100 backdrop-blur transition hover:bg-white/15">
          ← Back
        </Link>

        <CupCard className="overflow-hidden">
          <div className="border-b border-white/10 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-200">{deriveStageLabel(match)}</p>
                <h1 className="mt-2 text-xl font-black tracking-tight sm:text-2xl md:text-4xl">{match.homeTeam.abbreviation} vs {match.awayTeam.abbreviation}</h1>
              </div>
              <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${statusStyles[match.status]}`}>{statusLabels[match.status]}</span>
            </div>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 p-4 text-center sm:gap-3 sm:p-5">
            <div className="min-w-0 space-y-3">
              <TeamLogo name={match.homeTeam.name} logo={match.homeTeam.logo} />
              <div>
                <p className="break-words text-base font-black leading-tight sm:text-lg">{match.homeTeam.name}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-300">{match.homeTeam.abbreviation}</p>
              </div>
              <FollowTeamButton team={match.homeTeam} />
            </div>

            <div className="rounded-[1.25rem] bg-slate-950/55 px-3 py-3 shadow-inner shadow-slate-950/40 sm:rounded-[1.5rem] sm:px-4">
              {matchHasScore ? <p className="text-2xl font-black tabular-nums sm:text-3xl">{score}</p> : <p className="text-xl font-black uppercase tracking-wide sm:text-2xl">vs</p>}
              <p className="mt-1 text-[0.65rem] font-black uppercase tracking-wide text-slate-300">{match.statusText}</p>
            </div>

            <div className="min-w-0 space-y-3">
              <TeamLogo name={match.awayTeam.name} logo={match.awayTeam.logo} />
              <div>
                <p className="break-words text-base font-black leading-tight sm:text-lg">{match.awayTeam.name}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-300">{match.awayTeam.abbreviation}</p>
              </div>
              <FollowTeamButton team={match.awayTeam} />
            </div>
          </div>
        </CupCard>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <DetailSection title="Match Info">
            <InfoRow label="Kickoff" value={`${formatMatchDate(match.date)} · ${formatMatchTime(match.date)}`} />
            <InfoRow label="Status" value={match.statusText} />
            <InfoRow label="Stage" value={deriveStageLabel(match)} />
            {matchHasScore ? <InfoRow label="Score" value={score} /> : null}
          </DetailSection>

          <DetailSection title="Venue">
            <InfoRow label="Stadium" value={match.venue} />
            <InfoRow label="City" value={cityCountry} />
          </DetailSection>

          <DetailSection title="Broadcasts">
            {match.broadcasts?.length ? (
              <div className="flex flex-wrap gap-2">
                {match.broadcasts.map((broadcast) => (
                  <span key={broadcast} className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-100">
                    {broadcast}
                  </span>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-slate-950/40 px-4 py-3 text-slate-300">Broadcast information is not available yet.</p>
            )}
          </DetailSection>
        </div>
      </div>
    </main>
  );
}

export default function MatchDetailPage() {
  const params = useParams<{ id: string }>();
  const matchId = params.id;
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  useEffect(() => {
    let isMounted = true;

    async function loadMatch() {
      try {
        setLoadState('loading');
        const response = await fetch('/api/matches');

        if (!response.ok) {
          throw new Error(`Match request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as MatchesApiResponse;
        if (!isMounted) return;

        setMatches(payload.data);
        setLoadState(payload.data.some((match) => match.id === matchId) ? 'ready' : 'not-found');
      } catch (error) {
        console.error('Unable to load match detail:', error);
        if (isMounted) setLoadState('error');
      }
    }

    loadMatch();

    return () => {
      isMounted = false;
    };
  }, [matchId]);

  const match = useMemo(() => matches.find((candidate) => candidate.id === matchId), [matches, matchId]);

  if (loadState === 'loading') return <LoadingState />;
  if (loadState === 'not-found' || !match) return <MatchNotFound />;
  if (loadState === 'error') return <MatchNotFound />;

  return <MatchDetail match={match} />;
}
