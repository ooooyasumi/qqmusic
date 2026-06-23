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
import { findArtist, findBank } from './data';
import { calculateMatch, loadRooms, makeRoom, saveRooms } from './match';
import type { Question, Room, Screen } from './types';

interface AppState {
  screen: Screen;
  artistId: string;
  bankId: string;
  selectedQuestionIds: string[];
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
  go: (screen: Screen, pushHistory?: boolean) => void;
  back: () => void;
  setArtist: (artistId: string) => void;
  setBank: (bankId: string) => void;
  toggleQuestion: (id: string) => void;
  pickFirstSix: () => void;
  answerQuestion: (questionId: string, optionIndex: number) => void;
  createRoom: () => Room | null;
  finishFriend: () => void;
  openRoom: (room: Room) => void;
  notify: (msg: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const initial: AppState = {
  screen: 'home',
  artistId: 'jay',
  bankId: 'album',
  selectedQuestionIds: [],
  creatorAnswers: {},
  friendAnswers: {},
  answerIndex: 0,
  room: null,
  rooms: [],
  history: [],
  toast: null,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initial);
  const [mounted, setMounted] = useState(false);

  // 初始化：加载 rooms + 解析 hash
  useEffect(() => {
    setMounted(true);
    const rooms = loadRooms();
    setState((prev) => {
      const next = { ...prev, rooms };
      // 解析 hash
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        const match = hash.match(/room=([^&]+)/);
        if (match) {
          const roomId = decodeURIComponent(match[1]);
          const room = rooms.find((r) => r.id === roomId);
          if (room) {
            return {
              ...next,
              room,
              artistId: room.artistId,
              bankId: room.bankId,
              selectedQuestionIds: room.questionIds,
              creatorAnswers: room.creatorAnswers,
              friendAnswers: {},
              answerIndex: 0,
              screen: 'friendAnswer',
              history: [],
            };
          }
          return { ...next, screen: 'roomMissing' };
        }
      }
      return next;
    });
  }, []);

  // 监听 hash 变化
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onHashChange = () => {
      const hash = window.location.hash;
      const match = hash.match(/room=([^&]+)/);
      if (match) {
        const roomId = decodeURIComponent(match[1]);
        setState((prev) => {
          const room = prev.rooms.find((r) => r.id === roomId);
          if (!room) {
            return { ...prev, screen: 'roomMissing' };
          }
          return {
            ...prev,
            room,
            artistId: room.artistId,
            bankId: room.bankId,
            selectedQuestionIds: room.questionIds,
            creatorAnswers: room.creatorAnswers,
            friendAnswers: {},
            answerIndex: 0,
            screen: 'friendAnswer',
            history: [],
          };
        });
      } else if (!hash) {
        setState((prev) => ({ ...prev, screen: 'home', history: [] }));
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const artist = findArtist(state.artistId);
  const bank = artist?.banks.find((b) => b.id === state.bankId);
  const artistName = artist?.name ?? '';
  const bankName = bank?.name ?? '';
  const allBankQuestions = useMemo(() => bank?.questions ?? [], [bank]);
  const questions = useMemo(() => {
    if (state.selectedQuestionIds.length === 0) return [] as Question[];
    const order = new Map(state.selectedQuestionIds.map((id, idx) => [id, idx]));
    return state.selectedQuestionIds
      .map((id) => allBankQuestions.find((q) => q.id === id))
      .filter((q): q is Question => Boolean(q))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }, [allBankQuestions, state.selectedQuestionIds]);

  const go = useCallback((screen: Screen, pushHistory: boolean = true) => {
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
      if (previous) {
        return { ...prev, screen: previous, history: stack };
      }
      return { ...prev, screen: 'home', history: [] };
    });
  }, []);

  const setArtist = useCallback((artistId: string) => {
    setState((prev) => ({ ...prev, artistId, bankId: 'album' }));
  }, []);

  const setBank = useCallback((bankId: string) => {
    setState((prev) => ({
      ...prev,
      bankId,
      selectedQuestionIds: [],
      creatorAnswers: {},
      friendAnswers: {},
      answerIndex: 0,
    }));
  }, []);

  const toggleQuestion = useCallback((id: string) => {
    setState((prev) => {
      const has = prev.selectedQuestionIds.includes(id);
      if (has) {
        return {
          ...prev,
          selectedQuestionIds: prev.selectedQuestionIds.filter((x) => x !== id),
        };
      }
      if (prev.selectedQuestionIds.length >= 6) {
        return { ...prev, toast: '最多选择 6 道题。' };
      }
      return {
        ...prev,
        selectedQuestionIds: [...prev.selectedQuestionIds, id],
      };
    });
  }, []);

