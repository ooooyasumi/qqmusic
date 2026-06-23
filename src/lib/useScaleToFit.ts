'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * 让元素在内容超出父容器可视高度时按比例整体缩放（transform: scale）。
 * - 缩放原点为 top center，顶部内容位置不动
 * - 最小缩到 0.5，保证可读性
 * - 用 ResizeObserver 监听内容/容器变化，自动重算
 * - 初始延迟 150ms 触发一次，避开字体/图片加载导致的尺寸抖动
 */
export function useScaleToFit<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    const updateScale = () => {
      const available = parent.clientHeight;
      const content = el.scrollHeight;
      if (content > available && content > 0 && available > 0) {
        const next = Math.max(0.5, available / content);
        setScale(Number(next.toFixed(4)));
      } else {
        setScale(1);
      }
    };

    // 初始延迟：等字体/背景图就位后再算
    const initialTimer = window.setTimeout(updateScale, 150);

    const ro = new ResizeObserver(() => updateScale());
    ro.observe(el);
    ro.observe(parent);
    window.addEventListener('resize', updateScale);
    window.addEventListener('orientationchange', updateScale);

    return () => {
      window.clearTimeout(initialTimer);
      ro.disconnect();
      window.removeEventListener('resize', updateScale);
      window.removeEventListener('orientationchange', updateScale);
    };
  }, []);

  return { ref, scale };
}
