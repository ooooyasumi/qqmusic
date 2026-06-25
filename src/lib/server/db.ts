import 'server-only';

import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import path from 'path';

export interface RoomRow {
  id: string;
  owner_visitor_id: string;
  artist_id: string;
  artist_name: string;
  bank_id: string;
  bank_name: string;
  title: string;
  share_token: string;
  song_ids_json: string;
  creator_order_json: string;
  created_at: number;
}

export interface AttemptRow {
  id: string;
  room_id: string;
  visitor_id: string;
  friend_order_json: string;
  friend_song_ids_json: string;
  score: number;
  label: string;
  result_title: string;
  common_song_count: number;
  common_top_count: number;
  exact_count: number;
  gap_sum: number;
  created_at: number;
}

interface TableColumnRow {
  name: string;
}

let db: Database.Database | null = null;
const SCHEMA_VERSION = 3;

function databasePath(): string {
  const configured = process.env.QQMUSIC_DB_PATH;
  if (configured) return configured;
  return path.join(process.cwd(), 'data', 'qqmusic.sqlite');
}

function hasColumn(database: Database.Database, tableName: string, columnName: string): boolean {
  const rows = database.prepare(`PRAGMA table_info(${tableName})`).all() as TableColumnRow[];
  return rows.some((row) => row.name === columnName);
}

function addColumnIfMissing(
  database: Database.Database,
  tableName: string,
  columnName: string,
  definition: string,
): void {
  if (hasColumn(database, tableName, columnName)) return;
  database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`);
}

function migrate(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_visitors_last_seen
      ON visitors(last_seen DESC);

    CREATE INDEX IF NOT EXISTS idx_rooms_created
      ON rooms(created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_attempts_visitor_created
      ON attempts(visitor_id, created_at DESC);
  `);

  addColumnIfMissing(database, 'visitors', 'user_agent', 'user_agent TEXT');
  addColumnIfMissing(database, 'visitors', 'client_ip', 'client_ip TEXT');
  addColumnIfMissing(database, 'attempts', 'common_song_count', 'common_song_count INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing(database, 'attempts', 'common_top_count', 'common_top_count INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing(database, 'attempts', 'exact_count', 'exact_count INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing(database, 'attempts', 'gap_sum', 'gap_sum INTEGER NOT NULL DEFAULT 0');

  database
    .prepare(
      `INSERT INTO app_meta (key, value, updated_at)
       VALUES ('schema_version', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .run(String(SCHEMA_VERSION), Date.now());
}

export function getDb(): Database.Database {
  if (db) return db;

  const filename = databasePath();
  mkdirSync(path.dirname(filename), { recursive: true });
  db = new Database(filename);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS visitors (
      id TEXT PRIMARY KEY,
      hostname TEXT NOT NULL,
      user_agent TEXT,
      client_ip TEXT,
      created_at INTEGER NOT NULL,
      last_seen INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      owner_visitor_id TEXT NOT NULL,
      artist_id TEXT NOT NULL,
      artist_name TEXT NOT NULL,
      bank_id TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      title TEXT NOT NULL,
      share_token TEXT NOT NULL UNIQUE,
      song_ids_json TEXT NOT NULL,
      creator_order_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(owner_visitor_id) REFERENCES visitors(id)
    );

    CREATE INDEX IF NOT EXISTS idx_rooms_owner_created
      ON rooms(owner_visitor_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      friend_order_json TEXT NOT NULL,
      friend_song_ids_json TEXT NOT NULL,
      score INTEGER NOT NULL,
      label TEXT NOT NULL,
      result_title TEXT NOT NULL,
      common_song_count INTEGER NOT NULL DEFAULT 0,
      common_top_count INTEGER NOT NULL DEFAULT 0,
      exact_count INTEGER NOT NULL DEFAULT 0,
      gap_sum INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY(visitor_id) REFERENCES visitors(id)
    );

    CREATE INDEX IF NOT EXISTS idx_attempts_room_score
      ON attempts(room_id, score DESC, created_at DESC);
  `);
  migrate(db);

  return db;
}
