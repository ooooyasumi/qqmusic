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
import {
  createBackendRoom,
  fetchMyRoomCollections,
  fetchRoomByToken,
  submitBackendAttempt,
  syncLegacyRoom,
} from './apiClient';
import { findArtist } from './data';
import { findCatalogSong } from './appleMusicCatalog';
import { loadRooms } from './match';
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
  participatedRooms: Room[];
  activeChallengeToken: string | null;
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
  startFriendSort: () => void;
  createRoom: () => Promise<Room | null>;
  finishFriend: () => Promise<void>;
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
  participatedRooms: [],
  activeChallengeToken: null,
  history: [],
  toast: null,
};

function initialStateForChallenge(token?: string): AppState {
  if (!token) return initial;
  return {
    ...initial,
    screen: 'challengeLoading',
    activeChallengeToken: token,
  };
}

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

function mergeRooms(rooms: Room[], extras: Room[]): Room[] {
  const byId = new Map<string, Room>();
  [...extras, ...rooms].forEach((room) => byId.set(room.id, room));
  return [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
}

function isScreen(value: unknown): value is Screen {
  return (
    value === 'challengeLoading' ||
    value === 'home' ||
    value === 'artist' ||
    value === 'friendSelect' ||
    value === 'songList' ||
    value === 'create' ||
    value === 'creatorAnswer' ||
    value === 'creatorResult' ||
    value === 'friendAnswer' ||
    value === 'friendResult' ||
    value === 'shareResult' ||
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

function challengeTokenFromSearch(search: string): string | null {
  const params = new URLSearchParams(search);
  return params.get('challenge') ?? params.get('room');
}

function challengeTokenFromHash(hash: string): string | null {
  const raw = hash.replace(/^#/, '').replace(/^\//, '');
  if (!raw) return null;

  const query = raw.startsWith('?') ? raw.slice(1) : raw;
  const keyed = challengeTokenFromSearch(query);
  if (keyed) return keyed;

  const pathMatch = raw.match(/^(?:challenge|room)\/([^/?#&]+)/);
  return pathMatch ? decodeURIComponent(pathMatch[1]) : null;
}

function challengeTokenFromLocation(initialToken?: string): string | null {
  if (initialToken) return initialToken;
  if (typeof window === 'undefined') return null;
  return challengeTokenFromSearch(window.location.search) ?? challengeTokenFromHash(window.location.hash);
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

function applyRoomState(state: AppState, room: Room, mode: 'owner' | 'friend' = 'owner'): AppState {
  return {
    ...state,
    room,
    artistId: room.artistId,
    bankId: room.bankId,
    selectedSongIds: mode === 'friend' ? [] : room.songIds,
    creatorOrder: room.creatorOrder,
    friendOrder: mode === 'friend' ? [] : room.songIds,
    activeChallengeToken: mode === 'friend' ? room.shareToken ?? null : state.activeChallengeToken,
  };
}

export function AppProvider({ children, initialChallengeToken }: { children: ReactNode; initialChallengeToken?: string }) {
  const initialState = useMemo(() => initialStateForChallenge(initialChallengeToken), [initialChallengeToken]);
  const [state, setState] = useState<AppState>(initialState);
  const stateRef = useRef<AppState>(initialState);
  const browserHistoryInitializedRef = useRef(false);
  const browserHistoryActionRef = useRef<BrowserHistoryAction | null>(null);
  const lastBrowserHistoryKeyRef = useRef<string | null>(null);
  const legacySyncPromiseRef = useRef<Promise<Room[]> | null>(null);

  const syncLegacyRooms = useCallback((): Promise<Room[]> => {
    if (!legacySyncPromiseRef.current) {
      const legacyRooms = loadRooms().filter((room) => {
        const legacySongIds = Array.isArray(room.songIds) ? room.songIds : [];
        const legacyQuestionIds = Array.isArray(room.questionIds) ? room.questionIds : [];
        const legacyCreatorOrder = Array.isArray(room.creatorOrder) ? room.creatorOrder : [];
        const songIds = legacySongIds.length === REQUIRED_COUNT ? legacySongIds : legacyQuestionIds;
        const creatorOrder = legacyCreatorOrder.length === REQUIRED_COUNT ? legacyCreatorOrder : songIds;
        return (
          typeof room.id === 'string' &&
          room.id.startsWith('room-') &&
          songIds.length === REQUIRED_COUNT &&
          creatorOrder.length === REQUIRED_COUNT
        );
      });
      legacySyncPromiseRef.current = Promise.allSettled(legacyRooms.map(syncLegacyRoom)).then((results) =>
        results
          .filter((result): result is PromiseFulfilledResult<Room> => result.status === 'fulfilled')
          .map((result) => result.value),
      );
    }
    return legacySyncPromiseRef.current;
  }, []);

  const openChallenge = useCallback(
    async (token: string, isCancelled: () => boolean = () => false) => {
      const syncedRooms = await syncLegacyRooms();
      const challengeRoom = await fetchRoomByToken(token).catch(() => null);
      const collections = await fetchMyRoomCollections().catch(() => ({
        owned: syncedRooms,
        participated: [],
      }));
      if (isCancelled()) return;
      browserHistoryActionRef.current = 'replace';
      setState((prev) => {
        const next = {
          ...prev,
          rooms: mergeRooms(collections.owned, syncedRooms),
          participatedRooms: collections.participated,
        };
        if (!challengeRoom) return { ...next, screen: 'roomMissing', history: [] };
        return {
          ...applyRoomState(next, challengeRoom, 'friend'),
          screen: 'friendSelect',
          history: [],
        };
      });
    },
    [syncLegacyRooms],
  );

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;
    const loadInitialState = async () => {
      try {
        const token = challengeTokenFromLocation(initialChallengeToken);
        if (token) {
          await openChallenge(token, () => cancelled);
          return;
        }

        const syncedRooms = await syncLegacyRooms();
        const collections = await fetchMyRoomCollections();
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          rooms: mergeRooms(collections.owned, syncedRooms),
          participatedRooms: collections.participated,
        }));
      } catch {
        if (!cancelled) {
          setState((prev) => ({ ...prev, toast: '房间加载失败，请稍后再试。' }));
        }
      }
    };
    void loadInitialState();
    return () => {
      cancelled = true;
    };
  }, [initialChallengeToken, openChallenge, syncLegacyRooms]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onHashChange = () => {
      const token = challengeTokenFromLocation();
      if (!token) {
        const historyEntry = isBrowserHistoryEntry(window.history.state) ? window.history.state : null;
        browserHistoryActionRef.current = 'replace';
        setState((prev) => ({
          ...prev,
          screen: historyEntry?.screen ?? 'home',
          history: historyEntry?.history ?? [],
        }));
        return;
      }
      void openChallenge(token);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [openChallenge]);

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
      activeChallengeToken: null,
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

  const startFriendSort = useCallback(() => {
    browserHistoryActionRef.current = 'push';
    setState((prev) => {
      if (prev.selectedSongIds.length !== REQUIRED_COUNT) {
        browserHistoryActionRef.current = null;
        return { ...prev, toast: '请先选满 6 首歌。' };
      }
      return {
        ...prev,
        friendOrder: prev.selectedSongIds,
        screen: 'friendAnswer',
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

  const createRoom = useCallback(async (): Promise<Room | null> => {
    const current = stateRef.current;
    const artist2 = findArtist(current.artistId);
    if (!artist2 || current.creatorOrder.length !== REQUIRED_COUNT) {
      setState((prev) => ({ ...prev, toast: '请先完成 6 首歌排序。' }));
      return null;
    }
    try {
      const room = await createBackendRoom({
        artistId: current.artistId,
        songIds: current.selectedSongIds,
        creatorOrder: current.creatorOrder,
      });
      browserHistoryActionRef.current = 'push';
      setState((prev) => ({
        ...prev,
        room,
        rooms: [room, ...prev.rooms.filter((r) => r.id !== room.id)].slice(0, 50),
        activeChallengeToken: null,
        screen: 'creatorResult',
        history: [...prev.history, prev.screen],
        toast: '挑战已生成',
      }));
      return room;
    } catch {
      setState((prev) => ({ ...prev, toast: '创建失败，请稍后再试。' }));
      return null;
    }
  }, []);

  const finishFriend = useCallback(async () => {
    const current = stateRef.current;
    const token = current.activeChallengeToken ?? current.room?.shareToken;
    if (!token || current.friendOrder.length !== REQUIRED_COUNT) {
      setState((prev) => ({ ...prev, toast: '请先完成 6 首歌排序。' }));
      return;
    }
    try {
      const submitted = await submitBackendAttempt({
        token,
        friendSongIds: current.selectedSongIds,
        friendOrder: current.friendOrder,
      });
      browserHistoryActionRef.current = 'push';
      setState((prev) => ({
        ...prev,
        room: submitted.room,
        participatedRooms: [
          submitted.room,
          ...prev.participatedRooms.filter((room) => room.id !== submitted.room.id),
        ],
        screen: 'friendResult',
        history: [...prev.history, prev.screen],
      }));
    } catch {
      setState((prev) => ({ ...prev, toast: '结果提交失败，请稍后再试。' }));
    }
  }, []);

  const openRoom = useCallback((room: Room) => {
    browserHistoryActionRef.current = 'replace';
    setState((prev) => ({
      ...applyRoomState(prev, room, 'friend'),
      screen: 'friendSelect',
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

  useEffect(() => {
    if (state.screen !== 'rooms') return;
    let cancelled = false;
    const refreshRooms = async () => {
      try {
        const collections = await fetchMyRoomCollections();
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            rooms: collections.owned,
            participatedRooms: collections.participated,
          }));
        }
      } catch {
        if (!cancelled) setState((prev) => ({ ...prev, toast: '房间列表加载失败。' }));
      }
    };
    void refreshRooms();
    return () => {
      cancelled = true;
    };
  }, [state.screen]);

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
    startFriendSort,
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
