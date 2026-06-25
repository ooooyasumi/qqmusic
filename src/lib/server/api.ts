import 'server-only';

import { cookies, headers } from 'next/headers';
import { randomBytes, randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { findArtist } from '@/lib/data';
import { findCatalogSong } from '@/lib/appleMusicCatalog';
import { calculateSongMatch, generateRoomTitle } from '@/lib/match';
import type { Room, Song, SongMatchResult } from '@/lib/types';
import { getDb, type AttemptRow, type RoomRow } from './db';

export const VISITOR_COOKIE = 'tongdan_moqi_visitor';
const REQUIRED_COUNT = 6;

interface RankingRow {
  name: string;
  score: number;
  label: string;
}

export interface StoredRoom extends Room {
  shareToken: string;
}

export interface StoredAttempt {
  id: string;
  roomId: string;
  visitorId: string;
  friendOrder: string[];
  friendSongIds: string[];
  score: number;
  label: string;
  resultTitle: string;
  createdAt: number;
}

export interface SubmitResult {
  room: StoredRoom;
  attempt: StoredAttempt;
  result: SongMatchResult;
}

export interface RoomCollections {
  owned: StoredRoom[];
  participated: StoredRoom[];
}

export class RoomDeletedError extends Error {
  constructor() {
    super('Room deleted');
    this.name = 'RoomDeletedError';
  }
}

interface RequestClientInfo {
  hostname: string;
  userAgent: string | null;
  clientIp: string | null;
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function parseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string') ? parsed : [];
  } catch {
    return [];
  }
}

function rankingFromRows(rows: AttemptRow[]): RankingRow[] {
  return rows.map((row, index) => ({
    name: `好友 ${String(index + 1).padStart(2, '0')}`,
    score: row.score,
    label: row.label,
  }));
}

function rankedAttemptRowsForRoom(row: RoomRow): AttemptRow[] {
  return getDb()
    .prepare(
      `SELECT a.*
       FROM attempts a
       WHERE a.room_id = ?
         AND a.visitor_id != ?
         AND a.id = (
           SELECT b.id
           FROM attempts b
           WHERE b.room_id = a.room_id
             AND b.visitor_id = a.visitor_id
           ORDER BY b.score DESC, b.created_at DESC
           LIMIT 1
         )
       ORDER BY a.score DESC, a.created_at DESC
       LIMIT 5`,
    )
    .all(row.id, row.owner_visitor_id) as AttemptRow[];
}

function bestAttemptRowForVisitor(roomId: string, visitorId: string): AttemptRow | null {
  return (
    (getDb()
      .prepare(
        `SELECT *
         FROM attempts
         WHERE room_id = ? AND visitor_id = ?
         ORDER BY score DESC, created_at DESC
         LIMIT 1`,
      )
      .get(roomId, visitorId) as AttemptRow | undefined) ?? null
  );
}

function relationForRoom(row: RoomRow, visitorId: string, myAttempt: StoredAttempt | null): StoredRoom['relation'] {
  if (row.owner_visitor_id === visitorId) return 'owned';
  if (myAttempt) return 'participated';
  return 'invited';
}

export function roomFromRow(
  row: RoomRow,
  origin: string,
  rankings: RankingRow[] = [],
  options: { myAttempt?: StoredAttempt | null; relation?: StoredRoom['relation'] } = {},
): StoredRoom {
  const link = `${origin}/?challenge=${encodeURIComponent(row.share_token)}`;
  return {
    id: row.id,
    shareToken: row.share_token,
    artistId: row.artist_id,
    artistName: row.artist_name,
    bankId: row.bank_id,
    bankName: row.bank_name,
    title: row.title,
    link,
    questionIds: parseStringArray(row.song_ids_json),
    creatorAnswers: {},
    songIds: parseStringArray(row.song_ids_json),
    creatorOrder: parseStringArray(row.creator_order_json),
    rankings,
    createdAt: row.created_at,
    myAttempt: options.myAttempt ?? null,
    relation: options.relation,
  };
}

function attemptFromRow(row: AttemptRow): StoredAttempt {
  return {
    id: row.id,
    roomId: row.room_id,
    visitorId: row.visitor_id,
    friendOrder: parseStringArray(row.friend_order_json),
    friendSongIds: parseStringArray(row.friend_song_ids_json),
    score: row.score,
    label: row.label,
    resultTitle: row.result_title,
    createdAt: row.created_at,
  };
}

export async function getOrigin(): Promise<string> {
  const h = await headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:5000';
  return `${proto}://${host}`;
}

async function getRequestClientInfo(): Promise<RequestClientInfo> {
  const h = await headers();
  const forwardedFor = h.get('x-forwarded-for');
  const clientIp = forwardedFor?.split(',')[0]?.trim() || h.get('x-real-ip');
  return {
    hostname: h.get('x-forwarded-host') ?? h.get('host') ?? 'unknown',
    userAgent: h.get('user-agent'),
    clientIp,
  };
}

