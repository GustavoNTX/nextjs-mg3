"use client";

import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  useTheme
} from "@mui/material";
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon
} from "@mui/icons-material";

export default function HeaderDesktop({
  search,
  setSearch,
  filtro,
  setFiltro
}) {
  const theme = useTheme();

  return (
    <AppBar
      position="fixed"
      color="transparent"
      elevation={0}
      sx={{
        height: 64,
        left: "60px",
        width: "calc(100% - 60px)",
        px: 4,
        zIndex: theme.zIndex.drawer + 2,
      }}
    >
      <Toolbar disableGutters sx={{ display: "flex", alignItems: "center" }}>
        {/* Título centralizado */}
        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{ flexGrow: 1, textAlign: "center" }}
        >
          Selecione o condomínio
        </Typography>

        {/* Campo de busca */}
        <TextField
          size="small"
          placeholder="Pesquisar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          variant="outlined"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: 240, mr: 4 }}
        />

        {/* Filtro */}
        <FormControl variant="standard" sx={{ width: 160, mr: 4 }}>
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

        {/* Ícone de notificação */}
        <IconButton>
          <NotificationsIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
