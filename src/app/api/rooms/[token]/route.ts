import { NextResponse } from 'next/server';
import { deleteRoomByToken, findRoomByToken, jsonError, RoomDeletedError } from '@/lib/server/api';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let room;
  try {
    room = await findRoomByToken(token);
  } catch (error) {
    if (error instanceof RoomDeletedError) return jsonError('Room deleted', 410);
    throw error;
  }
  if (!room) return jsonError('Room not found', 404);
  return NextResponse.json({ room });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    await deleteRoomByToken(token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete room';
    return jsonError(message, message === 'Room not found' ? 404 : message === 'Forbidden' ? 403 : 400);
  }
}