export async function getOrCreateVisitorId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(VISITOR_COOKIE)?.value;
  const clientInfo = await getRequestClientInfo();
  const now = Date.now();
  const db = getDb();

  if (existing) {
    db.prepare('UPDATE visitors SET hostname = ?, user_agent = ?, client_ip = ?, last_seen = ? WHERE id = ?').run(
      clientInfo.hostname,
      clientInfo.userAgent,
      clientInfo.clientIp,
      now,
      existing,
    );
    const found = db.prepare('SELECT id FROM visitors WHERE id = ?').get(existing) as { id: string } | undefined;
    if (found) return existing;
  }

  const id = `visitor-${randomBytes(8).toString('hex')}`;
  db.prepare(
    'INSERT INTO visitors (id, hostname, user_agent, client_ip, created_at, last_seen) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(id, clientInfo.hostname, clientInfo.userAgent, clientInfo.clientIp, now, now);
  cookieStore.set(VISITOR_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });
  return id;
}

function assertSixSongIds(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length !== REQUIRED_COUNT || !value.every((item) => typeof item === 'string')) {
    throw new Error(`${field} must contain exactly 6 song ids`);
  }
  return value;
}

function songsForOrders(artistId: string, ...orders: string[][]): Song[] {
  const artist = findArtist(artistId);
  if (!artist) return [];
  const ids = [...new Set(orders.flat())];
  return ids
    .map((id) => findCatalogSong(artistId, id) ?? artist.songs.find((song) => song.id === id))
    .filter((song): song is Song => Boolean(song));
}

