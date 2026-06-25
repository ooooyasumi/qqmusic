import type { Metadata, Viewport } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '同担默契局 · QQ 音乐 AI 社交测试',
    template: '%s · 同担默契局',
  },
  description:
    '同担默契局：6 道题，测你们听懂的是不是同一种喜欢。选一个艺人，发给好友，测出你们的听歌默契。',
  keywords: ['同担默契局', 'QQ 音乐', '听歌测试', '艺人粉', '默契测试', 'AI 社交测试'],
  openGraph: {
    title: '同担默契局 · 6 道题，测你们的听歌默契',
    description: '你听的是哪一种喜欢？',
    siteName: '同担默契局',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0d0a1f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN" suppressHydrationWarning className="dark">
      <body suppressHydrationWarning>
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
