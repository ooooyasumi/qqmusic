import type { Artist, Question, Song } from './types';

function song(
  id: string,
  name: string,
  album: string,
  note: string,
  coverA: string,
  coverB: string,
): Song {
  return {
    id,
    name,
    title: name,
    album,
    note,
    reason: note,
    coverA,
    coverB,
    listenUrl: `https://y.qq.com/n/ryqq/search?w=${encodeURIComponent(name)}`,
  };
}

function legacyQuestions(seed: string): Question[] {
  return Array.from({ length: 6 }).map((_, i) => ({
    id: `${seed}-${i + 1}`,
    title: `Top ${i + 1}`,
    subtitle: '排序流程兼容占位',
    options: [
      { text: 'A', note: 'A', type: 'style' },
      { text: 'B', note: 'B', type: 'mood' },
      { text: 'C', note: 'C', type: 'era' },
      { text: 'D', note: 'D', type: 'vibe' },
    ],
  }));
}

export const artists: Artist[] = [
  {
    id: 'jay',
    name: '周杰伦',
    short: 'JAY',
    accent: '#7fb069',
    cover: 'https://web-resource-1372876299.cos.ap-guangzhou.myqcloud.com/qqmusic/artists/jay.png',
    hook: '敢来排你的 Top 吗',
    card: '青春回忆、神专争议、冷门私货',
    title: '创建你的周杰伦单曲排序',
    intro: '从歌库里选 6 首最能代表你的周杰伦单曲，再拖动排出真实 Top。',
    tags: ['Top6 排序', '青春 BGM', '老粉暗号'],
    featuredSongIds: [
      'jay-apple-1624001324',
      'jay-apple-1624001317',
      'jay-apple-536115195',
      'jay-apple-536030695',
      'jay-apple-535824738',
      'jay-apple-536009642',
    ],
    songs: [
      song('jay-01', '晴天', '叶惠美', '全员青春白月光', '#c7a45a', '#77b9a6'),
      song('jay-02', '七里香', '七里香', '盛夏风一吹就会想起', '#8ec5a7', '#f7d36c'),
      song('jay-03', '以父之名', '叶惠美', '神级前奏与暗黑叙事', '#2b2f3a', '#c7a45a'),
      song('jay-04', '夜曲', '十一月的萧邦', '一响就知道拿奖到手软', '#1d2633', '#8b7cff'),
      song('jay-05', '青花瓷', '我很忙', '中国风全民破圈曲', '#8abcc4', '#e7e1c7'),
      song('jay-06', '半岛铁盒', '八度空间', '老歌迷的回忆开关', '#b1885d', '#324b63'),
      song('jay-07', '梯田', '叶惠美', '藏在神专里的私货', '#6d8f5f', '#d2b56b'),
      song('jay-08', '双截棍', '范特西', '出圈速度像开场鼓点', '#171717', '#17d783'),
      song('jay-09', '稻香', '魔杰座', '低谷时的温柔拉回', '#ffd166', '#5e9f72'),
      song('jay-10', '搁浅', '七里香', '后劲很重的遗憾情歌', '#6e88a1', '#d9d2c1'),
      song('jay-11', '东风破', '叶惠美', '中国风叙事入口', '#935a43', '#dfc17c'),
      song('jay-12', '夜的第七章', '依然范特西', '侦探感和编曲控必选', '#1b1f29', '#9277a8'),
    ],
    banks: [{ id: 'top6', name: '单曲排序', icon: '◆', desc: '选择 6 首歌后拖动排序', questions: legacyQuestions('jay') }],
  },
  {
    id: 'jj',
    name: '林俊杰',
    short: 'JJ',
    accent: '#5b8def',
    cover: 'https://web-resource-1372876299.cos.ap-guangzhou.myqcloud.com/qqmusic/artists/jj.png',
    hook: '你们听懂的是同一种情歌吗',
    card: '情歌表达、唱作理解、现场高光',
    title: '创建你的林俊杰单曲排序',
    intro: '选出 6 首你最在意的 JJ 单曲，让好友来排同一组歌。',
    tags: ['情歌共鸣', '唱作理解', '现场高光'],
    featuredSongIds: [
      'jj-apple-1071753628',
      'jj-apple-1694849138',
      'jj-apple-1788007696',
      'jj-apple-1071506929',
      'jj-apple-1871400637',
      'jj-apple-1071517710',
    ],
    songs: [
      song('jj-01', '江南', '第二天堂', '国民记忆入口', '#5bd8ff', '#d5b77c'),
      song('jj-02', '修炼爱情', '因你而在', '遗憾浓度很高', '#495b7b', '#c19f8a'),
      song('jj-03', '可惜没如果', '新地球', '关系复盘名场面', '#6c7b8b', '#e5d7c4'),
      song('jj-04', '她说', '她说', '情歌叙事代表作', '#2f4058', '#9bb8c8'),
      song('jj-05', '背对背拥抱', '100天', '克制但很痛', '#3e5b62', '#dfbd74'),
      song('jj-06', '不为谁而作的歌', '和自己对话', '现场爆发与自我命题', '#242a31', '#5bd8ff'),
      song('jj-07', '伟大的渺小', '伟大的渺小', '成熟唱作理解', '#182032', '#f4d56f'),
      song('jj-08', '小酒窝', 'JJ陆', '甜感入口', '#ff9bb1', '#ffd166'),
      song('jj-09', '曹操', '曹操', '节奏记忆点强', '#5a2020', '#dba94f'),
      song('jj-10', '学不会', '学不会', '成熟情绪表达', '#313440', '#8ec5ff'),
      song('jj-11', '关键词', '和自己对话', '温柔直球', '#b8a589', '#5bd8ff'),
      song('jj-12', '醉赤壁', 'JJ陆', '古风旋律入口', '#7b4937', '#d8c084'),
    ],
    banks: [{ id: 'top6', name: '单曲排序', icon: '◆', desc: '选择 6 首歌后拖动排序', questions: legacyQuestions('jj') }],
  },
  {
    id: 'ts',
    name: 'Taylor Swift',
    short: 'TS',
    accent: '#e8a5b8',
    cover: 'https://web-resource-1372876299.cos.ap-guangzhou.myqcloud.com/qqmusic/artists/taylor.png',
    hook: '测测你们是不是同一个 Era',
    card: 'Era 偏好、歌词叙事、专辑人格',
    title: '创建你的 Taylor Swift 单曲排序',
    intro: '选出 6 首最能代表你 Taylor 雷达的歌，再让好友挑战你的 Era 偏好。',
    tags: ['Era 偏好', '歌词叙事', '专辑人格'],
    featuredSongIds: [
      'ts-apple-1440924808',
      'ts-apple-1440935808',
      'ts-apple-1468058171',
      'ts-apple-1650841515',
      'ts-apple-1524801580',
      'ts-apple-1440935812',
    ],
    songs: [
      song('ts-01', 'Love Story', 'Fearless', '金色乡村流行入口', '#d6b35d', '#f7efe0'),
      song('ts-02', 'All Too Well', 'Red', '叙事长刀代表作', '#9f2f2f', '#f28b74'),
      song('ts-03', 'Cruel Summer', 'Lover', '明亮流行高光', '#ff6f91', '#ffd166'),
      song('ts-04', 'Blank Space', '1989', '锋利流行人格', '#79a7d8', '#f7f4ed'),
      song('ts-05', 'cardigan', 'folklore', '安静民谣叙事', '#7b7f76', '#d8d1c1'),
      song('ts-06', 'Delicate', 'reputation', '夜色城市脉冲', '#111111', '#b7bbc4'),
      song('ts-07', 'Anti-Hero', 'Midnights', '午夜自我剖白', '#34315b', '#b7a7ff'),
      song('ts-08', 'Style', '1989', '霓虹流行驾驶感', '#8fc7ff', '#f6f7ef'),
      song('ts-09', 'Enchanted', 'Speak Now', '闪光告白名场面', '#9b6fd3', '#f0d8ff'),
      song('ts-10', 'champagne problems', 'evermore', '冬日故事后劲', '#7c5742', '#ded2bf'),
      song('ts-11', 'August', 'folklore', '夏日回忆滤镜', '#d8ae6d', '#8fb0a1'),
      song('ts-12', 'Shake It Off', '1989', '全民快乐开关', '#7bb9f0', '#ffcc63'),
    ],
    banks: [{ id: 'top6', name: '单曲排序', icon: '◆', desc: '选择 6 首歌后拖动排序', questions: legacyQuestions('ts') }],
  },
  {
    id: 'bp',
    name: 'BLACK PINK',
    short: 'BP',
    accent: '#f5c842',
    cover: 'https://web-resource-1372876299.cos.ap-guangzhou.myqcloud.com/qqmusic/artists/bp.png',
    hook: '舞台偏好和成员雷达对得上吗',
    card: '成员偏好、舞台名场面、风格态度',
    title: '创建你的 BLACK PINK 单曲排序',
    intro: '选 6 首最能代表你 BP 雷达的歌，再让好友挑战你的舞台偏好。',
    tags: ['成员偏好', '舞台名场面', '风格态度'],
    featuredSongIds: [
      'bp-apple-1551479993',
      'bp-apple-1533894669',
      'bp-apple-1639174482',
      'bp-apple-1644440674',
      'bp-apple-1533894681',
      'bp-apple-1551480140',
    ],
    songs: [
      song('bp-01', 'DDU-DU DDU-DU', 'SQUARE UP', '高能入口', '#111111', '#ff8fc2'),
      song('bp-02', 'How You Like That', 'THE ALBUM', '舞台爆发', '#1b1b1f', '#ffd166'),
      song('bp-03', 'Lovesick Girls', 'THE ALBUM', '情绪补听', '#ff6f91', '#5bd8ff'),
      song('bp-04', "As If It's Your Last", 'Single', '明亮好入口', '#ff7aa8', '#ffd166'),
      song('bp-05', 'Kill This Love', 'KILL THIS LOVE', '号角一响就开场', '#202024', '#f05868'),
      song('bp-06', 'Pink Venom', 'BORN PINK', '态度和气场', '#111111', '#f08dbc'),
      song('bp-07', 'Shut Down', 'BORN PINK', '成熟反击', '#2a2a2e', '#ffd166'),
      song('bp-08', 'Playing With Fire', 'SQUARE TWO', '早期甜酷', '#d1454f', '#20252e'),
      song('bp-09', 'Whistle', 'SQUARE ONE', '极简记忆点', '#111111', '#f6f7ef'),
      song('bp-10', 'Forever Young', 'SQUARE UP', '巡演氛围', '#5bd8ff', '#ff6f91'),
      song('bp-11', 'Pretty Savage', 'THE ALBUM', '粉丝私货舞台', '#191919', '#d897d3'),
      song('bp-12', 'Tally', 'BORN PINK', '态度表达', '#5a3d43', '#e2c08e'),
    ],
    banks: [{ id: 'top6', name: '单曲排序', icon: '◆', desc: '选择 6 首歌后拖动排序', questions: legacyQuestions('bp') }],
  },
];

export function findArtist(id: string): Artist | undefined {
  return artists.find((a) => a.id === id);
}

export function findBank(artistId: string, bankId: string) {
  const artist = findArtist(artistId);
  return artist?.banks.find((b) => b.id === bankId);
}

export function findSong(artistId: string, songId: string): Song | undefined {
  return findArtist(artistId)?.songs.find((s) => s.id === songId);
}
