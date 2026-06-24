'use client';

import { useApp } from '@/lib/state';
import { findArtist } from '@/lib/data';
import { Orbs } from '@/components/Orbs';
import { TopBar } from '@/components/TopBar';
import { SortableSongList } from '@/components/SongSort';

export function AnswerScreen({ role }: { role: 'creator' | 'friend' }) {
  const {
    artistId,
    creatorSongs,
    friendSongs,
    reorderCreator,
    reorderFriend,
    createRoom,
    finishFriend,
    notify,
  } = useApp();
  const artist = findArtist(artistId);
  if (!artist) return null;
  const isFriend = role === 'friend';
  const songs = isFriend ? friendSongs : creatorSongs;

  return (
    <div className="screen screen-fade">
      <Orbs accent={`${artist.accent}55`} secondary="rgba(212,175,122,0.25)" />
      <TopBar title={isFriend ? 'Friend Top6' : 'Creator Top6'} />

      <div className="screen-content-scrollable no-scrollbar">
        <div className="relative">
          <p className="kicker">{isFriend ? '好友挑战中' : '正在排序'}</p>
          <h1 className="ink-display mt-3" style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.1 }}>
            {isFriend ? '排出你心里的 Top 顺序' : '拖动排出你的真实 Top 顺序'}
          </h1>
          <p className="ink-body ink-secondary mt-3" style={{ fontSize: 13.5, lineHeight: 1.7 }}>
            按住歌曲卡片上下拖动。最喜欢的放在第一位。
          </p>
        </div>

        <div className="mt-6">
          <SortableSongList songs={songs} onMove={isFriend ? reorderFriend : reorderCreator} />
        </div>

      </div>

      <div className="bottom-bar">
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            if (isFriend) {
              finishFriend();
              return;
            }
            const room = createRoom();
            if (room) notify('挑战已生成');
          }}
        >
          {isFriend ? '查看默契' : '生成挑战'}
        </button>
      </div>
    </div>
  );
}
