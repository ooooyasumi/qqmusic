'use client';

import { Download, Image as ImageIcon, X } from 'lucide-react';
import QRCode from 'qrcode';
import { forwardRef, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { toCanvas } from 'html-to-image';
import { ArtistName } from '@/components/ArtistName';
import { QQMusicLogo } from '@/components/QQMusicLogo';
import type { Artist, Song, SongMatchResult } from '@/lib/types';

type PosterKind = 'challenge' | 'result';
const POSTER_WIDTH = 1080;
const POSTER_EXPORT_WIDTH = 900;
const POSTER_HEIGHT_BY_KIND: Record<PosterKind, number> = {
  challenge: 1600,
  result: 1600,
};
const POSTER_EXPORT_QUALITY = 0.72;

interface SharePosterModalProps {
  kind: PosterKind;
  artist: Artist;
  qrValue: string;
  triggerLabel?: string;
  downloadName: string;
  creatorSongs?: Song[];
  friendSongs?: Song[];
  result?: Pick<
    SongMatchResult,
    'score' | 'title' | 'copy' | 'shareSpark' | 'commonSongCount' | 'commonTopCount' | 'exactIds' | 'biggestGap'
  >;
}

type PosterStatus = 'idle' | 'generating' | 'ready' | 'failed';

function posterTitle(kind: PosterKind, artist: Artist): string {
  if (kind === 'challenge') return `来排你的 ${artist.short} Top6`;
  return `${artist.short} 同担默契结果`;
}

function posterAssetUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const nextUrl = new URL(url);
    nextUrl.searchParams.set('poster', '1');
    return nextUrl.toString();
  } catch {
    return url;
  }
}

