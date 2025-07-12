// src/app/cronograma/page.jsx
"use client";

import React, { useState } from "react"; // Remova useRef, useEffect, etc., pois eles foram movidos
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Button,
  Stack,
} from "@mui/material";
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import Layout from "@/components/Layout";

// Importe os componentes de visualização
import ListaAtividades from "@/components/ListaAtividades";
import KanbanBoard from "@/components/KanbanBoard";
import CalendarView from "@/components/CalendarView"; // <--- Importe o novo componente de calendário

export default function CronogramaPage() {
  const [currentTab, setCurrentTab] = useState(0); // Inicia na aba "LISTA"

  const handleTabChange = (event, newValue) => setCurrentTab(newValue);

  return (
    <Layout>
      {/* Seção de cabeçalho (opcional, comentada no seu código original) */}
      {/* <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={4} alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">Cronograma de atividades</Typography>
          <Typography variant="subtitle1" color="text.secondary">Cronograma geral de atividades do condomínio</Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField placeholder="Pesquisar" size="small" InputProps={{ endAdornment: <InputAdornment position="end"><SearchIcon /></InputAdornment> }} />
          <Avatar alt="Condomínio" src="/assets/images/manu-azul.png" />
          <IconButton><NotificationsIcon /></IconButton>
        </Stack>
      </Stack> */}

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="LISTA" />
          <Tab label="CALENDÁRIO" />
          <Tab label="KANBAN" />
        </Tabs>
      </Box>
      <Stack direction="row" justifyContent="flex-end" spacing={2} mb={3}>
        <Button variant="contained" startIcon={<AddIcon />}>Adicionar Atividade</Button>
        <Button variant="outlined">Filtros</Button>
      </Stack>

      <Box>
        {currentTab === 0 && <ListaAtividades />}
        {currentTab === 1 && <CalendarView />} {/* Renderiza o CalendarView aqui */}
        {currentTab === 2 && <KanbanBoard />}
      </Box>
    </Layout>
  );
}