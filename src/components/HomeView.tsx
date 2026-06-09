"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getTeamsFromMatches, matchInvolvesFavoriteTeam } from "@/lib/favorite-teams";
import { deriveStageLabel } from "@/lib/match-utils";
import { useFavoriteTeams } from "@/hooks/use-favorite-teams";
import type { GroupStanding, NewsArticle } from "@/types/cupwatch";
import type { Match, MatchStatus } from "@/types/match";

const GOLD = "#C9A84C";
const GOLD_DIM = "#8A6A28";
const BG = "#0D0D0D";
const CARD = "#161616";
const CARD2 = "#1C1C1C";
const BORDER = "#2A2A2A";
const TEXT = "#F0EDE6";
const MUTED = "#888480";
const ERROR = "#FCA5A5";
const OPENING_MATCH_START = new Date("2026-06-11T19:00:00Z");
const TOURNAMENT_END = new Date("2026-07-20T00:00:00Z");
const INSTALL_PROMPT_DISMISSED_KEY = "cupwatch-install-prompt-dismissed";

const statusLabels: Record<MatchStatus, string> = {
  live: "Live",
  pre: "Upcoming",
  post: "Final",
};

type MatchesApiResponse = {
  data: Match[];
  source: "espn" | "mock";
  fallback: boolean;
  message?: string;
};

type StandingsApiResponse = {
  data: GroupStanding[];
  source: "espn" | "mock";
  fallback: boolean;
  message?: string;
};

type NewsApiResponse = {
  data: NewsArticle[];
};

type LoadState = "idle" | "loading" | "ready" | "error";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toMatchdayKey(match: Match) {
  return toLocalDateKey(new Date(match.date));
}

function formatMatchday(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(localDate);
}

function formatKickoff(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(date));
}

function formatNewsDate(value?: string) {
  if (!value) return "CupWatch";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "CupWatch";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatGoalDifference(goalDifference: number) {
  return goalDifference > 0 ? `+${goalDifference}` : String(goalDifference);
}

function getScore(match: Match) {
  return `${match.homeTeam.score ?? 0}–${match.awayTeam.score ?? 0}`;
}

function getVenueCity(match: Match) {
  return match.city ?? match.venue ?? "Venue TBA";
}

function getTeamInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function sortMatches(matches: Match[]) {
  return [...matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function isTournamentActive(now: Date) {
  return now >= OPENING_MATCH_START && now < TOURNAMENT_END;
}

function getOpeningMatch(matches: Match[]) {
  return matches.find((match) => {
    const teams = `${match.homeTeam.name} ${match.awayTeam.name}`.toLowerCase();
    return teams.includes("mexico") && teams.includes("south africa");
  });
}

function getTodayMatches(matches: Match[], now: Date) {
  const today = toLocalDateKey(now);
  return sortMatches(matches).filter((match) => toMatchdayKey(match) === today);
}

function getNextUpcomingMatchday(matches: Match[], now: Date) {
  const upcoming = sortMatches(matches).filter((match) => match.status !== "post" && new Date(match.date) >= now);
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
  const openingMatch = getOpeningMatch(matches);

  if (now < OPENING_MATCH_START) {
    return {
      eyebrow: "Opening match",
      title: openingMatch ? `${openingMatch.homeTeam.name} vs ${openingMatch.awayTeam.name}` : "Mexico vs South Africa",
      detail: openingMatch ? `${formatKickoff(openingMatch.date)} · ${getVenueCity(openingMatch)}` : `${formatKickoff(OPENING_MATCH_START.toISOString())} · Mexico City`,
    };
  }

  const todayMatches = getTodayMatches(matches, now);
  const liveMatches = todayMatches.filter((match) => match.status === "live");
  const upcomingMatches = todayMatches.filter((match) => match.status === "pre");
  const completedMatches = todayMatches.filter((match) => match.status === "post");

  if (liveMatches.length) {
    return {
      eyebrow: "Live now",
      title: `${liveMatches.length} match${liveMatches.length === 1 ? "" : "es"} in progress`,
      detail: liveMatches.slice(0, 2).map((match) => `${match.homeTeam.abbreviation} ${getScore(match)} ${match.awayTeam.abbreviation}`).join(" · "),
    };
  }

  if (upcomingMatches.length) {
    return {
      eyebrow: "Today",
      title: `${upcomingMatches.length} kickoff${upcomingMatches.length === 1 ? "" : "s"} ahead`,
      detail: upcomingMatches.slice(0, 2).map((match) => `${match.homeTeam.abbreviation} vs ${match.awayTeam.abbreviation} · ${formatKickoff(match.date)}`).join(" · "),
    };
  }

  if (completedMatches.length) {
    return {
      eyebrow: "Today",
      title: `${completedMatches.length} result${completedMatches.length === 1 ? "" : "s"} posted`,
      detail: completedMatches.slice(0, 2).map((match) => `${match.homeTeam.abbreviation} ${getScore(match)} ${match.awayTeam.abbreviation}`).join(" · "),
    };
  }

  return {
    eyebrow: "Today",
    title: "No matches today",
    detail: "Check the next matchday below.",
  };
}

function countdownParts(target: Date, now: Date) {
  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  return { days, hours, minutes };
}

function isStandaloneDisplayMode() {
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };

  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

function Card({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay }} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, ...style }}>
      {children}
    </motion.div>
  );
}

