import { NextResponse } from 'next/server';
import { findRoomByToken, jsonError } from '@/lib/server/api';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const room = await findRoomByToken(token);
  if (!room) return jsonError('Room not found', 404);
  return NextResponse.json({ room });
}
