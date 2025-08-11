"use client";

import { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('gmp-token');
      if (storedToken) {
        const decodedUser = jwtDecode(storedToken); // Apenas o token (string) é passado aqui

        // Verifica se o token não expirou
        if (decodedUser.exp * 1000 > Date.now()) {
          setUser(decodedUser);
          setToken(storedToken);
        } else {
          localStorage.removeItem('gmp-token');
        }
      }
    } catch (error) {
      console.error("Falha ao processar token:", error);
      localStorage.removeItem('gmp-token');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((authData) => {
    const { user: userData, token: authToken } = authData;
    localStorage.setItem('gmp-token', authToken);
    setUser(userData);
    setToken(authToken);
    router.push('/selecione-o-condominio');
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('gmp-token');
    setUser(null);
    setToken(null);
    router.push('/login');
  }, [router]);

  const value = useMemo(
    () => ({ user, token, loading, login, logout }),
    [user, token, loading, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}