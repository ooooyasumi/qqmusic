'use client';

import { useMemo } from 'react';
import { useApp } from '@/lib/state';
import { findArtist, findBank } from '@/lib/data';
import { Orbs } from '@/components/Orbs';
import { TopBar } from '@/components/TopBar';
import { calculateMatch, TYPE_LABELS, getTypeColor } from '@/lib/match';

export function FriendResultScreen() {
  const { room, friendAnswers, go, notify } = useApp();
  const artist = room ? findArtist(room.artistId) : null;
  const bank = room ? findBank(room.artistId, room.bankId) : null;

  const match = useMemo(() => {
    if (!room || !bank || !artist) return null;
    const order = new Map(room.questionIds.map((id, idx) => [id, idx]));
    const questions = bank.questions
      .filter((q) => room.questionIds.includes(q.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return calculateMatch({
      questions,
      creatorAnswers: room.creatorAnswers,
      friendAnswers,
      recommendedSongs: artist.songs,
    });
  }, [room, bank, artist, friendAnswers]);

  if (!room || !artist || !bank || !match) return null;

  const accent = artist.accent;

  return (
    <div className="screen screen-fade">
      <Orbs accent={`${accent}55`} secondary="rgba(212,175,122,0.25)" />
      <TopBar title="Match Result" />

      <div className="screen-content-scrollable no-scrollbar">
        {/* 巨号分数 */}
        <div className="relative flex flex-col items-center text-center pt-2">
          <p className="kicker" style={{ color: accent }}>
            {artist.short} · Moqi Score
          </p>
          <div
            className="giant-number pop-in mt-3"
            style={{ ['--artist-accent' as string]: accent }}
          >
            {match.score}
          </div>
          <p
            className="ink-display mt-2"
            style={{ fontSize: 22, fontStyle: 'italic', color: 'var(--ink-primary)' }}
          >
            {match.title}
          </p>
          <p className="ink-mute text-xs mt-1 tracking-widest">
            {match.same} / {match.total} 题答案相同
          </p>
        </div>

        {/* 关系标签 */}
        <div
          className="mt-6 p-5"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--ink-faint)',
            borderRadius: 22,
            backdropFilter: 'blur(8px)',
          }}
        >
          <p className="kicker">Relation Label</p>
          <p
            className="ink-display mt-2"
            style={{ fontSize: 26, color: accent, fontStyle: 'italic' }}
          >
            {match.label}
          </p>
          <p className="ink-body ink-secondary mt-3 text-sm" style={{ lineHeight: 1.7 }}>
            {match.comment}
          </p>
        </div>

        {/* 双画像对比 */}
        <div className="mt-7">
          <div className="hairline mb-4">
            <span>Profile Compare</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ProfileCol
              title="你（发起者）"
              profile={match.creatorProfile}
            />
            <ProfileCol title="好友" profile={match.friendProfile} />
          </div>
        </div>

        {/* 分歧看点 */}
        <div className="mt-7">
          <div className="hairline mb-4">
            <span>Highlight & Differ</span>
          </div>
          <div className="flex flex-col gap-3">
            <div
              className="p-4"
              style={{
                background: 'rgba(212,175,122,0.06)',
                border: '1px solid rgba(212,175,122,0.18)',
                borderRadius: 16,
              }}
            >
              <p
                className="kicker"
                style={{ color: 'var(--accent-gold)' }}
              >
                Highlight
              </p>
              <p className="ink-body text-sm mt-1" style={{ lineHeight: 1.7 }}>
                {match.highlight}
              </p>
            </div>
            <div
              className="p-4"
              style={{
                background: 'rgba(232,165,184,0.04)',
                border: '1px solid rgba(232,165,184,0.18)',
                borderRadius: 16,
              }}
            >
              <p className="kicker" style={{ color: 'var(--accent-rose)' }}>
                Differ
              </p>
              <p className="ink-body text-sm mt-1" style={{ lineHeight: 1.7 }}>
                {match.differPoint}
              </p>
            </div>
          </div>
        </div>

        {/* 推荐歌曲 */}
        <div className="mt-7">
          <div className="hairline mb-4">
            <span>Recommended</span>
          </div>
          <div className="flex flex-col gap-2">
            {match.recommendedSongs.map((s, i) => (
              <div
                key={s.title}
                className="flex items-center justify-between py-2"
                style={{ borderBottom: '1px solid var(--ink-faint)' }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="ink-mono"
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.2em',
                      color: 'var(--ink-mute)',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="ink-title" style={{ fontSize: 14, fontWeight: 500 }}>
                      {s.title}
                    </p>
                    <p className="ink-mute text-xs">
                      {s.album} · {s.year}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="ink-mono text-xs"
                  style={{ color: accent, letterSpacing: '0.2em' }}
                  onClick={() =>
                    notify(`已打开收听入口：${s.title} · ${s.album}`)
                  }
                >
                  PLAY
                </button>
              </div>
            ))}
          </div>
          <p className="ink-faint text-xs text-center mt-3 tracking-widest">
            收听入口为占位 · 真实链接接入 QQ 音乐后开放
          </p>
        </div>

        {/* CTA */}
        <div className="mt-7 flex flex-col gap-3">
          <button
            type="button"
            className="btn-primary"
            onClick={() => notify('已生成分享卡（占位）')}
          >
            分享结果给好友
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => go('rooms')}
            >
              查看房间排名
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => go('home')}
            >
              回到首页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileCol({
  title,
  profile,
}: {
  title: string;
  profile: { topTypeName: string; typeDistribution: Array<{ name: string; count: number; type: string }> };
}) {
  return (
    <div
      className="p-4"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--ink-faint)',
        borderRadius: 16,
      }}
    >
      <p className="kicker">{title}</p>
      <p
        className="ink-display mt-2"
        style={{ fontSize: 18, color: 'var(--accent-gold)', fontStyle: 'italic' }}
      >
        {profile.topTypeName}
      </p>
      <div className="mt-3 flex flex-col gap-1.5">
        {profile.typeDistribution.map((d) => (
          <div key={d.type} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: getTypeColor(d.type as never) }}
              />
              <span className="ink-mute text-xs">{d.name}</span>
            </div>
            <span
              className="ink-mono"
              style={{ fontSize: 10, color: 'var(--ink-secondary)' }}
            >
              {d.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
