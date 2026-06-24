import type {
  MatchResult,
  OptionType,
  ProfileSummary,
  Question,
  Room,
  Song,
  SongMatchResult,
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
  songIds: string[];
  creatorOrder: string[];
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
    questionIds: args.songIds,
    creatorAnswers: {},
    songIds: args.songIds,
    creatorOrder: args.creatorOrder,
    rankings: [],
    createdAt: Date.now(),
  };
}

const RESULT_COPY: Record<
  string,
  Record<
    string,
    Omit<
      SongMatchResult,
      'score' | 'commonSongCount' | 'commonTopCount' | 'exactIds' | 'sharedRows' | 'biggestGap'
    >
  >
> = {
  jay: {
    over90: {
      title: '晴天DNA双胞胎',
      copy: '你们不是在排歌，是两份青春回忆自动同步。连 Top 位执念都撞上，建议立刻互查耳机播放记录。',
      shareSpark: '{exactCount} 首同位，这不是默契是复刻',
      callToAction: '快找下一个杰伦同担验血统',
    },
    over75: {
      title: '私货相悖型同担',
      copy: '主线偏好很接近，但你们心里的神专、白月光和冷门私货还有一点分歧。这个分数最适合发出去吵一轮。',
      shareSpark: '差一点满分，必须找 TA 对质',
      callToAction: '喊 TA 来解释为什么这首排这么低',
    },
    over55: {
      title: '喜好分岔型同担',
      copy: '你们都爱周杰伦，但入口不一样：一个守着青春白月光，一个可能钻进暗黑叙事或冷门私货。',
      shareSpark: '分歧刚好够吵一轮',
      callToAction: '评论区求同担审判',
    },
    under55: {
      title: '音乐品味异地恋',
      copy: '你们像在同一场演唱会坐了两个看台。先从对方第一名开始重新认识，也许下一轮就能翻盘。',
      shareSpark: '低分不是输，是另一个故事',
      callToAction: '快找人替你翻盘',
    },
  },
  jj: {
    over90: {
      title: '修炼爱情同班同学',
      copy: '你们听 JJ 的方式几乎一模一样：同一首歌进心里，同一句副歌卡在同一个地方。建议互相交出深夜循环记录。',
      shareSpark: '{exactCount} 首同位，痛点都撞上了',
      callToAction: '快找下一个情歌共犯',
    },
    over75: {
      title: '情绪雷达型同担',
      copy: '你们大部分情绪入口都很近，只是一个更爱经典情歌，一个更在意唱作阶段或现场爆发。这个分数适合发出去让 TA 解释第一名。',
      shareSpark: '差一点满分，问题一定在排序',
      callToAction: '喊 TA 来解释哪首不该低',
    },
    over55: {
      title: '泪点错位型同担',
      copy: '你们都听懂林俊杰，但一个可能陷在情歌遗憾里，一个更爱唱作、现场或温柔旋律。不是不默契，是哭点不在同一句。',
      shareSpark: '分歧刚好够复盘一晚',
      callToAction: '评论区求 JJ 粉判案',
    },
    under55: {
      title: '各自修炼型同担',
      copy: '你们像在同一首 JJ 歌里听见了两种故事。先别急着认输，从对方第一名开始补，也许下一轮就一起破防。',
      shareSpark: '低分不是不懂，是哭错段落',
      callToAction: '快找人替你修炼爱情',
    },
  },
  ts: {
    over90: {
      title: '灵魂双生型同担',
      copy: '你们的 Taylor 排序像同一条时间线分成两份：青春、复仇、文学感和夏日热单都踩在同一个节拍上。',
      shareSpark: '{exactCount} 首同位，Era DNA 对上了',
      callToAction: '快找下一个 Swiftie 验证血统',
    },
    over75: {
      title: 'Era邻居',
      copy: '你们大方向很同频，只是一个可能更爱流行高光，一个更爱叙事长刀或民谣宇宙。这个分数很适合发出去对线。',
      shareSpark: '差一点满分，问题出在某个 Era',
      callToAction: '喊 TA 来解释第一名',
    },
    over55: {
      title: '一个Pop一个Folklore',
      copy: '你们都在 Taylor 宇宙里，但一个可能追城市霓虹和热单，一个更爱长篇叙事、秋天、午夜和后劲。',
      shareSpark: '分歧刚好够开一场 Era 辩论',
      callToAction: '评论区求 Swiftie 审判',
    },
    under55: {
      title: 'Swiftie异地频道',
      copy: '你们像同时进了 Taylor 宇宙，却走向了完全不同的门。别急，从对方第一名开始补，可能会打开新 Era。',
      shareSpark: '低分不是不懂，是Era不同',
      callToAction: '快找人替你翻盘',
    },
  },
  bp: {
    over90: {
      title: '舞台雷达双生',
      copy: '你们的 BP 排序几乎是同一个舞台视角：高能开场、甜酷切换、态度曲和情绪面都踩在同一个鼓点上。',
      shareSpark: '{exactCount} 首同位，舞台雷达锁死',
      callToAction: '快找下一个 BLINK 来验舞台感',
    },
    over75: {
      title: '高能开场差一拍',
      copy: '你们主线偏好很接近，只是在高能、甜酷、成员魅力或情绪补听之间有一点站队差异。这个分数很适合发出去开吵。',
      shareSpark: '差一点满分，问题出在站队',
      callToAction: '喊 TA 来解释哪首不该低',
    },
    over55: {
      title: '看点分岔型同担',
      copy: '你们都在 BP 宇宙里，但一个可能优先看舞台爆发，一个更吃旋律、成员魅力或态度表达。不是不默契，是看点不一样。',
      shareSpark: '分歧刚好够开一轮舞台审判',
      callToAction: '评论区求 BLINK 判案',
    },
    under55: {
      title: '频道错位型同担',
      copy: '你们像在同一场舞台看了两个直拍。先别急着认输，从对方第一名开始补，也许下一轮就能同频。',
      shareSpark: '低分不是不懂，是镜头不同',
      callToAction: '快找人替你翻盘',
    },
  },
};

