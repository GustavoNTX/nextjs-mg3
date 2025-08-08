// src/components/CalendarView.jsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  useTheme,     // Importe useTheme para acessar os breakpoints
  useMediaQuery // Importe useMediaQuery para detectar o tamanho da tela
} from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

// Importações do FullCalendar
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

// Eventos mockados para o calendário
const mockEvents = [
    { title: "Manutenção Preventiva - Bloco A", date: "2025-07-10" },
    { title: "Assembleia Geral", date: "2025-07-15", color: "#EA6037" },
    { title: "Limpeza da Caixa D'água", start: "2025-07-20", end: "2025-07-22", backgroundColor: "#3788d8" },
    { title: "Inspeção de Telhado", date: "2025-07-28" },
    { title: "Dedetização Área Comum", date: "2025-08-05", color: "#6a1b9a" },
];

const CalendarView = () => {
  const [calendarTitle, setCalendarTitle] = useState("");
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const calendarRef = useRef(null);

  const theme = useTheme();
  // Detecta se a tela é pequena (por exemplo, abaixo de 'md')
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(currentView);
    }
  }, [currentView]);

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setCurrentView(newView);
    }
  };

  const handlePrevClick = () => calendarRef.current?.getApi().prev();
  const handleNextClick = () => calendarRef.current?.getApi().next();

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack
        // Em telas pequenas, empilha os itens verticalmente
        direction={isSmallScreen ? "column" : "row"}
        // Em telas pequenas, alinha os itens ao início (esquerda)
        justifyContent="space-between"
        alignItems={isSmallScreen ? "flex-start" : "center"}
        mb={2}
        // Adiciona um espaçamento maior entre os itens quando empilhados verticalmente
        spacing={isSmallScreen ? 2 : 0}
      >
        {/* ToggleButtonGroup para visualização (Mês/Semana) */}
        <ToggleButtonGroup exclusive value={currentView} onChange={handleViewChange}>
          <ToggleButton value="dayGridMonth">Mês</ToggleButton>
          <ToggleButton value="timeGridWeek">Semana</ToggleButton>
        </ToggleButtonGroup>

        {/* Stack para navegação (botões de chevron e título) */}
        <Stack
          direction="row"
          alignItems="center"
          // Espaçamento entre os elementos (chevrons e título)
          spacing={1}
          // Garante que o grupo de navegação ocupe largura total em telas pequenas
          sx={{ width: isSmallScreen ? '100%' : 'auto', justifyContent: isSmallScreen ? 'space-between' : 'flex-end' }}
        >
          <IconButton onClick={handlePrevClick}><ChevronLeftIcon /></IconButton>
          <Typography
            variant="h6"
            component="h2"
            sx={{
              minWidth: '150px',
              textAlign: 'center',
              // Reduz o tamanho da fonte em telas pequenas para economizar espaço
              fontSize: isSmallScreen ? '1rem' : '1.25rem',
              // Permite que o texto do título quebre se for muito longo
              whiteSpace: isSmallScreen ? 'normal' : 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flexShrink: 1, // Permite que o Typography encolha
            }}
          >
            {calendarTitle}
          </Typography>
          <IconButton onClick={handleNextClick}><ChevronRightIcon /></IconButton>
        </Stack>
      </Stack>

      <StyledCalendarWrapper>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          locale={ptBrLocale}
          initialView="dayGridMonth"
          initialDate="2025-07-02"
          headerToolbar={false}
          events={mockEvents}
          datesSet={(dateInfo) => setCalendarTitle(dateInfo.view.title)}
          eventClick={(info) => alert(`Atividade Clicada: ${info.event.title} em ${info.event.startStr}`)}
          dateClick={(info) => alert(`Data Clicada: ${info.dateStr}`)}
        />
      </StyledCalendarWrapper>
    </Paper>
  );
};

export default CalendarView;