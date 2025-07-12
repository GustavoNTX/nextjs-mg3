"use client";

import React from "react";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";

export default function HeaderMobile({
  title,
  search,
  setSearch,
  filtro,
  setFiltro,
  onMenuClick,
}) {
  const theme = useTheme();

  return (
    <Box>
      {/* 1) AppBar com menu e sino */}
      <AppBar
        position="fixed"
        elevation={1} // Adiciona uma leve sombra
        sx={{ backgroundColor: theme.palette.background.paper }} // Garante o fundo
      >
        <Toolbar>
          <IconButton edge="start" onClick={onMenuClick} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{
              flexGrow: 1,
              textAlign: "center",
              color: "primary.main", // Aplicando a cor primária do tema
            }}
          >
            {title}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton>
            <NotificationsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Toolbar />

      {/* 3) Busca + filtro */}
      <Box px={2} py={2}>
        <TextField
          fullWidth
          size="small"
          placeholder="Pesquisar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth variant="standard">
          <InputLabel>Filtrar por tipo</InputLabel>
          <Select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            label="Filtrar por tipo"
          >
            <MenuItem value="Todos">Todos</MenuItem>
            <MenuItem value="Residencial">Residencial</MenuItem>
            <MenuItem value="Comercial">Comercial</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}
