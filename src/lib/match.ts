import type {
  MatchResult,
  OptionType,
  ProfileSummary,
  Question,
  Room,
} from './types';

export const TYPE_LABELS: Record<OptionType, string> = {
  style: '风格派',
  mood: '氛围派',
  era: '时代派',
  logic: '理性派',
  vibe: '直觉派',
  sound: '声音派',
};

const TYPE_PALETTE: Record<OptionType, string> = {
  style: '#d4af7a',
  mood: '#e8a5b8',
  era: '#5b8def',
  logic: '#7fb069',
  vibe: '#a48bff',
  sound: '#f5c842',
};

export function getTypeColor(type: OptionType): string {
  return TYPE_PALETTE[type];
}

function buildProfile(answers: Record<string, number>, questions: Question[]): ProfileSummary {
  const counts: Record<OptionType, number> = {
    style: 0,
    mood: 0,
    era: 0,
    logic: 0,
    vibe: 0,
    sound: 0,
  };
  questions.forEach((q) => {
    const idx = answers[q.id];
    if (typeof idx === 'number' && q.options[idx]) {
      counts[q.options[idx].type] += 1;
    }
  });
  const entries = (Object.keys(counts) as OptionType[])
    .map((t) => ({ type: t, name: TYPE_LABELS[t], count: counts[t] }))
    .sort((a, b) => b.count - a.count);
  return {
    topType: entries[0]?.type ?? 'style',
    topTypeName: entries[0]?.name ?? '风格派',
    typeDistribution: entries,
  };
}

interface CalcInput {
  questions: Question[];
  creatorAnswers: Record<string, number>;
  friendAnswers: Record<string, number>;
  recommendedSongs: MatchResult['recommendedSongs'];
}

export function calculateMatch({
  questions,
  creatorAnswers,
  friendAnswers,
  recommendedSongs,
}: CalcInput): MatchResult {
  const total = questions.length;
  let same = 0;
  questions.forEach((q) => {
    if (creatorAnswers[q.id] === friendAnswers[q.id]) same += 1;
  });

  const creatorProfile = buildProfile(creatorAnswers, questions);
  const friendProfile = buildProfile(friendAnswers, questions);

  const base = 52 + same * 7;
  const typeBonus = creatorProfile.topType === friendProfile.topType ? 8 : 0;
  const score = Math.min(99, base + typeBonus);

  let tier: MatchResult['tier'] = 'icebreaker';
  let title = '破冰推荐';
  let label = '破冰搭档';
  let comment = '你们的听感像是两条平行的河流——暂时没交汇，但都流向同一片海。';
  let highlight = '这次听歌品味还没对上，但正因如此，才更值得交换耳机。';
  let differPoint = '你们听到的，可能是同一个艺人的两副面孔。';

  if (score > 90) {
    tier = 'top';
    title = '同担爱听';
    label = '同担认证';
    comment = '你听的是同一首歌，呼吸的也是同一个节拍。这种默契不需要解释。';
    highlight = '你听的是 TA 的呼吸，TA 听的是你的回声。';
    differPoint = '几乎找不到分歧——只能从「前奏哪个版本更上头」下手。';
  } else if (score >= 80) {
    tier = 'high';
    title = '高默契补听';
    label = '高补听档';
    comment = '你把耳机递过去的那一首歌，TA 一定会接住。';
    highlight = '你们的曲库重合度高，TA 漏掉的歌，刚好是你能补上的那一首。';
    differPoint = '剩下的差异，多半藏在一些冷门 B 面里。';
  } else if (score >= 65) {
    tier = 'complement';
    title = '互补歌单';
    label = '互补搭档';
    comment = '你负责带 TA 去听没听过的，TA 负责带你看更熟悉的那一面。';
    highlight = '你们是一对互补耳机——左耳新鲜，右耳熟悉。';
    differPoint = '差异刚好是你们可以交换的礼物，而不是鸿沟。';
  }

  return {
    score,
    same,
    total,
    title,
    label,
    comment,
    highlight,
    differPoint,
    tier,
    recommendedSongs,
    creatorProfile,
    friendProfile,
  };
}

export function generateRoomTitle(artistName: string, bankName: string): string {
  return `${artistName} · ${bankName} 同担默契局`;
}

export function makeRoom(args: {
  artistId: string;
  artistName: string;
  bankId: string;
  bankName: string;
  questionIds: string[];
  creatorAnswers: Record<string, number>;
}): Room {
  const id = `room-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const title = generateRoomTitle(args.artistName, args.bankName);
  return {
    id,
    artistId: args.artistId,
    artistName: args.artistName,
    bankId: args.bankId,
    bankName: args.bankName,
    title,
    link: typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#room=${id}` : `#room=${id}`,
    questionIds: args.questionIds,
    creatorAnswers: args.creatorAnswers,
    rankings: [],
    createdAt: Date.now(),
  };
}

export const STORAGE_KEY = 'tongdan_moqi_rooms';

export function loadRooms(): Room[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as Room[];
    if (!Array.isArray(data)) return [];
    return data.slice(0, 20);
  } catch {
    return [];
  }
}

export function saveRooms(rooms: Room[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms.slice(0, 20)));
  } catch {
    // ignore quota errors
  }
}
