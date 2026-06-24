'use client';

import { useMemo } from 'react';
import { useApp } from '@/lib/state';
import { findArtist } from '@/lib/data';
import { getCatalogSongsByArtist } from '@/lib/appleMusicCatalog';
import { Orbs } from '@/components/Orbs';
import { TopBar } from '@/components/TopBar';
import { SongChoiceButton } from '@/components/SongSort';
import { ArtistPageHero } from '@/components/ArtistPageHero';
import { SelectionReviewBottomBar } from '@/components/SelectionReviewBottomBar';
import type { Song } from '@/lib/types';

function featuredSongs(artistSongs: Song[], catalogSongs: Song[], featuredSongIds?: string[]): Song[] {
  if (!featuredSongIds?.length) {
    return catalogSongs.slice(0, 6);
  }

  const allSongs = [...catalogSongs, ...artistSongs];
  return featuredSongIds
    .map((id) => allSongs.find((song) => song.id === id))
    .filter((song): song is Song => Boolean(song));
}

export function ArtistScreen({ mode = 'creator' }: { mode?: 'creator' | 'friend' }) {
  const {
    artistId,
    selectedSongIds,
    selectedSongs,
    toggleSong,
    clearSongs,
    startCreatorSort,
    startFriendSort,
    notify,
    go,
  } = useApp();
  const artist = findArtist(artistId);
  const isFriend = mode === 'friend';
  const songs = useMemo(() => {
    if (!artist) return [];
    const catalogSongs = getCatalogSongsByArtist(artist.id);
    return featuredSongs(artist.songs, catalogSongs, artist.featuredSongIds);
  }, [artist]);

  if (!artist) return null;

  return (
    <div className="screen screen-fade">
      <Orbs accent={`${artist.accent}55`} secondary="rgba(212,175,122,0.25)" />
      <TopBar title={`${artist.short} Top6`} showBack={!isFriend} />

      <div className="screen-content-scrollable no-scrollbar">
        {isFriend && (
          <div
            className="mb-5 p-4"
            style={{
              background: `linear-gradient(120deg, ${artist.accent}24, rgba(255,255,255,0.025))`,
              border: '1px solid var(--ink-faint)',
              borderRadius: 18,
            }}
          >
            <p className="kicker" style={{ color: artist.accent }}>Friend Invite</p>
            <p className="ink-title mt-2" style={{ fontSize: 17, lineHeight: 1.4 }}>
              朋友邀请你选 6 首歌，测一测你们的同担 Top 默契。
            </p>
            <p className="ink-body ink-secondary mt-2" style={{ fontSize: 12.5, lineHeight: 1.65 }}>
              选完后按自己的偏好排序，系统会直接算出你们的同单默契值。
            </p>
          </div>
        )}
        <ArtistPageHero
          artist={artist}
          eyebrow="Pick 6 Songs"
          copy="选择 6 首最喜欢的音乐"
        />

        <div className="mt-6 flex flex-col gap-3">
          {songs.map((song) => {
            const selected = selectedSongIds.includes(song.id);
            const disabled = !selected && selectedSongIds.length >= 6;
            return (
              <SongChoiceButton
                key={song.id}
                artistName={artist.name}
                song={song}
                selected={selected}
                disabled={disabled}
                onClick={() => toggleSong(song.id)}
              />
            );
          })}
          {songs.length === 0 && (
            <p className="ink-mute text-sm text-center py-6">没有搜到这首歌，换个关键词试试。</p>
          )}
        </div>

        <button type="button" className="btn-secondary mt-4" onClick={() => go('songList')}>
          展开
        </button>
      </div>

      <SelectionReviewBottomBar artist={artist} songs={selectedSongs}>
        <div className="flex gap-3">
          <button type="button" className="btn-secondary" onClick={clearSongs}>重选</button>
          <button
            type="button"
            className="btn-primary"
            disabled={selectedSongIds.length !== 6}
            onClick={() => {
              if (selectedSongIds.length !== 6) {
                notify('请先选满 6 首歌。');
                return;
              }
              if (isFriend) {
                startFriendSort();
                return;
              }
              startCreatorSort();
            }}
          >
            开始排序
          </button>
        </div>
      </SelectionReviewBottomBar>
    </div>
  );
}
