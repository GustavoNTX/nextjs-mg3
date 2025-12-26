"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  TextField,
  Button,
  Box,
  Typography,
  Divider,
  IconButton,
  InputAdornment,
  CircularProgress,
  Paper,
  Tooltip,
  Zoom,
  Fade,
  useTheme,
  Alert,
  LinearProgress,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  DarkMode,
  LightMode,
  ArrowBack,
  Business,
  CheckCircle,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { useTheme as useCustomTheme } from "@/app/providers";

export default function RegisterWithTokenPage() {
  const router = useRouter();
  const routeParams = useParams();
  const token = Array.isArray(routeParams?.token)
    ? routeParams.token[0]
    : routeParams?.token ?? "";

  const muiTheme = useTheme();
  const { darkMode, toggleDarkMode } = useCustomTheme();
  const [showOverlay, setShowOverlay] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [empresaName, setEmpresaName] = useState("");
  const [checkingToken, setCheckingToken] = useState(true);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (darkMode) {
      setShowOverlay(true);
    }
  }, [darkMode]);

  const handleClickShowPassword = () => setShowPassword((v) => !v);
  const handleMouseDownPassword = (event) => event.preventDefault();

  useEffect(() => {
    if (!token) {
      setError("Link de cadastro inválido.");
      setCheckingToken(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(
          `/api/empresas?token=${encodeURIComponent(token)}`,
          {
            method: "GET",
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data?.error || "Empresa não encontrada para esse link."
          );
        }

        setEmpresaName(data.name);
        setSuccessMessage(`Convite válido para: ${data.name}`);

        setTimeout(() => setSuccessMessage(""), 5000);
      } catch (err) {
        console.error("Erro ao consultar empresa: ", err);
        setError(err.message);
      } finally {
        setCheckingToken(false);
      }
    })();
  }, [token]);

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const res = await fetch(
        `/api/register/${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao criar conta.");
      }

      setSuccessMessage("Conta criada com sucesso! Redirecionando para login...");

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnLogin = (event) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    router.push("/login");
  };

  const handleToggleTheme = () => {
    toggleDarkMode();
  };

  const formDisabled = checkingToken || loading || (!empresaName && !checkingToken);

  const backgroundColor = muiTheme.palette.background.default;
  const formBackground = muiTheme.palette.background.paper;
  const buttonColor = darkMode ? muiTheme.palette.grey[700] : "#545454";
  const buttonHoverColor = darkMode ? muiTheme.palette.grey[600] : "#333";
  const outlineButtonBorder = darkMode
    ? muiTheme.palette.divider
    : muiTheme.palette.grey[300];
  const validTokenColor = darkMode ? '#81c784' : '#2e7d32';
  const invalidTokenColor = darkMode ? '#f44336' : '#d32f2f';

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
      <Tooltip
        title={darkMode ? "Mudar para tema Claro" : "Mudar para tema Escuro"}
        placement="left"
        arrow
        TransitionComponent={Zoom}
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
          }}
        >
          {darkMode ? (
            <LightMode sx={{ color: '#FFD700' }} />
          ) : (
            <DarkMode sx={{ color: '#1976d2' }} />
          )}
        </IconButton>
      </Tooltip>

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

      <Paper
        component="form"
        onSubmit={handleRegister}
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

        <IconButton
          onClick={handleReturnLogin}
          disabled={loading}
          sx={{
            position: 'absolute',
            top: { xs: 16, md: 24 },
            left: { xs: 16, md: 24 },
            zIndex: 100,
            backgroundColor: darkMode
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.04)',
            '&:hover': {
              backgroundColor: darkMode
                ? 'rgba(255, 255, 255, 0.2)'
                : 'rgba(0, 0, 0, 0.08)',
            },
          }}
        >
          <ArrowBack />
        </IconButton>

        <Box
          mb={4}
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
              width: 100,
              height: 100,
              filter: darkMode
                ? 'drop-shadow(0 4px 8px rgba(144, 202, 249, 0.2))'
                : 'drop-shadow(0 4px 8px rgba(25, 118, 210, 0.2))',
            }}
          />
        </Box>

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
          Cadastro por Convite
        </Typography>

        <Typography
          variant="subtitle1"
          color="text.secondary"
          sx={{ mb: 4, textAlign: 'center' }}
        >
          Complete seu cadastro para acessar a plataforma
        </Typography>

        {checkingToken ? (
          <Box sx={{ width: '100%', maxWidth: 400, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Validando convite...
              </Typography>
            </Box>
            <LinearProgress />
          </Box>
        ) : empresaName ? (
          <Alert
            severity="success"
            icon={<CheckCircle />}
            sx={{
              width: '100%',
              maxWidth: 400,
              mb: 3,
              backgroundColor: darkMode ? 'rgba(129, 199, 132, 0.1)' : 'rgba(46, 125, 50, 0.1)',
              border: `1px solid ${validTokenColor}40`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Business sx={{ color: validTokenColor }} />
              <Typography variant="body2">
                <strong>Convite válido para:</strong> {empresaName}
              </Typography>
            </Box>
          </Alert>
        ) : (
          <Alert
            severity="error"
            icon={<ErrorIcon />}
            sx={{
              width: '100%',
              maxWidth: 400,
              mb: 3,
              backgroundColor: darkMode ? 'rgba(244, 67, 54, 0.1)' : 'rgba(211, 47, 47, 0.1)',
              border: `1px solid ${invalidTokenColor}40`,
            }}
          >
            <Typography variant="body2">
              {error || "Token inválido ou empresa não encontrada."}
            </Typography>
          </Alert>
        )}

        {successMessage && (
          <Alert
            severity="success"
            sx={{
              width: '100%',
              maxWidth: 400,
              mb: 3,
              animation: 'fadeIn 0.5s ease',
            }}
          >
            {successMessage}
          </Alert>
        )}

        <TextField
          placeholder="Digite seu nome completo"
          variant="outlined"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={formDisabled}
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
          placeholder="Digite seu e-mail"
          type="email"
          variant="outlined"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={formDisabled}
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
          required
          disabled={formDisabled}
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
                  disabled={formDisabled}
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

        {error && empresaName && (
          <Alert
            severity="error"
            sx={{
              width: '100%',
              maxWidth: 400,
              mt: 2,
            }}
          >
            {error}
          </Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={formDisabled}
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
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: `2px solid ${darkMode ? '#90caf9' : '#ffffff'}`,
                  borderTopColor: 'transparent',
                  animation: 'spin 1s linear infinite',
                }}
              />
              CRIANDO CONTA...
            </Box>
          ) : (
            "FINALIZAR CADASTRO"
          )}
        </Button>

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
        <Button
          variant="outlined"
          fullWidth
          onClick={handleReturnLogin}
          disabled={loading}
          sx={{
            backgroundColor: 'transparent',
            color: muiTheme.palette.text.primary,
            border: `1px solid ${outlineButtonBorder}`,
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
        >
          VOLTAR PARA LOGIN
        </Button>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontSize: '0.75rem',
              lineHeight: 1.4,
            }}
          >
            Este convite é válido apenas para a empresa específica e expira após uso.
          </Typography>
        </Box>

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
                background: 'linear-gradient(135deg, rgba(18, 18, 18, 0.9) 0%, rgba(30, 30, 30, 0.7) 100%)',
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
                    Convite Especial
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      mb: 3,
                      fontWeight: 500,
                      color: '#e0e0e0',
                    }}
                  >
                    Você foi convidado para uma empresa no GMP+
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
                      '🔐 Acesso seguro por convite',
                      '🏢 Integração com empresa existente',
                      '👥 Time pronto para colaborar',
                      '🚀 Comece a trabalhar imediatamente',
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
                    "Faça parte de uma equipe que já está usando o GMP+"
                  </Typography>
                </Box>
              </Fade>
            </Box>
          </Fade>
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