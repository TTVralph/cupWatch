import type { GroupStanding, NewsArticle, StandingRow } from '@/types/cupwatch';
import type { Match, MatchStatus } from '@/types/match';

export const ESPN_WORLD_CUP_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
export const ESPN_WORLD_CUP_STANDINGS_URL = 'https://site.web.api.espn.com/apis/v2/sports/soccer/fifa.world/standings';

const ESPN_REVALIDATE_SECONDS = 60 * 15;
const WORLD_CUP_START_DATE = '2026-06-11';
const WORLD_CUP_END_DATE = '2026-07-19';
const SCOREBOARD_BATCH_SIZE = 5;
const ESPN_SCOREBOARD_TIMEOUT_MS = 15_000;

const TEAM_FLAGS: Record<string, string> = {
  ARG: '🇦🇷', AUS: '🇦🇺', BEL: '🇧🇪', BIH: '🇧🇦', BRA: '🇧🇷', CAN: '🇨🇦', CIV: '🇨🇮', COL: '🇨🇴', CRC: '🇨🇷', CRO: '🇭🇷', CUW: '🇨🇼', CZE: '🇨🇿', DEN: '🇩🇰', ECU: '🇪🇨', EGY: '🇪🇬', ENG: '🏴', ESP: '🇪🇸', FRA: '🇫🇷', GER: '🇩🇪', GHA: '🇬🇭', HAI: '🇭🇹', IRN: '🇮🇷', ITA: '🇮🇹', JPN: '🇯🇵', KOR: '🇰🇷', MAR: '🇲🇦', MEX: '🇲🇽', NED: '🇳🇱', NOR: '🇳🇴', PAR: '🇵🇾', POL: '🇵🇱', POR: '🇵🇹', QAT: '🇶🇦', RSA: '🇿🇦', SCO: '🏴', SUI: '🇨🇭', TUR: '🇹🇷', UKR: '🇺🇦', URU: '🇺🇾', USA: '🇺🇸', WAL: '🏴',
};

type EspnScoreboard = {
  events?: EspnEvent[];
};

type EspnEvent = {
  id?: string;
  date?: string;
  name?: string;
  shortName?: string;
  competitions?: EspnCompetition[];
};

type EspnCompetition = {
  status?: {
    type?: {
      state?: string;
      shortDetail?: string;
      detail?: string;
      description?: string;
    };
  };
  venue?: {
    fullName?: string;
    address?: {
      city?: string;
      country?: string;
    };
  };
  competitors?: EspnCompetitor[];
  broadcasts?: Array<{
    names?: string[];
  }>;
  notes?: Array<{
    headline?: string;
    type?: string;
  }>;
};

type EspnCompetitor = {
  homeAway?: string;
  score?: string;
  team?: {
    displayName?: string;
    abbreviation?: string;
    logo?: string;
  };
};

type EspnStandingsResponse = {
  children?: EspnStandingsGroup[];
  standings?: EspnStandingsContainer;
  groups?: EspnStandingsGroup[];
};

type EspnStandingsContainer = {
  entries?: EspnStandingEntry[];
  groups?: EspnStandingsGroup[];
  name?: string;
  displayName?: string;
};

type EspnStandingsGroup = {
  id?: string;
  name?: string;
  displayName?: string;
  shortName?: string;
  abbreviation?: string;
  standings?: EspnStandingsContainer;
  children?: EspnStandingsGroup[];
  entries?: EspnStandingEntry[];
};

type EspnStandingEntry = {
  team?: {
    displayName?: string;
    name?: string;
    shortDisplayName?: string;
    abbreviation?: string;
  };
  stats?: EspnStandingStat[];
};

type EspnStandingStat = {
  name?: string;
  displayName?: string;
  shortDisplayName?: string;
  abbreviation?: string;
  value?: number;
  displayValue?: string;
};

