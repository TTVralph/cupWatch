import { NextResponse } from 'next/server';
import { fetchEspnWorldCupMatches } from '@/lib/espn';
import { mockTodayMatches } from '@/services/mock-data';

export const revalidate = 30;

type MatchesResponse = {
  data: typeof mockTodayMatches;
  source: 'espn' | 'mock';
  fallback: boolean;
  message?: string;
};

export async function GET() {
  try {
    const matches = await fetchEspnWorldCupMatches();

    return NextResponse.json<MatchesResponse>(
      { data: matches, source: 'espn', fallback: false },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=30' } },
    );
  } catch (error) {
    console.error('Falling back to mock World Cup matches after ESPN scoreboard failure:', error);

    return NextResponse.json<MatchesResponse>(
      {
        data: mockTodayMatches,
        source: 'mock',
        fallback: true,
        message: 'Live ESPN match data is temporarily unavailable, so CupWatch is showing fallback matches.',
      },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=30' } },
    );
  }
}
