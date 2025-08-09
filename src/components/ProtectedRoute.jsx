// src/components/ProtectedRoute.jsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Box, Typography } from '@mui/material';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Se não estiver carregando e não houver usuário, redireciona
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Se estiver carregando, exibe uma mensagem de "Carregando..."
  if (loading || !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Verificando autenticação...</Typography>
      </Box>
    );
  }

  // Se o usuário estiver logado, renderiza o conteúdo da página
  return children;
}