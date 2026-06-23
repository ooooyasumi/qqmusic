'use client';

import { useApp } from '@/lib/state';
import { findArtist } from '@/lib/data';
import { Orbs } from '@/components/Orbs';
import { TopBar } from '@/components/TopBar';
import { Waveform } from '@/components/Waveform';

export function ArtistScreen() {
  const { artistId, bankId, setBank, go } = useApp();
  const artist = findArtist(artistId);
  if (!artist) return null;

  return (
    <div className="screen screen-fade">
      <Orbs accent={`${artist.accent}55`} secondary="rgba(212,175,122,0.25)" />
      <TopBar title={artist.short} />

      <div className="screen-content-scrollable no-scrollbar">
        {/* 头部 */}
        <div className="relative">
          <p className="kicker">Featured Artist · {artist.short}</p>
          <h1
            className="ink-display mt-3 text-balance"
            style={{ fontSize: 36, fontWeight: 500, lineHeight: 1.1 }}
          >
            {artist.title}
          </h1>
          <div className="mt-4 flex items-center gap-3">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: artist.accent }}
            />
            <span className="ink-mute text-xs tracking-widest">{artist.card}</span>
          </div>
        </div>

        {/* 唱片 + 介绍 */}
        <div className="mt-7 flex items-center gap-5">
          <div
            className="vinyl"
            style={{
              width: 110,
              flex: '0 0 110px',
              ['--artist-accent' as string]: artist.accent,
            }}
          />
          <div className="flex-1">
            <p className="ink-body ink-secondary" style={{ fontSize: 13.5, lineHeight: 1.7 }}>
              {artist.intro}
            </p>
          </div>
        </div>

        {/* 波形 */}
        <div className="mt-5" style={{ color: artist.accent }}>
          <Waveform bars={56} height={36} />
        </div>

        {/* 标签 */}
        <div className="mt-5 flex flex-wrap gap-2">
          {artist.tags.map((t) => (
            <span
              key={t}
              className="kicker"
              style={{
                padding: '4px 12px',
                border: '1px solid var(--ink-faint)',
                borderRadius: 999,
                letterSpacing: '0.18em',
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* 题库选择 */}
        <div className="mt-9">
          <div className="hairline mb-5">
            <span>Choose Your Bank · 选择题库</span>
          </div>

          <div className="flex flex-col gap-3">
            {artist.banks.map((b) => {
              const selected = bankId === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  className="option-card"
                  data-selected={selected}
                  style={{ ['--artist-accent' as string]: artist.accent }}
                  onClick={() => setBank(b.id)}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className="ink-display"
                      style={{
                        fontSize: 24,
                        color: selected ? artist.accent : 'var(--ink-mute)',
                        width: 28,
                        textAlign: 'center',
                      }}
                    >
                      {b.icon}
                    </span>
                    <span className="flex flex-col items-start">
                      <span
                        className="ink-title"
                        style={{ fontSize: 16, fontWeight: 500 }}
                      >
                        {b.name}
                      </span>
                      <span className="ink-mute text-xs mt-0.5">{b.desc}</span>
                    </span>
                  </span>
                  <span
                    className="ink-mono text-xs"
                    style={{
                      color: selected ? artist.accent : 'var(--ink-mute)',
                      letterSpacing: '0.18em',
                    }}
                  >
                    {b.questions.length} 题 →
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 推荐曲目 */}
        <div className="mt-9">
          <div className="hairline mb-5">
            <span>Warm Up · 推荐曲目</span>
          </div>
          <div className="flex flex-col gap-2">
            {artist.songs.slice(0, 3).map((s, i) => (
              <div
                key={s.title}
                className="flex items-center justify-between py-2"
                style={{ borderBottom: '1px solid var(--ink-faint)' }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="ink-mono ink-faint"
                    style={{ fontSize: 10, letterSpacing: '0.2em' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p
                      className="ink-title"
                      style={{ fontSize: 14, fontWeight: 500 }}
                    >
                      {s.title}
                    </p>
                    <p className="ink-mute text-xs">{s.album} · {s.year}</p>
                  </div>
                </div>
                <span
                  className="ink-mono text-xs"
                  style={{ color: artist.accent, letterSpacing: '0.2em' }}
                >
                  PLAY
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8">
          <button
            type="button"
            className="btn-primary"
            onClick={() => go('create')}
            style={{ ['--artist-accent' as string]: artist.accent }}
          >
            开始作答
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
