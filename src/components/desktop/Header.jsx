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
  useTheme,
} from "@mui/material";
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";

// Receba a propriedade 'sidebarExpanded' para saber o estado da sidebar
export default function HeaderDesktop({
  title,
  search,
  setSearch,
  filtro,
  setFiltro,
  sidebarExpanded,
}) {
  const theme = useTheme();

  // Define as larguras da sidebar para o cálculo dinâmico
  const sidebarWidth = 60;
  const sidebarExpandedWidth = 240;
  const currentSidebarWidth = sidebarExpanded
    ? sidebarExpandedWidth
    : sidebarWidth;

  return (
    <AppBar
      position="fixed"
      // Removido color="transparent" e elevation={0} para dar um fundo padrão
      sx={{
        // A posição e a largura agora são dinâmicas
        left: `${currentSidebarWidth}px`,
        width: `calc(100% - ${currentSidebarWidth}px)`,
        height: 64,
        px: 4,
        zIndex: theme.zIndex.drawer + 1, // zIndex ajustado se necessário
        backgroundColor: theme.palette.background.paper, // Fundo branco ou de papel
        borderBottom: "1px solid", // Adiciona uma linha sutil na parte inferior
        borderColor: theme.palette.divider,
        transition: theme.transitions.create(["width", "left"], {
          // Adiciona transição
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}
    >
      <Toolbar disableGutters sx={{ display: "flex", alignItems: "center" }}>
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

        <IconButton>
          <NotificationsIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
