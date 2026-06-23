'use client';

import { useApp } from '@/lib/state';
import { findArtist, findBank } from '@/lib/data';
import { Orbs } from '@/components/Orbs';
import { TopBar } from '@/components/TopBar';

export function CreateScreen() {
  const {
    artistId,
    bankId,
    selectedQuestionIds,
    toggleQuestion,
    pickFirstSix,
    go,
    notify,
  } = useApp();

  const artist = findArtist(artistId);
  const bank = findBank(artistId, bankId);
  if (!artist || !bank) return null;

  const total = bank.questions.length;
  const selected = selectedQuestionIds.length;
  const ready = selected === 6;
  const accent = artist.accent;

  return (
    <div className="screen screen-fade">
      <Orbs accent={`${accent}55`} secondary="rgba(212,175,122,0.25)" />
      <TopBar title="Pick 6" />

      <div className="screen-content-scrollable no-scrollbar">
        <div className="relative">
          <p className="kicker">{artist.short} · {bank.name}</p>
          <h1
            className="ink-display mt-3"
            style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.1 }}
          >
            从 {total} 道题里挑 6 道
          </h1>
          <p className="ink-body ink-secondary mt-3" style={{ fontSize: 13.5, lineHeight: 1.7 }}>
            题目不分对错，挑选你最有话想说的那 6 道。
          </p>
        </div>

        {/* 计数 + 快捷 */}
        <div
          className="mt-6 p-4 flex items-center justify-between"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--ink-faint)',
            borderRadius: 18,
          }}
        >
          <div className="flex items-baseline gap-2">
            <span
              className="ink-display"
              style={{ fontSize: 36, color: accent, fontStyle: 'italic' }}
            >
              {String(selected).padStart(2, '0')}
            </span>
            <span className="ink-mute text-xs tracking-widest">/ 06</span>
          </div>
          <button
            type="button"
            className="btn-ghost-line"
            onClick={pickFirstSix}
            type-value="default"
            style={{ ['--artist-accent' as string]: accent }}
          >
            <span>✦</span>
            <span>帮我选 6 道</span>
          </button>
        </div>

        {/* 进度条 */}
        <div className="mt-4 progress-track">
          <div
            className="progress-fill"
            style={{ transform: `scaleX(${selected / 6})` }}
          />
        </div>

        {/* 题目卡 */}
        <div className="mt-6 flex flex-col gap-3">
          {bank.questions.map((q, i) => {
            const isSelected = selectedQuestionIds.includes(q.id);
            return (
              <button
                key={q.id}
                type="button"
                className="option-card"
                data-selected={isSelected}
                style={{ ['--artist-accent' as string]: accent }}
                onClick={() => {
                  if (!isSelected && selected >= 6) {
                    notify('最多选择 6 道题。');
                    return;
                  }
                  toggleQuestion(q.id);
                }}
              >
                <span className="flex items-center gap-3">
                  <span
                    className="ink-mono"
                    style={{
                      fontSize: 11,
                      letterSpacing: '0.18em',
                      color: isSelected ? accent : 'var(--ink-mute)',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className="ink-title"
                    style={{
                      fontSize: 14.5,
                      fontWeight: 500,
                      color: isSelected ? 'var(--ink-primary)' : 'var(--ink-secondary)',
                    }}
                  >
                    {q.title}
                  </span>
                </span>
                <span
                  className="ink-display"
                  style={{
                    fontSize: 18,
                    color: isSelected ? accent : 'var(--ink-faint)',
                    width: 20,
                    textAlign: 'center',
                  }}
                >
                  {isSelected ? '✓' : '+'}
                </span>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-8">
          <button
            type="button"
            className="btn-primary"
            disabled={!ready}
            onClick={() => {
              if (!ready) {
                notify('请先选满 6 道题。');
                return;
              }
              go('creatorAnswer');
            }}
            style={{ ['--artist-accent' as string]: accent }}
          >
            {ready ? '开始作答' : `还需 ${6 - selected} 道`}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M2 7h10M8 3l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
