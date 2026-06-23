'use client';

import { useLayoutEffect, useRef, useState } from 'react';
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
  const dragIndexRef = useRef<number | null>(null);
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const previousRects = useRef<Map<string, DOMRect> | null>(null);
  const cleanupTimer = useRef<number | null>(null);

  const rememberPositions = () => {
    previousRects.current = new Map(
      songs.map((song) => {
        const node = itemRefs.current.get(song.id);
        return [song.id, node?.getBoundingClientRect() ?? new DOMRect()];
      }),
    );
  };

  const moveWithAnimation = (from: number, to: number) => {
    if (from === to) return;
    rememberPositions();
    onMove(from, to);
    dragIndexRef.current = to;
    setDragIndex(to);
  };

  useLayoutEffect(() => {
    const rects = previousRects.current;
    if (!rects) return;
    previousRects.current = null;

    if (cleanupTimer.current !== null) {
      window.clearTimeout(cleanupTimer.current);
      cleanupTimer.current = null;
    }

    songs.forEach((song) => {
      const node = itemRefs.current.get(song.id);
      const previous = rects.get(song.id);
      if (!node || !previous) return;
      const next = node.getBoundingClientRect();
      const deltaX = previous.left - next.left;
      const deltaY = previous.top - next.top;
      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;

      node.style.transition = 'none';
      node.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      node.getBoundingClientRect();
      window.requestAnimationFrame(() => {
        node.style.transition = '';
        node.style.transform = '';
      });
    });

    cleanupTimer.current = window.setTimeout(() => {
      itemRefs.current.forEach((node) => {
        node.style.transition = '';
        node.style.transform = '';
      });
      cleanupTimer.current = null;
    }, 260);
  }, [songs]);

  return (
    <div className="song-rank-list">
      {songs.map((song, index) => (
        <div
          key={song.id}
          ref={(node) => {
            if (node) {
              itemRefs.current.set(song.id, node);
            } else {
              itemRefs.current.delete(song.id);
            }
          }}
          className="song-rank-card"
          draggable
          onDragStart={(event) => {
            dragIndexRef.current = index;
            setDragIndex(index);
            event.dataTransfer.effectAllowed = 'move';
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            const current = dragIndexRef.current;
            if (current !== null && current !== index) {
              moveWithAnimation(current, index);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            dragIndexRef.current = null;
            setDragIndex(null);
          }}
          onDragEnd={() => {
            dragIndexRef.current = null;
            setDragIndex(null);
          }}
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
