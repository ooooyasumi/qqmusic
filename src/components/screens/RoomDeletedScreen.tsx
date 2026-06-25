'use client';

import { Orbs } from '@/components/Orbs';
import { TopBar } from '@/components/TopBar';
import { useApp } from '@/lib/state';

export function RoomDeletedScreen() {
  const { go } = useApp();

  return (
    <div className="screen screen-fade">
      <Orbs accent="rgba(232,165,184,0.4)" secondary="rgba(212,175,122,0.25)" />
      <TopBar title="Challenge Deleted" />

      <div className="screen-content-scrollable no-scrollbar flex flex-col items-center justify-center text-center">
        <p className="kicker">410 · Challenge Closed</p>
        <h1
          className="ink-display mt-3"
          style={{
            fontSize: 48,
            fontStyle: 'italic',
            fontWeight: 500,
            lineHeight: 1.1,
          }}
        >
          挑战已被删除
        </h1>
        <p
          className="ink-body ink-secondary mt-3 text-sm"
          style={{ maxWidth: 320, lineHeight: 1.7 }}
        >
          这个同担默契局已经由发起人删除，原来的分享链接不再可用。
        </p>
        <button
          type="button"
          className="btn-primary mt-8"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.history.replaceState(window.history.state, '', window.location.pathname);
            }
            go('home', false);
          }}
        >
          创建自己的挑战
        </button>
      </div>
    </div>
  );
}
