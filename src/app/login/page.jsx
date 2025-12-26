// src/app/login/page.jsx - COM BOTÃO DE ALTERAR TEMA NO LOGIN
"use client";

import { useState, useEffect } from "react";
import {
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Divider,
  Box,
  Typography,
  Paper,
  useTheme,
  Fade,
  Tooltip,
  Zoom,
} from "@mui/material";
import { useRouter } from "next/navigation";
import {
  Visibility,
  VisibilityOff,
  DarkMode,
  LightMode,
  Settings,
} from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme as useCustomTheme } from "@/app/providers";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showThemeTooltip, setShowThemeTooltip] = useState(false);

  const router = useRouter();
  const muiTheme = useTheme();
  const { darkMode, toggleDarkMode } = useCustomTheme();

  // Controla a animação do overlay
  useEffect(() => {
    if (darkMode) {
      const timer = setTimeout(() => setShowOverlay(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowOverlay(false);
    }
  }, [darkMode]);

  // Mostra tooltip do tema na primeira vez
  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem("has-seen-theme-tooltip");
    if (!hasSeenTooltip) {
      setTimeout(() => {
        setShowThemeTooltip(true);
        setTimeout(() => setShowThemeTooltip(false), 5000);
        localStorage.setItem("has-seen-theme-tooltip", "true");
      }, 2000);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.push("/selecione-o-condominio");
    }
  }, [user, loading, router]);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleLogin = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push("/selecione-o-condominio");
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatAccout = async () => {
    setError("");
    try {
      router.push("/cadastro");
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  };

  const handleToggleTheme = () => {
    toggleDarkMode();
    // Feedback visual
    if (darkMode) {
      console.log("🎨 Tema alterado para Claro");
    } else {
      console.log("🌙 Tema alterado para Escuro");
    }
  };

  if (loading || user) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: muiTheme.palette.background.default,
        }}
      >
        <img
          src="/simple-logo.png"
          alt="Logo"
          style={{
            width: 150,
            height: 150,
            animation: 'pulse 2s infinite',
          }}
        />
      </Box>
    );
  }

  // Cores baseadas no tema
  const backgroundColor = muiTheme.palette.background.default;
  const formBackground = muiTheme.palette.background.paper;
  const buttonColor = darkMode ? muiTheme.palette.grey[700] : "#545454";
  const buttonHoverColor = darkMode ? muiTheme.palette.grey[600] : "#333";
  const createAccountBorder = darkMode
    ? muiTheme.palette.divider
    : muiTheme.palette.grey[300];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        height: "100vh",
        backgroundColor: backgroundColor,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Botão de alternar tema - TOPO DIREITO */}
      <Tooltip
        title={darkMode ? "Mudar para tema Claro" : "Mudar para tema Escuro"}
        placement="left"
        arrow
        TransitionComponent={Zoom}
        open={showThemeTooltip}
        onClose={() => setShowThemeTooltip(false)}
        disableHoverListener={showThemeTooltip}
      >
        <IconButton
          onClick={handleToggleTheme}
          sx={{
            position: 'absolute',
            top: { xs: 16, md: 24 },
            right: { xs: 16, md: 24 },
            zIndex: 1000,
            backgroundColor: darkMode
              ? 'rgba(144, 202, 249, 0.1)'
              : 'rgba(25, 118, 210, 0.1)',
            border: `1px solid ${darkMode ? '#90caf940' : '#1976d240'}`,
            width: 48,
            height: 48,
            '&:hover': {
              backgroundColor: darkMode
                ? 'rgba(144, 202, 249, 0.2)'
                : 'rgba(25, 118, 210, 0.2)',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.3s ease',
            animation: showThemeTooltip ? 'glow 2s infinite' : 'none',
          }}
        >
          {darkMode ? (
            <LightMode sx={{ color: '#FFD700' }} />
          ) : (
            <DarkMode sx={{ color: '#1976d2' }} />
          )}
        </IconButton>
      </Tooltip>

      {/* Badge de tema */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 70, md: 78 },
          right: { xs: 16, md: 24 },
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: darkMode
            ? 'rgba(30, 30, 30, 0.8)'
            : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          padding: '4px 12px',
          borderRadius: 20,
          border: `1px solid ${darkMode ? '#90caf940' : '#1976d240'}`,
          fontSize: '0.75rem',
          fontWeight: 500,
          color: darkMode ? '#90caf9' : '#1976d2',
          animation: 'fadeIn 0.5s ease',
          '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'translateY(-10px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: darkMode ? '#90caf9' : '#1976d2',
            animation: 'pulse 2s infinite',
          }}
        />
        {darkMode ? 'Modo Escuro' : 'Modo Claro'}
      </Box>

      {/* Lado esquerdo: Formulário */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          padding: { xs: 4, md: 8, lg: 10 },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: formBackground,
          position: 'relative',
          zIndex: 1,
          minWidth: { md: '500px' },
        }}
      >
        {/* Decoração sutil */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: darkMode
              ? 'linear-gradient(90deg, #90caf9 0%, #42a5f5 100%)'
              : 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
            zIndex: 2,
          }}
        />

        {/* Logo */}
        <Box
          mb={5}
          sx={{
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -10,
              left: '25%',
              width: '50%',
              height: '2px',
              background: darkMode
                ? 'linear-gradient(90deg, transparent, #90caf9, transparent)'
                : 'linear-gradient(90deg, transparent, #1976d2, transparent)',
            }
          }}
        >
          <img
            src="/simple-logo.png"
            alt="Logo GMP+"
            style={{
              width: 120,
              height: 120,
              filter: darkMode
                ? 'drop-shadow(0 4px 8px rgba(144, 202, 249, 0.2))'
                : 'drop-shadow(0 4px 8px rgba(25, 118, 210, 0.2))',
              transition: 'filter 0.3s ease',
            }}
          />
        </Box>

        {/* Título */}
        <Typography
          variant="h4"
          sx={{
            mb: 1,
            fontWeight: 700,
            background: darkMode
              ? 'linear-gradient(45deg, #90caf9 30%, #42a5f5 90%)'
              : 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          GMP +
        </Typography>

        <Typography
          variant="subtitle1"
          color="text.secondary"
          sx={{ mb: 4, textAlign: 'center' }}
        >
          Plataforma de Gestão de Manutenção
        </Typography>

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
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              },
              '&.Mui-focused': {
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(25, 118, 210, 0.08)',
                boxShadow: `0 0 0 2px ${darkMode ? '#90caf9' : '#1976d2'}20`,
              },
            },
          }}
        />

        <TextField
          placeholder="Digite sua senha"
          type={showPassword ? "text" : "password"}
          variant="outlined"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{
            maxWidth: 400,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              },
              '&.Mui-focused': {
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(25, 118, 210, 0.08)',
                boxShadow: `0 0 0 2px ${darkMode ? '#90caf9' : '#1976d2'}20`,
              },
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
                  sx={{
                    color: darkMode ? muiTheme.palette.text.secondary : muiTheme.palette.action.active,
                    '&:hover': {
                      backgroundColor: darkMode
                        ? 'rgba(144, 202, 249, 0.1)'
                        : 'rgba(25, 118, 210, 0.1)',
                    },
                  }}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {error && (
          <Box
            sx={{
              mt: 2,
              maxWidth: 400,
              width: '100%',
              p: 2,
              borderRadius: 1,
              backgroundColor: muiTheme.palette.error.main + '15',
              border: `1px solid ${muiTheme.palette.error.main}30`,
            }}
          >
            <Typography
              color="error"
              sx={{
                textAlign: "center",
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              <span style={{ fontSize: '1.2em' }}>⚠️</span> {error}
            </Typography>
          </Box>
        )}

        {/* Botão Entrar */}
        <Button
          variant="contained"
          fullWidth
          disabled={isSubmitting}
          sx={{
            mt: 4,
            mb: 2,
            backgroundColor: buttonColor,
            color: "#ffffff",
            textTransform: "uppercase",
            fontWeight: "bold",
            maxWidth: 400,
            borderRadius: 2,
            padding: "12px 0",
            fontSize: '0.9rem',
            letterSpacing: '0.5px',
            transition: 'all 0.3s ease',
            "&:hover": {
              backgroundColor: buttonHoverColor,
              transform: 'translateY(-1px)',
              boxShadow: darkMode
                ? '0 6px 12px rgba(0, 0, 0, 0.3)'
                : '0 6px 12px rgba(0, 0, 0, 0.15)',
            },
            "&.Mui-disabled": {
              backgroundColor: darkMode ? muiTheme.palette.grey[800] : muiTheme.palette.grey[400],
              color: darkMode ? muiTheme.palette.grey[500] : muiTheme.palette.grey[600],
              transform: 'none',
              boxShadow: 'none',
            },
          }}
          onClick={handleLogin}
        >
          {isSubmitting ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: `2px solid ${darkMode ? '#90caf9' : '#ffffff'}`,
                  borderTopColor: 'transparent',
                  animation: 'spin 1s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
              PROCESSANDO...
            </Box>
          ) : (
            "ACESSAR PLATAFORMA"
          )}
        </Button>

        {/* Esqueci minha senha */}
        <Button
          variant="text"
          fullWidth
          sx={{
            color: muiTheme.palette.text.secondary,
            textTransform: "none",
            fontWeight: 500,
            mt: 1,
            maxWidth: 400,
            fontSize: '0.875rem',
            "&:hover": {
              backgroundColor: darkMode
                ? 'rgba(144, 202, 249, 0.08)'
                : 'rgba(25, 118, 210, 0.08)',
              color: darkMode ? '#90caf9' : '#1976d2',
            }
          }}
        >
          Esqueci minha senha
        </Button>

        {/* Divisor */}
        <Box sx={{ position: 'relative', width: '100%', maxWidth: 400, my: 3 }}>
          <Divider
            sx={{
              borderColor: muiTheme.palette.divider,
            }}
          />
          <Typography
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              px: 2,
              backgroundColor: formBackground,
              color: muiTheme.palette.text.secondary,
              fontSize: '0.875rem',
            }}
          >
            ou
          </Typography>
        </Box>

        {/* Botão Criar Conta */}
        <Button
          variant="outlined"
          fullWidth
          sx={{
            backgroundColor: 'transparent',
            color: muiTheme.palette.text.primary,
            border: `1px solid ${createAccountBorder}`,
            textTransform: "uppercase",
            fontWeight: "bold",
            maxWidth: 400,
            borderRadius: 2,
            padding: "12px 0",
            fontSize: '0.9rem',
            letterSpacing: '0.5px',
            transition: 'all 0.3s ease',
            "&:hover": {
              backgroundColor: darkMode
                ? 'rgba(144, 202, 249, 0.1)'
                : 'rgba(25, 118, 210, 0.1)',
              borderColor: darkMode ? '#90caf9' : '#1976d2',
              transform: 'translateY(-1px)',
              boxShadow: darkMode
                ? '0 4px 8px rgba(144, 202, 249, 0.2)'
                : '0 4px 8px rgba(25, 118, 210, 0.2)',
            },
          }}
          onClick={handleCreatAccout}
        >
          CRIAR NOVA CONTA
        </Button>

        {/* Link para Configurações Gerais (só aparece quando logado, mas deixamos a dica) */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              fontSize: '0.75rem',
            }}
          >
            <Settings sx={{ fontSize: '0.875rem' }} />
            Preferências de tema podem ser ajustadas nas
            <Button
              variant="text"
              size="small"
              sx={{
                fontSize: '0.75rem',
                minWidth: 'auto',
                p: 0,
                color: darkMode ? '#90caf9' : '#1976d2',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'transparent',
                  textDecoration: 'underline',
                },
              }}
              onClick={() => {
                // Aqui você pode adicionar um modal de informações
                // ou um toast explicando
                console.log("Configurações disponíveis após login");
              }}
            >
              Configurações Gerais
            </Button>
          </Typography>
        </Box>

        {/* Rodapé */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            mt: 2,
            textAlign: 'center',
            maxWidth: 400,
            fontSize: '0.75rem',
          }}
        >
          © {new Date().getFullYear()} GMP +. Todos os direitos reservados.
        </Typography>
      </Paper>

      <Box
        sx={{
          flex: 1,
          backgroundImage: darkMode
            ? "url(/town-image.svg)"
            : "url(/town-image.svg)",
          backgroundRepeat: "no-repeat",
          backgroundSize: { xs: "contain", md: "cover" },
          backgroundPosition: "center",
          height: { xs: 250, md: "auto" },
          minHeight: { xs: 250, md: "100vh" },
          backgroundColor: darkMode ? '#0a0a0a' : '#f5f5f5',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {darkMode && (
          <Fade in={showOverlay} timeout={500}>
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(18, 18, 18, 0.95) 0%, rgba(30, 30, 30, 0.8) 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'center',
                p: 4,
              }}
            >
              <Fade in={showOverlay} timeout={800}>
                <Box
                  sx={{
                    maxWidth: 500,
                    textAlign: 'center',
                    color: '#ffffff',
                    mb: 8,
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      mb: 2,
                      background: 'linear-gradient(45deg, #90caf9 30%, #42a5f5 90%)',
                      backgroundClip: 'text',
                      textFillColor: 'transparent',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Gestão Inteligente
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      mb: 3,
                      fontWeight: 500,
                      color: '#e0e0e0',
                    }}
                  >
                    Controle completo do seu condomínio
                  </Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      mb: 4,
                    }}
                  >
                    {[
                      '📊 Dashboard interativo',
                      '🔔 Notificações inteligentes',
                      '📱 Acesso multiplataforma',
                      '🔒 Segurança de dados',
                    ].map((item, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 1.5,
                          borderRadius: 1,
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(144, 202, 249, 0.1)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(144, 202, 249, 0.1)',
                            transform: 'translateX(5px)',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: '#90caf9',
                          }}
                        />
                        <Typography sx={{ color: '#ffffff' }}>
                          {item}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      color: '#b0b0b0',
                      fontStyle: 'italic',
                    }}
                  >
                    "Soluções que transformam a gestão condominial"
                  </Typography>
                </Box>
              </Fade>
            </Box>
          </Fade>
        )}
        {darkMode && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              background: 'radial-gradient(circle at 20% 50%, rgba(144, 202, 249, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(66, 165, 245, 0.05) 0%, transparent 50%)',
            }}
          />
        )}
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            backgroundColor: darkMode
              ? 'rgba(30, 30, 30, 0.7)'
              : 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(10px)',
            padding: '6px 12px',
            borderRadius: 20,
            border: `1px solid ${darkMode ? '#90caf940' : '#1976d240'}`,
            fontSize: '0.7rem',
            fontWeight: 500,
            color: darkMode ? '#90caf9' : '#1976d2',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            animation: 'fadeIn 1s ease',
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: darkMode ? '#90caf9' : '#1976d2',
              animation: 'pulse 2s infinite',
            }}
          />
          {darkMode ? 'Experiência Noturna' : 'Experiência Diurna'}
        </Box>
      </Box>
    </Box>
  );
}