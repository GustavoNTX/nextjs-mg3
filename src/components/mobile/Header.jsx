// src/components/mobile/Header.jsx
"use client";

import React, { useMemo, useState } from "react";
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
  Avatar,
  Button,
  Badge,
  useTheme,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";
import { useCondominoUIOptional } from "@/contexts/CondominoUIContext";
import NotificationsModal from "@/components/shared/NotificationsModal";
import { useAtividadesOptional } from "@/contexts/AtividadesContext";
import { adaptAtividadesToTasks } from "@/utils/atividadeDate";
import { isTaskDueToday } from "@/utils/dateLogic";

export default function HeaderMobile({
  title,
  search,
  setSearch,
  filtro,
  setFiltro,
  onMenuClick,
  // opcionais
  selectedCondomino,
  onSair,
}) {
  const theme = useTheme();
  const ui = useCondominoUIOptional();
  const atividades = useAtividadesOptional();
  const empresaItems = atividades?.empresaItems ?? [];

  const effectiveSearch = ui?.search ?? search ?? "";
  const effectiveSetSearch = ui?.setSearch ?? setSearch ?? (() => {});
  const effectiveFiltro = ui?.filtro ?? filtro ?? "Todos";
  const effectiveSetFiltro = ui?.setFiltro ?? setFiltro ?? (() => {});
  const selected = ui?.selected ?? selectedCondomino ?? null;
  const handleSair = ui?.sair ?? onSair ?? (() => {});

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notificationsCount = useMemo(() => {
    const reference = new Date();
    const tasks = adaptAtividadesToTasks(empresaItems);
    return tasks.filter((task) => isTaskDueToday(task, reference)).length;
  }, [empresaItems]);

  const handleOpenNotifications = () => setNotificationsOpen(true);
  const handleCloseNotifications = () => setNotificationsOpen(false);

  return (
    <Box>
      <AppBar
        position="fixed"
        elevation={1}
        sx={{ backgroundColor: theme.palette.background.paper }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={onMenuClick} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>

          {/* Centro: logo + nome (se selecionado) OU título padrão */}
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
              variant="h6"
              fontWeight="bold"
              sx={{ color: "primary.main" }}
            >
              {selected ? selected.name : title}
            </Typography>
          </Box>

          {/* Direita: sino ou Sair */}
          {selected ? (
            <Button color="inherit" onClick={handleSair} size="small">
              Sair
            </Button>
          ) : (
            <></>
          )}
          <IconButton onClick={handleOpenNotifications}>
            <Badge
              color="error"
              badgeContent={notificationsCount}
              overlap="circular"
              invisible={!notificationsCount}
            >
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Toolbar />

      {/* Busca + filtro (somem em modo cronograma) */}
      {!selected && (
        <Box px={2} py={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="Pesquisar pelo nome"
            value={effectiveSearch}
            onChange={(e) => effectiveSetSearch(e.target.value)}
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
              value={effectiveFiltro}
              onChange={(e) => effectiveSetFiltro(e.target.value)}
              label="Filtrar por tipo"
            >
              <MenuItem value="Todos">Todos</MenuItem>
              <MenuItem value="Residencial">Residencial</MenuItem>
              <MenuItem value="Comercial">Comercial</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}
      <NotificationsModal open={notificationsOpen} onClose={handleCloseNotifications} />
    </Box>
  );
}
