'use client';

import { useEffect, useState } from 'react';

interface WaveformProps {
  bars?: number;
  active?: boolean;
  color?: string;
  height?: number;
}

// 模拟音频波形的 SVG 柱状条
// 注意：使用 mounted 模式避免 SSR 浮点精度差异导致的 hydration mismatch
export function Waveform({
  bars = 56,
  active = true,
  color = 'currentColor',
  height = 56,
}: WaveformProps) {
  const [seed, setSeed] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!active) return;
    const t = setInterval(() => setSeed((s) => s + 1), 700);
    return () => clearInterval(t);
  }, [active]);

  // SSR + 首次客户端渲染：固定占位波形
  if (!mounted) {
    const data = Array.from({ length: bars }).map((_, i) => {
      const center = bars / 2;
      const distance = Math.abs(i - center) / center;
      return Math.max(0.18, Math.cos(distance * Math.PI * 0.6) * 0.55);
    });
    return renderSvg(data, bars, color, height);
  }

  const data = Array.from({ length: bars }).map((_, i) => {
    const center = bars / 2;
    const distance = Math.abs(i - center) / center;
    const bell = Math.cos(distance * Math.PI * 0.6);
    const noise = ((Math.sin(i * 1.7 + seed) + 1) / 2) * 0.55 + 0.25;
    return Math.max(0.12, bell * noise);
  });

  return renderSvg(data, bars, color, height);
}

function renderSvg(data: number[], bars: number, color: string, height: number) {
  const barWidth = 2;
  const gap = 1.4;
  return (
    <svg
      viewBox={`0 0 ${bars * (barWidth + gap)} ${height}`}
      width="100%"
      height={height}
      style={{ display: 'block', color }}
      aria-hidden
      suppressHydrationWarning
    >
      {data.map((v, i) => {
        const h = Math.round(v * height * 100) / 100;
        const y = Math.round(((height - h) / 2) * 100) / 100;
        const x = Math.round(i * (barWidth + gap) * 100) / 100;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={h}
            rx={1}
            fill="currentColor"
            opacity={Math.round((0.35 + v * 0.65) * 100) / 100}
            suppressHydrationWarning
          />
        );
      })}
    </svg>
  );
}
