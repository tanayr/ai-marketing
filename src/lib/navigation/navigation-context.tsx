"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type NavigationContextType = {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  forceCollapsed: boolean;
  setForceCollapsed: (value: boolean) => void;
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [forceCollapsed, setForceCollapsed] = useState(false);
  
  // Reset user preference if force collapsed is set
  useEffect(() => {
    if (forceCollapsed) {
      setIsCollapsed(true);
    }
  }, [forceCollapsed]);

  return (
    <NavigationContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        forceCollapsed,
        setForceCollapsed,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  
  return context;
}
