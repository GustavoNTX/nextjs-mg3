'use client';

import { useState } from 'react';
import { TextField, Button, IconButton, InputAdornment, Divider, Box } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleLogin = () => {
    console.log('Login', { email, password });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' }, // coluna no mobile, linha no desktop
        height: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      {/* Lado esquerdo: Formulário */}
      <Box
        sx={{
          flex: 1,
          padding: { xs: 4, md: 6 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ffffff',
        }}
      >
        {/* Logo */}
        <Box mb={4}>
          <img src="/simple-logo.svg" alt="Logo" style={{ width: 100 }} />
        </Box>

        {/* Inputs */}
        <TextField
          placeholder="Digite seu e-mail"
          variant="outlined"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{
            maxWidth: 400,
            borderRadius: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />

        <TextField
          placeholder="Digite sua senha"
          type={showPassword ? 'text' : 'password'}
          variant="outlined"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{
            maxWidth: 400,
            borderRadius: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="Mostrar ou ocultar senha"
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Botão Entrar */}
        <Button
          variant="contained"
          fullWidth
          sx={{
            mt: 3,
            mb: 1,
            backgroundColor: '#545454',
            color: '#ffffff',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            maxWidth: 400,
            borderRadius: 2,
            padding: '10px 0',
            '&:hover': { backgroundColor: '#333' },
          }}
          onClick={handleLogin}
        >
          ENTRAR
        </Button>

        {/* Esqueci minha senha */}
        <Button
          variant="text"
          fullWidth
          sx={{
            color: '#FF5959',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            mt: 1,
            maxWidth: 400,
          }}
        >
          Esqueci minha senha
        </Button>

        {/* OU */}
        <Divider sx={{ my: 3, width: '100%', maxWidth: 400, color: '#BDBDBD' }}>OU</Divider>

        {/* Botão Criar Conta */}
        <Button
          variant="contained"
          fullWidth
          sx={{
            backgroundColor: '#FFFFFF',
            color: '#000000',
            border: '1px solid #C4C4C4',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            maxWidth: 400,
            borderRadius: 2,
            padding: '10px 0',
            '&:hover': { backgroundColor: '#f0f0f0' },
          }}
        >
          NÃO TENHO UMA CONTA
        </Button>
      </Box>

      {/* Lado direito: Imagem */}
      <Box
        sx={{
            flex: 1,
            backgroundImage: 'url(/town-image.svg)',
            backgroundRepeat: 'no-repeat',
            backgroundSize: { xs: 'contain', md: 'cover' },  // <- Aqui é o truque!
            backgroundPosition: 'center',
            height: { xs: 250, md: 'auto' },
            minHeight: { xs: 250, md: '100vh' },
            backgroundColor: "#f5f5f5"
        }}
      />
    </Box>
  );
}
