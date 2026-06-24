'use client';

import { Orbs } from '@/components/Orbs';
import { TopBar } from '@/components/TopBar';

export function ChallengeLoadingScreen() {
  return (
    <div className="screen screen-fade">
      <Orbs accent="rgba(232,165,184,0.42)" secondary="rgba(212,175,122,0.26)" />
      <TopBar title="Friend Invite" showBack={false} />

      <div className="screen-content-scrollable no-scrollbar flex flex-col items-center justify-center text-center">
        <p className="kicker" style={{ color: 'var(--accent-gold)' }}>
          Friend Invite
        </p>
        <h1
          className="ink-display mt-4"
          style={{
            fontSize: 38,
            fontWeight: 500,
            lineHeight: 1.16,
          }}
        >
          正在打开好友邀请
        </h1>
        <p
          className="ink-body ink-secondary mt-4"
          style={{ maxWidth: 300, fontSize: 14, lineHeight: 1.75 }}
        >
          马上进入选歌界面，完成你的 Top6 后就能看到同单默契值。
        </p>
        <div
          className="mt-8"
          style={{
            width: 72,
            height: 2,
            borderRadius: 999,
            background:
              'linear-gradient(90deg, transparent, var(--accent-gold), transparent)',
            opacity: 0.9,
          }}
        />
      </div>
    </div>
  );
}
