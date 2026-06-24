'use client';

import { useApp } from '@/lib/state';
import { findArtist } from '@/lib/data';
import { Orbs } from '@/components/Orbs';
import { TopBar } from '@/components/TopBar';
import { ArtistName } from '@/components/ArtistName';

export function ShareResultScreen() {
  const { room, go, setArtist } = useApp();
  const artist = room ? findArtist(room.artistId) : null;

  if (!room || !artist) return null;

  return (
    <div className="screen screen-fade">
      <Orbs accent={`${artist.accent}55`} secondary="rgba(212,175,122,0.25)" />
      <TopBar title="Share Result" showBack={false} />

      <div className="screen-content-scrollable no-scrollbar">
        <div className="relative text-center pt-4">
          <p className="kicker" style={{ color: artist.accent }}>
            <ArtistName name={artist.name} /> Top6
          </p>
          <h1 className="ink-display mt-3" style={{ fontSize: 34, fontWeight: 500, lineHeight: 1.1 }}>
            分享结果
          </h1>
          <p className="ink-body ink-secondary mt-3" style={{ fontSize: 13.5, lineHeight: 1.7 }}>
            这里先保留为分享卡占位。后续可以放生成图片、保存海报、转发文案等能力。
          </p>
        </div>

        <div
          className="mt-8 p-8 text-center"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed var(--ink-faint)',
            borderRadius: 24,
          }}
        >
          <p className="ink-display" style={{ fontSize: 58, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
            SOON
          </p>
          <p className="ink-body ink-secondary mt-3">分享结果模块占位</p>
        </div>
      </div>

      <div className="bottom-bar">
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setArtist(room.artistId);
            go('home', false);
          }}
        >
          发起挑战
        </button>
      </div>
    </div>
  );
}
