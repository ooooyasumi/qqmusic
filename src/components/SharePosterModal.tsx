'use client';

import { Download, Image as ImageIcon, X } from 'lucide-react';
import QRCode from 'qrcode';
import { forwardRef, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { toPng } from 'html-to-image';
import { ArtistName } from '@/components/ArtistName';
import type { Artist, Song, SongMatchResult } from '@/lib/types';

type PosterKind = 'challenge' | 'result';

interface SharePosterModalProps {
  kind: PosterKind;
  artist: Artist;
  songs: Song[];
  qrValue: string;
  triggerLabel?: string;
  downloadName: string;
  result?: Pick<
    SongMatchResult,
    'score' | 'title' | 'copy' | 'shareSpark' | 'commonSongCount' | 'commonTopCount' | 'exactIds' | 'biggestGap'
  >;
}

type PosterStatus = 'idle' | 'generating' | 'ready' | 'failed';

function posterTitle(kind: PosterKind, artist: Artist): string {
  if (kind === 'challenge') return `${artist.short} Top6 挑战`;
  return `${artist.short} 默契结果`;
}

function waitForRender(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function SharePosterModal({
  kind,
  artist,
  songs,
  qrValue,
  triggerLabel = '生成分享图',
  downloadName,
  result,
}: SharePosterModalProps) {
  const posterRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<PosterStatus>('idle');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');

  const generatePoster = async (): Promise<void> => {
    setIsOpen(true);
    setStatus('generating');
    setPosterUrl('');

    try {
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
      await waitForRender();
      await document.fonts?.ready;

      const node = posterRef.current;
      if (!node) throw new Error('Poster node missing.');

      const nextPosterUrl = await toPng(node, {
        width: 1080,
        height: 1440,
        pixelRatio: 1,
        cacheBust: true,
        backgroundColor: '#0d0a1f',
      });
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
                  if (posterUrl) downloadDataUrl(posterUrl, downloadName);
                }}
              >
                <Download size={16} strokeWidth={2.1} />
                <span>下载保存</span>
              </button>
            </div>
          </div>

          <div className="share-poster-source" aria-hidden="true">
            <PosterCanvas ref={posterRef} kind={kind} artist={artist} songs={songs} qrDataUrl={qrDataUrl} result={result} />
          </div>
        </div>
      )}
    </>
  );
}

interface PosterCanvasProps {
  kind: PosterKind;
  artist: Artist;
  songs: Song[];
  qrDataUrl: string;
  result?: SharePosterModalProps['result'];
}

const PosterCanvas = forwardRef<HTMLDivElement, PosterCanvasProps>(function PosterCanvas({
  kind,
  artist,
  songs,
  qrDataUrl,
  result,
}, ref) {
  const isResult = kind === 'result';

  return (
    <div
      ref={ref}
      className="share-poster-canvas"
      style={{ '--poster-accent': artist.accent } as CSSProperties}
    >
      <div className="share-poster-orb share-poster-orb-a" />
      <div className="share-poster-orb share-poster-orb-b" />
      <div className="share-poster-noise" />

      <div className="share-poster-header">
        <span>Tongdan Mojiju</span>
        <span>QQ Music Social Test</span>
      </div>

      <section className="share-poster-hero">
        <p className="share-poster-kicker">
          <ArtistName name={artist.name} /> / Top6
        </p>
        <h1>{posterTitle(kind, artist)}</h1>
        <p>{isResult ? result?.shareSpark ?? result?.title : '扫二维码来排你的同担 Top6，看我们到底有多默契。'}</p>
      </section>

      {isResult && result ? (
        <section className="share-poster-score">
          <div className="share-poster-score-number">{result.score}</div>
          <div className="share-poster-score-copy">
            <h2>{result.title}</h2>
            <p>{result.copy}</p>
          </div>
        </section>
      ) : (
        <section className="share-poster-challenge-mark">
          <span>TOP</span>
          <b>6</b>
        </section>
      )}

      <section className="share-poster-song-list">
        {songs.slice(0, 6).map((song, index) => (
          <div key={song.id} className="share-poster-song-row">
            <span>{index + 1}</span>
            <div>
              <b>{song.name}</b>
              <small>{song.album}</small>
            </div>
          </div>
        ))}
      </section>

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
