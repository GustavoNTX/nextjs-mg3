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
  Button,
  useTheme,
  useMediaQuery,
  Divider,
} from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Edit as EditIcon,
  Share as ShareIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";

const StyledCalendarWrapper = styled("div")(({ theme }) => ({
  ".fc": { fontFamily: theme.typography.fontFamily },
  ".fc-event": { border: "none", padding: "2px 4px", fontSize: "0.75rem" },
}));

// Eventos mockados
const mockEvents = [
  {
    id: "1",
    title: "Manutenção Preventiva - Bloco A",
    date: "2025-08-02",
    tags: ["Condomínio", "Melhoria", "sem orçamento"],
    priority: "low",
    status: "a fazer",
  },
  {
    id: "2",
    title: "Assembleia Geral",
    date: "2025-08-02",
    tags: ["Condomínio", "Reunião"],
    priority: "medium",
    status: "em andamento",
  },
];

export default function CalendarView() {
  const [calendarTitle, setCalendarTitle] = useState("");
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [selectedDate, setSelectedDate] = useState(null);

  const calendarRef = useRef(null);
  const detailsRef = useRef(null);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api) api.changeView(currentView);
  }, [currentView]);

  const handleEventClick = (info) => {
    const eventDate = info.event.startStr.split("T")[0];
    setSelectedDate(eventDate);

    // No mobile, rolar para os detalhes
    if (isSmallScreen && detailsRef.current) {
      setTimeout(() => detailsRef.current.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const handlePrevClick = () => calendarRef.current?.getApi().prev();
  const handleNextClick = () => calendarRef.current?.getApi().next();

  const activitiesOfDay = selectedDate
    ? mockEvents.filter((ev) => ev.date === selectedDate)
    : [];

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      {/* Header */}
      <Stack
        direction={isSmallScreen ? "column" : "row"}
        justifyContent="space-between"
        alignItems={isSmallScreen ? "flex-start" : "center"}
        mb={2}
        spacing={isSmallScreen ? 2 : 0}
      >
        <ToggleButtonGroup
          exclusive
          value={currentView}
          onChange={(_, v) => v && setCurrentView(v)}
        >
          <ToggleButton value="dayGridMonth">Mês</ToggleButton>
          <ToggleButton value="timeGridWeek">Semana</ToggleButton>
        </ToggleButtonGroup>

        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={handlePrevClick}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6" sx={{ minWidth: "150px", textAlign: "center" }}>
            {calendarTitle}
          </Typography>
          <IconButton onClick={handleNextClick}>
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </Stack>

      {/* Layout responsivo: lado a lado no desktop, empilhado no mobile */}
      <Stack direction={isSmallScreen ? "column" : "row"} spacing={2}>
        <Box flex={1}>
          <StyledCalendarWrapper>
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              locale={ptBrLocale}
              initialView="dayGridMonth"
              headerToolbar={false}
              events={mockEvents}
              datesSet={(info) => setCalendarTitle(info.view.title)}
              eventClick={handleEventClick}
            />
          </StyledCalendarWrapper>
        </Box>

        {/* Detalhes só aparecem quando há seleção */}
        {selectedDate && (
          <Box
            ref={detailsRef}
            flex={1}
            sx={{
              maxHeight: isSmallScreen ? "auto" : "80vh",
              overflowY: isSmallScreen ? "visible" : "auto",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Atividades em {new Date(selectedDate).toLocaleDateString("pt-BR")}
            </Typography>

            {activitiesOfDay.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Nenhuma atividade para este dia.
              </Typography>
            ) : (
              activitiesOfDay.map((activity) => (
                <Paper key={activity.id} sx={{ p: 2, mb: 2, border: "1px solid #ddd" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" fontWeight="bold">
                      {activity.title}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <IconButton size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small">
                        <ShareIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="body2">
                    <strong>Tags:</strong> {activity.tags.join(", ")}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Prioridade:</strong> {activity.priority}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {activity.status}
                  </Typography>

                  <Stack direction="row" spacing={1} mt={2}>
                    <Button variant="contained" size="small">
                      Iniciar
                    </Button>
                    <Button variant="contained" size="small">
                      Concluir
                    </Button>
                  </Stack>
                </Paper>
              ))
            )}
          </Box>
        )}
      </Stack>
    </Paper>
  );
}