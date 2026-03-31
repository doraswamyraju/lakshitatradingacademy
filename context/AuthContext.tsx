import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'USER';
  isPaperTrading: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: any) => void;
  logout: () => void;
  setPaperMode: (isPaper: boolean) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  setPaperMode: () => {},
  isAuthenticated: false
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved token
    const savedToken = localStorage.getItem('lakshita_token');
    const savedUser = localStorage.getItem('lakshita_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: any) => {
    localStorage.setItem('lakshita_token', newToken);
    localStorage.setItem('lakshita_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('lakshita_token');
    localStorage.removeItem('lakshita_user');
    setToken(null);
    setUser(null);
  };

  const setPaperMode = (isPaper: boolean) => {
    if (user) {
      const updatedUser = { ...user, isPaperTrading: isPaper };
      localStorage.setItem('lakshita_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-samp-dark text-white flex items-center justify-center">Loading Engine...</div>;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, setPaperMode, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};
