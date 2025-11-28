// src/app/empresas/page.jsx
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
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CircularProgress from "@mui/material/CircularProgress";

export default function EmpresasPage() {
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");

  const [emailError, setEmailError] = useState("");      // <-- erro visual email
  const [cnpjError, setCnpjError] = useState("");        // <-- erro visual CNPJ

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [submitting, setSubmitting] = useState(false); // controla loading do botão
  const [view, setView] = useState("form");

  // ---------------------------
  // Validação de email
  // ---------------------------
  const validateEmail = (value) => {
    if (!value.includes("@") || !value.includes(".")) {
      setEmailError("Digite um e-mail válido");
    } else {
      setEmailError("");
    }
  };

  // ---------------------------
  // Máscara e validação de CNPJ
  // ---------------------------
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

    // Se houver erros visuais, bloqueia submit
    if (emailError || cnpjError) return;

    setSubmitting(true); // ativa loading

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

      // tenta parsear JSON, mas sem quebrar se vier vazio no 500
      try {
        data = await res.json();
      } catch {}

      if (!res.ok) {
        const backendMsg =
          data?.error ||
          (data?.issues?.fieldErrors &&
            Object.values(data.issues.fieldErrors).flat().join(", ")) ||
          "Erro ao criar empresa";

        // 5xx => esconde formulário e mostra painel de erro
        if (res.status >= 500) {
          setError(backendMsg);
          setView("error");
          return;
        }

        // 4xx => mantém form aberto com mensagem
        throw new Error(backendMsg);
      }

      // 200 OK -> mostra resultado e esconde formulário
      setResult(data);
      setView("result");
    } catch (err) {
      setError(err.message || "Falha ao criar empresa");
      setView("form");
      console.error(err);
    } finally {
      setSubmitting(false); // desativa loading
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

  const linkCadastro = result ? `/cadastro/${result.empresaToken}` : "";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        height: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      {/* Lado esquerdo: formulário (mesmo layout da tela de cadastro) */}
      <Box
        component="form"
        onSubmit={handleCreate}
        sx={{
          flex: 1,
          padding: { xs: 4, md: 6 },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#ffffff",
        }}
      >
        <Box mb={2}>
          <img src="/simple-logo.png" alt="Logo" style={{ width: 100 }} />
        </Box>

        {/* FORM - só aparece quando view === 'form' */}
        {view === "form" && (
          <>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
              Criar empresa
            </Typography>

            <TextField
              placeholder="Nome da empresa"
              variant="outlined"
              fullWidth
              margin="normal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              sx={{ maxWidth: 400 }}
            />

            {/* EMAIL COM VALIDAÇÃO */}
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
              sx={{ maxWidth: 400 }}
            />

            {/* CNPJ COM MÁSCARA */}
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
              sx={{ maxWidth: 400 }}
            />

            {error && (
              <Typography
                color="error"
                sx={{ mt: 1, maxWidth: 400, textAlign: "center" }}
              >
                {error}
              </Typography>
            )}

            {/* Botão com loading */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting}
              sx={{
                mt: 3,
                mb: 2,
                backgroundColor: "#545454",
                color: "#ffffff",
                fontWeight: "bold",
                maxWidth: 400,
                borderRadius: 2,
                padding: "10px 0",
                "&:hover": { backgroundColor: "#333" },
              }}
            >
              {submitting ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    justifyContent: "center",
                  }}
                >
                  <CircularProgress size={20} color="inherit" />
                  CRIANDO...
                </Box>
              ) : (
                "CRIAR EMPRESA"
              )}
            </Button>
          </>
        )}

        {/* ERRO 500 */}
        {view === "error" && (
          <Box sx={{ width: "100%", maxWidth: 400 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
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
                backgroundColor: "#545454",
                "&:hover": { backgroundColor: "#333" },
              }}
            >
              Tentar novamente
            </Button>
          </Box>
        )}

        {/* RESULTADO */}
        {view === "result" && result && (
          <Box
            sx={{
              width: "100%",
              maxWidth: 400,
              p: 2,
              borderRadius: 2,
              backgroundColor: "#f9f9f9",
              border: "1px solid #eee",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
              Empresa criada
            </Typography>

            {/* TOKEN */}
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Token da empresa
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  bgcolor: "#fff",
                  border: "1px solid #eee",
                  borderRadius: 1,
                  px: 1.5,
                  py: 1,
                  mt: 0.5,
                }}
              >
                <Typography
                  component="code"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: 13,
                    flex: 1,
                    wordBreak: "break-all",
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
                    <ContentCopyIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* LINK */}
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Link de cadastro
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  bgcolor: "#fff",
                  border: "1px solid #eee",
                  borderRadius: 1,
                  px: 1.5,
                  py: 1,
                  mt: 0.5,
                }}
              >
                <Typography
                  component="code"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: 13,
                    flex: 1,
                    wordBreak: "break-all",
                  }}
                >
                  {linkCadastro}
                </Typography>

                <Tooltip title="Copiar link">
                  <IconButton
                    size="small"
                    onClick={() => handleCopy(linkCadastro, "Link copiado!")}
                  >
                    <ContentCopyIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
              <Button
                component={Link}
                href={linkCadastro}
                variant="outlined"
                size="small"
                sx={{ borderRadius: 2 }}
              >
                Abrir página de cadastro
              </Button>

              <Button
                variant="text"
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
                Criar outra
              </Button>
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2, width: "100%", maxWidth: 400 }}>OU</Divider>

        <Button
          variant="outlined"
          fullWidth
          sx={{ maxWidth: 400, borderRadius: 2, padding: "10px 0" }}
          component={Link}
          href="/login"
        >
          VOLTAR AO LOGIN
        </Button>
      </Box>

      {/* Lado direito: imagem */}
      <Box
        sx={{
          flex: 1,
          backgroundImage: "url(/town-image.svg)",
          backgroundRepeat: "no-repeat",
          backgroundSize: { xs: "contain", md: "cover" },
          backgroundPosition: "center",
          height: { xs: 250, md: "auto" },
          minHeight: { xs: 250, md: "100vh" },
          backgroundColor: "#f5f5f5",
        }}
      />

      {/* Snackbar de cópia */}
      <Snackbar
        open={!!copied}
        autoHideDuration={2000}
        onClose={() => setCopied("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setCopied("")}
        >
          {copied}
        </Alert>
      </Snackbar>
    </Box>
  );
}
