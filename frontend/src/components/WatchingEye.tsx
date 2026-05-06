'use client';

import { motion } from 'framer-motion';

interface WatchingEyeProps {
  isWatching: boolean;
  className?: string;
}

export default function WatchingEye({ isWatching, className = "" }: WatchingEyeProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Eye Shape SVG */}
      <svg viewBox="0 0 100 60" className={`w-full h-full transition-colors duration-500 ${isWatching ? 'text-accent' : 'text-white/20'}`}>
        <path 
          d="M5 30C5 30 20 5 50 5C80 5 95 30 95 30C95 30 80 55 50 55C20 55 5 30 5 30Z" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Iris & Pupil Container */}
        <motion.g
          animate={isWatching ? { x: -8, scale: 1.1 } : { x: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <circle cx="50" cy="30" r="18" fill="currentColor" fillOpacity="0.1" />
          <circle cx="50" cy="30" r="10" fill="currentColor" />
          {isWatching && <circle cx="47" cy="27" r="3" fill="white" fillOpacity="0.8" />}
        </motion.g>
      </svg>
    </div>
  );
}
