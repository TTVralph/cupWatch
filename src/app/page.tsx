'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CupCard, MatchCard as BrandedMatchCard, SectionHeader } from '@/components/Brand';
import { MotionCard } from '@/components/MotionCard';
import { TeamPicker } from '@/components/TeamPicker';
import { getTeamsFromMatches } from '@/lib/favorite-teams';
import { deriveStageLabel } from '@/lib/match-utils';
import { useFavoriteTeams } from '@/hooks/use-favorite-teams';
import type { GroupStanding, NewsArticle } from '@/types/cupwatch';
import type { Match, MatchStatus } from '@/types/match';

type MatchesApiResponse = {
  data: Match[];
  source: 'espn' | 'mock';
  fallback: boolean;
  message?: string;
};

type StandingsApiResponse = {
  data: GroupStanding[];
  source: 'espn' | 'mock';
  fallback: boolean;
  message?: string;
};

type NewsApiResponse = {
  data: NewsArticle[];
};

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const INSTALL_PROMPT_DISMISSED_KEY = 'cupwatch-install-prompt-dismissed';
const TOURNAMENT_START = new Date('2026-06-11T00:00:00Z');
const TOURNAMENT_END = new Date('2026-07-20T00:00:00Z');
const OPENING_MATCH_HINT = 'Mexico vs South Africa';

const statusLabels: Record<MatchStatus, string> = {
  live: 'Live',
  pre: 'Upcoming',
  post: 'Final',
};

const statusStyles: Record<MatchStatus, string> = {
  live: 'border-red-300/50 bg-red-500/15 text-red-100',
  pre: 'border-[rgba(245,197,91,0.42)] bg-[rgba(245,197,91,0.12)] text-[var(--cw-primary)]',
  post: 'border-slate-500/50 bg-slate-500/20 text-slate-200',
};

function formatDateRange() {
  return 'Jun 11 – Jul 19';
}

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toMatchdayKey(match: Match) {
  return toLocalDateKey(new Date(match.date));
}

function formatMatchday(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(localDate);
}

function formatKickoff(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(date));
}

function countdownParts(now: Date) {
  const diff = Math.max(0, TOURNAMENT_START.getTime() - now.getTime());
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);

  return { days, hours, minutes };
}

function getScore(match: Match) {
  return `${match.homeTeam.score ?? 0}–${match.awayTeam.score ?? 0}`;
}

function getVenueCity(match: Match) {
  return match.city ?? match.venue ?? 'Venue TBA';
}

function getTeamInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function sortMatches(matches: Match[]) {
  return [...matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function isTournamentStarted(now: Date) {
  return now >= TOURNAMENT_START;
}

function isTournamentActive(now: Date) {
  return now >= TOURNAMENT_START && now < TOURNAMENT_END;
}

function getOpeningMatch(matches: Match[]) {
  return matches.find((match) => {
    const teams = `${match.homeTeam.name} ${match.awayTeam.name}`.toLowerCase();
    return teams.includes('mexico') && teams.includes('south africa');
  });
}

function getTodayMatches(matches: Match[], now: Date) {
  const today = toLocalDateKey(now);
  return sortMatches(matches).filter((match) => toMatchdayKey(match) === today);
}

function getNextUpcomingMatchday(matches: Match[], now: Date) {
  const upcoming = sortMatches(matches).filter((match) => match.status !== 'post' && new Date(match.date) >= now);
  const firstUpcoming = upcoming[0];

  if (!firstUpcoming) return [];

  const matchday = toMatchdayKey(firstUpcoming);
  return upcoming.filter((match) => toMatchdayKey(match) === matchday);
}

function getFeaturedMatches(matches: Match[], now: Date) {
  const todayMatches = getTodayMatches(matches, now);

  if (isTournamentActive(now)) return todayMatches;

  return getNextUpcomingMatchday(matches, now);
}

function getHeroSummary(matches: Match[], now: Date) {
  if (!isTournamentStarted(now)) {
    const openingMatch = getOpeningMatch(matches);
    return {
      eyebrow: 'Opening match',
      title: OPENING_MATCH_HINT,
      detail: openingMatch ? `${formatKickoff(openingMatch.date)} · ${getVenueCity(openingMatch)}` : 'June 11, 2026',
    };
  }

  const todayMatches = getTodayMatches(matches, now);
  const liveMatches = todayMatches.filter((match) => match.status === 'live');
  const upcomingMatches = todayMatches.filter((match) => match.status === 'pre');
  const completedMatches = todayMatches.filter((match) => match.status === 'post');

  if (liveMatches.length) {
    return {
      eyebrow: 'Live now',
      title: `${liveMatches.length} match${liveMatches.length === 1 ? '' : 'es'} in progress`,
      detail: liveMatches.slice(0, 2).map((match) => `${match.homeTeam.abbreviation} ${getScore(match)} ${match.awayTeam.abbreviation}`).join(' · '),
    };
  }

  if (upcomingMatches.length) {
    return {
      eyebrow: 'Today',
      title: `${upcomingMatches.length} kickoff${upcomingMatches.length === 1 ? '' : 's'} ahead`,
      detail: upcomingMatches.slice(0, 2).map((match) => `${match.homeTeam.abbreviation} vs ${match.awayTeam.abbreviation} · ${formatKickoff(match.date)}`).join(' · '),
    };
  }

  if (completedMatches.length) {
    return {
      eyebrow: 'Today',
      title: `${completedMatches.length} result${completedMatches.length === 1 ? '' : 's'} posted`,
      detail: completedMatches.slice(0, 2).map((match) => `${match.homeTeam.abbreviation} ${getScore(match)} ${match.awayTeam.abbreviation}`).join(' · '),
    };
  }

  return {
    eyebrow: 'Today',
    title: 'No matches today',
    detail: 'Check the next matchday below.',
  };
}

function formatGoalDifference(goalDifference: number) {
  return goalDifference > 0 ? `+${goalDifference}` : goalDifference;
}

function LoadingPanel({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse cw-card ${className}`} />;
}


function isStandaloneDisplayMode() {
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };

  return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true;
}

function InstallPromptCard() {
  const [isVisible, setIsVisible] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandaloneDisplayMode()) return;
    if (window.localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY) === 'true') return;

    const showTimer = window.setTimeout(() => setIsVisible(true), 1_800);
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.clearTimeout(showTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, 'true');
    setIsVisible(false);
  };

  const handleInstall = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);

    if (choice.outcome === 'accepted') {
      dismiss();
    }
  };

  if (!isVisible) return null;

  return (
    <CupCard className="border-[rgba(245,197,91,0.28)] p-4 text-white">
      <div className="flex gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--cw-primary),var(--cw-amber))] text-sm font-black text-[#120d03] shadow-lg shadow-[rgba(245,197,91,0.18)]">CW</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">Add CupWatch to your home screen</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">Install the dark, mobile-first CupWatch app for quick access during World Cup 2026.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {installPrompt ? (
              <button type="button" onClick={handleInstall} className="rounded-full bg-[var(--cw-primary)] px-4 py-2 text-xs font-black text-[#120d03] transition hover:bg-amber-200">
                Add app
              </button>
            ) : (
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-slate-200">Use your browser’s share/menu button to add it.</span>
            )}
            <button type="button" onClick={dismiss} className="rounded-full border border-white/10 px-4 py-2 text-xs font-black text-slate-300 transition hover:bg-white/10 hover:text-white">
              Not now
            </button>
          </div>
        </div>
      </div>
    </CupCard>
  );
}

function TeamBadge({ name, logo }: { name: string; logo?: string }) {
  if (logo) {
    return <img src={logo} alt="" className="size-9 rounded-full bg-white/10 object-contain p-1" loading="lazy" />;
  }

  return <span className="grid size-9 place-items-center rounded-full bg-white/10 text-xs font-black text-white ring-1 ring-white/10">{getTeamInitials(name)}</span>;
}

function HeroCard({ matches, isLoading }: { matches: Match[]; now: Date; isLoading: boolean }) {
  return (
    <MotionCard className="cw-hero min-h-[18.75rem] overflow-hidden p-4 text-white sm:min-h-[20rem] sm:p-5 md:min-h-[22rem] md:p-8">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-y-0 right-0 w-[52%] bg-[radial-gradient(circle_at_70%_30%,rgba(245,197,91,0.34),transparent_26%),linear-gradient(90deg,transparent,rgba(0,0,0,0.18)_24%,rgba(217,149,47,0.22))]" />
        <div className="absolute right-3 top-5 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(245,197,91,0.26),transparent_58%)] blur-sm sm:right-10 sm:h-56 sm:w-56" />
        <div className="absolute right-[-1.5rem] top-4 h-44 w-36 opacity-25 sm:right-10 sm:top-7 sm:h-56 sm:w-44 md:opacity-35">
          <div className="mx-auto h-24 w-16 rounded-b-[2rem] rounded-t-lg border-[9px] border-[var(--cw-primary)] sm:h-32 sm:w-[5.5rem]" />
          <div className="mx-auto h-14 w-5 bg-[var(--cw-primary)] sm:h-[4.5rem]" />
          <div className="mx-auto h-3.5 w-24 rounded-full bg-[var(--cw-primary)] sm:w-32" />
        </div>
        <div className="absolute right-6 top-11 h-px w-44 rotate-[-22deg] bg-[linear-gradient(90deg,transparent,rgba(255,236,182,0.9),transparent)] shadow-[0_0_18px_rgba(245,197,91,0.55)] sm:w-72" />
        <div className="absolute right-0 top-24 h-px w-56 rotate-[-12deg] bg-[linear-gradient(90deg,transparent,rgba(245,197,91,0.5),transparent)] sm:w-80" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.72))]" />
      </div>

      <div className="relative max-w-[24rem] sm:max-w-[32rem] md:max-w-[42rem]">
        <p className="inline-flex rounded-full border border-[rgba(245,197,91,0.32)] bg-[rgba(245,197,91,0.13)] px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.18em] text-[var(--cw-primary)]">CupWatch 2026</p>
        <h1 className="mt-3 max-w-[21rem] text-[2.45rem] font-black uppercase leading-[0.88] tracking-[-0.065em] sm:max-w-[28rem] sm:text-5xl md:max-w-[38rem] md:text-7xl">
          Mexico <span className="text-[var(--cw-primary)]">vs</span> South Africa
        </h1>
        <p className="mt-3 text-sm font-black text-slate-100 sm:text-base">Jun 11 · 1:00 PM MDT · Mexico City</p>
        <p className="mt-1.5 text-sm font-bold text-[var(--cw-primary)] sm:text-base">Group A · Opening Match</p>
        <Link href="/match/760415" className="mt-4 inline-flex min-h-10 items-center rounded-[1rem] bg-[linear-gradient(135deg,var(--cw-primary),var(--cw-amber))] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#120d03] shadow-[var(--cw-glow-green)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cw-primary)] sm:min-h-11 sm:px-5 sm:text-sm">
          {isLoading ? 'Loading Match' : 'View Match'}
          <span className="ml-2 grid size-5 place-items-center rounded-full border border-[#120d03]/35">›</span>
        </Link>
      </div>
    </MotionCard>
  );
}

function MatchMiniCard({ match, index }: { match: Match; index: number }) {
  return (
    <Link href={`/match/${match.id}`} className="block min-w-[12.5rem] sm:min-w-[13.75rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cw-primary)]" aria-label={`View details for ${match.homeTeam.name} vs ${match.awayTeam.name}`}>
      <BrandedMatchCard delay={index * 0.04} className="p-2.5 text-center text-white sm:p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="truncate text-[0.65rem] font-black uppercase tracking-wide text-slate-400">{deriveStageLabel(match)}</span>
          <span className="text-[var(--cw-primary)]" aria-hidden="true">★</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="min-w-0">
            <TeamBadge name={match.homeTeam.name} logo={match.homeTeam.logo} />
            <p className="mt-1 truncate text-base font-black">{match.homeTeam.abbreviation}</p>
          </div>
          <span className="text-xs font-black uppercase text-slate-500">vs</span>
          <div className="min-w-0">
            <TeamBadge name={match.awayTeam.name} logo={match.awayTeam.logo} />
            <p className="mt-1 truncate text-base font-black">{match.awayTeam.abbreviation}</p>
          </div>
        </div>
        <div className="mt-2 rounded-xl bg-black/35 px-2.5 py-1.5 text-xs font-bold leading-5 text-slate-300">
          <p className="text-sm font-black text-white">{match.status === 'pre' ? formatKickoff(match.date) : getScore(match)}</p>
          <p className="truncate">{getVenueCity(match)}</p>
        </div>
      </BrandedMatchCard>
    </Link>
  );
}

function NextMatchesSection({ matches, now, isLoading }: { matches: Match[]; now: Date; isLoading: boolean }) {
  const featuredMatches = getFeaturedMatches(matches, now);
  const label = featuredMatches[0]
    ? isTournamentActive(now)
      ? 'Today’s matches'
      : `${formatMatchday(toMatchdayKey(featuredMatches[0]))} matchday`
    : 'Matchday';

  return (
    <section>
      <SectionHeader eyebrow={label} title="Next Matches" href="/schedule" linkText="Full schedule →" />
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          <LoadingPanel className="h-36 min-w-[13rem]" />
          <LoadingPanel className="h-36 min-w-[13rem]" />
        </div>
      ) : featuredMatches.length ? (
        <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-1">
          {featuredMatches.map((match, index) => (
            <div key={match.id} className="snap-start">
              <MatchMiniCard match={match} index={index} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.06] px-4 py-6 text-sm font-bold text-slate-300">No upcoming matches are available right now.</div>
      )}
    </section>
  );
}

function StandingsPreview({ groups, isLoading }: { groups: GroupStanding[]; isLoading: boolean }) {
  const activeGroup = groups.find((group) => group.group.toLowerCase() === 'group a') ?? groups[0];

  return (
    <section>
      <SectionHeader eyebrow="Tables" title="Standings Preview" href="/standings" linkText="View All Groups →" />
      <CupCard className="overflow-hidden p-3 text-white sm:p-4">
        {isLoading ? (
          <LoadingPanel className="h-48" />
        ) : groups.length && activeGroup ? (
          <div className="overflow-x-auto">
            <div className="mb-1 px-1 text-base font-black uppercase tracking-wide text-[var(--cw-primary)]">{activeGroup.group}</div>
            <table className="w-full min-w-[350px] text-left text-sm">
              <thead className="text-[0.68rem] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-1 py-1.5">Team</th>
                  <th className="px-1 py-1.5 text-center">P</th>
                  <th className="px-1 py-1.5 text-center">W</th>
                  <th className="px-1 py-1.5 text-center">D</th>
                  <th className="px-1 py-1.5 text-center">L</th>
                  <th className="px-1 py-1.5 text-center">GD</th>
                  <th className="px-1 py-1.5 text-center text-[var(--cw-primary)]">PTS</th>
                </tr>
              </thead>
              <tbody>
                {activeGroup.rows.slice(0, 4).map((row, index) => (
                  <tr key={row.code} className="border-t border-white/8">
                    <td className="px-1 py-1.5 font-bold">
                      <span className="mr-2 text-xs text-slate-300">{index + 1}</span>
                      <span className="mr-2">{row.flag}</span>
                      <span>{row.team}</span>
                    </td>
                    <td className="px-1 py-1.5 text-center text-slate-200">{row.played}</td>
                    <td className="px-1 py-1.5 text-center text-slate-200">{row.wins}</td>
                    <td className="px-1 py-1.5 text-center text-slate-200">{row.draws}</td>
                    <td className="px-1 py-1.5 text-center text-slate-200">{row.losses}</td>
                    <td className="px-1 py-1.5 text-center text-slate-200">{formatGoalDifference(row.goalDifference)}</td>
                    <td className="px-1 py-1.5 text-center font-black text-[var(--cw-primary)]">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-2 py-4 text-sm font-bold text-slate-300">No standings are available right now.</div>
        )}
      </CupCard>
    </section>
  );
}

function FavoritesCountdownRow({ matches, favorites, onToggleFavorite, isLoading, now }: { matches: Match[]; favorites: string[]; onToggleFavorite: (teamCode: string) => void; isLoading: boolean; now: Date }) {
  const teamOptions = useMemo(() => getTeamsFromMatches(matches), [matches]);
  const favoriteTeams = teamOptions.filter((team) => favorites.includes(team.abbreviation));
  const displayTeams = favoriteTeams.length ? favoriteTeams : teamOptions.slice(0, 3);
  const countdown = countdownParts(now);

  return (
    <section className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 lg:gap-4">
      <CupCard className="p-3 text-white sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-black uppercase tracking-tight">My Favorites</h2>
          <a href="#team-picker" className="rounded-full px-2 py-1 text-sm font-black text-[var(--cw-primary)] hover:text-white">Manage</a>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {displayTeams.map((team) => (
            <div key={team.abbreviation} className="relative text-center">
              <TeamBadge name={team.name} logo={team.logo} />
              {favorites.includes(team.abbreviation) ? <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[var(--cw-primary)] text-[0.55rem] text-[#120d03]">★</span> : null}
              <p className="mt-1 text-xs font-black text-slate-200">{team.abbreviation}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{favoriteTeams.length ? 'Personalized teams stay pinned across CupWatch.' : 'Add more teams to personalize your experience.'}</p>
        <details id="team-picker" className="mt-2">
          <summary className="cursor-pointer text-xs font-black uppercase tracking-wide text-[var(--cw-primary)]">Edit teams</summary>
          <TeamPicker teams={teamOptions} favorites={favorites} onToggle={onToggleFavorite} isLoading={isLoading} />
        </details>
      </CupCard>

      <CupCard className="overflow-hidden p-3 text-white sm:p-4">
        <div className="absolute right-1 top-5 h-24 w-20 opacity-10" aria-hidden="true">
          <div className="mx-auto h-14 w-10 rounded-b-[1.5rem] rounded-t-lg border-[6px] border-[var(--cw-primary)]" />
          <div className="mx-auto h-8 w-3 bg-[var(--cw-primary)]" />
          <div className="mx-auto h-2.5 w-16 rounded-full bg-[var(--cw-primary)]" />
        </div>
        <h2 className="text-sm font-black uppercase tracking-wide text-[var(--cw-primary)]">World Cup Countdown</h2>
        <div className="mt-4 grid grid-cols-3 gap-1.5">
          {[
            ['Days', countdown.days],
            ['Hrs', countdown.hours],
            ['Mins', countdown.minutes],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-black/35 px-1 py-2 text-center ring-1 ring-white/10">
              <p className="text-2xl font-black tabular-nums sm:text-3xl">{String(value).padStart(2, '0')}</p>
              <p className="text-[0.6rem] font-black uppercase tracking-wide text-slate-400">{label}</p>
            </div>
          ))}
        </div>
        <Link href="/schedule" className="mt-3 inline-flex min-h-9 items-center rounded-xl bg-white/[0.08] px-3 py-2 text-xs font-black uppercase text-white ring-1 ring-white/10 transition hover:bg-[var(--cw-primary)] hover:text-[#120d03] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cw-primary)]">
          ▦ <span className="ml-2">View Fixtures</span>
        </Link>
      </CupCard>
    </section>
  );
}

function NewsPreview({ news, isLoading }: { news: NewsArticle[]; isLoading: boolean }) {
  return (
    <section>
      <SectionHeader eyebrow="Briefing" title="Latest News" href="/news" linkText="See All →" />
      {isLoading ? (
        <div className="grid gap-3 lg:grid-cols-3">
          <LoadingPanel className="h-28" />
          <LoadingPanel className="h-28" />
          <LoadingPanel className="h-28" />
        </div>
      ) : news.length ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {news.slice(0, 3).map((item, index) => (
            <NewsPreviewCard key={item.id} article={item} delay={index * 0.04} />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.06] px-4 py-6 text-sm font-bold text-slate-300">No news cards are available right now.</div>
      )}
    </section>
  );
}


function NewsPreviewCard({ article, delay }: { article: NewsArticle; delay: number }) {
  const card = (
    <CupCard delay={delay} hover className="flex h-full overflow-hidden text-white">
      {article.image ? <img src={article.image} alt="" className="h-auto w-24 shrink-0 object-cover sm:w-28" loading="lazy" /> : <div className="w-24 shrink-0 bg-[radial-gradient(circle_at_40%_35%,rgba(245,197,91,0.28),transparent_55%),rgba(255,255,255,0.05)] sm:w-28" />}
      <div className="min-w-0 p-3">
        <div className="mb-2 flex items-center justify-between gap-3 text-[0.62rem] font-black uppercase tracking-wide text-slate-400">
          <span>CupWatch</span>
          {article.publishedAt ? <time dateTime={article.publishedAt}>{formatNewsDate(article.publishedAt)}</time> : null}
        </div>
        <h3 className="line-clamp-2 text-sm font-black leading-tight sm:text-base">{article.title}</h3>
        {article.description ? <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-300">{article.description}</p> : null}
      </div>
    </CupCard>
  );

  if (!article.url) return card;

  return (
    <a href={article.url} target="_blank" rel="noreferrer" className="block h-full focus:outline-none focus:ring-2 focus:ring-[var(--cw-primary)] focus:ring-offset-4 focus:ring-offset-slate-950">
      {card}
    </a>
  );
}

function formatNewsDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export default function TodayPage() {
  const [now, setNow] = useState(() => new Date());
  const [matches, setMatches] = useState<Match[]>([]);
  const [groups, setGroups] = useState<GroupStanding[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [matchesState, setMatchesState] = useState<LoadState>('idle');
  const [standingsState, setStandingsState] = useState<LoadState>('idle');
  const [newsState, setNewsState] = useState<LoadState>('idle');
  const [notice, setNotice] = useState<string | null>(null);
  const { favorites, toggleFavorite } = useFavoriteTeams();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setMatchesState('loading');
      setStandingsState('loading');
      setNewsState('loading');
      setNotice(null);

      const [matchesResult, standingsResult, newsResult] = await Promise.allSettled([
        fetch('/api/matches'),
        fetch('/api/standings'),
        fetch('/api/news'),
      ]);

      if (!isMounted) return;

      if (matchesResult.status === 'fulfilled' && matchesResult.value.ok) {
        const payload = (await matchesResult.value.json()) as MatchesApiResponse;
        setMatches(sortMatches(payload.data));
        setMatchesState('ready');
        if (payload.fallback) setNotice(payload.message ?? 'Showing saved match data while the live feed is unavailable.');
      } else {
        setMatches([]);
        setMatchesState('error');
      }

      if (standingsResult.status === 'fulfilled' && standingsResult.value.ok) {
        const payload = (await standingsResult.value.json()) as StandingsApiResponse;
        setGroups(payload.data);
        setStandingsState('ready');
      } else {
        setGroups([]);
        setStandingsState('error');
      }

      if (newsResult.status === 'fulfilled' && newsResult.value.ok) {
        const payload = (await newsResult.value.json()) as NewsApiResponse;
        setNews(payload.data);
        setNewsState('ready');
      } else {
        setNews([]);
        setNewsState('error');
      }
    }

    loadDashboard().catch((error: unknown) => {
      if (!isMounted) return;
      console.error('Unable to load dashboard:', error);
      setMatchesState('error');
      setStandingsState('error');
      setNewsState('error');
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const hasLoadError = matchesState === 'error' || standingsState === 'error' || newsState === 'error';

  return (
    <main className="page-container cw-page">
      <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
        <HeroCard matches={matches} now={now} isLoading={matchesState === 'loading'} />

        {notice ? <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-100">{notice}</div> : null}
        {hasLoadError ? <div className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">Some dashboard sections could not load. Try refreshing in a moment.</div> : null}

        <NextMatchesSection matches={matches} now={now} isLoading={matchesState === 'loading'} />

        <StandingsPreview groups={groups} isLoading={standingsState === 'loading'} />

        <FavoritesCountdownRow matches={matches} favorites={favorites} onToggleFavorite={toggleFavorite} isLoading={matchesState === 'loading'} now={now} />

        <NewsPreview news={news} isLoading={newsState === 'loading'} />

        <InstallPromptCard />
      </div>
    </main>
  );
}