  const pickFirstSix = useCallback(() => {
    setState((prev) => {
      const bank2 = findBank(prev.artistId, prev.bankId);
      if (!bank2) return prev;
      return {
        ...prev,
        selectedQuestionIds: bank2.questions.slice(0, 6).map((q) => q.id),
      };
    });
  }, []);

  const answerQuestion = useCallback((questionId: string, optionIndex: number) => {
    setState((prev) => {
      const isCreator = prev.screen === 'creatorAnswer';
      const answers = isCreator
        ? { ...prev.creatorAnswers, [questionId]: optionIndex }
        : { ...prev.friendAnswers, [questionId]: optionIndex };
      const isLast = prev.answerIndex >= prev.selectedQuestionIds.length - 1;
      if (!isLast) {
        return {
          ...prev,
          [isCreator ? 'creatorAnswers' : 'friendAnswers']: answers,
          answerIndex: prev.answerIndex + 1,
        };
      }
      // 最后一题
      if (isCreator) {
        const room = makeRoom({
          artistId: prev.artistId,
          artistName: prev.artistId,
          bankId: prev.bankId,
          bankName: prev.bankId,
          questionIds: prev.selectedQuestionIds,
          creatorAnswers: answers,
        });
        const artist2 = findArtist(prev.artistId);
        const bank2 = artist2?.banks.find((b) => b.id === prev.bankId);
        room.artistName = artist2?.name ?? '';
        room.bankName = bank2?.name ?? '';
        room.title = `${room.artistName} · ${room.bankName} 同担默契局`;
        const rooms = [room, ...prev.rooms.filter((r) => r.id !== room.id)].slice(0, 20);
        saveRooms(rooms);
        return {
          ...prev,
          creatorAnswers: answers,
          room,
          rooms,
          screen: 'creatorResult',
          history: [...prev.history, prev.screen],
        };
      }
      // friend 最后一题
      return {
        ...prev,
        friendAnswers: answers,
        screen: 'friendResult',
        history: [...prev.history, prev.screen],
      };
    });
  }, []);

  const createRoom = useCallback((): Room | null => {
    let created: Room | null = null;
    setState((prev) => {
      const room = makeRoom({
        artistId: prev.artistId,
        artistName: prev.artistId,
        bankId: prev.bankId,
        bankName: prev.bankId,
        questionIds: prev.selectedQuestionIds,
        creatorAnswers: prev.creatorAnswers,
      });
      // 重写 artistName / bankName
      const artist2 = findArtist(prev.artistId);
      const bank2 = artist2?.banks.find((b) => b.id === prev.bankId);
      room.artistName = artist2?.name ?? '';
      room.bankName = bank2?.name ?? '';
      room.title = `${room.artistName} · ${room.bankName} 同担默契局`;
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
      if (!room) {
        return { ...prev, screen: 'friendResult', history: [...prev.history, prev.screen] };
      }
      // 重新读取最新 friendAnswers（可能由 answerQuestion 已经写入）
      const bank2 = findBank(room.artistId, room.bankId);
      const questions = bank2?.questions.filter((q) => room.questionIds.includes(q.id)) ?? [];
      const order = new Map(room.questionIds.map((id, idx) => [id, idx]));
      const orderedQuestions = [...questions].sort(
        (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
      );
      const match = calculateMatch({
        questions: orderedQuestions,
        creatorAnswers: room.creatorAnswers,
        friendAnswers: prev.friendAnswers,
        recommendedSongs: findArtist(room.artistId)?.songs ?? [],
      });
      const nextIndex = room.rankings.length + 1;
      const newRanking = {
        name: `好友 ${nextIndex}`,
        score: match.score,
        label: match.title,
      };
      const updatedRankings = [...room.rankings, newRanking].sort(
        (a, b) => b.score - a.score,
      );
      const updatedRoom: Room = { ...room, rankings: updatedRankings };
      const updatedRooms = prev.rooms.map((r) =>
        r.id === updatedRoom.id ? updatedRoom : r,
      );
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
      selectedQuestionIds: room.questionIds,
      creatorAnswers: room.creatorAnswers,
      friendAnswers: {},
      answerIndex: 0,
      screen: 'friendAnswer',
      history: [],
    }));
  }, []);

  const notify = useCallback((msg: string) => {
    setState((prev) => ({ ...prev, toast: msg }));
  }, []);

  // 自动关闭 toast
  useEffect(() => {
    if (!state.toast) return;
    const t = setTimeout(() => setState((prev) => ({ ...prev, toast: null })), 2200);
    return () => clearTimeout(t);
  }, [state.toast]);

  const value: AppContextValue = {
    ...state,
    mounted,
    artistName,
    bankName,
    questions,
    go,
    back,
    setArtist,
    setBank,
    toggleQuestion,
    pickFirstSix,
    answerQuestion,
    createRoom,
    finishFriend,
    openRoom,
    notify,
  } as AppContextValue & { mounted: boolean };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}
