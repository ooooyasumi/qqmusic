'use client';

import { useMemo } from 'react';
import { useApp } from '@/lib/state';
import { findArtist } from '@/lib/data';
import { findCatalogSong } from '@/lib/appleMusicCatalog';
import { calculateSongMatch } from '@/lib/match';
import { Orbs } from '@/components/Orbs';
import { TopBar } from '@/components/TopBar';
import { SongCover } from '@/components/SongSort';
import { ArtistName } from '@/components/ArtistName';
import type { Attempt, Room } from '@/lib/types';

const REQUIRED_COUNT = 6;

function isCompleteAttemptForRoom(room: Room, attempt: Attempt | null | undefined): attempt is Attempt {
  return Boolean(
    attempt &&
      attempt.roomId === room.id &&
      attempt.friendOrder.length === REQUIRED_COUNT &&
      attempt.friendSongIds.length === REQUIRED_COUNT,
  );
}

export function FriendResultScreen() {
  const { room, friendOrder, currentAttempt, activeChallengeToken, go } = useApp();
  const artist = room ? findArtist(room.artistId) : null;
  const persistedAttempt = room && isCompleteAttemptForRoom(room, room.myAttempt) ? room.myAttempt : null;
  const liveAttempt = room && isCompleteAttemptForRoom(room, currentAttempt) ? currentAttempt : null;
  const resultFriendOrder =
    liveAttempt
      ? liveAttempt.friendOrder
      : persistedAttempt?.friendOrder ?? friendOrder;
  const result = useMemo(() => {
    if (!room || !artist || resultFriendOrder.length !== REQUIRED_COUNT) return null;
    const ids = [...new Set([...room.creatorOrder, ...resultFriendOrder])];
    const songs = ids
      .map((id) => findCatalogSong(artist.id, id) ?? artist.songs.find((song) => song.id === id))
      .filter((song): song is NonNullable<typeof song> => Boolean(song));
    return calculateSongMatch({
      artistId: artist.id,
      songs,
      creatorOrder: room.creatorOrder,
      friendOrder: resultFriendOrder,
    });
  }, [room, artist, resultFriendOrder]);

  if (!room || !artist || !result) return null;

  return (
    <div className="screen screen-fade">
      <Orbs accent={`${artist.accent}55`} secondary="rgba(212,175,122,0.25)" />
      <TopBar title="Match Result" showBack={!activeChallengeToken} />

      <div className="screen-content-scrollable no-scrollbar friend-result-content">
        <div className="relative flex flex-col items-center text-center">
          <p className="kicker" style={{ color: artist.accent }}>
            <ArtistName name={artist.name} /> Top6 默契结果
          </p>
        </div>

        <div className="friend-result-score-block text-center">
          <div className="friend-result-score pop-in">{result.score}</div>
          <p className="ink-display friend-result-title" style={{ color: artist.accent }}>
            {result.title}
          </p>
          <p className="ink-body ink-secondary friend-result-copy">
            {result.copy}
          </p>
        </div>

        <div className="friend-result-grid grid grid-cols-2 gap-3">
          <MiniCard title="共同歌单" value={`${result.commonSongCount}/6 首`} />
          <MiniCard title="Top3 同频" value={`${result.commonTopCount}/3 首`} />
          <MiniCard title="顺位同频" value={`${result.exactIds.length}/6 首`} />
          <MiniCard title={result.biggestGap === '完全同频' ? '最大分歧' : '最想争的一首'} value={result.biggestGap} />
        </div>

        <div className="friend-result-duel grid grid-cols-2 gap-3">
          <DuelBoard title="我的 Top6" order={resultFriendOrder} artistId={artist.id} />
          <DuelBoard title="TA 的 Top6" order={room.creatorOrder} artistId={artist.id} />
        </div>

      </div>

      <div className="bottom-bar">
        <button type="button" className="btn-primary" onClick={() => go('home')}>
          我也要创建挑战
        </button>
      </div>
    </div>
  );
}

function MiniCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--ink-faint)', borderRadius: 16 }}>
      <p className="kicker" style={{ letterSpacing: '0.18em' }}>{title}</p>
      <p className="ink-title mt-2" style={{ fontSize: 14, lineHeight: 1.45 }}>{value}</p>
    </div>
  );
}

function DuelBoard({ title, order, artistId }: { title: string; order: string[]; artistId: string }) {
  const artist = findArtist(artistId);
  if (!artist) return null;
  return (
    <div className="p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--ink-faint)', borderRadius: 16 }}>
      <p className="kicker mb-3" style={{ letterSpacing: '0.18em' }}>{title}</p>
      <div className="flex flex-col gap-2">
        {order.map((id, index) => {
          const song = findCatalogSong(artist.id, id) ?? artist.songs.find((item) => item.id === id);
          if (!song) return null;
          return (
            <div key={id} className="flex items-center gap-2 min-w-0">
              <span className="ink-mono" style={{ fontSize: 10, color: 'var(--ink-mute)', width: 14 }}>{index + 1}</span>
              <SongCover song={song} size={30} />
              <span className="ink-mute text-xs truncate">{song.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
