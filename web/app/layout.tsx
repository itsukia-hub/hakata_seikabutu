import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Meguriai',
  description: '同じ生活圏で繰り返し接点が生まれる相手と、双方の合意のもとで一歩前に進めるマッチングアプリ。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
          {children}
        </div>
      </body>
    </html>
  );
}
