'use client';

import { useApp } from '@/lib/state';
import { artists } from '@/lib/data';
import { Orbs } from '@/components/Orbs';
import { Waveform } from '@/components/Waveform';
import { TopBar } from '@/components/TopBar';
import { ArtistName } from '@/components/ArtistName';
import type { Artist } from '@/lib/types';

export function HomeScreen() {
  const { go, setArtist } = useApp();

  const handleSelect = (artist: Artist) => {
    setArtist(artist.id);
    go('artist');
  };

  return (
    <div className="screen screen-home">
      <TopBar title="同担默契局 · EP1" showBack={false} showMenu />

      <div className="screen-content">
        <div className="screen-content-scaler">
          <section className="home-hero">
            <span className="home-hero-year" aria-hidden="true">
              2026
            </span>

            <span className="kicker">Tongdan Mojiju</span>
            <h1 className="display-title title-highlight-sweep" data-text="同担默契局">
              同担默契局
            </h1>
            <p className="home-hero-sub">episode 1 · 第一弹</p>
            <Waveform height={28} />
          </section>

          <div className="section-head">
            <span className="section-head-line" />
            <span className="section-head-text">本弹嘉宾</span>
            <span className="section-head-en">This Episode</span>
            <span className="section-head-line" />
          </div>

          <div className="home-grid">
            {artists.map((artist, i) => (
              <button
                key={artist.id}
                type="button"
                className="grid-card"
                onClick={() => handleSelect(artist)}
                style={
                  {
                    '--artist-accent': artist.accent,
                    '--card-tilt': i % 2 === 0 ? '-2.5deg' : '2deg',
                  } as React.CSSProperties
                }
              >
                <div className="grid-card-stack">
                  <div className="grid-card-photo">
                    <div
                      className="grid-card-img"
                      style={{
                        backgroundImage: artist.cover
                          ? `url(${artist.cover})`
                          : undefined,
                      }}
                    />
                    <span className="grid-card-photo-tag" aria-hidden="true">
                      {artist.short}
                    </span>
                  </div>
                  <div className="grid-card-postcard">
                    <ArtistName name={artist.name} className="grid-card-name" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Orbs />
    </div>
  );
}
