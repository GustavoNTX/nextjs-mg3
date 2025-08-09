// src/contexts/AuthContext.jsx
"use client";

import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Estado de carregamento para verificar o storage
  const router = useRouter();

  // Efeito para carregar o usuário do localStorage na inicialização
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('gmp-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Falha ao carregar usuário do localStorage", error);
      // Limpa em caso de erro de parsing
      localStorage.removeItem('gmp-user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((userData) => {
    localStorage.setItem('gmp-user', JSON.stringify(userData));
    setUser(userData);
    router.push('/selecione-o-condominio'); // Redireciona após o login
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('gmp-user');
    setUser(null);
    router.push('/login'); // Redireciona para a página de login
  }, [router]);

  const value = { user, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook customizado para usar o contexto de autenticação
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}