export async function createRoomFromPayload(payload: unknown): Promise<StoredRoom> {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid payload');
  const data = payload as Record<string, unknown>;
  const artistId = typeof data.artistId === 'string' ? data.artistId : '';
  const artist = findArtist(artistId);
  if (!artist) throw new Error('Unknown artist');
  const songIds = assertSixSongIds(data.songIds, 'songIds');
  const creatorOrder = assertSixSongIds(data.creatorOrder, 'creatorOrder');
  const knownIds = new Set(songsForOrders(artistId, songIds, creatorOrder).map((song) => song.id));
  if (![...songIds, ...creatorOrder].every((id) => knownIds.has(id))) {
    throw new Error('Unknown song id');
  }

  const visitorId = await getOrCreateVisitorId();
  const origin = await getOrigin();
  const now = Date.now();
  const legacyId = optionalString(data.legacyId);
  const legacyShareToken = optionalString(data.shareToken);
  const id = legacyId && /^room-[a-zA-Z0-9_-]+$/.test(legacyId) ? legacyId : `room-${randomBytes(8).toString('hex')}`;
  const shareToken =
    legacyShareToken && /^[a-zA-Z0-9_-]+$/.test(legacyShareToken)
      ? legacyShareToken
      : randomBytes(12).toString('base64url');
  const existing = getDb()
    .prepare('SELECT * FROM rooms WHERE id = ? OR share_token = ?')
    .get(id, shareToken) as RoomRow | undefined;
  if (existing) return roomFromRow(existing, origin);
  const bankName = 'Top6 排序';
  const title = generateRoomTitle(artist.name, bankName);
  const createdAt = typeof data.createdAt === 'number' && Number.isFinite(data.createdAt) ? data.createdAt : now;
  getDb()
    .prepare(
      `INSERT INTO rooms (
        id, owner_visitor_id, artist_id, artist_name, bank_id, bank_name, title,
        share_token, song_ids_json, creator_order_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      visitorId,
      artistId,
      artist.name,
      'top6',
      bankName,
      title,
      shareToken,
      JSON.stringify(songIds),
      JSON.stringify(creatorOrder),
      createdAt,
    );

  return roomFromRow(
    {
      id,
      owner_visitor_id: visitorId,
      artist_id: artistId,
      artist_name: artist.name,
      bank_id: 'top6',
      bank_name: bankName,
      title,
      share_token: shareToken,
      song_ids_json: JSON.stringify(songIds),
    creator_order_json: JSON.stringify(creatorOrder),
    created_at: createdAt,
    deleted_at: null,
    },
    origin,
    [],
    { relation: 'owned' },
  );
}

export async function findRoomByToken(token: string): Promise<StoredRoom | null> {
  const row = getDb().prepare('SELECT * FROM rooms WHERE share_token = ? OR id = ?').get(token, token) as
    | RoomRow
    | undefined;
  if (!row) return null;
  if (row.deleted_at) throw new RoomDeletedError();
  const visitorId = await getOrCreateVisitorId();
  const myAttemptRow = bestAttemptRowForVisitor(row.id, visitorId);
  const myAttempt = myAttemptRow ? attemptFromRow(myAttemptRow) : null;
  const attempts = rankedAttemptRowsForRoom(row);
  return roomFromRow(row, await getOrigin(), rankingFromRows(attempts), {
    myAttempt,
    relation: relationForRoom(row, visitorId, myAttempt),
  });
}

export async function listMyRooms(): Promise<StoredRoom[]> {
  const visitorId = await getOrCreateVisitorId();
  const rows = getDb()
    .prepare('SELECT * FROM rooms WHERE owner_visitor_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 50')
    .all(visitorId) as RoomRow[];
  const origin = await getOrigin();
  return roomsFromRows(rows, origin, visitorId, 'owned');
}

function roomsFromRows(
  rows: RoomRow[],
  origin: string,
  visitorId: string,
  fallbackRelation?: StoredRoom['relation'],
): StoredRoom[] {
  return rows.map((row) => {
    const myAttemptRow = bestAttemptRowForVisitor(row.id, visitorId);
    const myAttempt = myAttemptRow ? attemptFromRow(myAttemptRow) : null;
    const attempts = rankedAttemptRowsForRoom(row);
    return roomFromRow(row, origin, rankingFromRows(attempts), {
      myAttempt,
      relation: fallbackRelation ?? relationForRoom(row, visitorId, myAttempt),
    });
  });
}

export async function listMyRoomCollections(): Promise<RoomCollections> {
  const visitorId = await getOrCreateVisitorId();
  const db = getDb();
  const ownedRows = db
    .prepare('SELECT * FROM rooms WHERE owner_visitor_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 50')
    .all(visitorId) as RoomRow[];
  const participatedRows = db
    .prepare(
      `SELECT r.*
       FROM rooms r
       JOIN attempts a ON a.room_id = r.id
       WHERE a.visitor_id = ? AND r.owner_visitor_id != ? AND r.deleted_at IS NULL
       GROUP BY r.id
       ORDER BY MAX(a.created_at) DESC
       LIMIT 50`,
    )
    .all(visitorId, visitorId) as RoomRow[];
  const origin = await getOrigin();
  return {
    owned: roomsFromRows(ownedRows, origin, visitorId, 'owned'),
    participated: roomsFromRows(participatedRows, origin, visitorId, 'participated'),
  };
}

export async function submitAttempt(token: string, payload: unknown): Promise<SubmitResult> {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid payload');
  const data = payload as Record<string, unknown>;
  const friendSongIds = assertSixSongIds(data.friendSongIds, 'friendSongIds');
  const friendOrder = assertSixSongIds(data.friendOrder, 'friendOrder');
  const room = await findRoomByToken(token);
  if (!room) throw new Error('Room not found');

  const songs = songsForOrders(room.artistId, room.creatorOrder, friendOrder);
  const result = calculateSongMatch({
    artistId: room.artistId,
    songs,
    creatorOrder: room.creatorOrder,
    friendOrder,
  });

  const visitorId = await getOrCreateVisitorId();
  const now = Date.now();
  const id = `attempt-${randomUUID()}`;
  getDb()
    .prepare(
      `INSERT INTO attempts (
        id, room_id, visitor_id, friend_order_json, friend_song_ids_json,
        score, label, result_title, common_song_count, common_top_count,
        exact_count, gap_sum, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      room.id,
      visitorId,
      JSON.stringify(friendOrder),
      JSON.stringify(friendSongIds),
      result.score,
      result.title,
      result.title,
      result.commonSongCount,
      result.commonTopCount,
      result.exactIds.length,
      result.gapSum,
      now,
    );

  const attempt: StoredAttempt = {
    id,
    roomId: room.id,
    visitorId,
    friendOrder,
    friendSongIds,
    score: result.score,
    label: result.title,
    resultTitle: result.title,
    createdAt: now,
  };

  const updatedRoom = (await findRoomByToken(token)) ?? room;
  return { room: updatedRoom, attempt, result };
}

export async function deleteRoomByToken(token: string): Promise<void> {
  const visitorId = await getOrCreateVisitorId();
  const row = getDb()
    .prepare('SELECT * FROM rooms WHERE share_token = ? OR id = ?')
    .get(token, token) as RoomRow | undefined;
  if (!row) throw new Error('Room not found');
  if (row.owner_visitor_id !== visitorId) throw new Error('Forbidden');
  if (row.deleted_at) return;
  getDb()
    .prepare('UPDATE rooms SET deleted_at = ? WHERE id = ?')
    .run(Date.now(), row.id);
}

export function jsonError(message: string, status = 400): NextResponse<{ error: string }> {
  return NextResponse.json({ error: message }, { status });
}
