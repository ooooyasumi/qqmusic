import { AppProvider } from '@/lib/state';
import { AppShell } from '@/components/screens/ScreenRouter';

interface HomePageProps {
  searchParams?: Promise<{
    challenge?: string | string[];
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const challengeParam = params?.challenge;
  const initialChallengeToken = Array.isArray(challengeParam) ? challengeParam[0] : challengeParam;

  return (
    <AppProvider initialChallengeToken={initialChallengeToken}>
      <AppShell />
    </AppProvider>
  );
}
