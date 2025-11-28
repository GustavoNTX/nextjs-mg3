// src/app/cadastro/[token]/page.jsx
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
  CircularProgress, // spinner
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function RegisterWithTokenPage() {
  const router = useRouter();
  const routeParams = useParams(); // { token: string | string[] }
  const token = Array.isArray(routeParams?.token)
    ? routeParams.token[0]
    : routeParams?.token ?? "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [empresaName, setEmpresaName] = useState("");
  const [checkingToken, setCheckingToken] = useState(true);

  // estado de loading para bloquear botão e inputs
  const [loading, setLoading] = useState(false);

  const handleClickShowPassword = () => setShowPassword((v) => !v);
  const handleMouseDownPassword = (event) => event.preventDefault();

  // valida o token e pega o nome da empresa
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
        console.log("consultar empresa: ", res, data);

        if (!res.ok) {
          throw new Error(
            data?.error || "Empresa não encontrada para esse link."
          );
        }

        setEmpresaName(data.name);
      } catch (err) {
        console.error("consultar empresa: ", err);
        setError(err.message);
      } finally {
        setCheckingToken(false);
      }
    })();
  }, [token]);

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true); // INÍCIO DO LOADING

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

      // aqui você decidiu só ir pro login depois
      router.push("/login");
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false); // FIM DO LOADING
    }
  };

  const handleReturnLogin = (event) => {
    event.preventDefault();
    if (loading) return; // evita clicar enquanto está carregando
    setError("");
    router.push("/login");
  };

  const formDisabled = (!empresaName && !checkingToken) || loading; // trava se token inválido OU loading

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        height: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      {/* Lado esquerdo – igual ao /cadastro normal */}
      <Box
        component="form"
        onSubmit={handleRegister}
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

        <Typography variant="h5" sx={{ mb: 1, fontWeight: "bold" }}>
          Crie sua conta
        </Typography>

        {/* Nome da empresa / status do token */}
        {checkingToken && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Validando link da empresa...
          </Typography>
        )}

        {!checkingToken && empresaName && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Para a empresa: <strong>{empresaName}</strong>
          </Typography>
        )}

        {!checkingToken && !empresaName && (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            {error || "Token inválido ou empresa não encontrada."}
          </Typography>
        )}

        <TextField
          placeholder="Digite seu nome completo"
          variant="outlined"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          sx={{ maxWidth: 400 }}
          disabled={formDisabled}
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
          sx={{ maxWidth: 400 }}
          disabled={formDisabled}
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
          sx={{ maxWidth: 400 }}
          disabled={formDisabled}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="Mostrar ou ocultar senha"
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                  disabled={formDisabled}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {error && empresaName && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={formDisabled}
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
          {loading ? (
            <CircularProgress size={26} sx={{ color: "#fff" }} />
          ) : (
            "CADASTRAR"
          )}
        </Button>

        <Divider sx={{ my: 2, width: "100%", maxWidth: 400 }}>OU</Divider>

        <Button
          variant="outlined"
          fullWidth
          disabled={loading}
          sx={{
            maxWidth: 400,
            borderRadius: 2,
            padding: "10px 0",
          }}
          onClick={handleReturnLogin}
        >
          JÁ TENHO UMA CONTA
        </Button>
      </Box>

      {/* Lado direito – mesma imagem do /cadastro */}
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
    </Box>
  );
}
