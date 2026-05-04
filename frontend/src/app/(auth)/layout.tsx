'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthUIProvider, useAuthUI } from '@/contexts/AuthUIContext';
import FloatingWatchers from '@/components/FloatingWatchers';

function AuthLayoutContent({
  children,
  pathname
}: {
  children: React.ReactNode;
  pathname: string;
}) {
  const { isWatchingPassword } = useAuthUI();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Shared Background Elements */}
      <div className="fixed inset-0 z-0 aurora-bg opacity-60 pointer-events-none"></div>
      
      {/* Moving Blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px] animate-blob pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[120px] animate-blob animation-delay-2000 pointer-events-none"></div>
      
      {/* Noise Texture */}
      <div className="fixed inset-0 z-[1] noise-overlay opacity-10 pointer-events-none"></div>

      {/* Floating Watchers - Now in the Layout at z-5 */}
      <FloatingWatchers isWatching={isWatchingPassword} />

      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-[600px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, x: 10, filter: 'blur(5px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -10, filter: 'blur(5px)' }}
            transition={{ 
              duration: 0.3, 
              ease: "easeInOut"
            }}
            className="w-full max-w-md flex flex-col items-center"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AuthUIProvider>
      <AuthLayoutContent pathname={pathname}>
        {children}
      </AuthLayoutContent>
    </AuthUIProvider>
  );
}
