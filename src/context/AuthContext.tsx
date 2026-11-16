import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, auth, signInWithGoogle, logOut, onAuthStateChanged } from '../lib/firebase';

const ADMIN_EMAILS = [
  'luiz.honorato@lcmconstrucao.com.br',
  'luizeduardo85187995@gmail.com',
];

export function checkIsAdmin(user: User | null): boolean {
  if (!user || !user.email || !user.emailVerified) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase().trim());
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  loginWithGoogle: async () => ({ success: false }),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const { user: loggedInUser, error } = await signInWithGoogle();
    if (loggedInUser) {
      setUser(loggedInUser);
      return { success: true };
    }
    return { success: false, error: error || 'Não foi possível fazer login com o Google' };
  };

  const logout = async () => {
    const result = await logOut();
    if (!result.success) throw new Error(result.error || 'Não foi possível sair da conta.');
    setUser(null);
  };

  const isAdmin = checkIsAdmin(user);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
