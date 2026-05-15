'use client';

import { use, useEffect, useState } from 'react';
import { getApiUrl } from '@/lib/api';

export default function HistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(getApiUrl(`/api/rankings/${id}/logs`))
      .then(res => res.json())
      .then(data => {
        setLogs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar histórico:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-8 text-center text-muted">Carregando histórico...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="pl-14 lg:pl-0">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Histórico Recente</h1>
        <p className="mt-1 text-sm text-muted">Veja as últimas atividades registradas no ranking.</p>
      </div>

      <div className="rounded-xl border border-primary bg-surface overflow-hidden">
        <div className="divide-y divide-primary">
          {logs.length > 0 ? logs.map((log) => (
            <div key={log.id} className="p-6 flex items-center justify-between hover:bg-surface-hover/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent text-lg">
                  ⚡
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {log.usuario} <span className="font-normal text-muted">registrou</span> {log.descricao}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(log.criado_em).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-green-500">+{log.pontos_recebidos} PTS</span>
              </div>
            </div>
          )) : (
            <div className="p-10 text-center text-muted">Nenhuma atividade registrada ainda.</div>
          )}
        </div>
      </div>
    </div>
  );
}
