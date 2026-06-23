'use client';

import { useApp } from '@/lib/state';

export function TopBar({
  title,
  showBack = true,
  showMenu = true,
}: {
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
}) {
  const { go, back, history } = useApp();
  const canBack = history.length > 0;

  return (
    <div className="top-bar">
      {showBack ? (
        <button
          type="button"
          className="icon-btn"
          onClick={() => (canBack ? back() : go('home'))}
          aria-label="返回"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M9 2L4 7l5 5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : (
        <span className="top-bar-spacer" aria-hidden />
      )}
      <span className="center-title">{title ?? '同担默契局'}</span>
      {showMenu ? (
        <button
          type="button"
          className="icon-btn"
          onClick={() => go('rooms')}
          aria-label="我的房间"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <circle cx="3" cy="7" r="1" fill="currentColor" />
            <circle cx="7" cy="7" r="1" fill="currentColor" />
            <circle cx="11" cy="7" r="1" fill="currentColor" />
          </svg>
        </button>
      ) : (
        <span className="top-bar-spacer" aria-hidden />
      )}
    </div>
  );
}
