'use client';

import { useApp } from '@/lib/state';
import { findArtist } from '@/lib/data';
import { Orbs } from '@/components/Orbs';
import { TopBar } from '@/components/TopBar';
import { SongCover } from '@/components/SongSort';
import { ArtistName } from '@/components/ArtistName';

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
            把你的同担 Top 发给朋友
          </h1>
          <p className="ink-body ink-secondary mt-3" style={{ fontSize: 13.5, lineHeight: 1.7 }}>
            好友会对你选出的 6 首歌重新排序，完成后解锁你们的默契度和双人榜单。
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
          <p className="ink-title mt-4" style={{ fontSize: 18, lineHeight: 1.45 }}>
            只有 6 首歌，快来排排看。
          </p>
        </div>

        <div className="mt-7">
          <div className="hairline mb-4"><span>Share Link</span></div>
          <div className="p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--ink-faint)', borderRadius: 16 }}>
            <p className="ink-mono" style={{ fontSize: 11, color: 'var(--ink-secondary)', wordBreak: 'break-all' }}>
              {room.link}
            </p>
          </div>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                navigator.clipboard?.writeText(room.link).catch(() => {});
                notify('已复制链接');
              }}
            >
              复制链接
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                if (typeof window !== 'undefined') window.location.hash = `room=${room.id}`;
                notify('已打开好友挑战预览');
              }}
            >
              预览挑战
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
