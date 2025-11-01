// src/app/page.js
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Box } from '@mui/material';
import Image from 'next/image';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('AUTH STATE CHECK:', { loading, user });
    if (!loading) {
      if (user) {
        router.push('/selecione-o-condominio');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      {loading && (
        <Image
          src="/simple-logo.png"
          alt="Logo"
          width={150}
          height={150}
        />
      )}
    </Box>
  );
}