'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface RankingThemeContextType {
  accentColor: string;
  setAccentColor: (color: string) => void;
  refreshTheme: () => void;
}

const RankingThemeContext = createContext<RankingThemeContextType | undefined>(undefined);

export function RankingThemeProvider({ children, rankingId }: { children: React.ReactNode, rankingId: string }) {
  const [accentColor, setAccentColor] = useState('#ff5528');

  const fetchTheme = () => {
    fetch(`http://127.0.0.1:5000/api/rankings/${rankingId}`)
      .then(res => res.json())
      .then(data => {
        if (data.cor_tema_hex) {
          setAccentColor(data.cor_tema_hex);
        }
      })
      .catch(err => console.error("Erro ao buscar tema:", err));
  };

  const getContrastColor = (hex: string) => {
    // Remove o # se existir
    const color = hex.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    
    // Fórmula de luminosidade (padrão ITU-R BT.709)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Se o brilho for maior que 155 (de 255), a cor é considerada clara
    return brightness > 155 ? '#000000' : '#ffffff';
  };

  useEffect(() => {
    fetchTheme();
  }, [rankingId]);

  const foregroundColor = getContrastColor(accentColor);

  return (
    <RankingThemeContext.Provider value={{ accentColor, setAccentColor, refreshTheme: fetchTheme }}>
      <div style={{ 
        '--accent': accentColor,
        '--accent-foreground': foregroundColor 
      } as React.CSSProperties}>
        {children}
      </div>
    </RankingThemeContext.Provider>
  );
}

export function useRankingTheme() {
  const context = useContext(RankingThemeContext);
  if (context === undefined) {
    throw new Error('useRankingTheme must be used within a RankingThemeProvider');
  }
  return context;
}
