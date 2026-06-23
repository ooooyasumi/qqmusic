import { AppProvider } from '@/lib/state';
import { AppShell } from '@/components/screens/ScreenRouter';

export default function HomePage() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