function copyConfig(artistId: string, score: number) {
  const bucket = score >= 90 ? 'over90' : score >= 75 ? 'over75' : score >= 55 ? 'over55' : 'under55';
  return (RESULT_COPY[artistId] ?? RESULT_COPY.jay)[bucket];
}

export function calculateSongMatch({
  artistId,
  songs,
  creatorOrder,
  friendOrder,
}: {
  artistId: string;
  songs: Song[];
  creatorOrder: string[];
  friendOrder: string[];
}): SongMatchResult {
  const creatorRank = new Map(creatorOrder.map((id, index) => [id, index + 1]));
  const friendRank = new Map(friendOrder.map((id, index) => [id, index + 1]));
  const missingRank = Math.max(creatorOrder.length, friendOrder.length) + 1;
  const sharedRows = songs.map((song) => {
    const creator = creatorRank.get(song.id) ?? missingRank;
    const friend = friendRank.get(song.id) ?? missingRank;
    return { song, creatorRank: creator, friendRank: friend, gap: Math.abs(creator - friend) };
  });
  const exactIds = sharedRows
    .filter((row) => row.creatorRank === row.friendRank)
    .map((row) => row.song.id);
  const commonSongCount = sharedRows.filter(
    (row) => row.creatorRank <= creatorOrder.length && row.friendRank <= friendOrder.length,
  ).length;
  const commonTopCount = songs.filter((song) => {
    const creator = creatorRank.get(song.id) ?? 99;
    const friend = friendRank.get(song.id) ?? 99;
    return creator <= 3 && friend <= 3;
  }).length;
  const gapPenalty = sharedRows.reduce((sum, row) => sum + row.gap, 0);
  const score = Math.max(30, Math.min(99, 100 - gapPenalty * 5 + exactIds.length * 3 + commonTopCount * 2));
  const config = copyConfig(artistId, score);
  const biggest = [...sharedRows].sort((a, b) => b.gap - a.gap)[0];
  const biggestGap = biggest && biggest.gap > 0 ? `${biggest.song.name} 相差 ${biggest.gap} 位` : '完全同频';
  return {
    score,
    title: config.title,
    copy: config.copy,
    shareSpark: config.shareSpark.replace('{exactCount}', String(exactIds.length)),
    callToAction: config.callToAction,
    biggestGap,
    commonSongCount,
    commonTopCount,
    exactIds,
    sharedRows: sharedRows.sort((a, b) => a.friendRank - b.friendRank),
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
