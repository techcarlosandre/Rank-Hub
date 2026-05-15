'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redireciona automaticamente para a criação manual, 
 * removendo a interface de IA conforme solicitado pelo usuário.
 */
export default function NewRankingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/new/manual');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
    </div>
  );
}
