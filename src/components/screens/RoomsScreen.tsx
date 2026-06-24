'use client';

import { useApp } from '@/lib/state';
import { findArtist } from '@/lib/data';
import { Orbs } from '@/components/Orbs';
import { TopBar } from '@/components/TopBar';

export function RoomsScreen() {
  const { rooms, openRoom, go, notify } = useApp();
  const list = rooms.slice(0, 20);

  return (
    <div className="screen screen-fade">
      <Orbs accent="rgba(212,175,122,0.35)" secondary="rgba(91,141,239,0.25)" />
      <TopBar title="My Rooms" />

      <div className="screen-content-scrollable no-scrollbar">
        <div className="relative">
          <p className="kicker">Links · 我的挑战</p>
          <h1
            className="ink-display mt-3"
            style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.1 }}
          >
            我的<span style={{ fontStyle: 'italic' }}> · </span>房间
          </h1>
          <p className="ink-mute text-sm mt-2">
            数据保存在后端 · 好友参与后会显示分数
          </p>
        </div>

        {list.length === 0 ? (
          <div
            className="mt-10 p-8 text-center"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed var(--ink-faint)',
              borderRadius: 24,
            }}
          >
            <p
              className="ink-display"
              style={{
                fontSize: 60,
                color: 'var(--ink-faint)',
                fontStyle: 'italic',
              }}
            >
              00
            </p>
            <p className="ink-body ink-secondary mt-3">还没有房间</p>
            <p className="ink-mute text-xs mt-1">
              创建挑战后，这里会保存你的分享链接
            </p>
            <button
              type="button"
              className="btn-primary mt-6"
              onClick={() => go('home')}
            >
              回到首页
            </button>
          </div>
        ) : (
          <div className="mt-7 flex flex-col gap-4">
            {list.map((room) => {
              const artist = findArtist(room.artistId);
              const accent = artist?.accent ?? '#d4af7a';
              const ranking = room.rankings.slice(0, 5);
              return (
                <div
                  key={room.id}
                  className="p-5"
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid var(--ink-faint)',
                    borderRadius: 22,
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="kicker"
                        style={{ color: accent }}
                      >
                        {artist?.short ?? 'Artist'} · {room.bankName}
                      </p>
                      <p
                        className="ink-title mt-1"
                        style={{ fontSize: 17, fontWeight: 500 }}
                      >
                        {room.title}
                      </p>
                    </div>
                    <span
                      className="ink-mono"
                      style={{ fontSize: 10, color: 'var(--ink-mute)' }}
                    >
                      {new Date(room.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>

                  <div
                    className="mt-3 px-3 py-2"
                    style={{
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid var(--ink-faint)',
                      borderRadius: 12,
                    }}
                  >
                    <p
                      className="ink-mono"
                      style={{
                        fontSize: 10,
                        color: 'var(--ink-mute)',
                        letterSpacing: '0.18em',
                      }}
                    >
                      ROOM ID
                    </p>
                    <p
                      className="ink-mono mt-0.5"
                      style={{ fontSize: 11, color: 'var(--ink-secondary)' }}
                    >
                      {room.id}
                    </p>
                  </div>

                  {/* 排行榜 */}
                  <div className="mt-4">
                    <p
                      className="kicker mb-2"
                      style={{ letterSpacing: '0.3em' }}
                    >
                      Leaderboard
                    </p>
                    {ranking.length === 0 ? (
                      <p className="ink-mute text-xs">还没有好友参与</p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {ranking.map((r, i) => (
                          <div
                            key={`${r.name}-${i}`}
                            className="flex items-center justify-between"
                            style={{
                              padding: '6px 0',
                              borderBottom:
                                i === ranking.length - 1
                                  ? 'none'
                                  : '1px solid var(--ink-faint)',
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className="ink-mono"
                                style={{
                                  fontSize: 11,
                                  color: i === 0 ? accent : 'var(--ink-mute)',
                                  width: 18,
                                }}
                              >
                                {String(i + 1).padStart(2, '0')}
                              </span>
                              <span
                                className="ink-body text-sm"
                                style={{ fontWeight: i === 0 ? 500 : 400 }}
                              >
                                {r.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className="ink-mute text-xs"
                                style={{ letterSpacing: '0.04em' }}
                              >
                                {r.label}
                              </span>
                              <span
                                className="ink-display"
                                style={{
                                  fontSize: 18,
                                  fontStyle: 'italic',
                                  color: i === 0 ? accent : 'var(--ink-secondary)',
                                }}
                              >
                                {r.score}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '10px 18px', fontSize: 13 }}
                      onClick={() => {
                        navigator.clipboard?.writeText(room.link).catch(() => {});
                        notify('已复制链接');
                      }}
                    >
                      复制链接
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: '10px 18px', fontSize: 13 }}
                      onClick={() => openRoom(room)}
                    >
                      进入房间
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      <div className="bottom-bar">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => go('home')}
        >
          {list.length > 0 ? '回到首页 · 创建新测试' : '回到首页'}
        </button>
      </div>
    </div>
  );
}
