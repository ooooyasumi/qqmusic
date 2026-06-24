'use client';

import { ArtistName } from '@/components/ArtistName';
import type { Artist } from '@/lib/types';

export function ArtistPageHero({
  artist,
  eyebrow,
  copy,
}: {
  artist: Artist;
  eyebrow: string;
  copy: string;
}) {
  const isLongName = artist.name.length >= 9;

  return (
    <section
      className="artist-page-hero"
      style={{
        ['--artist-accent' as string]: artist.accent,
        ['--artist-accent-soft' as string]: `${artist.accent}36`,
      }}
    >
      <div className="artist-page-copy">
        <p className="kicker" style={{ color: artist.accent }}>
          {eyebrow}
        </p>
        <h1 className="ink-display artist-page-title" data-long-name={isLongName}>
          <ArtistName name={artist.name} />
        </h1>
        <p className="ink-body ink-secondary artist-page-intro">{copy}</p>
      </div>
      <div className="artist-page-photo" aria-hidden="true">
        <div
          className="artist-page-img"
          style={{
            backgroundImage: artist.cover ? `url(${artist.cover})` : undefined,
          }}
        />
        <span>{artist.short}</span>
      </div>
    </section>
  );
}
