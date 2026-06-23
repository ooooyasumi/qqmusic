'use client';

import { useApp } from '@/lib/state';
import { HomeScreen } from './HomeScreen';
import { ArtistScreen } from './ArtistScreen';
import { CreateScreen } from './CreateScreen';
import { AnswerScreen } from './AnswerScreen';
import { CreatorResultScreen } from './CreatorResultScreen';
import { FriendResultScreen } from './FriendResultScreen';
import { RoomsScreen } from './RoomsScreen';
import { RoomMissingScreen } from './RoomMissingScreen';
import { Toast } from '@/components/Toast';

function ScreenContent() {
  const { screen } = useApp();
  switch (screen) {
    case 'home':
      return <HomeScreen />;
    case 'artist':
      return <ArtistScreen />;
    case 'create':
      return <CreateScreen />;
    case 'creatorAnswer':
      return <AnswerScreen role="creator" />;
    case 'creatorResult':
      return <CreatorResultScreen />;
    case 'friendAnswer':
      return <AnswerScreen role="friend" />;
    case 'friendResult':
      return <FriendResultScreen />;
    case 'rooms':
      return <RoomsScreen />;
    case 'roomMissing':
      return <RoomMissingScreen />;
    default:
      return <HomeScreen />;
  }
}

export function ScreenRouter() {
  return <ScreenContent />;
}

export function AppShell() {
  return (
    <div className="app-shell">
      <ScreenContent />
      <Toast />
    </div>
  );
}
