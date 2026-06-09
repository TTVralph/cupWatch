import { NextResponse } from 'next/server';
import { getCupWatchDataService } from '@/services/data-service';

export async function GET() {
  const bracket = await getCupWatchDataService().getBracket();
  return NextResponse.json({ data: bracket });
}
