'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MotionCard } from '@/components/MotionCard';
import { TeamPicker } from '@/components/TeamPicker';
import { getTeamsFromMatches, matchInvolvesFavoriteTeam } from '@/lib/favorite-teams';
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
  pre: 'border-cyan-300/40 bg-cyan-400/10 text-cyan-100',
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
  return <div className={`animate-pulse rounded-[1.75rem] border border-white/10 bg-white/10 ${className}`} />;
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
    <MotionCard className="rounded-[1.5rem] border border-emerald-300/25 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(15,23,42,0.88))] p-4 text-white shadow-xl shadow-slate-950/20 backdrop-blur">
      <div className="flex gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-400 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20">CW</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">Add CupWatch to your home screen</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">Install the dark, mobile-first CupWatch app for quick access during World Cup 2026.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {installPrompt ? (
              <button type="button" onClick={handleInstall} className="rounded-full bg-emerald-300 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-200">
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
    </MotionCard>
  );
}

function TeamBadge({ name, logo }: { name: string; logo?: string }) {
  if (logo) {
    return <img src={logo} alt="" className="size-9 rounded-full bg-white/10 object-contain p-1" loading="lazy" />;
  }

  return <span className="grid size-9 place-items-center rounded-full bg-white/10 text-xs font-black text-white ring-1 ring-white/10">{getTeamInitials(name)}</span>;
}

