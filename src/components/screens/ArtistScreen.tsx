'use client';

import { useMemo, useState } from 'react';
import { useApp } from '@/lib/state';
import { findArtist } from '@/lib/data';
import { getCatalogSongsByArtist } from '@/lib/appleMusicCatalog';
import { Orbs } from '@/components/Orbs';
import { TopBar } from '@/components/TopBar';
import { SongChoiceButton } from '@/components/SongSort';
import { ArtistPageHero } from '@/components/ArtistPageHero';

export function ArtistScreen() {
  const { artistId, selectedSongIds, toggleSong, clearSongs, startCreatorSort, notify, go } = useApp();
  const [keyword, setKeyword] = useState('');
  const artist = findArtist(artistId);
  const songs = useMemo(() => {
    if (!artist) return [];
    const catalogSongs = getCatalogSongsByArtist(artist.id);
    const q = keyword.trim().toLowerCase();
    return catalogSongs.filter((song) =>
      `${song.name} ${song.album}`.toLowerCase().includes(q),
    );
  }, [artist, keyword]);

  if (!artist) return null;

  return (
    <div className="screen screen-fade">
      <Orbs accent={`${artist.accent}55`} secondary="rgba(212,175,122,0.25)" />
      <TopBar title={`${artist.short} Top6`} />

      <div className="screen-content-scrollable no-scrollbar">
        <ArtistPageHero
          artist={artist}
          eyebrow="Pick 6 Songs"
          copy="选择 6 首最喜欢的音乐"
        />

        <div className="mt-6 p-4 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--ink-faint)', borderRadius: 18 }}>
          <div>
            <p className="kicker" style={{ color: artist.accent }}>Selected</p>
            <p className="ink-title mt-1" style={{ fontSize: 16 }}>{selectedSongIds.length === 6 ? '可以开始排序了' : '点歌曲加入你的 Top6'}</p>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="ink-display" style={{ fontSize: 42, color: artist.accent, fontStyle: 'italic' }}>{selectedSongIds.length}</span>
            <span className="ink-mute text-xs tracking-widest">/ 6</span>
          </div>
        </div>

        <label className="mt-4 block">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索这位歌手的歌曲"
            className="w-full"
            style={{
              height: 46,
              padding: '0 14px',
              color: 'var(--ink-primary)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--ink-faint)',
              borderRadius: 14,
              outline: 'none',
            }}
          />
        </label>

        <div className="mt-5 flex flex-col gap-3">
          {songs.slice(0, 5).map((song) => {
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

      <div className="bottom-bar">
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
              startCreatorSort();
            }}
          >
            开始排序
          </button>
        </div>
      </div>
    </div>
  );
}
