'use client';

import { useMemo, useState } from 'react';
import { useApp } from '@/lib/state';
import { findArtist } from '@/lib/data';
import { getCatalogSongsByArtist } from '@/lib/appleMusicCatalog';
import { Orbs } from '@/components/Orbs';
import { TopBar } from '@/components/TopBar';
import { SongCover, SongGridChoiceButton } from '@/components/SongSort';
import { ArtistName } from '@/components/ArtistName';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Artist, Song } from '@/lib/types';

const REVIEW_SLOTS = [0, 1, 2, 3, 4, 5] as const;

function rankColor(index: number): string {
  if (index === 0) return '#d4af7a';
  if (index === 1) return '#c8d0d8';
  if (index === 2) return '#b9825a';
  return 'var(--ink-secondary)';
}

function SelectionReviewPanel({ artist, songs }: { artist: Artist; songs: Song[] }) {
  return (
    <div
      className="selection-result-card p-5"
      style={{ background: `linear-gradient(120deg, ${artist.accent}22, rgba(255,255,255,0.02))`, border: '1px solid var(--ink-faint)', borderRadius: 22 }}
    >
      <p className="kicker" style={{ color: artist.accent }}>
        <ArtistName name={artist.name} /> Top6
      </p>
      <div className="mt-4 flex -space-x-3 selection-result-covers" aria-label="已选择歌曲封面">
        {songs.map((song) => (
          <span key={song.id} className="selection-result-cover-item">
            <SongCover song={song} size={52} />
          </span>
        ))}
      </div>

      <ol className="mt-4 space-y-1.5">
        {REVIEW_SLOTS.map((slot) => {
          const song = songs[slot];
          return (
            <li
              key={slot}
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
                  color: rankColor(slot),
                  width: 18,
                  flex: '0 0 auto',
                  fontWeight: 700,
                }}
              >
                {slot + 1}.
              </span>
              <span key={song?.id ?? `empty-song-${slot}`} className="selection-result-song-copy" data-filled={Boolean(song)} style={{ minWidth: 0 }}>
                {song ? (
                  <>
                    <span>{song.name}</span>
                    <span style={{ color: 'var(--ink-secondary)' }}> · {song.album}</span>
                  </>
                ) : (
                  '——'
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function SongListScreen() {
  const { artistId, selectedSongIds, selectedSongs, toggleSong, clearSongs, startCreatorSort, notify } = useApp();
  const [keyword, setKeyword] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
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
      <TopBar title={`${artist.short} Songs`} />

      <div className="screen-content-scrollable no-scrollbar">
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

        <div
          className="song-grid mt-5"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 12,
          }}
        >
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

      </div>

      <div className="bottom-bar selection-bottom-bar" data-review-state={reviewOpen ? 'open' : 'closed'}>
        <button
          type="button"
          className="selection-review-toggle"
          aria-label={reviewOpen ? '收起已选歌曲' : '展开已选歌曲'}
          aria-expanded={reviewOpen}
          onClick={() => setReviewOpen((open) => !open)}
        >
          {reviewOpen ? <ChevronDown size={18} strokeWidth={1.8} /> : <ChevronUp size={18} strokeWidth={1.8} />}
        </button>
        <div className="selection-review-drawer" aria-hidden={!reviewOpen}>
          <SelectionReviewPanel artist={artist} songs={selectedSongs.slice(0, 6)} />
        </div>
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
