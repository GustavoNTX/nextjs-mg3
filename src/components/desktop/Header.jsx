// src/components/desktop/Header.jsx
"use client";

import React, { useState } from "react";
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
  Button,
  Avatar,
  Box,
  useTheme,
} from "@mui/material";
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";
import { useCondominoUIOptional } from "@/contexts/CondominoUIContext";
import NotificationsModal from "@/components/shared/NotificationsModal";

export default function HeaderDesktop({
  title,
  search,
  setSearch,
  filtro,
  setFiltro,
  sidebarExpanded,
  // novos opcionais — caso o Layout prefira controlar via props
  selectedCondomino,
  onSair,
}) {
  const theme = useTheme();
  const ui = useCondominoUIOptional();

  // Larguras da sidebar
  const sidebarWidth = 60;
  const sidebarExpandedWidth = 240;
  const currentSidebarWidth = sidebarExpanded
    ? sidebarExpandedWidth
    : sidebarWidth;

  // Preferir contexto, mas cair para props caso não exista provider
  const effectiveSearch = ui?.search ?? search ?? "";
  const effectiveSetSearch = ui?.setSearch ?? setSearch ?? (() => {});
  const effectiveFiltro = ui?.filtro ?? filtro ?? "Todos";
  const effectiveSetFiltro = ui?.setFiltro ?? setFiltro ?? (() => {});
  const selected = ui?.selected ?? selectedCondomino ?? null;
  const handleSair = ui?.sair ?? onSair ?? (() => {});

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleOpenNotifications = () => setNotificationsOpen(true);
  const handleCloseNotifications = () => setNotificationsOpen(false);

  return (
    <>
      <AppBar
        position="fixed"
      sx={{
        left: `${currentSidebarWidth}px`,
        width: `calc(100% - ${currentSidebarWidth}px)`,
        height: 64,
        px: 4,
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.background.paper,
        borderBottom: "1px solid",
        borderColor: theme.palette.divider,
        transition: theme.transitions.create(["width", "left"], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}
    >
      <Toolbar disableGutters sx={{ display: "flex", alignItems: "center" }}>
        {/* Centro: título ou nome do condômino com logo */}
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 1,
          }}
        >
          {selected && (
            <Avatar
              src={selected.logoUrl || "/simple-logo.png"}
              sx={{ width: 28, height: 28 }}
            />
          )}
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{ color: "primary.main" }}
          >
            {selected ? selected.name : title}
          </Typography>
        </Box>

        {/* Direita: ou busca+filtro, ou botão Sair */}
        {selected ? (
          <Button variant="outlined" onClick={handleSair}>
            Sair
          </Button>
        ) : (
          <>
            <TextField
              size="small"
              placeholder="Pesquisar pelo nome"
              value={effectiveSearch}
              onChange={(e) => effectiveSetSearch(e.target.value)}
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 260, mr: 4 }}
            />

            <FormControl variant="standard" sx={{ width: 180, mr: 4 }}>
              <InputLabel>Filtrar por tipo</InputLabel>
              <Select
                value={effectiveFiltro}
                onChange={(e) => effectiveSetFiltro(e.target.value)}
                label="Filtrar por tipo"
              >
                <MenuItem value="Todos">Todos</MenuItem>
                <MenuItem value="Residencial">Residencial</MenuItem>
                <MenuItem value="Comercial">Comercial</MenuItem>
              </Select>
            </FormControl>
          </>
        )}
        <IconButton onClick={handleOpenNotifications}>
          <NotificationsIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
      <NotificationsModal open={notificationsOpen} onClose={handleCloseNotifications} />
    </>
  );
}