export async function fetchEspnWorldCupMatches(dateStrings = generateWorldCupDateStrings()): Promise<Match[]> {
  const uniqueDateStrings = [...new Set(dateStrings)];
  const matchesById = new Map<string, Match>();

  for (const dateBatch of chunk(uniqueDateStrings, SCOREBOARD_BATCH_SIZE)) {
    const scoreboards = await Promise.all(dateBatch.map(fetchEspnScoreboardForDate));

    for (const scoreboard of scoreboards) {
      for (const match of normalizeEspnScoreboard(scoreboard)) {
        matchesById.set(match.id, match);
      }
    }
  }

  return [...matchesById.values()].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function generateWorldCupDateStrings(startDate = WORLD_CUP_START_DATE, endDate = WORLD_CUP_END_DATE): string[] {
  const dates: string[] = [];
  const currentDate = new Date(`${startDate}T00:00:00Z`);
  const finalDate = new Date(`${endDate}T00:00:00Z`);

  while (currentDate <= finalDate) {
    dates.push(formatEspnDate(currentDate));
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return dates;
}

export function toEspnDateString(isoDate: string) {
  const parsedDate = new Date(`${isoDate}T00:00:00Z`);
  return Number.isNaN(parsedDate.getTime()) ? null : formatEspnDate(parsedDate);
}

async function fetchEspnScoreboardForDate(dateString: string): Promise<EspnScoreboard> {
  const response = await fetch(`${ESPN_WORLD_CUP_SCOREBOARD_URL}?dates=${dateString}`, {
    next: { revalidate: ESPN_REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(ESPN_SCOREBOARD_TIMEOUT_MS),
  } as RequestInit & { next: { revalidate: number } });

  if (!response.ok) {
    throw new Error(`ESPN scoreboard request for ${dateString} failed with status ${response.status}`);
  }

  return (await response.json()) as EspnScoreboard;
}

function formatEspnDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

export async function fetchEspnWorldCupStandings(): Promise<GroupStanding[]> {
  const response = await fetch(ESPN_WORLD_CUP_STANDINGS_URL, {
    next: { revalidate: ESPN_REVALIDATE_SECONDS },
  } as RequestInit & { next: { revalidate: number } });

  if (!response.ok) {
    throw new Error(`ESPN standings request failed with status ${response.status}`);
  }

  const data = (await response.json()) as EspnStandingsResponse;
  const standings = normalizeEspnStandings(data);

  if (standings.length === 0) {
    throw new Error('ESPN standings response did not contain group tables');
  }

  return standings;
}

export function normalizeEspnScoreboard(data: EspnScoreboard): Match[] {
  return (data.events ?? []).map(normalizeEspnEvent).filter((match): match is Match => match !== null);
}

export function normalizeEspnStandings(data: EspnStandingsResponse): GroupStanding[] {
  const groups = collectStandingsGroups(data);

  return groups
    .map((group) => {
      const rows = normalizeStandingsEntries(group.entries ?? group.standings?.entries ?? []);
      return rows.length > 0 ? { group: normalizeGroupName(group), rows } : null;
    })
    .filter((group): group is GroupStanding => group !== null);
}

function collectStandingsGroups(data: EspnStandingsResponse): EspnStandingsGroup[] {
  const topLevelGroups = [...(data.children ?? []), ...(data.groups ?? []), ...(data.standings?.groups ?? [])];
  const groups = flattenGroups(topLevelGroups);

  if (groups.length > 0) return groups;

  if (data.standings?.entries?.length) {
    return [{ name: data.standings.displayName ?? data.standings.name ?? 'Standings', entries: data.standings.entries }];
  }

  return [];
}

function flattenGroups(groups: EspnStandingsGroup[]): EspnStandingsGroup[] {
  return groups.flatMap((group) => {
    const nestedGroups = flattenGroups([...(group.children ?? []), ...(group.standings?.groups ?? [])]);
    const entries = group.entries ?? group.standings?.entries;
    return entries?.length ? [group, ...nestedGroups] : nestedGroups;
  });
}

function normalizeGroupName(group: EspnStandingsGroup) {
  return group.displayName ?? group.name ?? group.shortName ?? (group.abbreviation ? `Group ${group.abbreviation}` : 'Group');
}

function normalizeStandingsEntries(entries: EspnStandingEntry[]): StandingRow[] {
  return entries.map(normalizeStandingRow).filter((row): row is StandingRow => row !== null);
}

function normalizeStandingRow(entry: EspnStandingEntry): StandingRow | null {
  const code = entry.team?.abbreviation ?? entry.team?.shortDisplayName;
  const team = entry.team?.displayName ?? entry.team?.name ?? entry.team?.shortDisplayName ?? code;

  if (!team || !code) return null;

  const wins = getStatValue(entry.stats, ['wins', 'w']) ?? 0;
  const draws = getStatValue(entry.stats, ['ties', 'draws', 'd', 't']) ?? 0;
  const losses = getStatValue(entry.stats, ['losses', 'l']) ?? 0;
  const played = getStatValue(entry.stats, ['gamesplayed', 'games played', 'gp', 'played']) ?? wins + draws + losses;

  return {
    team,
    code,
    flag: TEAM_FLAGS[code.toUpperCase()] ?? '🌐',
    played,
    wins,
    draws,
    losses,
    goalDifference: getStatValue(entry.stats, ['pointdifferential', 'goaldifference', 'goal differential', 'differential', 'gd', '+/-']) ?? 0,
    points: getStatValue(entry.stats, ['points', 'pts']) ?? 0,
  };
}

function getStatValue(stats: EspnStandingStat[] | undefined, keys: string[]) {
  const stat = stats?.find((candidate) => {
    const aliases = [candidate.name, candidate.displayName, candidate.shortDisplayName, candidate.abbreviation]
      .filter((alias): alias is string => Boolean(alias))
      .map(normalizeStatKey);

    return keys.map(normalizeStatKey).some((key) => aliases.includes(key));
  });

  if (!stat) return null;
  if (typeof stat.value === 'number') return stat.value;

  const parsedValue = Number.parseInt(stat.displayValue ?? '', 10);
  return Number.isNaN(parsedValue) ? null : parsedValue;
}

function normalizeStatKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+/-]/g, '');
}

