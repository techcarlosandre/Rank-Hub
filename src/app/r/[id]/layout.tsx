'use client';

import { use } from 'react';
import SubSiteSidebar from '@/components/SubSiteSidebar';
import { RankingThemeProvider } from '@/contexts/RankingThemeContext';

export default function SubSiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <RankingThemeProvider rankingId={id}>
      <div className="flex min-h-screen bg-background">
        <SubSiteSidebar rankingId={id} />
        <main className="flex-1 w-full overflow-y-auto">
          <div className="mx-auto max-w-5xl p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </RankingThemeProvider>
  );
}
