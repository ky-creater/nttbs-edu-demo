import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/sidebar';

export const metadata: Metadata = {
  title: '校務支援AI プラットフォーム',
  description: '校務データを安全にAI活用し、教員業務の効率化と学校運営の高度化を実現',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="flex min-h-screen bg-surface">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-x-hidden">
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
            <p className="text-xs text-amber-700">
              このデータは全て架空のデモデータです。実在の生徒情報は含まれていません。
            </p>
          </div>
          <div className="px-8 py-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
