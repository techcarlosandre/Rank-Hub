'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiUrl } from '@/lib/api';

export default function SubSiteSidebar({ rankingId, themeColor = '#3b82f6' }: { rankingId: string, themeColor?: string }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [rankingInfo, setRankingInfo] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('Membro');

  // Controle do "Segurar para Sair"
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState<{ title: string, msg: string } | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Busca informações do ranking
    fetch(getApiUrl(`/api/rankings/${rankingId}?t=${Date.now()}`))
      .then(res => res.json())
      .then(data => setRankingInfo(data))
      .catch(err => console.error("Erro ao buscar ranking:", err));

    if (user) {
      fetch(getApiUrl(`/api/rankings/${rankingId}/role?usuario_id=${user.id}`))
        .then(res => res.json())
        .then(data => setUserRole(data.role))
        .catch(err => console.error("Erro ao buscar cargo:", err));
    }
  }, [rankingId, user]);

  const isStaff = userRole === 'Fundador' || userRole === 'Admin Promovido';

  // Lógica de Segurar Botão
  const startHold = () => {
    if (userRole === 'Fundador') {
      setShowInfoModal({
        title: "Você não pode sair!",
        msg: "O Fundador é a alma do Ranking. Para encerrar as atividades, você deve excluir o ranking permanentemente nas Configurações."
      });
      return;
    }
    setIsHolding(true);
    setHoldProgress(0);
    
    const startTime = Date.now();
    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 2000) * 100, 100);
      setHoldProgress(progress);
      
      if (progress >= 100) {
        clearInterval(holdTimerRef.current!);
        setIsHolding(false);
        setHoldProgress(0);
        setShowConfirmModal(true);
      }
    }, 20);
  };

  const stopHold = () => {
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    setIsHolding(false);
    setHoldProgress(0);
  };

  const handleFinalLeave = async () => {
    if (!user) return;
    try {
      const res = await fetch(getApiUrl(`/api/rankings/${rankingId}/members/${user.id}?requester_id=${user.id}`), {
        method: 'DELETE'
      });
      if (res.ok) {
        window.location.href = '/dashboard';
      } else {
        const err = await res.json();
        setShowInfoModal({ title: "Erro", msg: err.error });
      }
    } catch (err) {
      setShowInfoModal({ title: "Erro de Conexão", msg: "Não conseguimos processar sua saída agora." });
    } finally {
      setShowConfirmModal(false);
    }
  };

  const links = [
    { name: 'Tabela de pontuação', href: `/r/${rankingId}`, icon: '/img/Rankings.png', private: false },
    { name: 'Tarefas', href: `/r/${rankingId}/tasks`, icon: '📋', private: false },
    { name: rankingInfo?.nome_membros || 'Membros', href: `/r/${rankingId}/members`, icon: '👥', private: false },
    { name: 'Histórico', href: `/r/${rankingId}/history`, icon: '📜', private: false },
    { name: 'Comunidade', href: `/r/${rankingId}/community`, icon: '🛡️', private: true },
    { name: 'Configurações', href: `/r/${rankingId}/settings`, icon: '/img/Configuaracoes.png', private: true },
  ];

  const visibleLinks = links.filter(link => !link.private || isStaff);

  return (
    <>
      {/* Botão Menu Mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-menu-mobile lg:hidden"
        style={{ left: isOpen ? '200px' : '1rem', background: '#18181b', borderColor: 'rgba(255,255,255,0.1)' }}
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Painel Lateral do Ranking */}
      <div className={`painel-lateral-escuro lg:sticky lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div style={{ padding: '1.5rem', paddingTop: isOpen ? '4rem' : '1.5rem' }}>
          <Link href="/dashboard" className="link-voltar">
            ← Voltar ao Hub
          </Link>
          
          {/* Cabeçalho do Ranking */}
          <div className="linha-centro" style={{ gap: '1rem', marginBottom: '1rem' }}>
            <div className="avatar-ranking">
               {rankingInfo?.foto_url ? (
                 <img src={rankingInfo.foto_url} alt="Logo" className="imagem-cover" />
               ) : (
                 <span className="emoji-grande">{rankingInfo?.emoji || '🏆'}</span>
               )}
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 className="titulo-ranking">{rankingInfo?.nome || 'Ranking'}</h2>
              <p className="subtexto text-accent" style={{ opacity: 0.8, letterSpacing: '0.2em' }}>Ativo agora</p>
            </div>
          </div>
          <p className="descricao-ranking">{rankingInfo?.descricao || 'Nenhuma descrição'}</p>
        </div>

        {/* Links de Navegação */}
        <nav style={{ flex: 1, padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '1.5rem' }}>
          {visibleLinks.map((link) => {
            const isActive = pathname === link.href;
            const isPng = typeof link.icon === 'string' && link.icon.endsWith('.png');
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`link-sub ${isActive ? 'link-sub-ativo' : 'link-sub-inativo'}`}
              >
                {isPng ? (
                  <img src={link.icon as string} alt={link.name} className="icone-mini" style={{ opacity: isActive ? 1 : 0.4 }} />
                ) : (
                  <span style={{ fontSize: '1rem', opacity: isActive ? 1 : 0.4 }}>{link.icon}</span>
                )}
                <span className="texto-upper">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Rodapé: Usuário + Botão de Sair */}
        <div className="rodape-sub">
          <div className="cartao-usuario">
            <div className="avatar-mini" style={{ height: '2.5rem', width: '2.5rem', background: '#18181b', borderColor: 'rgba(255,255,255,0.1)' }}>
              {user?.foto_url ? (
                <img src={user.foto_url} alt={user.nome} className="imagem-cover" />
              ) : (
                <span className="rotulo" style={{ color: 'rgba(255,255,255,0.2)' }}>U</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="nome-usuario">{user?.nome || 'Usuário'}</p>
              <p className="subtexto" style={{ color: 'rgba(255,255,255,0.4)' }}>{userRole}</p>
            </div>
          </div>

          {/* Botão Segurar para Sair */}
          <button
            onMouseDown={startHold}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={startHold}
            onTouchEnd={stopHold}
            className="btn-sair"
          >
            <div className="barra-progresso" style={{ width: `${holdProgress}%` }} />
            
            <div className="btn-sair-conteudo-entre">
              <span>{isHolding ? 'Segure firme...' : 'Sair do Ranking'}</span>
              <img
                src="/img/Saida.png"
                alt="Sair"
                className="icone-mini"
                style={{ transition: 'all 0.2s', transform: isHolding ? 'scale(1.25) rotate(12deg)' : 'none', opacity: isHolding ? 1 : 0.4 }}
              />
            </div>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {/* Modal de Confirmação de Saída */}
        {showConfirmModal && (
          <div className="modal-fundo">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirmModal(false)} className="modal-overlay" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="modal-conteudo modal-perigo">
              <div className="modal-icone" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>⚠️</div>
              <h2 className="texto-modal-titulo">Atenção Máxima!</h2>
              <p className="texto-modal-corpo">Ao sair deste Ranking, você perderá **TODOS OS SEUS PONTOS** e seu histórico será deletado permanentemente.</p>
              <div className="grade-acoes">
                <button onClick={handleFinalLeave} className="btn-perigo">Sim, sair e perder tudo</button>
                <button onClick={() => setShowConfirmModal(false)} className="btn-cancelar">Cancelar e Voltar</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal de Informação */}
        {showInfoModal && (
          <div className="modal-fundo" style={{ zIndex: 110 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowInfoModal(null)} className="modal-overlay" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="modal-conteudo">
              <div className="modal-icone" style={{ background: 'rgba(255,85,40,0.1)', color: 'var(--accent)', borderRadius: '1rem', boxShadow: '0 0 20px -10px var(--accent)' }}>🛡️</div>
              <h2 className="texto-modal-titulo" style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>{showInfoModal.title}</h2>
              <p className="texto-modal-corpo">{showInfoModal.msg}</p>
              <button onClick={() => setShowInfoModal(null)} className="btn-cancelar" style={{ background: 'white', color: 'black' }}>Entendido, Administrador!</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
