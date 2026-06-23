'use client';

import type { CSSProperties } from 'react';

interface OrbsProps {
  accent?: string;
  secondary?: string;
}

// 艺人色光斑 + 中央球（无 accent 时用通用暖金+深蓝混色）
export function Orbs({ accent = '#5b8def', secondary = '#e8a5b8' }: OrbsProps) {
  const style1: CSSProperties = {
    background: accent,
    width: 260,
    height: 260,
    top: -80,
    right: -60,
  };
  const style2: CSSProperties = {
    background: secondary,
    width: 200,
    height: 200,
    bottom: -60,
    left: -50,
  };
  return (
    <>
      <div className="artist-orb" style={style1} />
      <div className="artist-orb" style={style2} />
    </>
  );
}
