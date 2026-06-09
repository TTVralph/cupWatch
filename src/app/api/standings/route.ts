import { NextResponse } from 'next/server';
import { getCupWatchDataService } from '@/services/data-service';

export async function GET() {
  const standings = await getCupWatchDataService().getStandings();
  return NextResponse.json({ data: standings });
}
