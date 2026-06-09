import { NextRequest, NextResponse } from 'next/server';
import { fetchEspnWorldCupMatches, toEspnDateString } from '@/lib/espn';
import { mockTodayMatches } from '@/services/mock-data';
import type { Match } from '@/types/match';

const MATCHES_REVALIDATE_SECONDS = 60 * 15;

export const revalidate = 900;

type MatchesResponse = {
  data: Match[];
  source: 'espn' | 'mock';
  fallback: boolean;
  message?: string;
};

export async function GET(request: NextRequest) {
  const dateFilter = getDateFilter(request.nextUrl.searchParams);
  const espnDateFilter = dateFilter ? toEspnDateString(dateFilter) : null;

  try {
    const matches = await fetchEspnWorldCupMatches(espnDateFilter ? [espnDateFilter] : undefined);
    const data = filterMatchesByDate(matches, dateFilter);

    return NextResponse.json<MatchesResponse>(
      { data, source: 'espn', fallback: false },
      { headers: cacheHeaders() },
    );
  } catch (error) {
    console.error('Falling back to mock World Cup matches after ESPN scoreboard failure:', error);

    return NextResponse.json<MatchesResponse>(
      {
        data: filterMatchesByDate(mockTodayMatches, dateFilter),
        source: 'mock',
        fallback: true,
        message: 'Live match data is temporarily unavailable, so CupWatch is showing saved fixtures until the live feed returns.',
      },
      { headers: cacheHeaders() },
    );
  }
}

function getDateFilter(searchParams: URLSearchParams) {
  const requestedDate = searchParams.get('date');
  if (requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) return requestedDate;

  if (searchParams.get('today') === 'true') return toIsoDate(new Date());

  return null;
}

function filterMatchesByDate(matches: Match[], dateFilter: string | null) {
  if (!dateFilter) return matches;

  return matches.filter((match) => toIsoDate(new Date(match.date)) === dateFilter);
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function cacheHeaders() {
  return {
    'Cache-Control': `public, s-maxage=${MATCHES_REVALIDATE_SECONDS}, stale-while-revalidate=${MATCHES_REVALIDATE_SECONDS}`,
  };
}
