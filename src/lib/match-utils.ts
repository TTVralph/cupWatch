import type { Match } from '@/types/match';

export const dateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
});

export function tournamentDateKey(date: string) {
  return date.slice(0, 10);
}

export function isBetween(value: string, start: string, end: string) {
  return value >= start && value <= end;
}

export function cleanRoundLabel(round?: string) {
  if (!round) return null;
  if (round.includes('@')) return null;
  if (/\bRD\d+\b/i.test(round)) return null;
  return round;
}

export function deriveStageLabel(match: Match) {
  const tournamentDate = tournamentDateKey(match.date);

  if (tournamentDate < '2026-06-28') return 'Group Stage';
  if (isBetween(tournamentDate, '2026-06-28', '2026-07-03')) return 'Round of 32';
  if (isBetween(tournamentDate, '2026-07-04', '2026-07-07')) return 'Round of 16';
  if (isBetween(tournamentDate, '2026-07-09', '2026-07-12')) return 'Quarter-finals';
  if (isBetween(tournamentDate, '2026-07-14', '2026-07-15')) return 'Semi-finals';
  if (tournamentDate === '2026-07-18') return 'Third-place match';
  if (tournamentDate === '2026-07-19') return 'Final';

  return cleanRoundLabel(match.round) ?? 'World Cup';
}

export function hasScore(match: Match) {
  return match.homeTeam.score !== undefined || match.awayTeam.score !== undefined;
}

export function scoreText(match: Match, separator = ' - ') {
  if (!hasScore(match)) return null;
  return `${match.homeTeam.score ?? 0}${separator}${match.awayTeam.score ?? 0}`;
}

export function locationText(match: Match) {
  return [match.venue, [match.city, match.country].filter(Boolean).join(', ')].filter(Boolean).join(' · ');
}

export function cityCountryText(match: Match) {
  return [match.city, match.country].filter(Boolean).join(', ');
}

export function getTeamInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function formatMatchDate(date: string) {
  return dateFormatter.format(new Date(date));
}

export function formatMatchTime(date: string) {
  return timeFormatter.format(new Date(date));
}
