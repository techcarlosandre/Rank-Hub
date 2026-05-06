'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function DynamicLogo() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className="flex items-center justify-center">
      <style jsx>{`
        @keyframes logo-pulse {
          0% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(255,255,255,0.2)); }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 15px rgba(255,85,40,0.4)); }
          100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(255,255,255,0.2)); }
        }
        
        .animated-logo {
          animation: logo-pulse 2s infinite ease-in-out;
        }
      `}</style>
      <div className="relative w-12 h-12">
        <Image 
          src="/img/logo.png" 
          alt="Rank&Hub Logo" 
          fill
          sizes="48px"
          className="object-contain animated-logo"
          priority
        />
      </div>
    </div>
  );
}