function LoadingBlock({ height = 120 }: { height?: number }) {
  return <div style={{ height, borderRadius: 12, border: `1px solid ${BORDER}`, background: "linear-gradient(90deg,#151515,#202020,#151515)" }} />;
}

function TeamMark({ name, logo, size = 30 }: { name: string; logo?: string; size?: number }) {
  if (logo) {
    return <img src={logo} alt="" loading="lazy" style={{ width: size, height: size, borderRadius: "50%", objectFit: "contain", background: CARD2, padding: 3, border: `1px solid ${BORDER}` }} />;
  }

  return (
    <span style={{ width: size, height: size, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", background: CARD2, border: `1px solid ${BORDER}`, color: TEXT, fontSize: size > 28 ? 11 : 9, fontWeight: 800 }}>
      {getTeamInitials(name)}
    </span>
  );
}

function SectionHeader({ title, href, linkText }: { title: string; href: string; linkText: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: 0.5, textTransform: "uppercase" }}>{title}</span>
      <Link href={href} style={{ color: GOLD, fontSize: 12, textDecoration: "none", fontWeight: 600 }}>
        {linkText} ›
      </Link>
    </div>
  );
}

function HeroCard({ matches, now, isLoading }: { matches: Match[]; now: Date; isLoading: boolean }) {
  const summary = getHeroSummary(matches, now);
  const openingMatch = getOpeningMatch(matches);
  const target = openingMatch ? new Date(openingMatch.date) : OPENING_MATCH_START;
  const countdown = countdownParts(target, now);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div style={{ margin: "0 12px 20px", borderRadius: 16, background: "linear-gradient(135deg, #0f0f0f 0%, #1a1208 60%, #2a1e04 100%)", border: `1px solid ${BORDER}`, overflow: "hidden", position: "relative", minHeight: 214 }}>
      <div style={{ padding: "16px 16px 14px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(201,168,76,0.12)", border: `1px solid ${GOLD_DIM}`, borderRadius: 20, padding: "4px 10px", fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: 0.5, marginBottom: 10 }}>
          <span style={{ width: 18, height: 18, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", background: GOLD, color: BG, fontSize: 9, fontWeight: 900 }}>CW</span>
          World Cup 2026
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.5px", marginBottom: 4 }}>{isLoading ? "Loading CupWatch" : summary.title}</div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <span>{summary.eyebrow}</span>
          <span>{isLoading ? "Fetching match feed" : summary.detail}</span>
        </div>
        <div style={{ fontSize: 11, color: GOLD, marginTop: 4 }}>Scores, tables, fixtures, and headlines without the clutter.</div>
        <Link href="/schedule" style={{ marginTop: 14, background: "rgba(201,168,76,0.12)", border: `1px solid ${GOLD_DIM}`, borderRadius: 8, color: GOLD, padding: "9px 18px", fontSize: 12, fontWeight: 700, letterSpacing: 0.8, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
          VIEW FIXTURES
        </Link>
      </div>
      <div style={{ position: "absolute", right: 10, bottom: 12, display: "flex", gap: 8 }}>
        {[
          ["DAYS", pad(countdown.days)],
          ["HRS", pad(countdown.hours)],
          ["MINS", pad(countdown.minutes)],
        ].map(([label, value]) => (
          <div key={label} style={{ minWidth: 46, textAlign: "center", borderRadius: 10, background: "rgba(13,13,13,0.62)", border: `1px solid ${BORDER}`, padding: "7px 5px" }}>
            <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{value}</div>
            <div style={{ fontSize: 7, color: MUTED, fontWeight: 800, marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", right: -8, top: 12, width: 96, height: 96, borderRadius: "50%", border: `1px solid ${GOLD_DIM}`, color: GOLD, opacity: 0.14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 900, userSelect: "none" }}>CW</div>
    </div>
  );
}

function MatchCard({ match, index, favorite }: { match: Match; index: number; favorite: boolean }) {
  return (
    <Link href={`/match/${match.id}`} style={{ color: "inherit", textDecoration: "none" }}>
      <Card delay={index * 0.04} style={{ padding: "12px 14px", minWidth: 168, flex: "0 0 168px", position: "relative", height: "100%" }}>
        {favorite ? <span style={{ position: "absolute", top: 10, right: 10, fontSize: 12, color: GOLD }}>★</span> : null}
        <div style={{ fontSize: 9, color: MUTED, letterSpacing: 0.8, marginBottom: 8, textTransform: "uppercase" }}>{deriveStageLabel(match)}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          {[match.homeTeam, match.awayTeam].map((team, teamIndex) => (
            <div key={team.abbreviation} style={{ textAlign: "center", flex: 1 }}>
              <TeamMark name={team.name} logo={team.logo} />
              <div style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>{team.abbreviation}</div>
              {match.status !== "pre" ? <div style={{ fontSize: 16, color: TEXT, fontWeight: 900 }}>{team.score ?? 0}</div> : null}
              {teamIndex === 0 ? null : null}
            </div>
          ))}
          <div style={{ position: "absolute", left: "50%", top: 58, transform: "translateX(-50%)", fontSize: 10, color: MUTED }}>VS</div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, textAlign: "center", color: match.status === "live" ? ERROR : TEXT }}>{match.status === "pre" ? formatKickoff(match.date) : statusLabels[match.status]}</div>
        <div style={{ fontSize: 10, color: MUTED, textAlign: "center", marginTop: 2 }}>{getVenueCity(match)}</div>
      </Card>
    </Link>
  );
}

function NextMatchesSection({ matches, now, favorites, isLoading }: { matches: Match[]; now: Date; favorites: string[]; isLoading: boolean }) {
  const featuredMatches = getFeaturedMatches(matches, now);
  const label = featuredMatches[0]
    ? isTournamentActive(now)
      ? "Today"
      : formatMatchday(toMatchdayKey(featuredMatches[0]))
    : "Upcoming";

  return (
    <div style={{ padding: "0 16px", marginBottom: 20 }}>
      <SectionHeader title={`Next Matches · ${label}`} href="/schedule" linkText="Full Schedule" />
      {isLoading ? (
        <div style={{ display: "flex", gap: 10, overflow: "hidden" }}>
          <LoadingBlock height={150} />
          <LoadingBlock height={150} />
        </div>
      ) : featuredMatches.length ? (
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
          {featuredMatches.map((match, i) => (
            <MatchCard key={match.id} match={match} index={i} favorite={matchInvolvesFavoriteTeam(match, favorites)} />
          ))}
        </div>
      ) : (
        <EmptyMessage>No upcoming matches are available right now.</EmptyMessage>
      )}
    </div>
  );
}

function StandingsPreview({ groups, isLoading }: { groups: GroupStanding[]; isLoading: boolean }) {
  const groupA = groups.find((group) => group.group.toLowerCase() === "group a") ?? groups[0];

  return (
    <div style={{ padding: "0 16px", marginBottom: 20 }}>
      <SectionHeader title="Standings Preview" href="/standings" linkText="View All Groups" />
      <Card style={{ overflow: "hidden" }}>
        {isLoading ? (
          <LoadingBlock height={214} />
        ) : groupA ? (
          <>
            <div style={{ padding: "10px 14px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: GOLD, fontWeight: 700, fontSize: 13, textTransform: "uppercase" }}>{groupA.group}</span>
              <div style={{ display: "flex", gap: 12 }}>
                {["P", "W", "D", "L", "GD", "PTS"].map((h) => (
                  <span key={h} style={{ fontSize: 10, color: MUTED, width: 18, textAlign: "center" }}>{h}</span>
                ))}
              </div>
            </div>
            {groupA.rows.map((row, i) => (
              <div key={row.code} style={{ display: "flex", alignItems: "center", padding: "9px 14px", borderTop: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: 11, color: MUTED, width: 14 }}>{i + 1}</span>
                <span style={{ fontSize: 18, margin: "0 8px" }}>{row.flag}</span>
                <span style={{ fontSize: 12, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.team}</span>
                <div style={{ display: "flex", gap: 12 }}>
                  {[row.played, row.wins, row.draws, row.losses, formatGoalDifference(row.goalDifference)].map((value, j) => (
                    <span key={j} style={{ fontSize: 11, color: MUTED, width: 18, textAlign: "center" }}>{value}</span>
                  ))}
                  <span style={{ fontSize: 11, color: GOLD, width: 18, textAlign: "center", fontWeight: 700 }}>{row.points}</span>
                </div>
              </div>
            ))}
          </>
        ) : (
          <EmptyMessage>No standings are available right now.</EmptyMessage>
        )}
      </Card>
    </div>
  );
}

function FavoritesCard({ matches, favorites, onToggleFavorite, isLoading }: { matches: Match[]; favorites: string[]; onToggleFavorite: (teamCode: string) => void; isLoading: boolean }) {
  const teamOptions = useMemo(() => getTeamsFromMatches(matches), [matches]);
  const favoriteTeams = favorites.map((code) => teamOptions.find((team) => team.abbreviation === code) ?? { abbreviation: code, name: code });
  const suggestedTeams = teamOptions.filter((team) => !favorites.includes(team.abbreviation)).slice(0, 3);

  return (
    <Card style={{ padding: "12px 12px 10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>My Favorites</span>
        <span style={{ color: GOLD, fontSize: 10 }}>{favorites.length ? `${favorites.length} followed` : "Follow teams"}</span>
      </div>
      {isLoading ? (
        <LoadingBlock height={70} />
      ) : favoriteTeams.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {favoriteTeams.map((team) => (
            <button key={team.abbreviation} type="button" onClick={() => onToggleFavorite(team.abbreviation)} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(201,168,76,0.08)", border: `1px solid ${GOLD_DIM}`, borderRadius: 999, color: TEXT, padding: "6px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer" }} title={`Unfollow ${team.name}`}>
              <TeamMark name={team.name} logo={team.logo} size={22} />
              {team.abbreviation} ★
            </button>
          ))}
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 10, color: MUTED, lineHeight: 1.45, marginBottom: 9 }}>Follow teams on this device to personalize match cards and schedule filters.</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {suggestedTeams.length ? suggestedTeams.map((team) => (
              <button key={team.abbreviation} type="button" onClick={() => onToggleFavorite(team.abbreviation)} style={{ border: `1px solid ${BORDER}`, background: CARD2, color: TEXT, borderRadius: 999, padding: "6px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                + {team.abbreviation}
              </button>
            )) : <span style={{ fontSize: 10, color: MUTED }}>Teams will appear after match data loads.</span>}
          </div>
        </div>
      )}
    </Card>
  );
}

function CountdownCard({ matches, now }: { matches: Match[]; now: Date }) {
  const openingMatch = getOpeningMatch(matches);
  const target = openingMatch ? new Date(openingMatch.date) : OPENING_MATCH_START;
  const { days, hours, minutes } = countdownParts(target, now);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <Card style={{ padding: "12px 10px 10px", position: "relative", overflow: "hidden" }}>
      <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>Opening Countdown</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {[
          ["DAYS", pad(days)],
          ["HRS", pad(hours)],
          ["MINS", pad(minutes)],
        ].map(([label, value]) => (
          <div key={label} style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 8, color: MUTED, textTransform: "uppercase", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
      <Link href="/schedule" style={{ background: "rgba(201,168,76,0.08)", border: `1px solid ${GOLD_DIM}`, borderRadius: 6, color: GOLD, padding: "6px 8px", fontSize: 9, fontWeight: 700, cursor: "pointer", width: "100%", letterSpacing: 0.5, textDecoration: "none", display: "block", textAlign: "center" }}>
        VIEW FIXTURES
      </Link>
      <div style={{ position: "absolute", right: -10, bottom: -10, fontSize: 44, opacity: 0.06, userSelect: "none", fontWeight: 900 }}>CW</div>
    </Card>
  );
}

function NewsPreview({ news, isLoading }: { news: NewsArticle[]; isLoading: boolean }) {
  return (
    <div style={{ padding: "0 16px", marginBottom: 20 }}>
      <SectionHeader title="Latest News" href="/news" linkText="See All" />
      {isLoading ? (
        <div style={{ display: "flex", gap: 10, overflow: "hidden" }}>
          <LoadingBlock height={166} />
          <LoadingBlock height={166} />
        </div>
      ) : news.length ? (
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
          {news.slice(0, 6).map((article, i) => (
            <NewsCard key={article.id} article={article} index={i} />
          ))}
        </div>
      ) : (
        <EmptyMessage>No news cards are available right now.</EmptyMessage>
      )}
    </div>
  );
}

function NewsCard({ article, index }: { article: NewsArticle; index: number }) {
  const card = (
    <Card delay={index * 0.04} style={{ overflow: "hidden", minWidth: 158, flex: "0 0 158px", height: "100%" }}>
      {article.image ? (
        <img src={article.image} alt="" loading="lazy" style={{ height: 78, width: "100%", objectFit: "cover", display: "block", background: CARD2 }} />
      ) : (
        <div style={{ height: 78, background: CARD2, display: "flex", alignItems: "center", justifyContent: "center", color: GOLD, fontSize: 20, fontWeight: 900 }}>CW</div>
      )}
      <div style={{ padding: "8px 10px 10px" }}>
        <div style={{ fontSize: 9, color: MUTED, marginBottom: 5, display: "flex", justifyContent: "space-between", gap: 8 }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{article.source ?? "CupWatch"}</span>
          <span>{formatNewsDate(article.publishedAt)}</span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.35, color: TEXT }}>{article.title}</div>
      </div>
    </Card>
  );

  if (!article.url) return card;

  return (
    <a href={article.url} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
      {card}
    </a>
  );
}

function InstallPromptCard() {
  const [isVisible, setIsVisible] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandaloneDisplayMode()) return;
    if (window.localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY) === "true") return;

    const showTimer = window.setTimeout(() => setIsVisible(true), 1800);
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.clearTimeout(showTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, "true");
    setIsVisible(false);
  };

  const handleInstall = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);

    if (choice.outcome === "accepted") {
      dismiss();
    }
  };

  if (!isVisible) return null;

  return (
    <div style={{ padding: "0 16px", marginBottom: 20 }}>
      <Card style={{ padding: 14, background: "linear-gradient(135deg, rgba(201,168,76,0.13), #151515)" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 14, background: GOLD, color: BG, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13 }}>CW</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>Add CupWatch to your home screen</div>
            <div style={{ marginTop: 4, color: MUTED, fontSize: 11, lineHeight: 1.45 }}>Install the compact CupWatch app for quick matchday access.</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {installPrompt ? (
                <button type="button" onClick={handleInstall} style={{ background: GOLD, color: BG, border: "none", borderRadius: 999, padding: "7px 12px", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>Add app</button>
              ) : (
                <span style={{ border: `1px solid ${BORDER}`, background: CARD2, color: TEXT, borderRadius: 999, padding: "7px 10px", fontSize: 10, fontWeight: 700 }}>Use your browser menu to add it.</span>
              )}
              <button type="button" onClick={dismiss} style={{ background: "transparent", color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 999, padding: "7px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>Not now</button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return <div style={{ border: `1px dashed ${BORDER}`, borderRadius: 12, padding: "16px 14px", color: MUTED, fontSize: 12, fontWeight: 700 }}>{children}</div>;
}

export default function HomeView() {
  const [now, setNow] = useState(() => new Date());
  const [matches, setMatches] = useState<Match[]>([]);
  const [groups, setGroups] = useState<GroupStanding[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [matchesState, setMatchesState] = useState<LoadState>("idle");
  const [standingsState, setStandingsState] = useState<LoadState>("idle");
  const [newsState, setNewsState] = useState<LoadState>("idle");
  const [notice, setNotice] = useState<string | null>(null);
  const { favorites, toggleFavorite } = useFavoriteTeams();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setMatchesState("loading");
      setStandingsState("loading");
      setNewsState("loading");
      setNotice(null);

      const [matchesResult, standingsResult, newsResult] = await Promise.allSettled([
        fetch("/api/matches"),
        fetch("/api/standings"),
        fetch("/api/news"),
      ]);

      if (!isMounted) return;

      if (matchesResult.status === "fulfilled" && matchesResult.value.ok) {
        const payload = (await matchesResult.value.json()) as MatchesApiResponse;
        setMatches(sortMatches(payload.data));
        setMatchesState("ready");
        if (payload.fallback) setNotice(payload.message ?? "Showing saved match data while the live feed is unavailable.");
      } else {
        setMatches([]);
        setMatchesState("error");
      }

      if (standingsResult.status === "fulfilled" && standingsResult.value.ok) {
        const payload = (await standingsResult.value.json()) as StandingsApiResponse;
        setGroups(payload.data);
        setStandingsState("ready");
      } else {
        setGroups([]);
        setStandingsState("error");
      }

      if (newsResult.status === "fulfilled" && newsResult.value.ok) {
        const payload = (await newsResult.value.json()) as NewsApiResponse;
        setNews(payload.data);
        setNewsState("ready");
      } else {
        setNews([]);
        setNewsState("error");
      }
    }

    loadDashboard().catch((error: unknown) => {
      if (!isMounted) return;
      console.error("Unable to load dashboard:", error);
      setMatchesState("error");
      setStandingsState("error");
      setNewsState("error");
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const hasLoadError = matchesState === "error" || standingsState === "error" || newsState === "error";

  return (
    <main style={{ background: BG, minHeight: "100vh", color: TEXT, padding: "14px 0 calc(7rem + env(safe-area-inset-bottom))" }}>
      <div style={{ maxWidth: 430, margin: "0 auto" }}>
        <HeroCard matches={matches} now={now} isLoading={matchesState === "loading"} />

        {notice ? <div style={{ margin: "0 16px 12px", border: `1px solid ${GOLD_DIM}`, background: "rgba(201,168,76,0.09)", color: GOLD, borderRadius: 12, padding: "10px 12px", fontSize: 11, fontWeight: 700 }}>{notice}</div> : null}
        {hasLoadError ? <div style={{ margin: "0 16px 12px", border: "1px solid rgba(252,165,165,0.35)", background: "rgba(239,68,68,0.08)", color: ERROR, borderRadius: 12, padding: "10px 12px", fontSize: 11, fontWeight: 700 }}>Some dashboard sections could not load. Try refreshing in a moment.</div> : null}

        <NextMatchesSection matches={matches} now={now} favorites={favorites} isLoading={matchesState === "loading"} />

        <StandingsPreview groups={groups} isLoading={standingsState === "loading"} />

        <div style={{ padding: "0 16px", marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <FavoritesCard matches={matches} favorites={favorites} onToggleFavorite={toggleFavorite} isLoading={matchesState === "loading"} />
          <CountdownCard matches={matches} now={now} />
        </div>

        <NewsPreview news={news} isLoading={newsState === "loading"} />

        <InstallPromptCard />
      </div>
    </main>
  );
}