function waitForRender(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

async function waitForFonts(): Promise<void> {
  if (!document.fonts?.ready) return;
  await document.fonts.ready;
}

function extractCssUrls(value: string): string[] {
  const urls: string[] = [];
  const matcher = /url\((['"]?)(.*?)\1\)/g;
  let match = matcher.exec(value);
  while (match) {
    const url = match[2];
    if (url && !url.startsWith('data:') && !url.startsWith('blob:')) urls.push(url);
    match = matcher.exec(value);
  }
  return urls;
}

function waitForImageElement(image: HTMLImageElement): Promise<void> {
  if (image.complete && image.naturalWidth > 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Poster image failed to load.'));
  });
}

function waitForImageUrl(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Poster background image failed to load: ${url}`));
    image.src = url;
  });
}

async function waitForPosterAssets(node: HTMLElement): Promise<void> {
  await waitForFonts();

  const inlineImages = Array.from(node.querySelectorAll('img'));
  await Promise.all(inlineImages.map(waitForImageElement));

  const backgroundUrls = new Set<string>();
  [node, ...Array.from(node.querySelectorAll<HTMLElement>('*'))].forEach((element) => {
    extractCssUrls(window.getComputedStyle(element).backgroundImage).forEach((url) => backgroundUrls.add(url));
  });
  await Promise.all(Array.from(backgroundUrls).map(waitForImageUrl));
}

function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function filenameWithExtension(filename: string, extension: string): string {
  return filename.replace(/\.[a-z0-9]+$/i, '') + extension;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

async function canvasToCompressedPoster(canvas: HTMLCanvasElement): Promise<{ blob: Blob; extension: string }> {
  const webp = await canvasToBlob(canvas, 'image/webp', POSTER_EXPORT_QUALITY);
  if (webp && webp.type === 'image/webp') return { blob: webp, extension: '.webp' };

  const jpeg = await canvasToBlob(canvas, 'image/jpeg', 0.82);
  if (jpeg) return { blob: jpeg, extension: '.jpg' };

  const png = await canvasToBlob(canvas, 'image/png', 1);
  if (!png) throw new Error('Poster compression failed.');
  return { blob: png, extension: '.png' };
}

export function SharePosterModal({
  kind,
  artist,
  qrValue,
  triggerLabel = '生成分享图',
  downloadName,
  creatorSongs,
  friendSongs,
  result,
}: SharePosterModalProps) {
  const posterRef = useRef<HTMLDivElement | null>(null);
  const posterObjectUrlRef = useRef<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<PosterStatus>('idle');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [posterExtension, setPosterExtension] = useState('.webp');

  useEffect(() => {
    return () => {
      if (posterObjectUrlRef.current) URL.revokeObjectURL(posterObjectUrlRef.current);
    };
  }, []);

  useEffect(() => {
    setQrDataUrl('');
  }, [qrValue]);

  const generatePoster = async (): Promise<void> => {
    setIsOpen(true);
    setStatus('generating');
    if (posterObjectUrlRef.current) {
      URL.revokeObjectURL(posterObjectUrlRef.current);
      posterObjectUrlRef.current = '';
    }
    setPosterUrl('');

    try {
      if (!qrDataUrl) {
        const nextQrDataUrl = await QRCode.toDataURL(qrValue, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 220,
          color: {
            dark: '#251b3d',
            light: '#f4ecd8',
          },
        });
        setQrDataUrl(nextQrDataUrl);
      }
      await waitForRender();

      const node = posterRef.current;
      if (!node) throw new Error('Poster node missing.');
      await waitForPosterAssets(node);

      const posterHeight = POSTER_HEIGHT_BY_KIND[kind];
      const exportHeight = Math.round((posterHeight / POSTER_WIDTH) * POSTER_EXPORT_WIDTH);
      const canvas = await toCanvas(node, {
        width: POSTER_WIDTH,
        height: posterHeight,
        canvasWidth: POSTER_EXPORT_WIDTH,
        canvasHeight: exportHeight,
        pixelRatio: 1,
        cacheBust: false,
        skipFonts: true,
        backgroundColor: '#0d0a1f',
      });
      const compressed = await canvasToCompressedPoster(canvas);
      const nextPosterUrl = URL.createObjectURL(compressed.blob);
      posterObjectUrlRef.current = nextPosterUrl;
      setPosterExtension(compressed.extension);
      setPosterUrl(nextPosterUrl);
      setStatus('ready');
    } catch {
      setStatus('failed');
    }
  };

  return (
    <>
      <button type="button" className="btn-secondary share-poster-trigger" onClick={() => void generatePoster()}>
        <ImageIcon size={16} strokeWidth={2.1} />
        <span>{triggerLabel}</span>
      </button>

      {isOpen && (
        <div className="share-poster-modal" role="dialog" aria-modal="true" aria-label="分享图预览">
          <div className="share-poster-panel">
            <button
              type="button"
              className="share-poster-close"
              aria-label="关闭分享图预览"
              onClick={() => setIsOpen(false)}
            >
              <X size={18} strokeWidth={2.2} />
            </button>

            <div className="share-poster-preview">
              {posterUrl ? (
                <img src={posterUrl} alt="生成的分享图" />
              ) : (
                <div className="share-poster-loading">
                  <span className="kicker">{status === 'failed' ? 'Export Failed' : 'Generating'}</span>
                  <p>{status === 'failed' ? '生成失败，请稍后再试。' : '正在生成分享图...'}</p>
                </div>
              )}
            </div>

            <div className="share-poster-actions">
              <button
                type="button"
                className="btn-primary"
                disabled={!posterUrl}
                onClick={() => {
                  if (posterUrl) downloadDataUrl(posterUrl, filenameWithExtension(downloadName, posterExtension));
                }}
              >
                <Download size={16} strokeWidth={2.1} />
                <span>下载保存</span>
              </button>
            </div>
          </div>

          <div className="share-poster-source" aria-hidden="true">
            <PosterCanvas
              ref={posterRef}
              kind={kind}
              artist={artist}
              qrDataUrl={qrDataUrl}
              creatorSongs={creatorSongs}
              friendSongs={friendSongs}
              result={result}
            />
          </div>
        </div>
      )}
    </>
  );
}

interface PosterCanvasProps {
  kind: PosterKind;
  artist: Artist;
  qrDataUrl: string;
  creatorSongs?: Song[];
  friendSongs?: Song[];
  result?: SharePosterModalProps['result'];
}

const PosterCanvas = forwardRef<HTMLDivElement, PosterCanvasProps>(function PosterCanvas({
  kind,
  artist,
  qrDataUrl,
  creatorSongs = [],
  friendSongs = [],
  result,
}, ref) {
  const isResult = kind === 'result';

  return (
    <div
      ref={ref}
      className="share-poster-canvas"
      data-kind={kind}
      style={
        {
          '--poster-accent': artist.accent,
          height: POSTER_HEIGHT_BY_KIND[kind],
        } as CSSProperties
      }
    >
      <div className="share-poster-orb share-poster-orb-a" />
      <div className="share-poster-orb share-poster-orb-b" />
      <div className="share-poster-noise" />

      <div className="share-poster-header">
        <QQMusicLogo className="share-poster-logo" />
        <span>QQ Music Social Test</span>
      </div>

      <section className="share-poster-brand">
        <p className="share-poster-kicker">Tongdan Mojiju</p>
        <h1 data-text="同担默契局">同担默契局</h1>
      </section>

      <section className="share-poster-hero" data-kind={kind}>
        <p className="share-poster-kicker">
          <ArtistName name={artist.name} /> / Top6
        </p>
        {!isResult && <h2>{posterTitle(kind, artist)}</h2>}
        <p>{isResult ? result?.shareSpark ?? result?.title : '选出你的 6 首本命歌，看看我们是不是同一副耳机里的同担。'}</p>
      </section>

      {isResult && result ? (
        <>
          <section className="share-poster-score">
            <div className="share-poster-score-number">{result.score}</div>
            <div className="share-poster-score-copy">
              <h3>{result.title}</h3>
              <p>{result.copy}</p>
            </div>
          </section>

          <section className="share-poster-duel">
            <PosterDuelRow title="我的 Top6" songs={friendSongs.slice(0, 6)} />
            <PosterDuelRow title="TA 的 Top6" songs={creatorSongs.slice(0, 6)} />
          </section>
        </>
      ) : (
        <section className="share-poster-artist-page">
          <PosterArtistPage artist={artist} eyebrow="Pick 6 Songs" copy="选择 6 首最喜欢的音乐" />
        </section>
      )}

      {isResult && result ? (
        <section className="share-poster-stats">
          <div>
            <span>共同歌单</span>
            <b>{result.commonSongCount}/6</b>
          </div>
          <div>
            <span>Top3 同频</span>
            <b>{result.commonTopCount}/3</b>
          </div>
          <div>
            <span>顺位同频</span>
            <b>{result.exactIds.length}/6</b>
          </div>
        </section>
      ) : null}

      <section className="share-poster-footer">
        <div>
          <p>{isResult ? '扫码一起创建你的同担默契局' : '扫码进入这个挑战'}</p>
          <span>{isResult ? 'Create your own Top6 test' : 'Join this Top6 challenge'}</span>
        </div>
        <div className="share-poster-qr">
          {qrDataUrl ? <img src={qrDataUrl} alt="" /> : null}
        </div>
      </section>
    </div>
  );
});

function PosterArtistPage({ artist, eyebrow, copy }: { artist: Artist; eyebrow: string; copy: string }) {
  const isLongName = artist.name.length >= 9;
  const imageUrl = posterAssetUrl(artist.cover);

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
        {imageUrl ? (
          <img className="artist-page-img share-poster-asset-img" src={imageUrl} crossOrigin="anonymous" alt="" />
        ) : null}
        <span>{artist.short}</span>
      </div>
    </section>
  );
}

function PosterImageCover({ song }: { song: Song }) {
  const imageUrl = posterAssetUrl(song.coverUrl);

  return (
    <span
      className="song-cover share-poster-image-cover"
      style={{
        width: 48,
        height: 48,
        ['--cover-a' as string]: song.coverA,
        ['--cover-b' as string]: song.coverB,
      }}
      aria-hidden="true"
    >
      {imageUrl ? <img src={imageUrl} crossOrigin="anonymous" alt="" /> : song.name.slice(0, 2).toUpperCase()}
    </span>
  );
}

function PosterDuelRow({ title, songs }: { title: string; songs: Song[] }) {
  return (
    <div className="share-poster-duel-board">
      <div className="share-poster-duel-title">{title}</div>
      <div className="share-poster-duel-list">
        {songs.map((song, index) => (
          <div key={`${title}-${song.id}`} className="share-poster-duel-song">
            <span className="share-poster-duel-rank">{index + 1}</span>
            <span className="share-poster-duel-cover">
              <PosterImageCover song={song} />
            </span>
            <span className="share-poster-duel-copy">
              <b>{song.name}</b>
              <small>{song.album}</small>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
