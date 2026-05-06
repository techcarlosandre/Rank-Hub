'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface FloatingWatchersProps {
  isWatching: boolean;
}

export default function FloatingWatchers({ isWatching }: FloatingWatchersProps) {
  const watchers = [
    { icon: '🏆', x: '5%', y: '15%', rotate: -15 },
    { icon: '⭐', x: '92%', y: '12%', rotate: 15 },
    { icon: '👑', x: '8%', y: '85%', rotate: -10 },
    { icon: '🎮', x: '90%', y: '82%', rotate: 20 },
    { icon: '🥇', x: '4%', y: '48%', rotate: -5 },
    { icon: '🔥', x: '94%', y: '50%', rotate: 10 },
    { icon: '📈', x: '35%', y: '8%', rotate: 0 },
    { icon: '💎', x: '65%', y: '92%', rotate: 5 },
    { icon: '🕹️', x: '12%', y: '35%', rotate: -20 },
    { icon: '⚡', x: '85%', y: '38%', rotate: 25 },
    { icon: '🎯', x: '25%', y: '90%', rotate: -15 },
    { icon: '🚀', x: '75%', y: '10%', rotate: 20 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
      {watchers.map((w, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isWatching ? {
            opacity: 0.6,
            scale: 1.2,
            y: 0,
            rotate: 0,
          } : { 
            opacity: 0.25, 
            scale: 1,
            y: [0, -40, 0],
            rotate: [w.rotate, w.rotate + 8, w.rotate]
          }}
          transition={isWatching ? { type: "spring", stiffness: 200, damping: 20 } : { 
            delay: i * 0.1,
            duration: 3 + (i % 2),
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ position: 'absolute', left: w.x, top: w.y }}
          className="text-4xl sm:text-5xl"
        >
          <AnimatePresence mode="wait">
            {!isWatching ? (
              <motion.span
                key="emoji"
                initial={{ opacity: 0, scale: 0.5, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.5, filter: 'blur(20px)' }}
                className="block filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] grayscale brightness-125"
              >
                {w.icon}
              </motion.span>
            ) : (
              <motion.div
                key="eye"
                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0, rotate: 180 }}
                className="relative w-14 h-9 sm:w-20 sm:h-12 flex items-center justify-center"
              >
                {/* Almond Eye Shape */}
                <motion.svg 
                  viewBox="0 0 100 60" 
                  className="w-full h-full text-accent drop-shadow-[0_0_20px_var(--accent)]"
                  animate={{ 
                    rotate: Math.atan2(50 - parseFloat(w.y), 50 - parseFloat(w.x)) * (180 / Math.PI) 
                  }}
                  transition={{ type: "spring", stiffness: 150, damping: 15 }}
                >
                  <path 
                    d="M5 30C5 30 20 5 50 5C80 5 95 30 95 30C95 30 80 55 50 55C20 55 5 30 5 30Z" 
                    fill="white" 
                    fillOpacity="0.05"
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  {/* Pupil focused on center */}
                  <motion.g
                    animate={{ x: 15 }} // Look "forward" (which is now towards the center due to svg rotation)
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <circle cx="50" cy="30" r="18" fill="currentColor" fillOpacity="0.2" />
                    <circle cx="50" cy="30" r="12" fill="currentColor" />
                    <circle cx="52" cy="28" r="4" fill="white" fillOpacity="0.9" />
                  </motion.g>
                </motion.svg>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}
