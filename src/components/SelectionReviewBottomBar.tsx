'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ArtistName } from '@/components/ArtistName';
import { SongCover } from '@/components/SongSort';
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
              <span
                key={song?.id ?? `empty-song-${slot}`}
                className="selection-result-song-copy"
                data-filled={Boolean(song)}
                style={{ minWidth: 0 }}
              >
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

export function SelectionReviewBottomBar({
  artist,
  songs,
  children,
}: {
  artist: Artist;
  songs: Song[];
  children: ReactNode;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);

  return (
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
        <SelectionReviewPanel artist={artist} songs={songs.slice(0, 6)} />
      </div>
      {children}
    </div>
  );
}
