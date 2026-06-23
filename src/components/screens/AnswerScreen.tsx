'use client';

import { useApp } from '@/lib/state';
import { findArtist } from '@/lib/data';
import { Orbs } from '@/components/Orbs';
import { TopBar } from '@/components/TopBar';
import { getTypeColor } from '@/lib/match';

export function AnswerScreen({ role }: { role: 'creator' | 'friend' }) {
  const {
    artistId,
    answerIndex,
    questions,
    answerQuestion,
    creatorAnswers,
    friendAnswers,
    notify,
  } = useApp();
  const artist = findArtist(artistId);
  if (!artist || questions.length === 0) return null;

  const current = questions[answerIndex];
  const total = questions.length;
  const progress = (answerIndex + 1) / total;
  const accent = artist.accent;
  const isCreator = role === 'creator';
  const selectedIndex = isCreator
    ? creatorAnswers[current.id]
    : friendAnswers[current.id];

  return (
    <div className="screen screen-fade">
      <Orbs accent={`${accent}55`} secondary="rgba(212,175,122,0.25)" />
      <TopBar
        title={`Q ${String(answerIndex + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`}
      />

      <div className="screen-content-scrollable no-scrollbar">
        <div className="flex items-center justify-between">
          <span className="kicker">
            {isCreator ? 'Creator · 发起者作答' : 'Friend · 好友作答'}
          </span>
          <span
            className="ink-mono"
            style={{ fontSize: 10, letterSpacing: '0.24em', color: 'var(--ink-mute)' }}
          >
            {String(answerIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
        </div>
        <div className="mt-3 progress-track">
          <div className="progress-fill" style={{ transform: `scaleX(${progress})` }} />
        </div>

        <div className="question-card mt-6">
          <p className="kicker" style={{ color: accent, letterSpacing: '0.3em' }}>
            {artist.short} · Question
          </p>
          <h2
            className="ink-title mt-3 text-balance"
            style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.35 }}
          >
            {current.title}
          </h2>
          {current.subtitle && (
            <p className="ink-mute text-sm mt-2">{current.subtitle}</p>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {current.options.map((opt, i) => {
            const isPicked = selectedIndex === i;
            return (
              <button
                key={i}
                type="button"
                className="option-card"
                data-selected={isPicked}
                onClick={() => {
                  if (isPicked) return;
                  answerQuestion(current.id, i);
                  if (answerIndex === total - 1) {
                    // 末题：由 state 内部完成跳转
                  } else {
                    notify(`已选择 · ${opt.text}`);
                  }
                }}
              >
                <span className="flex items-center gap-3">
                  <span
                    className="ink-mono"
                    style={{
                      fontSize: 11,
                      letterSpacing: '0.18em',
                      color: isPicked ? accent : 'var(--ink-mute)',
                    }}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex flex-col items-start">
                    <span
                      className="ink-title"
                      style={{ fontSize: 15, fontWeight: 500 }}
                    >
                      {opt.text}
                    </span>
                    <span className="ink-mute text-xs mt-0.5">
                      {opt.note} ·{' '}
                      <span style={{ color: getTypeColor(opt.type) }}>{opt.type}</span>
                    </span>
                  </span>
                </span>
                <span
                  className="ink-display"
                  style={{
                    fontSize: 18,
                    color: isPicked ? accent : 'var(--ink-faint)',
                  }}
                >
                  {isPicked ? '●' : '○'}
                </span>
              </button>
            );
          })}
        </div>

        <p className="ink-faint text-center text-xs mt-8 tracking-widest">
          按下选项即记录 · 不可回退
        </p>
      </div>
    </div>
  );
}
