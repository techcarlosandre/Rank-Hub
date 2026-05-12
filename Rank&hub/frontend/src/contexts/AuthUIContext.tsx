'use client';

import React, { createContext, useContext, useState } from 'react';

interface AuthUIContextType {
  isWatchingPassword: boolean;
  setIsWatchingPassword: (value: boolean) => void;
}

const AuthUIContext = createContext<AuthUIContextType | undefined>(undefined);

export function AuthUIProvider({ children }: { children: React.ReactNode }) {
  const [isWatchingPassword, setIsWatchingPassword] = useState(false);

  return (
    <AuthUIContext.Provider value={{ isWatchingPassword, setIsWatchingPassword }}>
      {children}
    </AuthUIContext.Provider>
  );
}

export function useAuthUI() {
  const context = useContext(AuthUIContext);
  if (context === undefined) {
    throw new Error('useAuthUI must be used within an AuthUIProvider');
  }
  return context;
}