function HeroCard({ matches, now, isLoading }: { matches: Match[]; now: Date; isLoading: boolean }) {
  const summary = getHeroSummary(matches, now);
  const countdown = countdownParts(now);
  const started = isTournamentStarted(now);

  return (
    <MotionCard className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_34rem),linear-gradient(135deg,#101827_0%,#07111f_58%,#06251f_100%)] p-5 text-white shadow-2xl shadow-slate-950/30 md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">World Cup companion</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">CupWatch 2026</h1>
          <p className="mt-3 text-sm font-semibold text-slate-300 md:text-base">{formatDateRange()} · Simple scores, tables, fixtures, and headlines.</p>
        </div>

        {!started ? (
          <div className="grid grid-cols-3 gap-2 rounded-[1.5rem] border border-white/10 bg-white/10 p-2 backdrop-blur">
            {[
              ['Days', countdown.days],
              ['Hours', countdown.hours],
              ['Mins', countdown.minutes],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-slate-950/45 px-4 py-3 text-center">
                <p className="text-2xl font-black tabular-nums">{value}</p>
                <p className="text-[0.65rem] font-black uppercase tracking-wide text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur md:flex md:items-center md:justify-between md:gap-5">
        {isLoading ? (
          <LoadingPanel className="h-20 flex-1" />
        ) : (
          <>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">{summary.eyebrow}</p>
              <h2 className="mt-2 text-2xl font-black leading-tight">{summary.title}</h2>
              <p className="mt-2 text-sm font-semibold text-slate-300">{summary.detail}</p>
            </div>
            <Link href="/schedule" className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-100 md:mt-0">
              View schedule
            </Link>
          </>
        )}
      </div>
    </MotionCard>
  );
}

function MatchMiniCard({ match, index }: { match: Match; index: number }) {
  return (
    <Link href={`/match/${match.id}`} className="block min-w-[17rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300" aria-label={`View details for ${match.homeTeam.name} vs ${match.awayTeam.name}`}>
      <MotionCard delay={index * 0.04} className="rounded-[1.5rem] border border-white/10 bg-white/[0.08] p-4 text-white shadow-lg shadow-slate-950/20 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/[0.12]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className={`rounded-full border px-3 py-1 text-[0.65rem] font-black uppercase tracking-wide ${statusStyles[match.status]}`}>{statusLabels[match.status]}</span>
        <span className="text-xs font-bold text-slate-400">{deriveStageLabel(match)}</span>
      </div>

      <div className="space-y-3">
        {[match.homeTeam, match.awayTeam].map((team) => (
          <div key={`${match.id}-${team.abbreviation}`} className="flex items-center gap-3">
            <TeamBadge name={team.name} logo={team.logo} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black">{team.name}</p>
              <p className="text-xs font-bold text-slate-400">{team.abbreviation}</p>
            </div>
            {match.status !== 'pre' ? <span className="text-lg font-black tabular-nums">{team.score ?? 0}</span> : null}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-slate-950/45 px-3 py-3 text-xs font-bold leading-5 text-slate-300">
        <p>{match.status === 'pre' ? formatKickoff(match.date) : match.statusText}</p>
        <p>{getVenueCity(match)}</p>
      </div>
      </MotionCard>
    </Link>
  );
}

function SectionHeader({ eyebrow, title, href, linkText }: { eyebrow: string; title: string; href?: string; linkText?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 px-1">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/80">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-black text-white">{title}</h2>
      </div>
      {href && linkText ? (
        <Link href={href} className="shrink-0 text-sm font-black text-emerald-200 transition hover:text-white">
          {linkText}
        </Link>
      ) : null}
    </div>
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
          <LoadingPanel className="h-56 min-w-[17rem]" />
          <LoadingPanel className="h-56 min-w-[17rem]" />
        </div>
      ) : featuredMatches.length ? (
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-1">
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
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  useEffect(() => {
    if (!selectedGroup && groups[0]) setSelectedGroup(groups[0].group);
    if (selectedGroup && groups.length && !groups.some((group) => group.group === selectedGroup)) setSelectedGroup(groups[0].group);
  }, [groups, selectedGroup]);

  const activeGroup = groups.find((group) => group.group === selectedGroup) ?? groups[0];

  return (
    <section>
      <SectionHeader eyebrow="Tables" title="Standings Preview" href="/standings" linkText="Full standings →" />
      <MotionCard className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.08] text-white shadow-lg shadow-slate-950/20 backdrop-blur">
        {isLoading ? (
          <LoadingPanel className="h-72" />
        ) : groups.length && activeGroup ? (
          <>
            <div className="flex gap-2 overflow-x-auto border-b border-white/10 p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {groups.map((group) => (
                <button
                  key={group.group}
                  type="button"
                  onClick={() => setSelectedGroup(group.group)}
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-black transition ${activeGroup.group === group.group ? 'bg-emerald-300 text-slate-950' : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'}`}
                >
                  {group.group}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[360px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-2 py-3 text-center">P</th>
                    <th className="px-2 py-3 text-center">GD</th>
                    <th className="px-4 py-3 text-center">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {activeGroup.rows.map((row) => (
                    <tr key={row.code}>
                      <td className="px-4 py-3 font-bold">
                        <span className="mr-2">{row.flag}</span>
                        <span>{row.team}</span>
                      </td>
                      <td className="px-2 py-3 text-center text-slate-300">{row.played}</td>
                      <td className="px-2 py-3 text-center text-slate-300">{formatGoalDifference(row.goalDifference)}</td>
                      <td className="px-4 py-3 text-center font-black">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="px-4 py-6 text-sm font-bold text-slate-300">No standings are available right now.</div>
        )}
      </MotionCard>
    </section>
  );
}

function YourTeamsSection({ matches, now, favorites, isLoading }: { matches: Match[]; now: Date; favorites: string[]; isLoading: boolean }) {
  const favoriteMatches = useMemo(
    () => sortMatches(matches).filter((match) => match.status !== 'post' && new Date(match.date) >= now && matchInvolvesFavoriteTeam(match, favorites)).slice(0, 8),
    [matches, now, favorites],
  );

  if (!favorites.length) return null;

  return (
    <section>
      <SectionHeader eyebrow={`${favorites.length} followed`} title="Your Teams" href="/schedule" linkText="See favorites →" />
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          <LoadingPanel className="h-56 min-w-[17rem]" />
          <LoadingPanel className="h-56 min-w-[17rem]" />
        </div>
      ) : favoriteMatches.length ? (
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-1">
          {favoriteMatches.map((match, index) => (
            <div key={match.id} className="snap-start">
              <MatchMiniCard match={match} index={index} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.06] px-4 py-6 text-sm font-bold text-slate-300">No upcoming matches found for {favorites.join(', ')} yet.</div>
      )}
    </section>
  );
}

function FollowTeamsCard({ matches, favorites, onToggleFavorite, isLoading }: { matches: Match[]; favorites: string[]; onToggleFavorite: (teamCode: string) => void; isLoading: boolean }) {
  const teamOptions = useMemo(() => getTeamsFromMatches(matches), [matches]);

  return (
    <MotionCard className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(255,255,255,0.07))] p-5 text-white shadow-lg shadow-slate-950/20">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">Personalize</p>
      <h2 className="mt-2 text-2xl font-black">Follow your teams</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">Pick favorites on this device. No account, no login, and no extra feed clutter.</p>

      <TeamPicker teams={teamOptions} favorites={favorites} onToggle={onToggleFavorite} isLoading={isLoading} />

      <p className="mt-3 text-xs font-bold text-slate-400">
        {favorites.length ? `${favorites.length} selected: ${favorites.join(', ')}` : 'Select teams to unlock a Your Teams match rail and schedule filter.'}
      </p>
    </MotionCard>
  );
}

function NewsPreview({ news, isLoading }: { news: NewsArticle[]; isLoading: boolean }) {
  return (
    <section>
      <SectionHeader eyebrow="Briefing" title="Latest News" href="/news" linkText="See more →" />
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <LoadingPanel className="h-44" />
          <LoadingPanel className="h-44" />
          <LoadingPanel className="h-44" />
        </div>
      ) : news.length ? (
        <div className="grid gap-4 md:grid-cols-3">
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
    <MotionCard delay={delay} className="h-full overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.08] text-white shadow-lg shadow-slate-950/20 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/[0.1]">
      {article.image ? <img src={article.image} alt="" className="h-32 w-full object-cover" loading="lazy" /> : null}
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3 text-[0.65rem] font-black uppercase tracking-wide text-slate-400">
          <span>{article.source ?? 'ESPN'}</span>
          {article.publishedAt ? <time dateTime={article.publishedAt}>{formatNewsDate(article.publishedAt)}</time> : null}
        </div>
        <h3 className="text-lg font-black leading-tight">{article.title}</h3>
        {article.description ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">{article.description}</p> : null}
      </div>
    </MotionCard>
  );

  if (!article.url) return card;

  return (
    <a href={article.url} target="_blank" rel="noreferrer" className="block h-full focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-4 focus:ring-offset-slate-950">
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
        if (payload.fallback) setNotice(payload.message ?? 'Showing fallback match data while the live feed is unavailable.');
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
    <main className="page-container min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_28rem),linear-gradient(180deg,#020617_0%,#08111f_48%,#0f172a_100%)] px-4 pt-5 md:px-6 md:pt-8">
      <div className="mx-auto max-w-6xl space-y-7">
        <HeroCard matches={matches} now={now} isLoading={matchesState === 'loading'} />

        <InstallPromptCard />

        {notice ? <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-100">{notice}</div> : null}
        {hasLoadError ? <div className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">Some dashboard sections could not load. Try refreshing in a moment.</div> : null}

        <YourTeamsSection matches={matches} now={now} favorites={favorites} isLoading={matchesState === 'loading'} />

        <NextMatchesSection matches={matches} now={now} isLoading={matchesState === 'loading'} />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
          <StandingsPreview groups={groups} isLoading={standingsState === 'loading'} />
          <FollowTeamsCard matches={matches} favorites={favorites} onToggleFavorite={toggleFavorite} isLoading={matchesState === 'loading'} />
        </div>

        <NewsPreview news={news} isLoading={newsState === 'loading'} />
      </div>
    </main>
  );
}
