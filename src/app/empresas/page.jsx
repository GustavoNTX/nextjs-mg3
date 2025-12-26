"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TextField,
  Button,
  Box,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Paper,
  useTheme,
  Fade,
  Zoom,
  CircularProgress,
} from "@mui/material";
import {
  ContentCopy as ContentCopyIcon,
  DarkMode,
  LightMode,
  ArrowBack,
  Business,
  CheckCircle,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { useTheme as useCustomTheme } from "@/app/providers";

export default function EmpresasPage() {
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [cnpjError, setCnpjError] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState("form");
  const [showOverlay, setShowOverlay] = useState(false);

  const muiTheme = useTheme();
  const { darkMode, toggleDarkMode } = useCustomTheme();

  useState(() => {
    if (darkMode) {
      setShowOverlay(true);
    }
  }, [darkMode]);

  const validateEmail = (value) => {
    if (!value.includes("@") || !value.includes(".")) {
      setEmailError("Digite um e-mail válido");
    } else {
      setEmailError("");
    }
  };

  const formatCnpj = (value) => {
    value = value.replace(/\D/g, "");

    if (value.length > 14) value = value.slice(0, 14);

    if (value.length <= 2) return value;
    if (value.length <= 5) return `${value.slice(0, 2)}.${value.slice(2)}`;
    if (value.length <= 8)
      return `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5)}`;
    if (value.length <= 12)
      return `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(
        5,
        8
      )}/${value.slice(8)}`;

    return `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(
      5,
      8
    )}/${value.slice(8, 12)}-${value.slice(12, 14)}`;
  };

  const validateCnpj = (value) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length > 0 && digits.length !== 14) {
      setCnpjError("CNPJ incompleto");
    } else {
      setCnpjError("");
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);

    if (emailError || cnpjError) return;

    setSubmitting(true);

    try {
      const res = await fetch("/api/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          cnpj: cnpj || undefined,
        }),
      });

      let data = null;

      try {
        data = await res.json();
      } catch { }

      if (!res.ok) {
        const backendMsg =
          data?.error ||
          (data?.issues?.fieldErrors &&
            Object.values(data.issues.fieldErrors).flat().join(", ")) ||
          "Erro ao criar empresa";

        if (res.status >= 500) {
          setError(backendMsg);
          setView("error");
          return;
        }

        throw new Error(backendMsg);
      }

      setResult(data);
      setView("result");
    } catch (err) {
      setError(err.message || "Falha ao criar empresa");
      setView("form");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
    } catch {
      setError("Não consegui copiar para a área de transferência.");
    }
  };

  const handleToggleTheme = () => {
    toggleDarkMode();
  };

  const linkCadastro = result ? `/cadastro/${result.empresaToken}` : "";

  const backgroundColor = muiTheme.palette.background.default;
  const formBackground = muiTheme.palette.background.paper;
  const buttonColor = darkMode ? muiTheme.palette.grey[700] : "#545454";
  const buttonHoverColor = darkMode ? muiTheme.palette.grey[600] : "#333";
  const outlineButtonBorder = darkMode
    ? muiTheme.palette.divider
    : muiTheme.palette.grey[300];
  const successColor = darkMode ? '#81c784' : '#2e7d32';
  const errorColor = darkMode ? '#f44336' : '#d32f2f';

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
      {/* Botão de alternar tema */}
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
        component="form"
        onSubmit={handleCreate}
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

        {/* Botão voltar para login */}
        <IconButton
          component={Link}
          href="/login"
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

        {/* Logo */}
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

        {/* FORM */}
        {view === "form" && (
          <>
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
              Criar Nova Empresa
            </Typography>

            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{ mb: 4, textAlign: 'center' }}
            >
              Configure uma empresa para gerenciar seus condomínios
            </Typography>

            {/* Campo Nome */}
            <TextField
              placeholder="Nome da empresa"
              variant="outlined"
              fullWidth
              margin="normal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
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

            {/* Campo Email */}
            <TextField
              placeholder="E-mail da empresa"
              type="email"
              variant="outlined"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                validateEmail(e.target.value);
              }}
              error={!!emailError}
              helperText={emailError}
              required
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

            {/* Campo CNPJ */}
            <TextField
              placeholder="CNPJ (opcional)"
              variant="outlined"
              fullWidth
              margin="normal"
              value={cnpj}
              onChange={(e) => {
                const formatted = formatCnpj(e.target.value);
                setCnpj(formatted);
                validateCnpj(formatted);
              }}
              error={!!cnpjError}
              helperText={cnpjError}
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

            {/* Mensagem de erro */}
            {error && (
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

            {/* Botão Criar Empresa */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting}
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
              {submitting ? (
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
                  CRIANDO EMPRESA...
                </Box>
              ) : (
                "CRIAR EMPRESA"
              )}
            </Button>
          </>
        )}

        {/* ERRO 500 */}
        {view === "error" && (
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <Alert
              severity="error"
              icon={<ErrorIcon />}
              sx={{ mb: 2 }}
            >
              {error || "Erro interno do servidor. Tente novamente mais tarde."}
            </Alert>

            <Button
              variant="contained"
              fullWidth
              onClick={() => {
                setError("");
                setView("form");
              }}
              sx={{
                borderRadius: 2,
                padding: "10px 0",
                backgroundColor: buttonColor,
                "&:hover": { backgroundColor: buttonHoverColor },
              }}
            >
              Tentar novamente
            </Button>
          </Box>
        )}

        {/* RESULTADO */}
        {view === "result" && result && (
          <Paper
            elevation={2}
            sx={{
              width: '100%',
              maxWidth: 400,
              p: 3,
              borderRadius: 2,
              backgroundColor: darkMode
                ? 'rgba(255, 255, 255, 0.05)'
                : '#f9f9f9',
              border: `1px solid ${darkMode ? muiTheme.palette.divider : '#eee'}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CheckCircle sx={{ color: successColor }} />
              <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                Empresa Criada com Sucesso!
              </Typography>
            </Box>

            {/* Informações da Empresa */}
            <Box sx={{ mb: 2, p: 2, borderRadius: 1, bgcolor: darkMode ? 'rgba(255, 255, 255, 0.03)' : '#f5f5f5' }}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Business fontSize="small" />
                <strong>{result.name}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                E-mail: {result.email || "Não informado"}
              </Typography>
            </Box>

            {/* Token da Empresa */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: "text.secondary", display: 'block', mb: 1 }}>
                Token de acesso:
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  bgcolor: darkMode ? 'rgba(0, 0, 0, 0.2)' : '#fff',
                  border: `1px solid ${darkMode ? muiTheme.palette.divider : '#eee'}`,
                  borderRadius: 1,
                  px: 1.5,
                  py: 1,
                }}
              >
                <Typography
                  component="code"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: 13,
                    flex: 1,
                    wordBreak: "break-all",
                    color: darkMode ? '#90caf9' : '#1976d2',
                  }}
                >
                  {result.empresaToken}
                </Typography>
                <Tooltip title="Copiar token">
                  <IconButton
                    size="small"
                    onClick={() =>
                      handleCopy(result.empresaToken, "Token copiado!")
                    }
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Link de Cadastro */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ color: "text.secondary", display: 'block', mb: 1 }}>
                Link de cadastro para convidados:
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  bgcolor: darkMode ? 'rgba(0, 0, 0, 0.2)' : '#fff',
                  border: `1px solid ${darkMode ? muiTheme.palette.divider : '#eee'}`,
                  borderRadius: 1,
                  px: 1.5,
                  py: 1,
                }}
              >
                <Typography
                  component="code"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: 13,
                    flex: 1,
                    wordBreak: "break-all",
                    color: darkMode ? '#81c784' : '#2e7d32',
                  }}
                >
                  {window.location.origin}{linkCadastro}
                </Typography>
                <Tooltip title="Copiar link">
                  <IconButton
                    size="small"
                    onClick={() => handleCopy(`${window.location.origin}${linkCadastro}`, "Link copiado!")}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Ações */}
            <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
              <Button
                component={Link}
                href={linkCadastro}
                variant="contained"
                size="small"
                sx={{
                  borderRadius: 2,
                  backgroundColor: successColor,
                  "&:hover": { backgroundColor: darkMode ? '#388e3c' : '#1b5e20' },
                }}
                startIcon={<Business />}
              >
                Abrir página de cadastro
              </Button>

              <Button
                variant="outlined"
                size="small"
                sx={{ borderRadius: 2 }}
                onClick={() => {
                  setName("");
                  setEmail("");
                  setCnpj("");
                  setResult(null);
                  setError("");
                  setView("form");
                }}
              >
                Criar outra empresa
              </Button>
            </Box>
          </Paper>
        )}

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

        {/* Botão Voltar para Login */}
        <Button
          variant="outlined"
          fullWidth
          component={Link}
          href="/login"
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

        {/* Informações */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            mt: 3,
            textAlign: 'center',
            maxWidth: 400,
            fontSize: '0.75rem',
            lineHeight: 1.4,
          }}
        >
          A empresa criada será a responsável por todos os condomínios cadastrados.
        </Typography>

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
                    Gerenciamento Empresarial
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      mb: 3,
                      fontWeight: 500,
                      color: '#e0e0e0',
                    }}
                  >
                    Centralize a gestão de múltiplos condomínios
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
                      '🏢 Multi-condomínios em uma única plataforma',
                      '👥 Controle de acesso por equipes',
                      '📊 Relatórios consolidados',
                      '🔗 Integração com sistemas existentes',
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
                    "Escalabilidade e controle para empresas de gestão condominial"
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
        </Box>
      </Box>

      <Snackbar
        open={!!copied}
        autoHideDuration={2000}
        onClose={() => setCopied("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        TransitionComponent={Zoom}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setCopied("")}
          sx={{ width: '100%' }}
        >
          {copied}
        </Alert>
      </Snackbar>
    </Box>
  );
}