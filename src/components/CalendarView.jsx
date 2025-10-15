// src/components/CalendarView.jsx
"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Box, Typography, IconButton, Stack, ToggleButtonGroup, ToggleButton,
  Paper, Button, useTheme, useMediaQuery, Divider, CircularProgress
} from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  Today as TodayIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { useAtividades } from "@/contexts/AtividadesContext";

/* ---------- estilos ---------- */
const StyledCalendarWrapper = styled("div")(({ theme }) => ({
  ".fc": { fontFamily: theme.typography.fontFamily },
  ".fc-event": { border: "none", padding: "2px 4px", fontSize: "0.75rem" },
  ".fc-daygrid-event-dot": { display: "none" },
}));

/* ---------- helpers ---------- */
const toDate = (v) => (v ? new Date(v) : null);
const isSameDay = (a, b) =>
  a && b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const normalizeStatus = (s) => {
  if (s === true || s === 1 || s === "EM_ANDAMENTO" || s === "IN_PROGRESS") return true;
  if (s === false || s === 0 || s === "PENDENTE" || s === "PENDING") return false;
  return false;
};
const statusText = (b) => (b ? "Em andamento" : "Pendente");
const priColor = (p) => {
  const s = String(p || "").toUpperCase();
  if (s.includes("URG")) return "#b71c1c";
  if (s.includes("ALTO")) return "#d32f2f";
  if (s.includes("MÉDIO") || s.includes("MEDIO")) return "#ed6c02";
  if (s.includes("BAIXO")) return "#2e7d32";
  return "#1976d2";
};

/** escolhe datas da atividade:
 * prioridade: expectedDate > startAt > createdAt (fallback)
 */
const pickStart = (a) => toDate(a.expectedDate) || toDate(a.startAt) || toDate(a.createdAt);
const pickEnd   = (a) => toDate(a.endAt) || toDate(a.completedAt) || null;
const isAllDay  = (a) => !!a.expectedDate && !a.startAt && !a.endAt; // simplificado e útil

/** Datas all-day precisam ser yyyy-mm-dd; para FullCalendar basta passar Date sem hora com allDay:true */
const dateOnly = (d) => {
  if (!d) return null;
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return x;
};

