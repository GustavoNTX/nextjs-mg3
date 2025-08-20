// src/components/CalendarView.jsx
"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
  CircularProgress,
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
import { useAtividades } from "@/contexts/AtividadesContext";

const StyledCalendarWrapper = styled("div")(({ theme }) => ({
  ".fc": { fontFamily: theme.typography.fontFamily },
  ".fc-event": { border: "none", padding: "2px 4px", fontSize: "0.75rem" },
}));

const dateOnly = (d) => {
  if (!d) return null;
  const dt = typeof d === "string" ? new Date(d) : d;
  // YYYY-MM-DD para evento all-day
  return new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()))
    .toISOString()
    .slice(0, 10);
};

const statusText = (b) => (b ? "Em andamento" : "Pendente");

export default function CalendarView() {
  const { items, loading, error, updateAtividade } = useAtividades();

  const [calendarTitle, setCalendarTitle] = useState("");
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [selectedDate, setSelectedDate] = useState(null);

  const calendarRef = useRef(null);
  const detailsRef = useRef(null);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  // muda a view programaticamente
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api) api.changeView(currentView);
  }, [currentView]);

  // mapeia atividades -> eventos do FullCalendar
  const events = useMemo(() => {
    return items.map((a) => {
      const allDayStart = dateOnly(a.createdAt); // V2: trocar para expectedDate/startAt
      return {
        id: a.id,
        title: a.name,
        start: allDayStart, // all-day
        allDay: true,
        extendedProps: {
          atividade: a,
          prioridade: a.prioridade,
          statusBool: a.status,
        },
      };
    });
  }, [items]);

  const handleEventClick = (info) => {
    const clicked = info.event.start; // Date
    setSelectedDate(dateOnly(clicked));
    if (isSmallScreen && detailsRef.current) {
      setTimeout(() => detailsRef.current.scrollIntoView({ behavior: "smooth" }), 120);
    }
  };

  const handlePrevClick = () => calendarRef.current?.getApi().prev();
  const handleNextClick = () => calendarRef.current?.getApi().next();

  const activitiesOfDay = useMemo(() => {
    if (!selectedDate) return [];
    return items.filter((a) => dateOnly(a.createdAt) === selectedDate);
  }, [items, selectedDate]);

  const onStart = useCallback(
    async (id) => {
      await updateAtividade(id, { status: true });
    },
    [updateAtividade]
  );

  const onFinish = useCallback(
    async (id) => {
      // schema atual não tem “concluído”; usando false = pendente/histórico
      await updateAtividade(id, { status: false });
    },
    [updateAtividade]
  );

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
        <ToggleButtonGroup exclusive value={currentView} onChange={(_, v) => v && setCurrentView(v)}>
          <ToggleButton value="dayGridMonth">Mês</ToggleButton>
          <ToggleButton value="timeGridWeek">Semana</ToggleButton>
          <ToggleButton value="listWeek">Lista</ToggleButton>
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

      {/* Loading / Error states */}
      {loading && !items.length ? (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Stack>
      ) : error ? (
        <Typography color="error" sx={{ textAlign: "center", my: 4 }}>
          {error}
        </Typography>
      ) : (
        <Stack direction={isSmallScreen ? "column" : "row"} spacing={2}>
          <Box flex={1}>
            <StyledCalendarWrapper>
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                locale={ptBrLocale}
                initialView="dayGridMonth"
                headerToolbar={false}
                events={events}
                datesSet={(info) => setCalendarTitle(info.view.title)}
                eventClick={handleEventClick}
                // (opcional) estilizar eventos conforme status/priority
                eventContent={(arg) => {
                  const st = arg.event.extendedProps?.statusBool;
                  const pri = arg.event.extendedProps?.prioridade;
                  return (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: st ? "#2d96ff" : "#FF5959",
                        }}
                      />
                      <span>{arg.event.title}</span>
                      {pri && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            opacity: 0.75,
                            marginLeft: "auto",
                          }}
                        >
                          {pri}
                        </span>
                      )}
                    </div>
                  );
                }}
              />
            </StyledCalendarWrapper>
          </Box>

          {/* Detalhes do dia selecionado */}
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
                activitiesOfDay.map((a) => (
                  <Paper key={a.id} sx={{ p: 2, mb: 2, border: "1px solid #ddd" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle1" fontWeight="bold">
                        {a.name}
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
                      <strong>Local:</strong> {a.location || "—"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Prioridade:</strong> {a.prioridade || "—"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong> {statusText(a.status)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Equipe:</strong> {a.equipe || "—"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Tipo:</strong> {a.tipoAtividade || "—"}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Observações:</strong> {a.observacoes || "—"}
                    </Typography>

                    <Stack direction="row" spacing={1} mt={2}>
                      {a.status ? (
                        <Button variant="contained" size="small" onClick={() => onFinish(a.id)}>
                          Concluir
                        </Button>
                      ) : (
                        <Button variant="contained" size="small" onClick={() => onStart(a.id)}>
                          Iniciar
                        </Button>
                      )}
                    </Stack>
                  </Paper>
                ))
              )}
            </Box>
          )}
        </Stack>
      )}
    </Paper>
  );
}
