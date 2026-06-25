'use client';

import { useMemo, useState } from 'react';
import { useApp } from '@/lib/state';
import { findArtist } from '@/lib/data';
import { getCatalogSongsByArtist } from '@/lib/appleMusicCatalog';
import { Orbs } from '@/components/Orbs';
import { TopBar } from '@/components/TopBar';
import { SongGridChoiceButton } from '@/components/SongSort';
import { SelectionReviewBottomBar } from '@/components/SelectionReviewBottomBar';
import type { CatalogSong } from '@/lib/appleMusicCatalog';

type SongListMode = 'songs' | 'albums';

interface AlbumGroup {
  name: string;
  songs: CatalogSong[];
  albumOrder: number;
}

function buildAlbumGroups(songs: CatalogSong[]): AlbumGroup[] {
  const byAlbum = new Map<string, AlbumGroup>();
  songs.forEach((song) => {
    const existing = byAlbum.get(song.album);
    if (existing) {
      existing.songs.push(song);
      existing.albumOrder = Math.min(existing.albumOrder, song.albumOrder);
      return;
    }
    byAlbum.set(song.album, {
      name: song.album,
      songs: [song],
      albumOrder: song.albumOrder,
    });
  });

  return [...byAlbum.values()]
    .map((group) => ({
      ...group,
      songs: [...group.songs].sort((a, b) => a.sourceOrder - b.sourceOrder),
    }))
    .sort((a, b) => a.albumOrder - b.albumOrder || a.name.localeCompare(b.name));
}

export function SongListScreen() {
  const {
    artistId,
    selectedSongIds,
    selectedSongs,
    activeChallengeToken,
    toggleSong,
    clearSongs,
    startCreatorSort,
    startFriendSort,
    notify,
  } = useApp();
  const [keyword, setKeyword] = useState('');
  const [mode, setMode] = useState<SongListMode>('songs');
  const [activeAlbumName, setActiveAlbumName] = useState<string | null>(null);
  const artist = findArtist(artistId);
  const isFriend = Boolean(activeChallengeToken);
  const catalogSongs = useMemo(() => {
    if (!artist) return [];
    return getCatalogSongsByArtist(artist.id);
  }, [artist]);
  const albums = useMemo(() => buildAlbumGroups(catalogSongs), [catalogSongs]);
  const activeAlbum = useMemo(
    () => albums.find((album) => album.name === activeAlbumName) ?? null,
    [activeAlbumName, albums],
  );
  const songs = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const source = activeAlbum ? activeAlbum.songs : catalogSongs;
    return source.filter((song) => `${song.name} ${song.album}`.toLowerCase().includes(q));
  }, [activeAlbum, catalogSongs, keyword]);
  const filteredAlbums = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return albums.filter((album) => album.name.toLowerCase().includes(q));
  }, [albums, keyword]);
  const isAlbumMode = mode === 'albums';
  const isAlbumDetail = Boolean(activeAlbum);

  if (!artist) return null;

  return (
    <div className="screen screen-fade">
      <Orbs accent={`${artist.accent}55`} secondary="rgba(212,175,122,0.25)" />
      <TopBar
        title={activeAlbum?.name ?? `${artist.short} Songs`}
        showBack={!isFriend || isAlbumDetail}
        onBack={isAlbumDetail ? () => setActiveAlbumName(null) : undefined}
      />

      <div className="screen-content-scrollable no-scrollbar">
        <div className="song-list-toolbar mt-4">
          <label className="song-list-search">
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={isAlbumMode && !isAlbumDetail ? '搜索专辑' : '搜索这位歌手的歌曲'}
              className="w-full"
            />
          </label>
          <button
            type="button"
            className="song-list-mode-btn"
            onClick={() => {
              setMode((current) => (current === 'songs' ? 'albums' : 'songs'));
              setActiveAlbumName(null);
              setKeyword('');
            }}
          >
            {isAlbumMode ? '全部歌曲展开' : '按专辑筛选'}
          </button>
        </div>

        {isAlbumMode && !activeAlbum ? (
          <div className="album-list mt-5">
            {filteredAlbums.map((album) => (
              <button
                key={album.name}
                type="button"
                className="album-list-item"
                onClick={() => {
                  setActiveAlbumName(album.name);
                  setKeyword('');
                }}
              >
                <span>{album.name}</span>
              </button>
            ))}
            {filteredAlbums.length === 0 && (
              <p className="ink-mute text-sm text-center py-6">没有搜到这张专辑，换个关键词试试。</p>
            )}
          </div>
        ) : (
          <div className="song-grid mt-5">
            {songs.map((song) => {
              const selected = selectedSongIds.includes(song.id);
              const disabled = !selected && selectedSongIds.length >= 6;
              return (
                <SongGridChoiceButton
                  key={song.id}
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
        )}
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
