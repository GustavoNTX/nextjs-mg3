// src/components/CalendarView.jsx
"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
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
import { buildCalendar, getStatusNoDia } from "@/utils/atividadeStatus";
import { adaptAtividadesToTasks } from "@/utils/atividadeDate";

/* ---------- estilos ---------- */
const StyledCalendarWrapper = styled("div")(({ theme }) => ({
  ".fc": { fontFamily: theme.typography.fontFamily },
  ".fc-event": { border: "none", padding: "2px 4px", fontSize: "0.75rem" },
  ".fc-daygrid-event-dot": { display: "none" },
}));

/* ---------- utils locais p/ datas ---------- */
const toDate = (v) => (v ? new Date(v) : null);
const isSameDay = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** “Zera” a hora para eventos all-day */
const dateOnly = (d) => {
  if (!d) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const pad2 = (n) => String(n).padStart(2, "0");
const formatDateTime = (d) => {
  if (!d) return "";
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
};

/** cor de “tag” por prioridade (só estética do calendário) */
const priorityColor = (p) => {
  const s = String(p || "").toUpperCase();
  if (s.includes("URG")) return "#b71c1c";
  if (s.includes("ALTO")) return "#d32f2f";
  if (s.includes("MÉDIO") || s.includes("MEDIO")) return "#ed6c02";
  if (s.includes("BAIXO")) return "#2e7d32";
  return "#1976d2";
};

/** cor por status do dia */
const statusColor = (code) => {
  const s = String(code || "").toUpperCase();
  if (s === "FEITO") return "#2e7d32";
  if (s === "EM_ANDAMENTO") return "#ed6c02";
  if (s === "PENDENTE") return "#d32f2f";
  if (s === "SEM_REGISTRO") return "#9e9e9e";
  if (s === "NAO_ESPERADO") return "#bdbdbd";
  return "#1976d2";
};

const statusLabel = (code) => {
  const s = String(code || "").toUpperCase();
  if (s === "FEITO") return "Feito";
  if (s === "EM_ANDAMENTO") return "Em andamento";
  if (s === "PENDENTE") return "Pendente";
  if (s === "SEM_REGISTRO") return "Sem registro";
  if (s === "NAO_ESPERADO") return "Não esperado para este dia";
  return code || "—";
};

const isRunning = (statusDia) =>
  statusDia && statusDia.statusHoje === "EM_ANDAMENTO";

/** monta TaskLike usando o mesmo adaptador da API/notifications */
const atividadeToTask = (a) => {
  const arr = adaptAtividadesToTasks([a]);
  return arr && arr.length ? arr[0] : null;
};

/** converte historico da atividade pro formato esperado pelo helper */
const atividadeHistoricoToList = (a) => {
  if (!Array.isArray(a.historico)) return [];
  return a.historico.map((h) => ({
    atividadeId: a.id,
    dataReferencia:
      h.dataReferencia instanceof Date
        ? h.dataReferencia.toISOString()
        : String(h.dataReferencia),
    status: h.status,
    completedAt:
      h.completedAt instanceof Date
        ? h.completedAt.toISOString()
        : h.completedAt ?? null,
    observacoes: h.observacoes ?? null,
  }));
};

/* ---------- componente ---------- */
export default function CalendarView({ onEdit }) {
  const { items, loading, error, updateAtividade } = useAtividades();

  const [calendarTitle, setCalendarTitle] = useState("");
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [selectedDate, setSelectedDate] = useState(null);
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);

  const calendarRef = useRef(null);
  const detailsRef = useRef(null);

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));

  // muda view programaticamente
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api) api.changeView(currentView);
  }, [currentView]);

  // mapeia atividades -> eventos do FullCalendar (usando buildCalendar)
  const events = useMemo(() => {
    if (!rangeStart || !rangeEnd) return [];

    const allEvents = [];

    for (const a of items) {
      const task = atividadeToTask(a);
      if (!task) continue;

      const historico = atividadeHistoricoToList(a);
      const dias = buildCalendar(task, historico, rangeStart, rangeEnd);

      for (const dia of dias) {
        const d = dateOnly(dia.data);
        const id = `${a.id}-${d.toISOString().slice(0, 10)}`;

        allEvents.push({
          id,
          title: a.name,
          start: d,
          allDay: true,
          editable: false, // mover recorrência é mais complexo; deixa travado
          durationEditable: false,
          extendedProps: {
            atividade: a,
            statusCode: dia.status,
            prioridade: a.prioridade,
            dateRef: d,
          },
        });
      }
    }

    return allEvents;
  }, [items, rangeStart, rangeEnd]);

  const handleDatesSet = (info) => {
    setCalendarTitle(info.view.title);
    setRangeStart(info.start);
    setRangeEnd(info.end);
  };

  const handleEventClick = (info) => {
    const d = info.event.extendedProps?.dateRef || info.event.start;
    setSelectedDate(dateOnly(d));
    if (isSmall && detailsRef.current) {
      setTimeout(
        () => detailsRef.current.scrollIntoView({ behavior: "smooth" }),
        120
      );
    }
  };

  const goPrev = () => calendarRef.current?.getApi().prev();
  const goNext = () => calendarRef.current?.getApi().next();
  const goToday = () => {
    const api = calendarRef.current?.getApi();
    api?.today();
    if (api?.view) setCalendarTitle(api.view.title);
  };

  // lista do dia selecionado (usando getStatusNoDia)
  const activitiesOfDay = useMemo(() => {
    if (!selectedDate) return [];
    return items
      .map((a) => {
        const task = atividadeToTask(a);
        const historico = atividadeHistoricoToList(a);
        const statusDia = getStatusNoDia(task, historico, selectedDate);

        // Se nem era esperado e não tem registro, ignora
        if (!statusDia.esperadoHoje && statusDia.statusHoje === "NAO_ESPERADO")
          return null;

        return { atividade: a, statusDia };
      })
      .filter(Boolean);
  }, [items, selectedDate]);

  // Arrastar evento (desativado na prática, mas deixo o handler)
  const handleEventDrop = async (arg) => {
    const { event } = arg;
    const a = event.extendedProps?.atividade;
    if (!a) return;
    try {
      // aqui, se quiser no futuro permitir remanejar ocorrências,
      // teria que criar lógica de remanejamento de dataReferencia
      arg.revert();
    } catch (e) {
      console.error(e);
      arg.revert();
    }
  };

  // Redimensionar (idem)
  const handleEventResize = async (arg) => {
    const { event } = arg;
    const a = event.extendedProps?.atividade;
    if (!a) return;
    try {
      arg.revert();
    } catch (e) {
      console.error(e);
      arg.revert();
    }
  };

  // ações: mexem só no HISTÓRICO do dia selecionado
  const handleStart = useCallback(
    async (id) => {
      const ref = selectedDate || new Date();
      try {
        await updateAtividade(id, {
          status: "EM_ANDAMENTO",
          dataReferencia: ref.toISOString(),
        });
      } catch (e) {
        console.error(e);
      }
    },
    [updateAtividade, selectedDate]
  );

  const handleFinish = useCallback(
    async (id) => {
      const ref = selectedDate || new Date();
      const now = new Date();
      try {
        await updateAtividade(id, {
          status: "FEITO",
          dataReferencia: ref.toISOString(),
          completedAt: now.toISOString(),
        });
      } catch (e) {
        console.error(e);
      }
    },
    [updateAtividade, selectedDate]
  );

  const handleReopen = useCallback(
    async (id) => {
      const ref = selectedDate || new Date();
      try {
        await updateAtividade(id, {
          status: "PENDENTE",
          dataReferencia: ref.toISOString(),
          completedAt: null,
        });
      } catch (e) {
        console.error(e);
      }
    },
    [updateAtividade, selectedDate]
  );

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
        <ToggleButtonGroup
          exclusive
          value={currentView}
          onChange={(_, v) => v && setCurrentView(v)}
        >
          <ToggleButton value="dayGridMonth">Mês</ToggleButton>
          <ToggleButton value="timeGridWeek">Semana</ToggleButton>
          <ToggleButton value="listWeek">Lista</ToggleButton>
        </ToggleButtonGroup>

        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={goPrev}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6" sx={{ minWidth: 160, textAlign: "center" }}>
            {calendarTitle}
          </Typography>
          <IconButton onClick={goNext}>
            <ChevronRightIcon />
          </IconButton>
          <Button size="small" startIcon={<TodayIcon />} onClick={goToday}>
            Hoje
          </Button>
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
                plugins={[
                  dayGridPlugin,
                  timeGridPlugin,
                  listPlugin,
                  interactionPlugin,
                ]}
                locale={ptBrLocale}
                initialView="dayGridMonth"
                headerToolbar={false}
                events={events}
                datesSet={handleDatesSet}
                eventClick={handleEventClick}
                editable={false}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                eventContent={(arg) => {
                  const code = arg.event.extendedProps?.statusCode;
                  const dot = statusColor(code);
                  const pri = arg.event.extendedProps?.prioridade;
                  const tag = priorityColor(pri);
                  return (
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: dot,
                        }}
                      />
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
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
              sx={{
                maxHeight: isSmall ? "auto" : "80vh",
                overflowY: isSmall ? "visible" : "auto",
              }}
            >
              <Typography variant="h6" gutterBottom>
                Atividades em {formatDateTime(selectedDate)}
              </Typography>

              {activitiesOfDay.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma atividade para este dia.
                </Typography>
              ) : (
                activitiesOfDay.map(({ atividade: a, statusDia }) => {
                  const code = statusDia.statusHoje;
                  const lbl = statusLabel(code);
                  const running = isRunning(statusDia);

                  return (
                    <Paper
                      key={a.id}
                      sx={{ p: 2, mb: 2, border: "1px solid #ddd" }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
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

                      <Typography variant="body2">
                        <strong>Local:</strong> {a.location || "—"}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Prioridade:</strong> {a.prioridade || "—"}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Status no dia:</strong> {lbl}
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
                        {running ? (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleFinish(a.id)}
                          >
                            Concluir
                          </Button>
                        ) : code === "FEITO" ? (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleReopen(a.id)}
                          >
                            Reabrir
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleStart(a.id)}
                          >
                            Iniciar
                          </Button>
                        )}
                      </Stack>
                    </Paper>
                  );
                })
              )}
            </Box>
          )}
        </Stack>
      )}
    </Paper>
  );
}
