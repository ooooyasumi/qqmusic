'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { findArtist } from './data';
import { findCatalogSong } from './appleMusicCatalog';
import { loadRooms, makeRoom, saveRooms } from './match';
import type { Question, Room, Screen, Song } from './types';

interface AppState {
  screen: Screen;
  artistId: string;
  bankId: string;
  selectedQuestionIds: string[];
  selectedSongIds: string[];
  creatorOrder: string[];
  friendOrder: string[];
  creatorAnswers: Record<string, number>;
  friendAnswers: Record<string, number>;
  answerIndex: number;
  room: Room | null;
  rooms: Room[];
  history: Screen[];
  toast: string | null;
}

interface AppContextValue extends AppState {
  artistName: string;
  bankName: string;
  questions: Question[];
  selectedSongs: Song[];
  creatorSongs: Song[];
  friendSongs: Song[];
  go: (screen: Screen, pushHistory?: boolean) => void;
  back: () => void;
  setArtist: (artistId: string) => void;
  setBank: (bankId: string) => void;
  toggleQuestion: (id: string) => void;
  pickFirstSix: () => void;
  answerQuestion: (questionId: string, optionIndex: number) => void;
  toggleSong: (id: string) => void;
  clearSongs: () => void;
  startCreatorSort: () => void;
  reorderCreator: (from: number, to: number) => void;
  reorderFriend: (from: number, to: number) => void;
  createRoom: () => Room | null;
  finishFriend: () => void;
  openRoom: (room: Room) => void;
  notify: (msg: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);
const REQUIRED_COUNT = 6;
const HISTORY_STATE_KEY = 'tongdan-moqi-screen';

type BrowserHistoryAction = 'push' | 'replace' | 'pop';

interface BrowserHistoryEntry {
  app: typeof HISTORY_STATE_KEY;
  screen: Screen;
  history: Screen[];
  roomId: string | null;
}

const initial: AppState = {
  screen: 'home',
  artistId: 'jay',
  bankId: 'top6',
  selectedQuestionIds: [],
  selectedSongIds: [],
  creatorOrder: [],
  friendOrder: [],
  creatorAnswers: {},
  friendAnswers: {},
  answerIndex: 0,
  room: null,
  rooms: [],
  history: [],
  toast: null,
};

function moveItem(list: string[], from: number, to: number): string[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
    return list;
  }
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function orderedSongs(artistId: string, ids: string[]): Song[] {
  const artist = findArtist(artistId);
  if (!artist) return [];
  return ids
    .map((id) => findCatalogSong(artistId, id) ?? artist.songs.find((song) => song.id === id))
    .filter((song): song is Song => Boolean(song));
}

function isScreen(value: unknown): value is Screen {
  return (
    value === 'home' ||
    value === 'artist' ||
    value === 'songList' ||
    value === 'create' ||
    value === 'creatorAnswer' ||
    value === 'creatorResult' ||
    value === 'friendAnswer' ||
    value === 'friendResult' ||
    value === 'rooms' ||
    value === 'roomMissing'
  );
}

function isBrowserHistoryEntry(value: unknown): value is BrowserHistoryEntry {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<BrowserHistoryEntry>;
  return (
    candidate.app === HISTORY_STATE_KEY &&
    isScreen(candidate.screen) &&
    Array.isArray(candidate.history) &&
    candidate.history.every(isScreen) &&
    (typeof candidate.roomId === 'string' || candidate.roomId === null)
  );
}

function currentBrowserUrl(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function writeBrowserHistory(
  action: Exclude<BrowserHistoryAction, 'pop'>,
  screen: Screen,
  history: Screen[],
  roomId: string | null,
): void {
  const entry: BrowserHistoryEntry = {
    app: HISTORY_STATE_KEY,
    screen,
    history,
    roomId,
  };

  if (action === 'push') {
    window.history.pushState(entry, '', currentBrowserUrl());
    return;
  }

  window.history.replaceState(entry, '', currentBrowserUrl());
}

function applyRoomState(state: AppState, room: Room): AppState {
  return {
    ...state,
    room,
    artistId: room.artistId,
    bankId: room.bankId,
    selectedSongIds: room.songIds,
    creatorOrder: room.creatorOrder,
    friendOrder: room.songIds,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initial);
  const stateRef = useRef<AppState>(initial);
  const browserHistoryInitializedRef = useRef(false);
  const browserHistoryActionRef = useRef<BrowserHistoryAction | null>(null);
  const lastBrowserHistoryKeyRef = useRef<string | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const rooms = loadRooms();
    setState((prev) => {
      const next = { ...prev, rooms };
      if (typeof window === 'undefined') return next;
      const match = window.location.hash.match(/room=([^&]+)/);
      if (!match) return next;
      const roomId = decodeURIComponent(match[1]);
      const room = rooms.find((r) => r.id === roomId);
      if (!room) return { ...next, screen: 'roomMissing' };
      browserHistoryActionRef.current = 'replace';
      return {
        ...applyRoomState(next, room),
        screen: 'friendAnswer',
        history: [],
      };
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onHashChange = () => {
      const match = window.location.hash.match(/room=([^&]+)/);
      if (!match) {
        const historyEntry = isBrowserHistoryEntry(window.history.state) ? window.history.state : null;
        browserHistoryActionRef.current = 'replace';
        setState((prev) => ({
          ...prev,
          screen: historyEntry?.screen ?? 'home',
          history: historyEntry?.history ?? [],
        }));
        return;
      }
      const roomId = decodeURIComponent(match[1]);
      setState((prev) => {
        const room = prev.rooms.find((r) => r.id === roomId);
        if (!room) return { ...prev, screen: 'roomMissing' };
        browserHistoryActionRef.current = 'replace';
        return {
          ...applyRoomState(prev, room),
          screen: 'friendAnswer',
          history: [],
        };
      });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onPopState = (event: PopStateEvent) => {
      if (!isBrowserHistoryEntry(event.state)) return;
      browserHistoryActionRef.current = 'pop';
      setState((prev) => {
        const room = event.state.roomId
          ? prev.rooms.find((r) => r.id === event.state.roomId) ?? prev.room
          : prev.room;
        const next = room ? applyRoomState(prev, room) : prev;
        return {
          ...next,
          screen: event.state.screen,
          history: event.state.history,
        };
      });
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const roomId = state.room?.id ?? null;
    const historyKey = `${state.screen}|${state.history.join(',')}|${roomId ?? ''}|${
      window.location.hash
    }`;
    const action = browserHistoryActionRef.current;
    browserHistoryActionRef.current = null;

    if (!browserHistoryInitializedRef.current) {
      writeBrowserHistory('replace', state.screen, state.history, roomId);
      browserHistoryInitializedRef.current = true;
      lastBrowserHistoryKeyRef.current = historyKey;
      return;
    }

    if (historyKey === lastBrowserHistoryKeyRef.current) return;

    if (action === 'pop') {
      lastBrowserHistoryKeyRef.current = historyKey;
      return;
    }

    writeBrowserHistory(action === 'push' ? 'push' : 'replace', state.screen, state.history, roomId);
    lastBrowserHistoryKeyRef.current = historyKey;
  }, [state.history, state.room?.id, state.screen]);

  const artist = findArtist(state.artistId);
  const bank = artist?.banks.find((b) => b.id === state.bankId);
  const questions = useMemo(() => bank?.questions ?? [], [bank]);
  const selectedSongs = useMemo(
    () => orderedSongs(state.artistId, state.selectedSongIds),
    [state.artistId, state.selectedSongIds],
  );
  const creatorSongs = useMemo(
    () => orderedSongs(state.artistId, state.creatorOrder),
    [state.artistId, state.creatorOrder],
  );
  const friendSongs = useMemo(
    () => orderedSongs(state.artistId, state.friendOrder),
    [state.artistId, state.friendOrder],
  );

  const go = useCallback((screen: Screen, pushHistory = true) => {
    browserHistoryActionRef.current = pushHistory ? 'push' : 'replace';
    setState((prev) => ({
      ...prev,
      screen,
      history: pushHistory ? [...prev.history, prev.screen] : prev.history,
    }));
  }, []);

  const back = useCallback(() => {
    const canUseBrowserHistory =
      typeof window !== 'undefined' &&
      stateRef.current.history.length > 0 &&
      isBrowserHistoryEntry(window.history.state);

    if (canUseBrowserHistory) {
      window.history.back();
      return;
    }

    browserHistoryActionRef.current = 'replace';
    setState((prev) => {
      const stack = [...prev.history];
      const previous = stack.pop();
      return previous
        ? { ...prev, screen: previous, history: stack }
        : { ...prev, screen: 'home', history: [] };
    });
  }, []);

  const setArtist = useCallback((artistId: string) => {
    setState((prev) => ({
      ...prev,
      artistId,
      bankId: 'top6',
      selectedSongIds: [],
      creatorOrder: [],
      friendOrder: [],
      room: null,
    }));
  }, []);

  const setBank = useCallback((bankId: string) => {
    setState((prev) => ({ ...prev, bankId }));
  }, []);

  const toggleSong = useCallback((id: string) => {
    setState((prev) => {
      if (prev.selectedSongIds.includes(id)) {
        return {
          ...prev,
          selectedSongIds: prev.selectedSongIds.filter((songId) => songId !== id),
        };
      }
      if (prev.selectedSongIds.length >= REQUIRED_COUNT) {
        return { ...prev, toast: '最多选择 6 首歌。' };
      }
      return { ...prev, selectedSongIds: [...prev.selectedSongIds, id] };
    });
  }, []);

  const clearSongs = useCallback(() => {
    setState((prev) => ({ ...prev, selectedSongIds: [], creatorOrder: [], friendOrder: [] }));
  }, []);

  const startCreatorSort = useCallback(() => {
    browserHistoryActionRef.current = 'push';
    setState((prev) => {
      if (prev.selectedSongIds.length !== REQUIRED_COUNT) {
        browserHistoryActionRef.current = null;
        return { ...prev, toast: '请先选满 6 首歌。' };
      }
      return {
        ...prev,
        creatorOrder: prev.selectedSongIds,
        screen: 'create',
        history: [...prev.history, prev.screen],
      };
    });
  }, []);

  const reorderCreator = useCallback((from: number, to: number) => {
    setState((prev) => ({ ...prev, creatorOrder: moveItem(prev.creatorOrder, from, to) }));
  }, []);

  const reorderFriend = useCallback((from: number, to: number) => {
    setState((prev) => ({ ...prev, friendOrder: moveItem(prev.friendOrder, from, to) }));
  }, []);

  const createRoom = useCallback((): Room | null => {
    let created: Room | null = null;
    browserHistoryActionRef.current = 'push';
    setState((prev) => {
      const artist2 = findArtist(prev.artistId);
      if (!artist2 || prev.creatorOrder.length !== REQUIRED_COUNT) {
        browserHistoryActionRef.current = null;
        return { ...prev, toast: '请先完成 6 首歌排序。' };
      }
      const room = makeRoom({
        artistId: prev.artistId,
        artistName: artist2.name,
        bankId: 'top6',
        bankName: 'Top6 排序',
        songIds: prev.selectedSongIds,
        creatorOrder: prev.creatorOrder,
      });
      const rooms = [room, ...prev.rooms.filter((r) => r.id !== room.id)].slice(0, 20);
      saveRooms(rooms);
      created = room;
      return {
        ...prev,
        room,
        rooms,
        screen: 'creatorResult',
        history: [...prev.history, prev.screen],
      };
    });
    return created;
  }, []);

  const finishFriend = useCallback(() => {
    browserHistoryActionRef.current = 'push';
    setState((prev) => {
      const room = prev.room;
      if (!room) return { ...prev, screen: 'friendResult', history: [...prev.history, prev.screen] };
      const updatedRoom: Room = { ...room };
      const updatedRooms = prev.rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r));
      saveRooms(updatedRooms);
      return {
        ...prev,
        room: updatedRoom,
        rooms: updatedRooms,
        screen: 'friendResult',
        history: [...prev.history, prev.screen],
      };
    });
  }, []);

  const openRoom = useCallback((room: Room) => {
    if (typeof window !== 'undefined') {
      window.location.hash = `room=${room.id}`;
    }
    browserHistoryActionRef.current = 'replace';
    setState((prev) => ({
      ...applyRoomState(prev, room),
      screen: 'friendAnswer',
      history: [],
    }));
  }, []);

  const notify = useCallback((msg: string) => {
    setState((prev) => ({ ...prev, toast: msg }));
  }, []);

  useEffect(() => {
    if (!state.toast) return;
    const timer = window.setTimeout(() => setState((prev) => ({ ...prev, toast: null })), 2200);
    return () => window.clearTimeout(timer);
  }, [state.toast]);

  const toggleQuestion = useCallback((id: string) => {
    setState((prev) => ({ ...prev, selectedQuestionIds: [id] }));
  }, []);
  const pickFirstSix = useCallback(() => {}, []);
  const answerQuestion = useCallback(() => {}, []);

  const value: AppContextValue = {
    ...state,
    artistName: artist?.name ?? '',
    bankName: bank?.name ?? '',
    questions,
    selectedSongs,
    creatorSongs,
    friendSongs,
    go,
    back,
    setArtist,
    setBank,
    toggleQuestion,
    pickFirstSix,
    answerQuestion,
    toggleSong,
    clearSongs,
    startCreatorSort,
    reorderCreator,
    reorderFriend,
    createRoom,
    finishFriend,
    openRoom,
    notify,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
