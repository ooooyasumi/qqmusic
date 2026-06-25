'use client';

import { useApp } from '@/lib/state';
import { findArtist } from '@/lib/data';
import { Orbs } from '@/components/Orbs';
import { TopBar } from '@/components/TopBar';
import { copyText, shareLinkForRoom } from '@/lib/share';

const REQUIRED_COUNT = 6;

export function RoomsScreen() {
  const { rooms, participatedRooms, openRoom, deleteRoom, go, notify } = useApp();
  const createdList = rooms.slice(0, 20);
  const participatedList = participatedRooms.slice(0, 20);
  const hasRooms = createdList.length > 0 || participatedList.length > 0;

  return (
    <div className="screen screen-fade">
      <Orbs accent="rgba(212,175,122,0.35)" secondary="rgba(91,141,239,0.25)" />
      <TopBar title="My Rooms" showMenu={false} />

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
            查看你发起过、参与过的同担默契局
          </p>
        </div>

        {!hasRooms ? (
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
          <div className="mt-7 flex flex-col gap-8">
            <RoomSection
              title="我创建的挑战"
              emptyText="还没有创建过挑战"
              rooms={createdList}
              openRoom={openRoom}
              deleteRoom={deleteRoom}
              canDelete
              notify={notify}
            />
            <RoomSection
              title="我参与的挑战"
              emptyText="还没有参与过好友挑战"
              rooms={participatedList}
              openRoom={openRoom}
              deleteRoom={deleteRoom}
              notify={notify}
            />
          </div>
        )}

      </div>

      <div className="bottom-bar">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => go('home')}
        >
          {hasRooms ? '回到首页 · 创建新测试' : '回到首页'}
        </button>
      </div>
    </div>
  );
}

function RoomSection({
  title,
  emptyText,
  rooms,
  openRoom,
  deleteRoom,
  canDelete = false,
  notify,
}: {
  title: string;
  emptyText: string;
  rooms: ReturnType<typeof useApp>['rooms'];
  openRoom: ReturnType<typeof useApp>['openRoom'];
  deleteRoom: ReturnType<typeof useApp>['deleteRoom'];
  canDelete?: boolean;
  notify: ReturnType<typeof useApp>['notify'];
}) {
  return (
    <section>
      <div className="hairline mb-4">
        <span>{title}</span>
      </div>
      {rooms.length === 0 ? (
        <p className="ink-mute text-xs px-1">{emptyText}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              openRoom={openRoom}
              deleteRoom={deleteRoom}
              canDelete={canDelete}
              notify={notify}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function RoomCard({
  room,
  openRoom,
  deleteRoom,
  canDelete,
  notify,
}: {
  room: ReturnType<typeof useApp>['rooms'][number];
  openRoom: ReturnType<typeof useApp>['openRoom'];
  deleteRoom: ReturnType<typeof useApp>['deleteRoom'];
  canDelete: boolean;
  notify: ReturnType<typeof useApp>['notify'];
}) {
  const artist = findArtist(room.artistId);
  const accent = artist?.accent ?? '#d4af7a';
  const ranking = room.rankings.slice(0, 5);
  const hasCompleteAttempt = Boolean(
    room.myAttempt &&
      room.myAttempt.roomId === room.id &&
      room.myAttempt.friendOrder.length === REQUIRED_COUNT &&
      room.myAttempt.friendSongIds.length === REQUIRED_COUNT,
  );
  const enterLabel = room.relation === 'owned' ? '查看挑战' : hasCompleteAttempt ? '查看结果' : '进入房间';
  const shareLink = shareLinkForRoom(room);

  return (
    <div
      className="p-5"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid var(--ink-faint)',
        borderRadius: 22,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div style={{ minWidth: 0 }}>
          <p className="kicker" style={{ color: accent }}>
            {artist?.short ?? 'Artist'} · {room.bankName}
          </p>
          <p className="ink-title mt-1" style={{ fontSize: 17, fontWeight: 500 }}>
            {room.title}
          </p>
        </div>
        <span className="ink-mono" style={{ fontSize: 10, color: 'var(--ink-mute)', flex: '0 0 auto' }}>
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
        <p className="ink-mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.18em' }}>
          ROOM ID
        </p>
        <p className="ink-mono mt-0.5" style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>
          {room.id}
        </p>
      </div>

      <div className="mt-4">
        <p className="kicker mb-2" style={{ letterSpacing: '0.3em' }}>
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
                  borderBottom: i === ranking.length - 1 ? 'none' : '1px solid var(--ink-faint)',
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
                  <span className="ink-body text-sm" style={{ fontWeight: i === 0 ? 500 : 400 }}>
                    {r.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="ink-mute text-xs" style={{ letterSpacing: '0.04em' }}>
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
            void copyText(shareLink).then((copied) => {
              notify(copied ? '已复制链接' : '复制失败，请长按链接手动复制');
            });
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
          {enterLabel}
        </button>
      </div>
      {canDelete && (
        <button
          type="button"
          className="btn-secondary mt-2"
          style={{ padding: '10px 18px', fontSize: 13 }}
          onClick={() => {
            const confirmed =
              typeof window === 'undefined' ||
              window.confirm('删除后，别人再次打开这个挑战会看到“挑战已被删除”。确定删除吗？');
            if (confirmed) void deleteRoom(room);
          }}
        >
          删除挑战
        </button>
      )}
    </div>
  );
}
