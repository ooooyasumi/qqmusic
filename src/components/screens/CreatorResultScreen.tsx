'use client';

import { useApp } from '@/lib/state';
import { findArtist } from '@/lib/data';
import { Orbs } from '@/components/Orbs';
import { TopBar } from '@/components/TopBar';
import { SongCover } from '@/components/SongSort';
import { ArtistName } from '@/components/ArtistName';

function rankColor(index: number): string {
  if (index === 0) return '#d4af7a';
  if (index === 1) return '#c8d0d8';
  if (index === 2) return '#b9825a';
  return 'var(--ink-secondary)';
}

export function CreatorResultScreen() {
  const { room, creatorSongs, go, notify } = useApp();
  if (!room) return null;
  const artist = findArtist(room.artistId);
  if (!artist) return null;

  return (
    <div className="screen screen-fade">
      <Orbs accent={`${artist.accent}55`} secondary="rgba(212,175,122,0.25)" />
      <TopBar title="Challenge Ready" />

      <div className="screen-content-scrollable no-scrollbar">
        <div className="relative">
          <p className="kicker">挑战已生成 · Share</p>
          <h1 className="ink-display mt-3" style={{ fontSize: 34, fontWeight: 500, lineHeight: 1.1 }}>
            分享给朋友
          </h1>
          <p className="ink-body ink-secondary mt-3" style={{ fontSize: 13.5, lineHeight: 1.7 }}>
            朋友会按同一组 6 首歌排出自己的顺序，完成后就能看到你们的默契度和双人榜单。
          </p>
        </div>

        <div className="mt-6 p-5" style={{ background: `linear-gradient(120deg, ${artist.accent}22, rgba(255,255,255,0.02))`, border: '1px solid var(--ink-faint)', borderRadius: 22 }}>
          <p className="kicker" style={{ color: artist.accent }}>
            <ArtistName name={artist.name} /> Top6
          </p>
          <div className="mt-4 flex -space-x-3">
            {creatorSongs.slice(0, 6).map((song) => (
              <SongCover key={song.id} song={song} size={52} />
            ))}
          </div>
          <ol className="mt-4 space-y-1.5">
            {creatorSongs.slice(0, 6).map((song, index) => (
              <li
                key={song.id}
                className="ink-body"
                style={{
                  display: 'flex',
                  gap: 10,
                  color: 'var(--ink-primary)',
                  fontSize: 13,
                  lineHeight: 1.55,
                }}
              >
                <span
                  className="ink-mono"
                  style={{
                    color: rankColor(index),
                    width: 18,
                    flex: '0 0 auto',
                    fontWeight: 700,
                  }}
                >
                  {index + 1}.
                </span>
                <span style={{ minWidth: 0 }}>
                  <span>{song.name}</span>
                  <span style={{ color: 'var(--ink-secondary)' }}> · {song.album}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-7">
          <div className="hairline mb-4"><span>Share Link</span></div>
          <div className="p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--ink-faint)', borderRadius: 16 }}>
            <p className="ink-mono" style={{ fontSize: 11, color: 'var(--ink-secondary)', wordBreak: 'break-all' }}>
              {room.link}
            </p>
          </div>
          <div className="mt-3">
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                navigator.clipboard?.writeText(room.link).catch(() => {});
                notify('已复制链接');
              }}
            >
              复制链接
            </button>
          </div>
        </div>

      </div>

      <div className="bottom-bar">
        <div className="flex gap-3">
          <button type="button" className="btn-secondary" onClick={() => go('home')}>创建新挑战</button>
          <button type="button" className="btn-secondary" onClick={() => go('rooms')}>我的房间</button>
        </div>
      </div>
    </div>
  );
}
