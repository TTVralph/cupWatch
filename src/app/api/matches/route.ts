import { NextResponse } from 'next/server';
import { getCupWatchDataService } from '@/services/data-service';

export async function GET() {
  const matches = await getCupWatchDataService().getTodayMatches();
  return NextResponse.json({ data: matches });
}
