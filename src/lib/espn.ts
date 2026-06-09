import type { Match, MatchStatus } from '@/types/match';

export const ESPN_WORLD_CUP_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';

const ESPN_REVALIDATE_SECONDS = 30;

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

export async function fetchEspnWorldCupMatches(): Promise<Match[]> {
  const response = await fetch(ESPN_WORLD_CUP_SCOREBOARD_URL, {
    next: { revalidate: ESPN_REVALIDATE_SECONDS },
  } as RequestInit & { next: { revalidate: number } });

  if (!response.ok) {
    throw new Error(`ESPN scoreboard request failed with status ${response.status}`);
  }

  const data = (await response.json()) as EspnScoreboard;
  return normalizeEspnScoreboard(data);
}

export function normalizeEspnScoreboard(data: EspnScoreboard): Match[] {
  return (data.events ?? []).map(normalizeEspnEvent).filter((match): match is Match => match !== null);
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
    logo: competitor.team?.logo,
    score: competitor.score,
  };
}

function normalizeRound(competition: EspnCompetition | undefined, event: EspnEvent) {
  const headline = competition?.notes?.find((note) => note.type === 'event')?.headline ?? competition?.notes?.[0]?.headline;
  return headline ?? event.shortName ?? event.name;
}

function normalizeBroadcasts(competition: EspnCompetition | undefined) {
  const names = competition?.broadcasts?.[0]?.names ?? [];
  return names.length > 0 ? names : undefined;
}
