'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import DynamicLogo from '@/components/DynamicLogo';
import { useAuthUI } from '@/contexts/AuthUIContext';
import { useEffect } from 'react';
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

export default function RegisterPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { setIsWatchingPassword } = useAuthUI();

  // Auth UI effect removed as password visibility is disabled here

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    
    try {
      const response = await fetch(getApiUrl('register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha: password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('rankhub_last_user', nome);
        setSuccess(true);
        setTimeout(() => {
          router.push('/login?new=true');
        }, 2500);
      } else {
        setError(data.error || 'Erro ao criar conta.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col items-center mb-10 text-center relative">
        <div className="relative h-20 w-20 mb-6 group">
          <div className="absolute inset-[-10px] border border-accent/10 rounded-full animate-pulse"></div>
          <div className="relative h-full w-full flex items-center justify-center drop-shadow-[0_0_15px_rgba(255,85,40,0.3)]">
            <DynamicLogo />
          </div>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase drop-shadow-sm">Rank&Hub</h1>
        <p className="text-white/40 mt-2 tracking-[0.2em] uppercase text-[10px] font-medium">Crie sua jornada premium</p>
      </motion.div>

      <motion.div variants={itemVariants} className="premium-card w-full p-10 rounded-[3rem] relative group overflow-hidden border-white/10 shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"></div>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center"
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-8 rounded-[2rem] bg-green-500/10 border border-green-500/20 text-center space-y-4"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 bg-green-500 rounded-full mx-auto flex items-center justify-center text-white text-3xl shadow-lg shadow-green-500/40"
            >
              ✓
            </motion.div>
            <div className="space-y-1">
              <h3 className="text-white font-black uppercase tracking-tighter text-xl">Conta Criada!</h3>
              <p className="text-green-500/80 text-[10px] font-bold uppercase tracking-widest">Prepare-se para o próximo nível</p>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <motion.div variants={itemVariants}>
            <input 
              type="text" 
              placeholder="Nome Completo" 
              required
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-white placeholder:text-white/20 focus:border-accent/40 focus:bg-white/[0.04] outline-none transition-all duration-300"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <input 
              type="email" 
              placeholder="E-mail" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-white placeholder:text-white/20 focus:border-accent/40 focus:bg-white/[0.04] outline-none transition-all duration-300"
            />
          </motion.div>
          <motion.div variants={itemVariants} className="relative group/input">
            <input 
              type="password"
              placeholder="Senha" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-white placeholder:text-white/20 focus:border-accent/40 focus:bg-white/[0.04] outline-none transition-all duration-300"
            />
          </motion.div>

          {password && (
            <motion.div 
              initial={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              className="px-6 py-4 bg-accent/5 border border-accent/20 rounded-2xl"
            >
              <p className="text-[10px] uppercase tracking-widest text-accent/60 mb-1">Visualização da Senha</p>
              <p className="text-sm font-mono text-white/80 break-all">{password}</p>
            </motion.div>
          )}


          <motion.button 
            variants={itemVariants}
            whileHover={{ scale: 1.02, backgroundColor: 'var(--accent)', boxShadow: '0 0 30px rgba(255, 85, 40, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || success}
            className="w-full bg-accent/90 text-white font-black py-5 rounded-2xl transition-all uppercase tracking-[0.2em] mt-6 disabled:opacity-50 relative overflow-hidden group/btn"
          >
            <span className="relative z-10">{loading ? 'Gerando Acesso...' : 'Criar Conta'}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
          </motion.button>
        </form>

        <motion.div variants={itemVariants} className="mt-10 text-center">
          <Link href="/login" className="group/link inline-block">
            <p className="text-white/30 text-sm transition-colors group-hover/link:text-white/50">
              Já tem uma conta? <span className="text-white font-bold underline decoration-accent underline-offset-4 group-hover/link:text-accent transition-all">Faça Login</span>
            </p>
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
