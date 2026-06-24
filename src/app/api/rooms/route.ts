import { NextRequest, NextResponse } from 'next/server';
import { createRoomFromPayload, jsonError, listMyRooms } from '@/lib/server/api';

export const runtime = 'nodejs';

export async function GET() {
  const rooms = await listMyRooms();
  return NextResponse.json({ rooms });
}

export async function POST(request: NextRequest) {
  try {
    const room = await createRoomFromPayload(await request.json());
    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to create room');
  }
}
