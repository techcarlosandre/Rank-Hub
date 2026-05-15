'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import DynamicLogo from '@/components/DynamicLogo';
import WatchingEye from '@/components/WatchingEye';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthUI } from '@/contexts/AuthUIContext';
import { getApiUrl } from '@/lib/api';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: "spring", stiffness: 260, damping: 20 }
  }
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewUser = searchParams.get('new') === 'true';
  const { login } = useAuth();
  
  const [lastUser, setLastUser] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setIsWatchingPassword } = useAuthUI();

  useEffect(() => {
    const savedUser = localStorage.getItem('rankhub_last_user');
    if (savedUser) {
      setLastUser(savedUser);
    }
  }, []);

  useEffect(() => {
    setIsWatchingPassword(showPassword);
    return () => setIsWatchingPassword(false);
  }, [showPassword, setIsWatchingPassword]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(getApiUrl('/api/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha: password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('rankhub_last_user', data.user.nome);
        login(data.user);
        router.push('/dashboard');
      } else {
        setError(data.error || 'Credenciais inválidas');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full">
      <motion.div variants={itemVariants} className="flex flex-col items-center mb-10 text-center relative">
        <div className="relative h-20 w-20 mb-6 group">
          <div className="absolute inset-[-10px] border border-accent/10 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 bg-accent/10 blur-xl rounded-full group-hover:bg-accent/20 transition-colors duration-500"></div>
          <div className="relative h-full w-full flex items-center justify-center drop-shadow-[0_0_15px_rgba(255,85,40,0.3)]">
            <DynamicLogo />
          </div>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase drop-shadow-sm">Rank&Hub</h1>
        <p className="text-white/40 mt-2 tracking-[0.2em] uppercase text-[10px] font-medium">Acesse seu Centro de Classificação</p>
      </motion.div>

      <motion.div variants={itemVariants} className="premium-card w-full p-10 rounded-[3rem] relative group overflow-hidden border-white/10 shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

        <h2 className="text-xl font-medium text-white mb-8 text-center leading-relaxed px-2">
          {isNewUser ? (
            <>
              <span className="text-accent font-black uppercase text-xs tracking-[0.3em] block mb-2">Conta Criada!</span>
              Seja bem-vindo, <br />
              <span className="font-bold text-accent text-2xl tracking-tight">{lastUser}</span>
              <p className="text-[10px] text-white/30 uppercase mt-4 tracking-widest font-bold">Faça seu primeiro acesso e divirta-se!</p>
            </>
          ) : lastUser ? (
            <>
              Bem-vindo de volta,<br />
              <span className="font-bold text-accent text-2xl tracking-tight">{lastUser}</span>
            </>
          ) : (
            <>
              Bem-vindo ao<br />
              <span className="font-bold text-accent text-2xl tracking-tight">Rank&Hub</span>
            </>
          )}
        </h2>

        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center">
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <motion.div variants={itemVariants} className="group/input">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-white placeholder:text-white/20 focus:border-accent/40 focus:bg-white/[0.04] outline-none transition-all duration-300"
            />
          </motion.div>

          <motion.div variants={itemVariants} className="relative group/input">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Senha"
              required
              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-white placeholder:text-white/20 focus:border-accent/40 focus:bg-white/[0.04] outline-none transition-all duration-300"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 z-10 hover:opacity-80 transition-opacity">
              <WatchingEye isWatching={showPassword} className="w-8 h-8" />
            </button>
          </motion.div>

          <motion.button variants={itemVariants} whileHover={{ scale: 1.02, backgroundColor: 'var(--accent)', boxShadow: '0 0 30px rgba(255, 85, 40, 0.4)' }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full bg-accent/90 text-white font-black py-5 rounded-2xl transition-all uppercase tracking-[0.2em] mt-6 disabled:opacity-50 relative overflow-hidden group/btn">
            <span className="relative z-10">{loading ? 'Verificando...' : 'Entrar'}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
          </motion.button>
        </form>

        <motion.div variants={itemVariants} className="mt-10 text-center">
          <Link href="/register" className="group/link inline-block">
            <p className="text-white/30 text-sm transition-colors group-hover/link:text-white/50">
              Não tem uma conta? <span className="text-white font-bold underline decoration-accent underline-offset-4 group-hover/link:text-accent transition-all">Crie agora</span>
            </p>
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LoginContent />
    </Suspense>
  );
}
