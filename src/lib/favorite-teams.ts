import type { Match } from '@/types/match';

export const FAVORITE_TEAMS_STORAGE_KEY = 'cupwatch.favoriteTeams';
export const FAVORITE_TEAMS_CHANGE_EVENT = 'cupwatch:favoriteTeamsChanged';

export type FavoriteTeam = {
  name: string;
  abbreviation: string;
  logo?: string;
};

type BrowserStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function normalizeTeamCode(value: string) {
  return value.trim().toUpperCase();
}

function uniqueTeamCodes(values: string[]) {
  return Array.from(new Set(values.map(normalizeTeamCode).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export function parseFavoriteTeams(value: string | null) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return uniqueTeamCodes(parsed.filter((item): item is string => typeof item === 'string'));
  } catch {
    return [];
  }
}

export function readFavoriteTeams(storage?: BrowserStorage | null) {
  if (!storage) return [];

  try {
    const storedValue = storage.getItem(FAVORITE_TEAMS_STORAGE_KEY);
    const favorites = parseFavoriteTeams(storedValue);

    if (storedValue && favorites.length === 0) {
      storage.removeItem(FAVORITE_TEAMS_STORAGE_KEY);
    }

    return favorites;
  } catch {
    return [];
  }
}

export function saveFavoriteTeams(favorites: string[], storage?: BrowserStorage | null) {
  const normalizedFavorites = uniqueTeamCodes(favorites);

  if (!storage) return normalizedFavorites;

  try {
    storage.setItem(FAVORITE_TEAMS_STORAGE_KEY, JSON.stringify(normalizedFavorites));
  } catch {
    return normalizedFavorites;
  }

  return normalizedFavorites;
}

export function addFavoriteTeam(favorites: string[], teamCode: string) {
  return uniqueTeamCodes([...favorites, teamCode]);
}

export function removeFavoriteTeam(favorites: string[], teamCode: string) {
  const normalizedTeamCode = normalizeTeamCode(teamCode);
  return favorites.map(normalizeTeamCode).filter((favorite) => favorite !== normalizedTeamCode);
}

export function toggleFavoriteTeam(favorites: string[], teamCode: string) {
  const normalizedTeamCode = normalizeTeamCode(teamCode);
  return favorites.map(normalizeTeamCode).includes(normalizedTeamCode) ? removeFavoriteTeam(favorites, normalizedTeamCode) : addFavoriteTeam(favorites, normalizedTeamCode);
}

export function getTeamsFromMatches(matches: Match[]) {
  const teams = new Map<string, FavoriteTeam>();

  for (const match of matches) {
    teams.set(normalizeTeamCode(match.homeTeam.abbreviation), {
      name: match.homeTeam.name,
      abbreviation: normalizeTeamCode(match.homeTeam.abbreviation),
      logo: match.homeTeam.logo,
    });
    teams.set(normalizeTeamCode(match.awayTeam.abbreviation), {
      name: match.awayTeam.name,
      abbreviation: normalizeTeamCode(match.awayTeam.abbreviation),
      logo: match.awayTeam.logo,
    });
  }

  return Array.from(teams.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function matchInvolvesFavoriteTeam(match: Match, favorites: string[]) {
  const favoriteSet = new Set(favorites.map(normalizeTeamCode));

  return favoriteSet.has(normalizeTeamCode(match.homeTeam.abbreviation)) || favoriteSet.has(normalizeTeamCode(match.awayTeam.abbreviation));
}
