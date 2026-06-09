import { NextResponse } from 'next/server';
import { fetchEspnWorldCupStandings } from '@/lib/espn';
import { mockStandings } from '@/services/mock-data';

export const revalidate = 30;

type StandingsResponse = {
  data: typeof mockStandings;
  source: 'espn' | 'mock';
  fallback: boolean;
  message?: string;
};

export async function GET() {
  try {
    const standings = await fetchEspnWorldCupStandings();

    return NextResponse.json<StandingsResponse>(
      { data: standings, source: 'espn', fallback: false },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=30' } },
    );
  } catch (error) {
    console.error('Falling back to mock World Cup standings after ESPN standings failure:', error);

    return NextResponse.json<StandingsResponse>(
      {
        data: mockStandings,
        source: 'mock',
        fallback: true,
        message: 'Live standings are temporarily unavailable, so CupWatch is showing saved group tables until the live feed returns.',
      },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=30' } },
    );
  }
}
