// src/app/cadastro/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TextField,
  Button,
  Box,
  Typography,
  Divider,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleClickShowPassword = () => setShowPassword((v) => !v);
  const handleMouseDownPassword = (event) => event.preventDefault();

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao criar conta.");
      }

      // login automático após cadastro
      login(data);
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  };

  const handleReturnLogin = (event) => {
    event.preventDefault();
    setError("");
    try {
      router.push("/login");
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        height: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
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
        <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
          Crie sua conta
        </Typography>

        <TextField
          placeholder="Digite seu nome completo"
          variant="outlined"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          sx={{ maxWidth: 400 }}
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

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        <Button
          type="submit"
          variant="contained"
          fullWidth
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
          CADASTRAR
        </Button>

        <Divider sx={{ my: 2, width: "100%", maxWidth: 400 }}>OU</Divider>
        <Button
          variant="outlined"
          fullWidth
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
