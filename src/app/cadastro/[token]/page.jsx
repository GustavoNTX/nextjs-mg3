"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function RegisterWithTokenPage() {
  const router = useRouter();
  // /cadastro/[token]
  const routeParams = useParams(); // { token: string | string[] }
  const token = Array.isArray(routeParams?.token)
    ? routeParams.token[0]
    : routeParams?.token ?? "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`/api/register/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao criar conta.");

      // redirecione para login, dashboard ou faça login automático se tiver contexto
      router.push("/login");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 4,
      }}
    >
      <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
        Crie sua conta
      </Typography>

      <Typography variant="body2" sx={{ mb: 1 }}>
        Empresa (token): <strong>{token}</strong>
      </Typography>

      <Box
        component="form"
        onSubmit={handleRegister}
        sx={{ width: "100%", maxWidth: 420 }}
      >
        <TextField
          placeholder="Seu nome"
          variant="outlined"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <TextField
          placeholder="Seu e-mail"
          type="email"
          variant="outlined"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <TextField
          placeholder="Sua senha"
          type={showPassword ? "text" : "password"}
          variant="outlined"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="Mostrar ou ocultar senha"
                  onClick={() => setShowPassword((v) => !v)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {error && (
          <Typography color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{
            mt: 2,
            backgroundColor: "#545454",
            color: "#fff",
            fontWeight: "bold",
            borderRadius: 2,
          }}
        >
          CADASTRAR
        </Button>

        <Divider sx={{ my: 2 }}>OU</Divider>

        <Button
          variant="outlined"
          fullWidth
          onClick={() => router.push("/login")}
        >
          JÁ TENHO UMA CONTA
        </Button>
      </Box>
    </Box>
  );
}
