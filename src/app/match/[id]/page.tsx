'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { MotionCard } from '@/components/MotionCard';
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
  live: 'border-red-300/40 bg-red-500/15 text-red-100',
  pre: 'border-cyan-300/40 bg-cyan-400/10 text-cyan-100',
  post: 'border-slate-400/40 bg-slate-500/20 text-slate-100',
};

function TeamLogo({ name, logo }: { name: string; logo?: string }) {
  if (logo) {
    return <img src={logo} alt="" className="mx-auto size-16 rounded-full bg-white/90 object-contain p-2 shadow-lg shadow-slate-950/20" loading="lazy" />;
  }

  return <span className="mx-auto grid size-16 place-items-center rounded-full bg-white/10 text-lg font-black text-white ring-1 ring-white/15">{getTeamInitials(name)}</span>;
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <MotionCard className="rounded-[1.5rem] border border-white/10 bg-white/[0.08] p-4 text-white shadow-lg shadow-slate-950/20 backdrop-blur">
      <h2 className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">{title}</h2>
      <div className="mt-4 space-y-3 text-sm font-semibold text-slate-300">{children}</div>
    </MotionCard>
  );
}

function InfoRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-950/40 px-4 py-3">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-right text-sm font-bold text-slate-100">{value || 'TBA'}</span>
    </div>
  );
}

function LoadingState() {
  return (
    <main className="page-container min-h-screen bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.2),transparent_28rem),linear-gradient(180deg,#020617_0%,#0f172a_100%)] px-4 pt-5">
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
    <main className="page-container grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_28rem),linear-gradient(180deg,#020617_0%,#0f172a_100%)] px-4 py-10 text-white">
      <MotionCard className="max-w-md rounded-[2rem] border border-white/10 bg-white/[0.08] p-6 text-center shadow-2xl shadow-slate-950/30 backdrop-blur">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-200">Match not found</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">We could not find that fixture.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">The match may have moved, or the ESPN schedule may have refreshed. Head back to the schedule to pick another match.</p>
        <Link href="/schedule" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-100">
          Back to Schedule
        </Link>
      </MotionCard>
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
      className={`mx-auto inline-flex rounded-full border px-3 py-2 text-xs font-black transition ${following ? 'border-emerald-300 bg-emerald-300 text-slate-950' : 'border-white/10 bg-white/10 text-slate-200 hover:bg-white/15'}`}
    >
      {following ? `Following ${team.name}` : `Follow ${team.name}`}
    </button>
  );
}

function MatchDetail({ match }: { match: Match }) {
  const score = scoreText(match, ' – ');
  const cityCountry = cityCountryText(match);
  const matchHasScore = hasScore(match);

  return (
    <main className="page-container min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_32rem),radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_28rem),linear-gradient(180deg,#020617_0%,#0f172a_100%)] px-4 pt-5 text-white md:px-6 md:pt-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/schedule" className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-slate-100 backdrop-blur transition hover:bg-white/15">
          ← Back
        </Link>

        <MotionCard className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.08] shadow-2xl shadow-slate-950/30 backdrop-blur">
          <div className="border-b border-white/10 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-200">{deriveStageLabel(match)}</p>
                <h1 className="mt-2 text-2xl font-black tracking-tight md:text-4xl">{match.homeTeam.abbreviation} vs {match.awayTeam.abbreviation}</h1>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${statusStyles[match.status]}`}>{statusLabels[match.status]}</span>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-5 text-center">
            <div className="min-w-0 space-y-3">
              <TeamLogo name={match.homeTeam.name} logo={match.homeTeam.logo} />
              <div>
                <p className="break-words text-lg font-black leading-tight">{match.homeTeam.name}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-400">{match.homeTeam.abbreviation}</p>
              </div>
              <FollowTeamButton team={match.homeTeam} />
            </div>

            <div className="rounded-[1.5rem] bg-slate-950/55 px-4 py-3 shadow-inner shadow-slate-950/40">
              {matchHasScore ? <p className="text-3xl font-black tabular-nums">{score}</p> : <p className="text-2xl font-black uppercase tracking-wide">vs</p>}
              <p className="mt-1 text-[0.65rem] font-black uppercase tracking-wide text-slate-500">{match.statusText}</p>
            </div>

            <div className="min-w-0 space-y-3">
              <TeamLogo name={match.awayTeam.name} logo={match.awayTeam.logo} />
              <div>
                <p className="break-words text-lg font-black leading-tight">{match.awayTeam.name}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-400">{match.awayTeam.abbreviation}</p>
              </div>
              <FollowTeamButton team={match.awayTeam} />
            </div>
          </div>
        </MotionCard>

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

          <DetailSection title="Related Links">
            <InfoRow label="Stats" value="Coming soon" />
            <InfoRow label="Lineups" value="Coming soon" />
            <InfoRow label="Timeline" value="Coming soon" />
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
