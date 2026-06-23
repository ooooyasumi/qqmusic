'use client';

import { useEffect, useRef, useState } from 'react';

// 设计稿基准尺寸（iPhone 13/14 标准）
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

/**
 * 全局缩放 Hook：以 iPhone 13/14 (390×844) 为设计基准
 * 1. 测量窗口的实际宽高
 * 2. 计算缩放比，取宽高中更小的那个，保证全部装下
 * 3. 用 transform: scale() 缩放整个 .app-frame
 * 4. 视口变化时实时重算（resize / orientationchange）
 *
 * - 返回的 baseWidth/baseHeight 用来把 .app-frame 撑到设计稿大小
 * - transform 把这个 390×844 的画布等比缩到视口里
 * - transformOrigin: top left，缩放后从左上角开始，不会有偏移
 */
export function useScreenScale<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [scale, setScale] = useState(1);
  const [baseWidth] = useState(BASE_WIDTH);
  const [baseHeight] = useState(BASE_HEIGHT);

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (vw === 0 || vh === 0) return;
      const s = Math.min(vw / BASE_WIDTH, vh / BASE_HEIGHT);
      setScale(s);
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return { ref, scale, baseWidth, baseHeight };
}
