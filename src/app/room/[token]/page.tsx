import { redirect } from 'next/navigation';

export default async function RoomPathPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  redirect(`/?challenge=${encodeURIComponent(token)}`);
}
