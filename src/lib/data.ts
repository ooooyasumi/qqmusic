import type { Artist, Question } from './types';

// 通用 10 道题模板（4 个艺人共用，减少占位文案量）
function buildBankQuestions(seed: string): Question[] {
  const types: Array<'style' | 'mood' | 'era' | 'logic' | 'vibe' | 'sound'> = [
    'era',
    'vibe',
    'style',
    'mood',
    'sound',
    'logic',
    'mood',
    'era',
    'style',
    'logic',
  ];
  return Array.from({ length: 10 }).map((_, i) => {
    const t = types[i];
    return {
      id: `${seed}-${i + 1}`,
      title: `第 ${i + 1} 题 · 占位题干（${t}）`,
      subtitle: '题目副标题 · 可自定义',
      options: [
        { text: '选项 A · 占位文案', note: 'A 注释', type: t },
        { text: '选项 B · 占位文案', note: 'B 注释', type: t },
        { text: '选项 C · 占位文案', note: 'C 注释', type: t },
        { text: '选项 D · 占位文案', note: 'D 注释', type: t },
      ],
    };
  });
}

export const artists: Artist[] = [
  {
    id: 'jay',
    name: '周杰伦',
    short: 'JAY',
    accent: '#7fb069',
    cover: '/artists/jay.png',
    hook: '别光说你也听周杰伦',
    card: '华语流行 / 2000s 经典',
    title: '你听懂的是哪一种喜欢？',
    intro:
      '从《Jay》到《最伟大的作品》，他的音乐陪伴了一整代人的青春。挑 6 道题，看看你和朋友听到的是不是同一种喜欢。',
    tags: ['华语经典', '中国风', 'R&B', '青春记忆'],
    songs: [
      { title: '七里香', album: '七里香', year: '2004', reason: '夏天的代名词，最适合作为答案配乐。' },
      { title: '以父之名', album: '叶惠美', year: '2003', reason: '哥特式说唱，测试硬核粉必听。' },
      { title: '晴天', album: '叶惠美', year: '2003', reason: '前奏一响，青春就回来了。' },
    ],
    banks: [
      {
        id: 'album',
        name: '专辑题库',
        icon: '◆',
        desc: '从 14 张录音室专辑中出题',
        questions: buildBankQuestions('jay-album'),
      },
      {
        id: 'lyric',
        name: '歌词题库',
        icon: '✦',
        desc: '从经典歌词的意象里出题',
        questions: buildBankQuestions('jay-lyric'),
      },
    ],
  },
  {
    id: 'jj',
    name: '林俊杰',
    short: 'JJ',
    accent: '#5b8def',
    cover: '/artists/jj.png',
    hook: '你们听懂的是同一种情歌吗',
    card: '情歌王子 / R&B 抒情',
    title: '你听懂的是同一种情歌吗？',
    intro:
      '从《江南》到《交换余生》，JJ 把情歌唱成了一整个青春。挑 6 道题，测测你们听的是不是同一种心动。',
    tags: ['情歌', 'R&B', '行走的 CD', '温柔系'],
    songs: [
      { title: '江南', album: '第二天堂', year: '2004', reason: '情歌入坑曲，氛围感拉满。' },
      { title: '她说', album: '她说', year: '2010', reason: '细腻情绪的代表作。' },
      { title: '修炼爱情', album: '因你而在', year: '2013', reason: '一首比一首上头。' },
    ],
    banks: [
      {
        id: 'album',
        name: '专辑题库',
        icon: '◆',
        desc: '从历年专辑中出题',
        questions: buildBankQuestions('jj-album'),
      },
      {
        id: 'lyric',
        name: '歌词题库',
        icon: '✦',
        desc: '从经典歌词中出题',
        questions: buildBankQuestions('jj-lyric'),
      },
    ],
  },
  {
    id: 'ts',
    name: 'Taylor Swift',
    short: 'TS',
    accent: '#e8a5b8',
    cover: '/artists/taylor.png',
    hook: '测测你们是不是同一个 Era',
    card: 'Pop / Country / Folk',
    title: '你听的是 Taylor 哪个 Era？',
    intro:
      '从乡村少女到流行天后，Taylor 用一张张专辑讲述自己的故事。挑 6 道题，看看你们是不是处在同一个 Era。',
    tags: ['霉霉', 'Eras Tour', 'Folklore', 'Midnights'],
    songs: [
      { title: 'Cruel Summer', album: 'Lover', year: '2019', reason: 'Eras Tour 高光时刻。' },
      { title: 'All Too Well', album: 'Red', year: '2012', reason: '10 分钟版必听。' },
      { title: 'Anti-Hero', album: 'Midnights', year: '2022', reason: '当代年轻人主题曲。' },
    ],
    banks: [
      {
        id: 'album',
        name: '专辑题库',
        icon: '◆',
        desc: '从 11 张录音室专辑中出题',
        questions: buildBankQuestions('ts-album'),
      },
      {
        id: 'lyric',
        name: '歌词题库',
        icon: '✦',
        desc: '从经典歌词中出题',
        questions: buildBankQuestions('ts-lyric'),
      },
    ],
  },
  {
    id: 'bp',
    name: 'BLACKPINK',
    short: 'BP',
    accent: '#f5c842',
    cover: '/artists/bp.png',
    hook: '舞台偏好和成员雷达对得上吗',
    card: 'K-Pop / Girl Crush',
    title: '你 Pick 的 BLACKPINK 是什么颜色？',
    intro:
      '粉墨舞台的四种颜色，Jennie / Jisoo / Rosé / Lisa 各自的味道。挑 6 道题，看看你们的舞台雷达对不对得上。',
    tags: ['K-Pop', 'Girl Crush', '舞台', '成员雷达'],
    songs: [
      { title: 'DDU-DU DDU-DU', album: 'SQUARE UP', year: '2018', reason: '舞台入坑神曲。' },
      { title: 'How You Like That', album: 'THE ALBUM', year: '2020', reason: '霸气回归。' },
      { title: 'Pink Venom', album: 'BORN PINK', year: '2022', reason: '粉墨式高燃。' },
    ],
    banks: [
      {
        id: 'album',
        name: '专辑题库',
        icon: '◆',
        desc: '从主打曲中出题',
        questions: buildBankQuestions('bp-album'),
      },
      {
        id: 'lyric',
        name: '歌词题库',
        icon: '✦',
        desc: '从舞台表演中出题',
        questions: buildBankQuestions('bp-lyric'),
      },
    ],
  },
];

export function findArtist(id: string): Artist | undefined {
  return artists.find((a) => a.id === id);
}

export function findBank(artistId: string, bankId: string) {
  const artist = findArtist(artistId);
  return artist?.banks.find((b) => b.id === bankId);
}
