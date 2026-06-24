import { AppProvider } from '@/lib/state';
import { AppShell } from '@/components/screens/ScreenRouter';

interface HomePageProps {
  searchParams?: Promise<{
    challenge?: string | string[];
    room?: string | string[];
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const challengeParam = params?.challenge;
  const roomParam = params?.room;
  const initialChallengeToken = Array.isArray(challengeParam)
    ? challengeParam[0]
    : challengeParam ?? (Array.isArray(roomParam) ? roomParam[0] : roomParam);

  return (
    <AppProvider initialChallengeToken={initialChallengeToken}>
      <AppShell />
    </AppProvider>
  );
}