/* ---------- componente ---------- */
export default function CalendarView({ onEdit }) {
  const { items, loading, error, updateAtividade } = useAtividades();

  const [calendarTitle, setCalendarTitle] = useState("");
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [selectedDate, setSelectedDate] = useState(null);

  const calendarRef = useRef(null);
  const detailsRef = useRef(null);

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));

  // muda view
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api) api.changeView(currentView);
  }, [currentView]);

  // eventos
  const events = useMemo(() => {
    return items.map((a) => {
      const start = pickStart(a);
      const end = pickEnd(a);
      const allDay = isAllDay(a);

      return {
        id: a.id,
        title: a.name,
        start: allDay ? dateOnly(start) : start,
        end: allDay ? undefined : end || undefined, // end exclusivo; opcional
        allDay,
        editable: true,       // permite drag/resize
        durationEditable: true,
        extendedProps: {
          atividade: a,
          prioridade: a.prioridade,
          statusBool: normalizeStatus(a.status),
        },
      };
    });
  }, [items]);

  const handleDatesSet = (info) => setCalendarTitle(info.view.title);

  const handleEventClick = (info) => {
    const d = info.event.start;
    setSelectedDate(dateOnly(d));
    if (isSmall && detailsRef.current) {
      setTimeout(() => detailsRef.current.scrollIntoView({ behavior: "smooth" }), 120);
    }
  };

  const goPrev = () => calendarRef.current?.getApi().prev();
  const goNext = () => calendarRef.current?.getApi().next();
  const goToday = () => {
    calendarRef.current?.getApi().today();
    const view = calendarRef.current?.getApi().view;
    if (view) setCalendarTitle(view.title);
  };

  // lista do dia selecionado
  const activitiesOfDay = useMemo(() => {
    if (!selectedDate) return [];
    return items.filter((a) => isSameDay(pickStart(a), selectedDate));
  }, [items, selectedDate]);

  // Arrastar evento (muda dia/horário)
  const handleEventDrop = async (arg) => {
    const { event } = arg;
    const a = event.extendedProps?.atividade;
    if (!a) return;

    try {
      if (event.allDay) {
        // mover all-day -> ajusta expectedDate
        await updateAtividade(a.id, { expectedDate: event.start });
      } else {
        // mover com hora -> ajusta startAt/endAt
        await updateAtividade(a.id, {
          startAt: event.start,
          endAt: event.end || null,
        });
      }
    } catch (e) {
      console.error(e);
      arg.revert(); // volta posição se deu erro
    }
  };

  // Redimensionar (altera duração)
  const handleEventResize = async (arg) => {
    const { event } = arg;
    const a = event.extendedProps?.atividade;
    if (!a) return;

    try {
      await updateAtividade(a.id, {
        startAt: event.start,
        endAt: event.end || null,
      });
    } catch (e) {
      console.error(e);
      arg.revert();
    }
  };

  const onStart = useCallback(async (id) => {
    await updateAtividade(id, { status: true, startAt: new Date() });
  }, [updateAtividade]);

  const onFinish = useCallback(async (id) => {
    await updateAtividade(id, { status: false, completedAt: new Date() });
  }, [updateAtividade]);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      {/* Header */}
      <Stack
        direction={isSmall ? "column" : "row"}
        justifyContent="space-between"
        alignItems={isSmall ? "flex-start" : "center"}
        mb={2}
        spacing={isSmall ? 2 : 0}
      >
        <ToggleButtonGroup exclusive value={currentView} onChange={(_, v) => v && setCurrentView(v)}>
          <ToggleButton value="dayGridMonth">Mês</ToggleButton>
          <ToggleButton value="timeGridWeek">Semana</ToggleButton>
          <ToggleButton value="listWeek">Lista</ToggleButton>
        </ToggleButtonGroup>

        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={goPrev}><ChevronLeftIcon /></IconButton>
          <Typography variant="h6" sx={{ minWidth: 160, textAlign: "center" }}>
            {calendarTitle}
          </Typography>
          <IconButton onClick={goNext}><ChevronRightIcon /></IconButton>
          <Button size="small" startIcon={<TodayIcon />} onClick={goToday}>Hoje</Button>
        </Stack>
      </Stack>

      {/* Estados */}
      {loading && !items.length ? (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Stack>
      ) : error ? (
        <Typography color="error" sx={{ textAlign: "center", my: 4 }}>
          {error}
        </Typography>
      ) : (
        <Stack direction={isSmall ? "column" : "row"} spacing={2}>
          {/* Calendário */}
          <Box flex={1}>
            <StyledCalendarWrapper>
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                locale={ptBrLocale}
                initialView="dayGridMonth"
                headerToolbar={false}
                events={events}
                datesSet={handleDatesSet}
                eventClick={handleEventClick}
                editable
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                eventContent={(arg) => {
                  const st = normalizeStatus(arg.event.extendedProps?.statusBool);
                  const pri = arg.event.extendedProps?.prioridade;
                  const dot = st ? "#2d96ff" : "#FF5959";
                  const tag = priColor(pri);
                  return (
                    <div style={{ display: "flex", gap: 6, alignItems: "center", width: "100%" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {arg.event.title}
                      </span>
                      {pri && (
                        <span
                          style={{
                            marginLeft: "auto",
                            fontSize: "0.7rem",
                            padding: "0 6px",
                            borderRadius: 10,
                            background: tag + "22",
                            border: `1px solid ${tag}55`,
                          }}
                        >
                          {String(pri).toUpperCase()}
                        </span>
                      )}
                    </div>
                  );
                }}
              />
            </StyledCalendarWrapper>
          </Box>

          {/* Detalhes do dia */}
          {selectedDate && (
            <Box
              ref={detailsRef}
              flex={1}
              sx={{ maxHeight: isSmall ? "auto" : "80vh", overflowY: isSmall ? "visible" : "auto" }}
            >
              <Typography variant="h6" gutterBottom>
                Atividades em {selectedDate.toLocaleDateString("pt-BR")}
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
                        <IconButton size="small" onClick={() => onEdit?.(a)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small">
                          <ShareIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>

                    <Divider sx={{ my: 1 }} />

                    <Typography variant="body2"><strong>Local:</strong> {a.location || "—"}</Typography>
                    <Typography variant="body2"><strong>Prioridade:</strong> {a.prioridade || "—"}</Typography>
                    <Typography variant="body2"><strong>Status:</strong> {statusText(normalizeStatus(a.status))}</Typography>
                    <Typography variant="body2"><strong>Equipe:</strong> {a.equipe || "—"}</Typography>
                    <Typography variant="body2"><strong>Tipo:</strong> {a.tipoAtividade || "—"}</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}><strong>Observações:</strong> {a.observacoes || "—"}</Typography>

                    <Stack direction="row" spacing={1} mt={2}>
                      {normalizeStatus(a.status) ? (
                        <Button variant="contained" size="small" onClick={() => onFinish(a.id)}>Concluir</Button>
                      ) : (
                        <Button variant="contained" size="small" onClick={() => onStart(a.id)}>Iniciar</Button>
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
