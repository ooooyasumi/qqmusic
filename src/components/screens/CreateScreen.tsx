'use client';

import { useApp } from '@/lib/state';
import { findArtist } from '@/lib/data';
import { Orbs } from '@/components/Orbs';
import { TopBar } from '@/components/TopBar';
import { SortableSongList } from '@/components/SongSort';

export function CreateScreen() {
  const { artistId, creatorSongs, reorderCreator, createRoom, go, notify } = useApp();
  const artist = findArtist(artistId);
  if (!artist) return null;

  return (
    <div className="screen screen-fade">
      <Orbs accent={`${artist.accent}55`} secondary="rgba(212,175,122,0.25)" />
      <TopBar title="Drag Top6" />

      <div className="screen-content-scrollable no-scrollbar">
        <div className="relative">
          <p className="kicker">正在排序 · Creator Top6</p>
          <h1 className="ink-display mt-3" style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.1 }}>
            拖动排出你的真实 Top 顺序
          </h1>
          <p className="ink-body ink-secondary mt-3" style={{ fontSize: 13.5, lineHeight: 1.7 }}>
            把最喜欢的拖到最上面。好友会对同一组 6 首歌重新排序，然后计算你们的默契度。
          </p>
        </div>

        <div className="mt-6">
          <SortableSongList songs={creatorSongs} onMove={reorderCreator} />
        </div>

        <div className="mt-7 flex gap-3">
          <button type="button" className="btn-secondary" onClick={() => go('artist')}>
            返回换歌
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              const room = createRoom();
              if (room) notify('挑战已生成');
            }}
          >
            生成挑战
          </button>
        </div>
      </div>
    </div>
  );
}
