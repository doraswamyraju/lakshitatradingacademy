import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ActiveTab = 'dashboard' | 'strategy' | 'backtest' | 'settings' | 'hub' | 'learn' | 'admin';
export type AdminSubTab = 'architect' | 'errors' | 'inquiries' | 'admissions' | 'aliceblue' | 'audit';

interface AppState {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  adminSubTab: AdminSubTab;
  setAdminSubTab: (tab: AdminSubTab) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const AppStateContext = createContext<AppState | null>(null);

export const useAppState = () => {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
};

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => {
    const hash = window.location.hash.replace('#', '');
    if (['dashboard', 'strategy', 'admin', 'settings', 'backtest', 'hub', 'learn'].includes(hash)) {
      return hash as ActiveTab;
    }
    return 'dashboard';
  });
  const [adminSubTab, setAdminSubTabState] = useState<AdminSubTab>('architect');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash.replace('#', '');
      if (['dashboard', 'strategy', 'admin', 'settings', 'backtest', 'hub', 'learn'].includes(hash)) {
        setActiveTabState(hash as ActiveTab);
      }
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab);
    window.location.hash = tab;
  };

  return (
    <AppStateContext.Provider value={{
      activeTab, setActiveTab,
      adminSubTab, setAdminSubTab: setAdminSubTabState,
      isSidebarOpen, setSidebarOpen: setIsSidebarOpen
    }}>
      {children}
    </AppStateContext.Provider>
  );
};
