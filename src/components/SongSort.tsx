'use client';

import { Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import type { Song } from '@/lib/types';

const PREVIEW_AUDIO_BASE_URL = 'https://web-resource-1372876299.cos.ap-guangzhou.myqcloud.com/qqmusic/audio/previews';

const PREVIEW_AUDIO_BY_SONG_ID: Record<string, string> = {
  'jay-apple-1624001324': `${PREVIEW_AUDIO_BASE_URL}/jay-daoxiang-15s.mp3`,
  'jay-apple-1624001317': `${PREVIEW_AUDIO_BASE_URL}/jay-huahai-15s.mp3`,
  'jay-apple-536115195': `${PREVIEW_AUDIO_BASE_URL}/jay-qilixiang-15s.mp3`,
  'jay-apple-536030695': `${PREVIEW_AUDIO_BASE_URL}/jay-qinghuaci-15s.mp3`,
  'jay-apple-535824738': `${PREVIEW_AUDIO_BASE_URL}/jay-qingtian-15s.mp3`,
  'jay-apple-536009642': `${PREVIEW_AUDIO_BASE_URL}/jay-yequ-15s.mp3`,
};

interface ActivePreview {
  songId: string;
  stop: () => void;
}

let activePreview: ActivePreview | null = null;

function previewAudioUrl(songId: string): string | null {
  return PREVIEW_AUDIO_BY_SONG_ID[songId] ?? null;
}

function handleCardKeyDown(
  event: KeyboardEvent<HTMLDivElement>,
  disabled: boolean,
  onClick: () => void,
): void {
  if (disabled) return;
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  onClick();
}

function SongPreviewButton({
  song,
  variant,
}: {
  song: Song;
  variant: 'list' | 'grid';
}) {
  const audioUrl = previewAudioUrl(song.id);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimerRef = useRef<number | null>(null);

  const stopPreview = useCallback((): void => {
    if (stopTimerRef.current !== null) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    }

    if (activePreview?.songId === song.id) {
      activePreview = null;
    }

    setIsPlaying(false);
  }, [song.id]);

  useEffect(() => stopPreview, [stopPreview]);

  const playPreview = (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    if (!audioUrl) return;

    if (isPlaying) {
      stopPreview();
      return;
    }

    activePreview?.stop();

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    activePreview = { songId: song.id, stop: stopPreview };
    setIsPlaying(true);
    stopTimerRef.current = window.setTimeout(stopPreview, 15000);
    audio.addEventListener('ended', stopPreview, { once: true });
    void audio.play().catch(() => {
      stopPreview();
    });
  };

  return (
    <button
      type="button"
      className="song-preview-btn"
      data-variant={variant}
      data-playing={isPlaying}
      disabled={!audioUrl}
      aria-label={isPlaying ? `停止播放 ${song.name}` : `播放 ${song.name} 15 秒片段`}
      onClick={playPreview}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {isPlaying ? <Pause size={15} strokeWidth={2.4} /> : <Play size={15} strokeWidth={2.4} />}
    </button>
  );
}

export function SongCover({
  song,
  size = 54,
  fill = false,
}: {
  song: Song;
  size?: number;
  fill?: boolean;
}) {
  return (
    <span
      className="song-cover"
      style={{
        width: fill ? '100%' : size,
        height: fill ? 'auto' : size,
        aspectRatio: fill ? '1' : undefined,
        backgroundImage: song.coverUrl
          ? `linear-gradient(135deg, rgba(255, 255, 255, 0.12), transparent 42%), url(${song.coverUrl})`
          : undefined,
        backgroundSize: song.coverUrl ? 'cover' : undefined,
        backgroundPosition: song.coverUrl ? 'center' : undefined,
        ['--cover-a' as string]: song.coverA,
        ['--cover-b' as string]: song.coverB,
      }}
      aria-hidden="true"
    >
      {song.coverUrl ? '' : song.name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function SongChoiceButton({
  artistName,
  song,
  selected,
  disabled,
  onClick,
}: {
  artistName: string;
  song: Song;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      className="option-card"
      data-selected={selected}
      data-disabled={disabled}
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) onClick();
      }}
      onKeyDown={(event) => handleCardKeyDown(event, disabled, onClick)}
    >
      <span className="flex items-center gap-3 min-w-0">
        <SongCover song={song} />
        <SongPreviewButton song={song} variant="list" />
        <span className="song-rank-info">
          <b>{song.name}</b>
          <small>{artistName} · {song.album}</small>
        </span>
      </span>
    </div>
  );
}

export function SongGridChoiceButton({
  song,
  selected,
  disabled,
  onClick,
}: {
  song: Song;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      className="song-grid-card"
      aria-pressed={selected}
      aria-disabled={disabled}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        minWidth: 0,
        minHeight: 168,
        padding: 14,
      }}
      data-selected={selected}
      data-disabled={disabled}
      onClick={() => {
        if (!disabled) onClick();
      }}
      onKeyDown={(event) => handleCardKeyDown(event, disabled, onClick)}
    >
      <SongCover song={song} fill />
      <SongPreviewButton song={song} variant="grid" />
      <span
        className="song-grid-copy"
        style={{
          display: 'block',
          width: '100%',
          marginTop: 12,
          textAlign: 'center',
          minWidth: 0,
        }}
      >
        <b
          style={{
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {song.name}
        </b>
        <small
          style={{
            display: 'block',
            marginTop: 5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {song.album}
        </small>
      </span>
    </div>
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

  const setDragPreview = (event: React.DragEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const preview = event.currentTarget.cloneNode(true) as HTMLDivElement;
    preview.classList.add('song-rank-drag-preview');
    preview.style.width = `${rect.width}px`;
    preview.style.height = `${rect.height}px`;
    preview.style.position = 'fixed';
    preview.style.top = '-1000px';
    preview.style.left = '-1000px';
    preview.style.pointerEvents = 'none';
    document.body.appendChild(preview);
    event.dataTransfer.setDragImage(preview, event.clientX - rect.left, event.clientY - rect.top);
    window.setTimeout(() => {
      preview.remove();
    }, 0);
  };

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

  const nextMoveTarget = (
    event: React.DragEvent<HTMLDivElement>,
    from: number,
    over: number,
  ): number | null => {
    if (from === over) return null;
    const rect = event.currentTarget.getBoundingClientRect();
    const movingDown = over > from;
    const threshold = rect.top + rect.height / 2;
    const crossed = movingDown ? event.clientY >= threshold : event.clientY <= threshold;
    return crossed ? over : null;
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
            setDragPreview(event);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            const current = dragIndexRef.current;
            const target = current === null ? null : nextMoveTarget(event, current, index);
            if (current !== null && target !== null) {
              moveWithAnimation(current, target);
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
          <span className="song-rank-no" data-rank={index + 1}>#{index + 1}</span>
          <SongCover song={song} />
          <span className="song-rank-info">
            <b>{song.name}</b>
            <small>{song.album}</small>
          </span>
          <span className="song-drag-handle" aria-hidden="true">
            ⋮⋮
          </span>
        </div>
      ))}
    </div>
  );
}
