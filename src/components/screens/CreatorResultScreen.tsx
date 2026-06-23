'use client';

import { useApp } from '@/lib/state';
import { findArtist, findBank } from '@/lib/data';
import { Orbs } from '@/components/Orbs';
import { TopBar } from '@/components/TopBar';
import { TYPE_LABELS, getTypeColor } from '@/lib/match';

export function CreatorResultScreen() {
  const { room, creatorAnswers, go, notify } = useApp();
  if (!room) return null;
  const artist = findArtist(room.artistId);
  const bank = findBank(room.artistId, room.bankId);
  if (!artist || !bank) return null;

  const accent = artist.accent;
  const questions = bank.questions.filter((q) => room.questionIds.includes(q.id));
  const order = new Map(room.questionIds.map((id, idx) => [id, idx]));
  const ordered = [...questions].sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
  );

  // 简单画像统计
  const counts: Record<string, number> = {};
  ordered.forEach((q) => {
    const i = creatorAnswers[q.id];
    if (typeof i === 'number' && q.options[i]) {
      const t = q.options[i].type;
      counts[t] = (counts[t] ?? 0) + 1;
    }
  });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="screen screen-fade">
      <Orbs accent={`${accent}55`} secondary="rgba(212,175,122,0.25)" />
      <TopBar title="Creator Result" />

      <div className="screen-content-scrollable no-scrollbar">
        <div className="relative">
          <p className="kicker">Creator Card · 发起者解读</p>
          <h1
            className="ink-display mt-3"
            style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.1 }}
          >
            你的<span style={{ fontStyle: 'italic' }}>{artist.name}</span>雷达
          </h1>
          <p className="ink-mute text-sm mt-2">{bank.name} · 6 道题解读</p>
        </div>

        {/* 标签卡 */}
        <div
          className="mt-6 p-5"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--ink-faint)',
            borderRadius: 22,
            backdropFilter: 'blur(8px)',
          }}
        >
          <p className="kicker">Your Tag</p>
          <p
            className="ink-display mt-2"
            style={{
              fontSize: 36,
              color: accent,
              fontStyle: 'italic',
              lineHeight: 1.1,
            }}
          >
            {top ? TYPE_LABELS[top[0] as keyof typeof TYPE_LABELS] : '风格派'}粉丝
          </p>
          <p className="ink-body ink-secondary mt-3 text-sm leading-relaxed">
            你在 {bank.name} 里更看重「{top ? TYPE_LABELS[top[0] as keyof typeof TYPE_LABELS] : '风格'}」维度——这一类题你会比较快地给出答案。
          </p>
        </div>

        {/* 题目风格概览 */}
        <div className="mt-7">
          <div className="hairline mb-4">
            <span>Question Style</span>
          </div>
          <div className="flex flex-col gap-2">
            {ordered.map((q, i) => {
              const picked = creatorAnswers[q.id];
              const opt = typeof picked === 'number' ? q.options[picked] : undefined;
              return (
                <div
                  key={q.id}
                  className="flex items-start justify-between gap-3 py-2"
                  style={{ borderBottom: '1px solid var(--ink-faint)' }}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <span
                      className="ink-mono"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.2em',
                        color: 'var(--ink-mute)',
                        paddingTop: 3,
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p
                      className="ink-body text-sm flex-1"
                      style={{ lineHeight: 1.5 }}
                    >
                      {q.title}
                    </p>
                  </div>
                  {opt && (
                    <span
                      className="ink-mono"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.18em',
                        color: getTypeColor(opt.type),
                        paddingTop: 3,
                      }}
                    >
                      {opt.type.toUpperCase()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 短评 */}
        <div className="mt-7">
          <div className="hairline mb-4">
            <span>Comment · 出题短评</span>
          </div>
          <p className="ink-body text-base ink-secondary" style={{ lineHeight: 1.8 }}>
            「这一套题的顺序，是你听{artist.name}的顺序——所以，朋友跟你的默契，其实就是按你的播放列表来打分。」
          </p>
        </div>

        {/* 好友钩子 */}
        <div
          className="mt-7 p-5"
          style={{
            background: `linear-gradient(120deg, ${accent}22, transparent 70%)`,
            border: '1px solid var(--ink-faint)',
            borderRadius: 22,
          }}
        >
          <p className="kicker" style={{ color: accent }}>For Your Friend</p>
          <p
            className="ink-title mt-2 text-balance"
            style={{ fontSize: 18, lineHeight: 1.5, fontWeight: 500 }}
          >
            把你心里的 {artist.name} 摆好了，发给 TA 看看 TA 心里是不是同一个。
          </p>
        </div>

        {/* 分享链接 */}
        <div className="mt-7">
          <div className="hairline mb-4">
            <span>Share Link</span>
          </div>
          <div
            className="p-4 flex items-center justify-between gap-3"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--ink-faint)',
              borderRadius: 16,
            }}
          >
            <span
              className="ink-mono"
              style={{ fontSize: 11, color: 'var(--ink-secondary)', wordBreak: 'break-all' }}
            >
              {room.link}
            </span>
          </div>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(room.link).catch(() => {});
                }
                notify('已复制链接');
              }}
            >
              复制链接
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.hash = `room=${room.id}`;
                }
                notify('已打开房间链接');
              }}
            >
              打开房间
            </button>
          </div>
        </div>

        {/* 我的房间 */}
        <div className="mt-7 flex gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => go('rooms')}
          >
            查看我的房间
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
  );
}
