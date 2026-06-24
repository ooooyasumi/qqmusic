// 艺人 / 题库 / 题目 / 房间 / 答案类型
export type OptionType = 'style' | 'mood' | 'era' | 'logic' | 'vibe' | 'sound';

export interface QuestionOption {
  text: string;
  note: string;
  type: OptionType;
}

export interface Question {
  id: string;
  title: string;
  subtitle?: string;
  options: QuestionOption[];
}

export interface QuestionBank {
  id: string;
  name: string;
  icon: string;
  desc: string;
  questions: Question[];
}

export interface Song {
  id: string;
  name: string;
  title: string;
  album: string;
  year?: string;
  reason: string;
  note: string;
  coverA: string;
  coverB: string;
  coverUrl?: string;
  listenUrl: string;
}

export interface Artist {
  id: string;
  name: string;
  short: string;
  accent: string;
  cover?: string;
  hook: string;
  card: string;
  title: string;
  intro: string;
  tags: string[];
  featuredSongIds?: string[];
  songs: Song[];
  banks: QuestionBank[];
}

export type Screen =
  | 'challengeLoading'
  | 'home'
  | 'artist'
  | 'friendSelect'
  | 'songList'
  | 'create'
  | 'creatorAnswer'
  | 'creatorResult'
  | 'friendAnswer'
  | 'friendResult'
  | 'shareResult'
  | 'rooms'
  | 'roomMissing';

export interface Room {
  id: string;
  artistId: string;
  artistName: string;
  bankId: string;
  bankName: string;
  title: string;
  link: string;
  shareToken?: string;
  questionIds: string[];
  creatorAnswers: Record<string, number>;
  songIds: string[];
  creatorOrder: string[];
  rankings: Array<{ name: string; score: number; label: string }>;
  createdAt: number;
}

export interface SongMatchResult {
  score: number;
  title: string;
  copy: string;
  shareSpark: string;
  biggestGap: string;
  callToAction: string;
  commonTopCount: number;
  exactIds: string[];
  sharedRows: Array<{
    song: Song;
    creatorRank: number;
    friendRank: number;
    gap: number;
  }>;
}

export type MatchTier = 'top' | 'high' | 'complement' | 'icebreaker';

export interface ProfileSummary {
  topType: OptionType;
  topTypeName: string;
  typeDistribution: Array<{ type: OptionType; name: string; count: number }>;
}

export interface MatchResult {
  score: number;
  same: number;
  total: number;
  title: string;
  label: string;
  comment: string;
  highlight: string;
  differPoint: string;
  tier: MatchTier;
  recommendedSongs: Song[];
  creatorProfile: ProfileSummary;
  friendProfile: ProfileSummary;
}
