import { NextResponse } from 'next/server';
import { getOrCreateVisitorId } from '@/lib/server/api';

export const runtime = 'nodejs';

export async function GET() {
  const visitorId = await getOrCreateVisitorId();
  return NextResponse.json({ visitorId });
}
