import { NextResponse } from 'next/server';
import { getCupWatchDataService } from '@/services/data-service';

export async function GET() {
  const news = await getCupWatchDataService().getNews();
  return NextResponse.json({ data: news });
}
