// src/app/cronograma/page.jsx
"use client";

import React, { useState, useRef, useEffect } from "react";
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
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  styled, // Importa a função 'styled' do MUI
} from "@mui/material";
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import Layout from "@/components/Layout";

// Importações do FullCalendar (sem plugins de tema)
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";

// Wrapper estilizado para o FullCalendar
const StyledCalendarWrapper = styled('div')(({ theme }) => ({
  // Estilos gerais
  '.fc': {
    fontFamily: theme.typography.fontFamily,
  },
  // Estilo para os botões do header (se estivessem habilitados)
  '.fc .fc-button': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    border: 'none',
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  // Estilo para bordas da tabela
  '.fc .fc-scrollgrid, .fc .fc-list': {
    borderColor: theme.palette.divider,
  },
  // Estilo para os cabeçalhos dos dias (Seg, Ter, Qua...)
  '.fc .fc-col-header-cell-cushion': {
    color: theme.palette.text.secondary,
    fontWeight: theme.typography.fontWeightMedium,
  },
  // Estilo para o dia de hoje
  '.fc .fc-day-today': {
    backgroundColor: theme.palette.action.hover,
  },
  // Estilo para eventos
  '.fc-event': {
    border: 'none',
    padding: '2px 4px',
    fontSize: '0.75rem',
  },
}));

const mockEvents = [
    { title: "Manutenção Preventiva - Bloco A", date: "2025-07-10" },
    { title: "Assembleia Geral", date: "2025-07-15", color: "#EA6037" },
    { title: "Limpeza da Caixa D'água", start: "2025-07-20", end: "2025-07-22", backgroundColor: "#3788d8" },
];

export default function CronogramaPage() {
  const [currentTab, setCurrentTab] = useState(1);
  const [calendarTitle, setCalendarTitle] = useState("");
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const calendarRef = useRef(null);

  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const newView = currentTab === 0 ? "listWeek" : currentView;
      calendarApi.changeView(newView);
    }
  }, [currentTab, currentView]);

  const handleTabChange = (event, newValue) => setCurrentTab(newValue);
  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setCurrentView(newView);
      if (currentTab !== 1) setCurrentTab(1);
    }
  };
  const handlePrevClick = () => calendarRef.current?.getApi().prev();
  const handleNextClick = () => calendarRef.current?.getApi().next();

  return (
    <Layout>
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
    
          <Tab label="CALENDÁRIO" />
          
        </Tabs>
      </Box>
      <Stack direction="row" justifyContent="flex-end" spacing={2} mb={3}>
        <Button variant="contained" startIcon={<AddIcon />}>Adicionar Atividade</Button>
        <Button variant="outlined">Filtros</Button>
      </Stack>

      <Box>
        {currentTab === 2 && <Typography>Visualização em Kanban (a ser implementada)</Typography>}
        {(currentTab === 0 || currentTab === 1) && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <ToggleButtonGroup exclusive value={currentView} onChange={handleViewChange}>
                <ToggleButton value="dayGridMonth">Mês</ToggleButton>
                <ToggleButton value="timeGridWeek">Semana</ToggleButton>
              </ToggleButtonGroup>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton onClick={handlePrevClick}><ChevronLeftIcon /></IconButton>
                <Typography variant="h6" component="h2" sx={{ minWidth: '150px', textAlign: 'center' }}>{calendarTitle}</Typography>
                <IconButton onClick={handleNextClick}><ChevronRightIcon /></IconButton>
              </Stack>
            </Stack>
            
            <StyledCalendarWrapper>
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]} // REMOVIDO o plugin de tema
                locale={ptBrLocale}
                initialView="dayGridMonth"
                initialDate="2025-07-02"
                headerToolbar={false}
                events={mockEvents}
                datesSet={(dateInfo) => setCalendarTitle(dateInfo.view.title)}
                eventClick={(info) => alert(`Atividade Clicada: ${info.event.title}`)}
                dateClick={(info) => alert(`Data Clicada: ${info.dateStr}`)}
              />
            </StyledCalendarWrapper>
          </Paper>
        )}
      </Box>
    </Layout>
  );
}