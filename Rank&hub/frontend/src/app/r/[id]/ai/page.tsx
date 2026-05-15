'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redireciona automaticamente para fora da página de IA,
 * removendo a funcionalidade conforme solicitado.
 */
export default function AIPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/r/${id}`);
  }, [id, router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
    </div>
  );
}
