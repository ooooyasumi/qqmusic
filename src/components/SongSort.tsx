'use client';

import { Menu, Pause, Play } from 'lucide-react';
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

interface PointerDragState {
  pointerId: number;
  songId: string;
  grabOffsetY: number;
  height: number;
  lastClientY: number;
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
      <span className="song-choice-content">
        <SongCover song={song} />
        <span className="song-rank-info">
          <b>{song.name}</b>
          <small>{artistName} · {song.album}</small>
        </span>
        <SongPreviewButton song={song} variant="list" />
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
      <span
        className="song-grid-copy"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          marginTop: 12,
          textAlign: 'left',
          minWidth: 0,
        }}
      >
        <span className="song-grid-text">
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
        <SongPreviewButton song={song} variant="grid" />
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
  const [draggingSongId, setDraggingSongId] = useState<string | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const activeDragRef = useRef<PointerDragState | null>(null);
  const capturedHandleRef = useRef<HTMLButtonElement | null>(null);
  const cleanupWindowDragRef = useRef<(() => void) | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const songsRef = useRef<Song[]>(songs);
  const previousRects = useRef<Map<string, DOMRect> | null>(null);
  const cleanupTimer = useRef<number | null>(null);

  const rememberPositions = (): void => {
    previousRects.current = new Map(
      songsRef.current.map((song) => {
        const node = itemRefs.current.get(song.id);
        return [song.id, node?.getBoundingClientRect() ?? new DOMRect()];
      }),
    );
  };

  const reorderSongs = (from: number, to: number): Song[] => {
    const next = [...songsRef.current];
    const [moved] = next.splice(from, 1);
    if (!moved) return next;
    next.splice(to, 0, moved);
    return next;
  };

  const applyDraggedTransform = (clientY: number): void => {
    const drag = activeDragRef.current;
    const list = listRef.current;
    if (!drag || !list) return;

    const node = itemRefs.current.get(drag.songId);
    if (!node) return;

    const listTop = list.getBoundingClientRect().top;
    const layoutTop = listTop + node.offsetTop;
    const desiredTop = clientY - drag.grabOffsetY;
    const deltaY = desiredTop - layoutTop;

    node.style.transition = 'none';
    node.style.transform = `translate3d(0, ${deltaY}px, 0)`;
    node.style.zIndex = '3';
  };

  const moveWithAnimation = (from: number, to: number): void => {
    if (from === to) return;
    rememberPositions();
    songsRef.current = reorderSongs(from, to);
    onMove(from, to);
    dragIndexRef.current = to;
  };

  const updatePointerDrag = (clientY: number): void => {
    const drag = activeDragRef.current;
    if (!drag) return;

    drag.lastClientY = clientY;
    applyDraggedTransform(clientY);

    const current = dragIndexRef.current;
    const centerY = clientY - drag.grabOffsetY + drag.height / 2;
    const target = current === null ? null : targetIndexFromPointer(centerY, current);

    if (current !== null && target !== null) {
      moveWithAnimation(current, target);
      window.requestAnimationFrame(() => {
        applyDraggedTransform(drag.lastClientY);
      });
    }
  };

  const targetIndexFromPointer = (centerY: number, from: number): number | null => {
    const list = listRef.current;
    const currentSongs = songsRef.current;
    if (!list) return null;

    const previousSong = currentSongs[from - 1];
    const nextSong = currentSongs[from + 1];
    const listTop = list.getBoundingClientRect().top;

    if (previousSong) {
      const previousNode = itemRefs.current.get(previousSong.id);
      if (previousNode) {
        const previousMidpoint = listTop + previousNode.offsetTop + previousNode.offsetHeight / 2;
        if (centerY < previousMidpoint) return from - 1;
      }
    }

    if (nextSong) {
      const nextNode = itemRefs.current.get(nextSong.id);
      if (nextNode) {
        const nextMidpoint = listTop + nextNode.offsetTop + nextNode.offsetHeight / 2;
        if (centerY > nextMidpoint) return from + 1;
      }
    }

    return null;
  };

  const endPointerDrag = (pointerId: number): void => {
    const drag = activeDragRef.current;
    if (!drag || drag.pointerId !== pointerId) return;

    const capturedHandle = capturedHandleRef.current;
    if (capturedHandle?.hasPointerCapture?.(pointerId)) {
      capturedHandle.releasePointerCapture(pointerId);
    }
    capturedHandleRef.current = null;

    cleanupWindowDragRef.current?.();
    cleanupWindowDragRef.current = null;

    const node = itemRefs.current.get(drag.songId);
    if (node) {
      node.style.transition = '';
      node.style.transform = '';
      node.style.zIndex = '';
    }

    activeDragRef.current = null;
    dragIndexRef.current = null;
    setDraggingSongId(null);
  };

  const handleDragHandleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();

    const target = event.key === 'ArrowUp' ? index - 1 : index + 1;
    if (target < 0 || target >= songs.length) return;
    moveWithAnimation(index, target);
  };

  useLayoutEffect(() => {
    songsRef.current = songs;
  }, [songs]);

  useEffect(() => {
    return () => {
      cleanupWindowDragRef.current?.();
      cleanupWindowDragRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    const rects = previousRects.current;
    if (!rects) return;
    previousRects.current = null;

    if (cleanupTimer.current !== null) {
      window.clearTimeout(cleanupTimer.current);
      cleanupTimer.current = null;
    }

    songs.forEach((song) => {
      const activeSongId = activeDragRef.current?.songId;
      if (activeSongId === song.id) return;

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

    const activeClientY = activeDragRef.current?.lastClientY;
    if (activeClientY !== undefined) {
      applyDraggedTransform(activeClientY);
    }

    cleanupTimer.current = window.setTimeout(() => {
      itemRefs.current.forEach((node) => {
        if (activeDragRef.current?.songId === node.dataset.songId) return;
        node.style.transition = '';
        node.style.transform = '';
      });
      cleanupTimer.current = null;
    }, 260);
  }, [songs]);

  return (
    <div className="song-rank-list" ref={listRef}>
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
          data-song-id={song.id}
          data-dragging={draggingSongId === song.id}
        >
          <span className="song-rank-no" data-rank={index + 1}>#{index + 1}</span>
          <SongCover song={song} />
          <span className="song-rank-info">
            <b>{song.name}</b>
            <small>{song.album}</small>
          </span>
          <button
            type="button"
            className="song-drag-handle"
            aria-label={`拖动调整 ${song.name} 排序`}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              const card = itemRefs.current.get(song.id);
              if (!card) return;

              const rect = card.getBoundingClientRect();
              activeDragRef.current = {
                pointerId: event.pointerId,
                songId: song.id,
                grabOffsetY: event.clientY - rect.top,
                height: rect.height,
                lastClientY: event.clientY,
              };
              dragIndexRef.current = index;
              setDraggingSongId(song.id);
              capturedHandleRef.current = event.currentTarget;
              cleanupWindowDragRef.current?.();

              const handleWindowPointerMove = (moveEvent: globalThis.PointerEvent): void => {
                if (activeDragRef.current?.pointerId !== moveEvent.pointerId) return;
                moveEvent.preventDefault();
                updatePointerDrag(moveEvent.clientY);
              };
              const handleWindowPointerEnd = (endEvent: globalThis.PointerEvent): void => {
                endPointerDrag(endEvent.pointerId);
              };

              window.addEventListener('pointermove', handleWindowPointerMove, { passive: false });
              window.addEventListener('pointerup', handleWindowPointerEnd);
              window.addEventListener('pointercancel', handleWindowPointerEnd);
              cleanupWindowDragRef.current = () => {
                window.removeEventListener('pointermove', handleWindowPointerMove);
                window.removeEventListener('pointerup', handleWindowPointerEnd);
                window.removeEventListener('pointercancel', handleWindowPointerEnd);
              };

              try {
                event.currentTarget.setPointerCapture(event.pointerId);
              } catch {
                capturedHandleRef.current = null;
              }

              applyDraggedTransform(event.clientY);
            }}
            onPointerMove={(event) => {
              if (activeDragRef.current?.pointerId !== event.pointerId) return;
              event.preventDefault();
              updatePointerDrag(event.clientY);
            }}
            onPointerUp={(event) => endPointerDrag(event.pointerId)}
            onPointerCancel={(event) => endPointerDrag(event.pointerId)}
            onKeyDown={(event) => handleDragHandleKeyDown(event, index)}
          >
            <Menu size={18} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
