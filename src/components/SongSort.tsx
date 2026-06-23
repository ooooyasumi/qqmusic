'use client';

import { useState } from 'react';
import type { Song } from '@/lib/types';

export function SongCover({ song, size = 54 }: { song: Song; size?: number }) {
  return (
    <span
      className="song-cover"
      style={{
        width: size,
        height: size,
        ['--cover-a' as string]: song.coverA,
        ['--cover-b' as string]: song.coverB,
      }}
      aria-hidden="true"
    >
      {song.name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function SortableSongList({
  songs,
  onMove,
}: {
  songs: Song[];
  onMove: (from: number, to: number) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  return (
    <div className="song-rank-list">
      {songs.map((song, index) => (
        <div
          key={song.id}
          className="song-rank-card"
          draggable
          onDragStart={(event) => {
            setDragIndex(index);
            event.dataTransfer.effectAllowed = 'move';
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (dragIndex !== null) onMove(dragIndex, index);
            setDragIndex(null);
          }}
          onDragEnd={() => setDragIndex(null)}
          data-dragging={dragIndex === index}
        >
          <span className="song-rank-no">#{index + 1}</span>
          <SongCover song={song} />
          <span className="song-rank-info">
            <b>{song.name}</b>
            <small>{song.album} · {song.note}</small>
          </span>
          <span className="song-drag-handle" aria-hidden="true">
            ⋮⋮
          </span>
        </div>
      ))}
    </div>
  );
}
