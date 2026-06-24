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
            排一份你的私藏 Top6
          </h1>
          <p className="ink-body ink-secondary mt-3" style={{ fontSize: 13.5, lineHeight: 1.7 }}>
            长按拖动卡片，把本命曲放到最有分量的位置。
          </p>
        </div>

        <div className="mt-6">
          <SortableSongList songs={creatorSongs} onMove={reorderCreator} />
        </div>

      </div>

      <div className="bottom-bar">
        <div className="flex gap-3">
          <button type="button" className="btn-secondary" onClick={() => go('artist')}>
            返回换歌
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              void createRoom().then((room) => {
                if (room) notify('挑战已生成');
              });
            }}
          >
            生成挑战
          </button>
        </div>
      </div>
    </div>
  );
}