function normalizeEspnEvent(event: EspnEvent): Match | null {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const home = competitors.find((competitor) => competitor.homeAway === 'home');
  const away = competitors.find((competitor) => competitor.homeAway === 'away');

  if (!event.id || !event.date || !home || !away) {
    return null;
  }

  return {
    id: event.id,
    date: event.date,
    status: normalizeStatus(competition?.status?.type?.state),
    statusText: competition?.status?.type?.shortDetail ?? competition?.status?.type?.detail ?? competition?.status?.type?.description ?? 'Scheduled',
    homeTeam: normalizeTeam(home),
    awayTeam: normalizeTeam(away),
    venue: competition?.venue?.fullName,
    city: competition?.venue?.address?.city,
    country: competition?.venue?.address?.country,
    round: normalizeRound(competition, event),
    broadcasts: normalizeBroadcasts(competition),
  };
}

function normalizeStatus(state?: string): MatchStatus {
  if (state === 'in') return 'live';
  if (state === 'post') return 'post';
  return 'pre';
}

function normalizeTeam(competitor: EspnCompetitor): Match['homeTeam'] {
  return {
    name: competitor.team?.displayName ?? 'TBD',
    abbreviation: competitor.team?.abbreviation ?? 'TBD',
    logo: sanitizeLogoUrl(competitor.team?.logo),
    score: competitor.score,
  };
}

function sanitizeLogoUrl(url?: string) {
  if (!url) return undefined;
  return /fifa|sofasc/i.test(url) ? undefined : url;
}

function normalizeRound(competition: EspnCompetition | undefined, event: EspnEvent) {
  const headline = competition?.notes?.find((note) => note.type === 'event')?.headline ?? competition?.notes?.[0]?.headline;
  return headline ?? event.shortName ?? event.name;
}

function normalizeBroadcasts(competition: EspnCompetition | undefined) {
  const names = competition?.broadcasts?.[0]?.names ?? [];
  return names.length > 0 ? names : undefined;
}

