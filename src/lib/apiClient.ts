import type { Room, SongMatchResult } from './types';

export interface AttemptResponse {
  room: Room;
  result: SongMatchResult;
}

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T | { error?: string };
  if (!response.ok) {
    const message = typeof data === 'object' && data && 'error' in data && data.error ? data.error : '请求失败';
    throw new Error(message);
  }
  return data as T;
}

export async function fetchMyRooms(): Promise<Room[]> {
  const data = await readJson<{ rooms: Room[] }>(await fetch('/api/rooms', { cache: 'no-store' }));
  return data.rooms;
}

export async function createBackendRoom(args: {
  artistId: string;
  songIds: string[];
  creatorOrder: string[];
}): Promise<Room> {
  const data = await readJson<{ room: Room }>(
    await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    }),
  );
  return data.room;
}

export async function fetchRoomByToken(token: string): Promise<Room> {
  const data = await readJson<{ room: Room }>(await fetch(`/api/rooms/${encodeURIComponent(token)}`, { cache: 'no-store' }));
  return data.room;
}

export async function submitBackendAttempt(args: {
  token: string;
  friendSongIds: string[];
  friendOrder: string[];
}): Promise<AttemptResponse> {
  return readJson<AttemptResponse>(
    await fetch(`/api/rooms/${encodeURIComponent(args.token)}/attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        friendSongIds: args.friendSongIds,
        friendOrder: args.friendOrder,
      }),
    }),
  );
}
