'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
    .map((id) => artist.songs.find((song) => song.id === id) ?? findCatalogSong(artistId, id))
    .filter((song): song is Song => Boolean(song));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initial);

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
      return {
        ...next,
        room,
        artistId: room.artistId,
        bankId: room.bankId,
        selectedSongIds: room.songIds,
        creatorOrder: room.creatorOrder,
        friendOrder: room.songIds,
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
        setState((prev) => ({ ...prev, screen: 'home', history: [] }));
        return;
      }
      const roomId = decodeURIComponent(match[1]);
      setState((prev) => {
        const room = prev.rooms.find((r) => r.id === roomId);
        if (!room) return { ...prev, screen: 'roomMissing' };
        return {
          ...prev,
          room,
          artistId: room.artistId,
          bankId: room.bankId,
          selectedSongIds: room.songIds,
          creatorOrder: room.creatorOrder,
          friendOrder: room.songIds,
          screen: 'friendAnswer',
          history: [],
        };
      });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

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
    setState((prev) => ({
      ...prev,
      screen,
      history: pushHistory ? [...prev.history, prev.screen] : prev.history,
    }));
  }, []);

  const back = useCallback(() => {
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
    setState((prev) => {
      if (prev.selectedSongIds.length !== REQUIRED_COUNT) {
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
    setState((prev) => {
      const artist2 = findArtist(prev.artistId);
      if (!artist2 || prev.creatorOrder.length !== REQUIRED_COUNT) {
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
    setState((prev) => ({
      ...prev,
      room,
      artistId: room.artistId,
      bankId: room.bankId,
      selectedSongIds: room.songIds,
      creatorOrder: room.creatorOrder,
      friendOrder: room.songIds,
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
