'use client';

import { useApp } from '@/lib/state';
import { Orbs } from '@/components/Orbs';
import { TopBar } from '@/components/TopBar';

export function RoomMissingScreen() {
  const { go } = useApp();

  return (
    <div className="screen screen-fade">
      <Orbs accent="rgba(232,165,184,0.4)" secondary="rgba(212,175,122,0.25)" />
      <TopBar title="Room Missing" />

      <div className="screen-content-scrollable no-scrollbar flex flex-col items-center justify-center text-center">
        <p className="kicker">404 · Lost in Vinyl</p>
        <h1
          className="ink-display mt-3"
          style={{
            fontSize: 56,
            fontStyle: 'italic',
            fontWeight: 500,
            lineHeight: 1.1,
          }}
        >
          404
        </h1>
        <p
          className="ink-display mt-2"
          style={{ fontSize: 22, color: 'var(--accent-rose)' }}
        >
          这张唱片不在了
        </p>
        <p
          className="ink-body ink-secondary mt-3 text-sm"
          style={{ maxWidth: 320, lineHeight: 1.7 }}
        >
          服务器数据库里没有找到这个挑战。可能是链接复制不完整，或者这是后端上线前生成的旧链接。
        </p>
        <button
          type="button"
          className="btn-primary mt-8"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.hash = '';
            }
            go('home');
          }}
        >
          回到首页
        </button>
      </div>
    </div>
  );
}
