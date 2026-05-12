'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getApiUrl } from '@/lib/api';

export default function HubSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inviteCount, setInviteCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetch(getApiUrl(`user/${user.id}/invites`))
        .then(res => res.json())
        .then(data => setInviteCount(data.length))
        .catch(err => console.error("Erro ao buscar convites:", err));
    }
  }, [user]);

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '/img/Dashboard.png' },
    { name: 'Meus Rankings', href: '/dashboard/rankings', icon: '/img/Rankings.png' },
    { name: 'Convites', href: '/dashboard/invites', icon: '📩', badge: inviteCount },
    { name: 'Configurações', href: '/profile', icon: '/img/Configuaracoes.png' },
  ];

  return (
    <>
      {/* Botão do Menu Mobile */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="btn-menu-mobile lg:hidden"
        style={{ left: isOpen ? '200px' : '1rem' }}
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Fundo Escurecido */}
      {isOpen && (
        <div className="fundo-escuro lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Painel Lateral Principal */}
      <aside className={`painel-lateral lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div style={{ padding: '2rem', paddingTop: isOpen ? '5rem' : '2rem' }}>
          <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
            <h1 className="titulo-marca">Rank&Hub</h1>
          </div>

          {/* Seção de Perfil */}
          <div className="secao-perfil">
            <div className="avatar-perfil">
              {user ? (
                <img 
                  src={user.foto_perfil || user.foto_url || ''} 
                  alt={user.nome} 
                  className="imagem-cover"
                />
              ) : (
                <div className="imagem-cover" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--foreground-muted)' }}>...</div>
              )}
            </div>
            <h3 className="nome-perfil">{user?.nome || 'Convidado'}</h3>
            <p className="rotulo" style={{ marginTop: '0.25rem', color: 'var(--foreground-muted)' }}>Nível 1 • Iniciante</p>
          </div>

          {/* Menu de Navegação */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const isEmoji = item.icon.length < 5;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`link-nav ${isActive ? 'link-nav-ativo' : 'link-nav-inativo'}`}
                >
                  <div className="linha-centro" style={{ gap: '0.75rem' }}>
                    {isEmoji ? (
                       <span style={{ fontSize: '1.125rem' }}>{item.icon}</span>
                    ) : (
                      <img src={item.icon} alt={item.name} className="icone-pequeno" style={{ opacity: isActive ? 1 : 0.6, filter: isActive ? 'brightness(0) invert(1)' : 'none' }} />
                    )}
                    {item.name}
                  </div>
                  
                  {item.badge && item.badge > 0 ? (
                    <span className="badge-notificacao">{item.badge}</span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Botão de Sair */}
        <div className="rodape-lateral">
          <motion.button 
            onClick={logout}
            whileHover="hover"
            className="btn-sair"
          >
            <motion.div 
              variants={{
                hover: { width: '100%', opacity: 1 }
              }}
              initial={{ width: '0%', opacity: 0 }}
              className="barra-progresso"
              style={{ background: 'rgba(220, 38, 38, 0.4)', borderRight: '2px solid #ef4444' }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />

            <div className="btn-sair-conteudo">
              <motion.img 
                variants={{
                  hover: { x: 175, rotate: 10, scale: 1.1 }
                }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                src="/img/Saida.png" 
                alt="Sair" 
                className="icone-pequeno" 
                style={{ opacity: 0.6 }}
              />
              
              <motion.span 
                variants={{
                  hover: { x: -20, opacity: 0.8 }
                }}
                style={{ marginLeft: '0.75rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}
              >
                Sair da Conta
              </motion.span>
            </div>
          </motion.button>
        </div>
      </aside>
    </>
  );
}