export const ESPN_WORLD_CUP_NEWS_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/news';

const ESPN_NEWS_TIMEOUT_MS = 10_000;
const BLOCKED_NEWS_TERMS = [
  'betting',
  'bet ',
  ' bets',
  'odds',
  'sportsbook',
  'fantasy',
  'sofascore',
  'bookmaker',
  'wager',
  'wagering',
  'gambling',
  'casino',
  'parlay',
  'draftkings',
  'fanduel',
  'betmgm',
  'caesars',
  'pointsbet',
  'sponsor',
  'sponsored',
];

type EspnNewsResponse = {
  articles?: EspnNewsArticle[];
  headlines?: EspnNewsArticle[];
};

type EspnNewsArticle = {
  id?: number | string;
  nowId?: string;
  dataSourceIdentifier?: string;
  headline?: string;
  title?: string;
  description?: string;
  type?: string;
  published?: string;
  lastModified?: string;
  byline?: string;
  source?: string;
  images?: Array<{
    url?: string;
    type?: string;
    name?: string;
    alt?: string;
  }>;
  links?: {
    web?: {
      href?: string;
    };
    mobile?: {
      href?: string;
    };
    api?: {
      news?: {
        href?: string;
      };
    };
  };
  categories?: Array<{
    description?: string;
    type?: string;
    topic?: string;
  }>;
};

export async function fetchEspnWorldCupNews(): Promise<NewsArticle[]> {
  const response = await fetch(ESPN_WORLD_CUP_NEWS_URL, {
    next: { revalidate: ESPN_REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(ESPN_NEWS_TIMEOUT_MS),
  } as RequestInit & { next: { revalidate: number } });

  if (!response.ok) {
    throw new Error(`ESPN news request failed with status ${response.status}`);
  }

  const data = (await response.json()) as EspnNewsResponse;
  const articles = normalizeEspnNews(data);

  if (articles.length === 0) {
    throw new Error('ESPN news response did not contain usable World Cup articles');
  }

  return articles;
}

export function normalizeEspnNews(data: EspnNewsResponse): NewsArticle[] {
  const seen = new Set<string>();
  const rawArticles = [...(data.articles ?? []), ...(data.headlines ?? [])];

  return rawArticles
    .map(normalizeEspnNewsArticle)
    .filter((article): article is NewsArticle => article !== null)
    .filter((article) => {
      if (seen.has(article.id)) return false;
      seen.add(article.id);
      return true;
    })
    .slice(0, 12);
}

function normalizeEspnNewsArticle(article: EspnNewsArticle): NewsArticle | null {
  const title = cleanText(article.headline ?? article.title);
  const url = article.links?.web?.href ?? article.links?.mobile?.href;

  if (!title || isBlockedNewsArticle(article, title, url)) return null;

  return {
    id: String(article.id ?? article.nowId ?? article.dataSourceIdentifier ?? stableArticleId(title, url)),
    title,
    description: cleanText(article.description),
    image: selectArticleImage(article),
    source: cleanText(article.source ?? article.byline) ?? 'ESPN',
    publishedAt: normalizePublishedAt(article.published ?? article.lastModified),
    url,
  };
}

function selectArticleImage(article: EspnNewsArticle) {
  const preferredImage = article.images?.find((image) => image.url && image.type !== 'video') ?? article.images?.find((image) => image.url);
  return preferredImage?.url;
}

function cleanText(value?: string) {
  const cleaned = value?.replace(/\s+/g, ' ').trim();
  return cleaned || undefined;
}

function normalizePublishedAt(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function stableArticleId(title: string, url?: string) {
  return `${title}-${url ?? ''}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
}

function isBlockedNewsArticle(article: EspnNewsArticle, title: string, url?: string) {
  const haystack = [
    title,
    article.description,
    article.source,
    article.byline,
    article.type,
    url,
    ...(article.categories ?? []).flatMap((category) => [category.description, category.type, category.topic]),
  ]
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .toLowerCase();

  return BLOCKED_NEWS_TERMS.some((term) => haystack.includes(term));
}
