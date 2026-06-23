'use client';

import { useMemo, useState } from 'react';
import { useApp } from '@/lib/state';
import { findArtist } from '@/lib/data';
import { Orbs } from '@/components/Orbs';
import { TopBar } from '@/components/TopBar';
import { SongCover } from '@/components/SongSort';

export function ArtistScreen() {
  const { artistId, selectedSongIds, toggleSong, clearSongs, startCreatorSort, notify } = useApp();
  const [keyword, setKeyword] = useState('');
  const artist = findArtist(artistId);
  const songs = useMemo(() => {
    if (!artist) return [];
    const q = keyword.trim().toLowerCase();
    return artist.songs.filter((song) =>
      `${song.name} ${song.album} ${song.note}`.toLowerCase().includes(q),
    );
  }, [artist, keyword]);

  if (!artist) return null;

  return (
    <div className="screen screen-fade">
      <Orbs accent={`${artist.accent}55`} secondary="rgba(212,175,122,0.25)" />
      <TopBar title={`${artist.short} Top6`} />

      <div className="screen-content-scrollable no-scrollbar">
        <div className="relative">
          <p className="kicker">正在选择 · Pick 6 Songs</p>
          <h1 className="ink-display mt-3" style={{ fontSize: 34, fontWeight: 500, lineHeight: 1.1 }}>
            {artist.title}
          </h1>
          <p className="ink-body ink-secondary mt-3" style={{ fontSize: 13.5, lineHeight: 1.7 }}>
            {artist.intro}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {artist.tags.map((tag) => (
            <span key={tag} className="kicker" style={{ padding: '4px 12px', border: '1px solid var(--ink-faint)', borderRadius: 999, letterSpacing: '0.18em' }}>
              {tag}
            </span>
          ))}
        </div>

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
          {songs.map((song) => {
            const selectedIndex = selectedSongIds.indexOf(song.id);
            const selected = selectedIndex > -1;
            const disabled = !selected && selectedSongIds.length >= 6;
            return (
              <button
                key={song.id}
                type="button"
                className="option-card"
                data-selected={selected}
                disabled={disabled}
                onClick={() => toggleSong(song.id)}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <SongCover song={song} />
                  <span className="song-rank-info">
                    <b>{song.name}</b>
                    <small>{artist.name} · {song.album} · {song.note}</small>
                  </span>
                </span>
                <span className="ink-display" style={{ fontSize: 18, color: selected ? artist.accent : 'var(--ink-faint)', width: 24, textAlign: 'center' }}>
                  {selected ? selectedIndex + 1 : '+'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-7 flex gap-3">
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
