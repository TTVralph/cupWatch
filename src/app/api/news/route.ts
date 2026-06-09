import { NextResponse } from 'next/server';
import { fetchEspnWorldCupNews } from '@/lib/espn';
import { mockNews } from '@/services/mock-data';
import type { NewsArticle } from '@/types/cupwatch';

const NEWS_REVALIDATE_SECONDS = 60 * 15;

export const revalidate = 900;

type NewsResponse = {
  data: NewsArticle[];
  source: 'espn' | 'mock';
  fallback: boolean;
  message?: string;
};

export async function GET() {
  try {
    const news = await fetchEspnWorldCupNews();

    return NextResponse.json<NewsResponse>(
      { data: news, source: 'espn', fallback: false },
      { headers: cacheHeaders() },
    );
  } catch (error) {
    console.error('Falling back to mock World Cup news after ESPN news failure:', error);

    return NextResponse.json<NewsResponse>(
      {
        data: mockNews,
        source: 'mock',
        fallback: true,
        message: 'Live ESPN World Cup news is temporarily unavailable, so CupWatch is showing fallback news cards.',
      },
      { headers: cacheHeaders() },
    );
  }
}

function cacheHeaders() {
  return {
    'Cache-Control': `public, s-maxage=${NEWS_REVALIDATE_SECONDS}, stale-while-revalidate=${NEWS_REVALIDATE_SECONDS}`,
  };
}
