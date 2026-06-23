'use client';

import { useMemo } from 'react';
import { useApp } from '@/lib/state';
import { findArtist } from '@/lib/data';
import { calculateSongMatch } from '@/lib/match';
import { Orbs } from '@/components/Orbs';
import { TopBar } from '@/components/TopBar';
import { SongCover } from '@/components/SongSort';

export function FriendResultScreen() {
  const { room, friendOrder, go, notify } = useApp();
  const artist = room ? findArtist(room.artistId) : null;
  const result = useMemo(() => {
    if (!room || !artist) return null;
    const songs = room.songIds
      .map((id) => artist.songs.find((song) => song.id === id))
      .filter((song): song is NonNullable<typeof song> => Boolean(song));
    return calculateSongMatch({
      artistId: artist.id,
      songs,
      creatorOrder: room.creatorOrder,
      friendOrder,
    });
  }, [room, artist, friendOrder]);

  if (!room || !artist || !result) return null;

  return (
    <div className="screen screen-fade">
      <Orbs accent={`${artist.accent}55`} secondary="rgba(212,175,122,0.25)" />
      <TopBar title="Match Result" />

      <div className="screen-content-scrollable no-scrollbar">
        <div className="relative flex flex-col items-center text-center pt-2">
          <p className="kicker" style={{ color: artist.accent }}>{artist.name} Top6 默契结果</p>
          <p className="ink-display mt-3" style={{ fontSize: 30, color: artist.accent, fontStyle: 'italic' }}>
            {result.title}
          </p>
          <div className="giant-number pop-in mt-2">{result.score}</div>
          <p className="ink-body ink-secondary mt-2 text-sm" style={{ lineHeight: 1.7 }}>
            {result.copy}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <MiniCard title="共同 Top3" value={`${result.commonTopCount}/3 首`} />
          <MiniCard title="晒图爆点" value={result.shareSpark} />
          <MiniCard title="最大分歧" value={result.biggestGap} />
          <MiniCard title="召唤好友" value={result.callToAction} />
        </div>

        <div className="mt-7">
          <div className="hairline mb-4"><span>你们都选了</span></div>
          <div className="flex flex-col gap-2">
            {result.sharedRows.map((row) => (
              <div key={row.song.id} className="song-rank-card" data-dragging={result.exactIds.includes(row.song.id)}>
                <span className="song-rank-no">#{row.friendRank}</span>
                <SongCover song={row.song} />
                <span className="song-rank-info">
                  <b>{row.song.name}</b>
                  <small>你 #{row.friendRank} / TA #{row.creatorRank}</small>
                </span>
                <span className="ink-mono text-xs" style={{ color: row.gap === 0 ? artist.accent : 'var(--ink-mute)' }}>
                  {row.gap === 0 ? '同位' : `${row.gap}位`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3">
          <DuelBoard title="我的 Top6" order={friendOrder} artistId={artist.id} />
          <DuelBoard title="TA 的 Top6" order={room.creatorOrder} artistId={artist.id} />
        </div>

        <div className="mt-7 flex flex-col gap-3">
          <button type="button" className="btn-primary" onClick={() => notify('已生成分享卡（占位）')}>
            分享结果
          </button>
          <button type="button" className="btn-secondary" onClick={() => go('home')}>
            再选艺人
          </button>
        </div>
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
          const song = artist.songs.find((item) => item.id === id);
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
