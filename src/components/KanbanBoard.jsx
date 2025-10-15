// src/components/KanbanBoard.jsx
"use client";

import React, { useMemo, useCallback, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
  Stack,
  CircularProgress,
  Popover,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
} from "@mui/material";
import {
  Edit as EditIcon,
  Share as ShareIcon,
  InfoOutlined as InfoIcon,
  LowPriority as LowPriorityIcon,
} from "@mui/icons-material";
import HomeRepairServiceIcon from "@mui/icons-material/HomeRepairService";
import { styled } from "@mui/material/styles";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useAtividades } from "@/contexts/AtividadesContext";

// helpers centralizados
import {
  inferStatus,      // (atividade) => "PROXIMAS" | "EM_ANDAMENTO" | "PENDENTE" | "HISTORICO"
  statusLabel,      // (code) => "Próximas" | "Em andamento" | ...
  statusColor,      // (code) => cor hex
  formatDateTime,   // (date|string|null) => "dd/mm/aaaa HH:MM"
} from "@/utils/atividadeStatus";

/* ---------- estilos ---------- */
const KanbanContainer = styled(Box)(({ theme }) => ({ marginTop: theme.spacing(3) }));

const StyledChip = styled(Chip)(({ theme }) => ({
  borderRadius: "20px",
  marginBottom: theme.spacing(2),
  cursor: "pointer",
}));

const GridContainer = styled(Box)(({ theme }) => ({
  display: "grid",
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
    overflowX: "hidden",
  },
  [theme.breakpoints.between("sm", "md")]: {
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    overflowX: "auto",
  },
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    overflowX: "hidden",
  },
  gap: theme.spacing(2),
  paddingBottom: theme.spacing(2),
}));

const Column = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.default,
  minHeight: 440,
  display: "flex",
  flexDirection: "column",
}));

const ColumnHeaderStatusSpan = styled("span")(({ theme, $color }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(2),
  color: $color || theme.palette.text.primary,
  fontWeight: 700,
  fontSize: "1rem",
}));

const ColumnHeaderStatusCircle = styled("div")(({ theme, $color }) => ({
  width: 10,
  height: 10,
  borderRadius: "50%",
  backgroundColor: $color || theme.palette.grey[500],
  marginRight: theme.spacing(1),
}));

const CardContainer = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
  border: "1px solid #e0e0e0",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  cursor: "grab",
  "&:active": { cursor: "grabbing" },
}));

const IdTag = styled(Typography)(({ theme }) => ({
  fontSize: "0.75rem",
  color: theme.palette.text.secondary,
}));

const CardTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: "1rem",
  color: theme.palette.text.primary,
  flexGrow: 1,
}));

const CardMiddleElement = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(0.5),
  flexWrap: "wrap",
  gap: theme.spacing(0.5),
}));

const CardLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  marginRight: theme.spacing(1),
  color: theme.palette.text.secondary,
  fontSize: "0.8rem",
}));

const CardContentTx = styled(Typography)(({ theme }) => ({
  fontSize: "0.8rem",
  color: theme.palette.text.primary,
}));

const CardStatusWrapper = styled(Box)(() => ({
  marginTop: 8,
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
}));

const CardStatusSpan = styled("span")(({ theme, $color }) => ({
  display: "flex",
  alignItems: "center",
  color: $color || theme.palette.text.secondary,
  fontSize: "0.75rem",
  fontWeight: 700,
}));

const CardStatusCircle = styled("div")(({ $color }) => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  backgroundColor: $color || "#999",
  marginRight: 6,
}));

/* ---------- persistência ao soltar em coluna ---------- */
function patchForColumn(code) {
  const now = new Date().toISOString();
  switch (code) {
    case "EM_ANDAMENTO":
      return { status: "EM_ANDAMENTO", startAt: now, completedAt: null };
    case "HISTORICO":
      return { status: "HISTORICO", endAt: now, completedAt: now };
    case "PENDENTE":
      return { status: "PENDENTE", startAt: null, completedAt: null };
    case "PROXIMAS":
    default:
      return { status: "PROXIMAS", completedAt: null };
  }
}

/* ---------- Card ---------- */
const KanbanActivityCard = ({ activity, statusCode, onAction, onEdit }) => {
  const label = statusLabel(statusCode);
  const color = statusColor(statusCode);

  const budgetLabel = activity?.budgetStatus || "—";
  const condLabel =
    activity?.condominio?.name ||
    activity?.condominium ||
    activity?.location ||
    "—";

  return (
    <CardContainer variant="outlined">
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <IdTag>#{String(activity.id || "").substring(0, 8)}</IdTag>
        <Box>
          <IconButton size="small" onClick={() => onEdit?.(activity)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small">
            <ShareIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <CardTitle>{activity.name || activity.title}</CardTitle>
      <Divider sx={{ my: 1 }} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <CardMiddleElement>
          <LowPriorityIcon sx={{ mr: 1, fontSize: 16, color: "text.secondary" }} />
          <CardLabel>Condomínio:</CardLabel>
          <CardContentTx>{condLabel}</CardContentTx>
        </CardMiddleElement>

        <CardMiddleElement>
          <CardLabel>Orçamento:</CardLabel>
          <CardContentTx>{budgetLabel}</CardContentTx>
        </CardMiddleElement>

        <CardMiddleElement>
          <CardLabel>Data Prevista:</CardLabel>
          <CardContentTx>{formatDateTime(activity?.expectedDate)}</CardContentTx>
        </CardMiddleElement>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          mt: 2,
          gap: { xs: 1, sm: 0 },
        }}
      >
        <Button
          variant="outlined"
          size="small"
          startIcon={<InfoIcon />}
          sx={{ color: "#545454", borderColor: "#545454" }}
          onClick={() => onAction?.("view", activity)}
        >
          Ver mais
        </Button>

        <CardStatusWrapper>
          <CardStatusSpan $color={color}>
            <CardStatusCircle $color={color} />
            <Typography variant="body2">{label}</Typography>
          </CardStatusSpan>
        </CardStatusWrapper>
      </Box>

      <Box sx={{ display: "flex", gap: 1, mt: 2, justifyContent: "flex-end", flexWrap: "wrap" }}>
        {(statusCode === "PROXIMAS" || statusCode === "PENDENTE") && (
          <Button
            variant="contained"
            size="small"
            sx={{ backgroundColor: "#E6EAED", color: "#545454", "&:hover": { backgroundColor: "#d1d6da" } }}
            onClick={() => onAction?.("to_in_progress", activity)}
          >
            Iniciar atividade
          </Button>
        )}
        {statusCode === "EM_ANDAMENTO" && (
          <Button
            variant="contained"
            size="small"
            sx={{ backgroundColor: "#E6EAED", color: "#545454", "&:hover": { backgroundColor: "#d1d6da" } }}
            onClick={() => onAction?.("to_done", activity)}
          >
            Concluir atividade
          </Button>
        )}
      </Box>
    </CardContainer>
  );
};

/* ---------- Board ---------- */
export default function KanbanBoard({ onEdit }) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const { items, loading, error, nextCursor, loadMore, updateAtividade } = useAtividades();

  // colunas fixas por CODE
  const columns = useMemo(
    () => [
      { code: "PROXIMAS" },
      { code: "EM_ANDAMENTO" },
      { code: "PENDENTE" },
      { code: "HISTORICO" },
    ],
    []
  );

  /* ---------- FILTROS (Status + Período) ---------- */
  const ALL_STATUSES = ["PROXIMAS", "EM_ANDAMENTO", "PENDENTE", "HISTORICO"];

  // popover
  const [anchorEl, setAnchorEl] = useState(null);
  const openFilters = (e) => setAnchorEl(e.currentTarget);
  const closeFilters = () => setAnchorEl(null);

  // estado dos filtros
  const [filters, setFilters] = useState({
    statuses: new Set(ALL_STATUSES), // todos selecionados
    start: "", // "YYYY-MM-DD"
    end: "",   // "YYYY-MM-DD"
  });

  // data base para período (prioridade: expectedDate > startAt > createdAt)
  const scheduleDate = (a) => a?.expectedDate || a?.startAt || a?.createdAt || null;

  // passa no filtro?
  const passesFilters = useCallback((a) => {
    // status
    const code = inferStatus(a);
    const allowed = filters.statuses.size ? filters.statuses : new Set(ALL_STATUSES);
    if (!allowed.has(code)) return false;

    // período
    const dStr = scheduleDate(a);
    if (!dStr) return true; // sem data, ignora período
    const d = new Date(dStr);

    if (filters.start && d < new Date(filters.start + "T00:00:00")) return false;
    if (filters.end && d > new Date(filters.end + "T23:59:59")) return false;

    return true;
  }, [filters.statuses, filters.start, filters.end]);

  const toggleStatus = (code) => {
    setFilters((f) => {
      const next = new Set(f.statuses);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return { ...f, statuses: next };
    });
  };
  const clearFilters = () => setFilters({ statuses: new Set(ALL_STATUSES), start: "", end: "" });

  const periodLabel = useMemo(() => {
    if (!filters.start && !filters.end) return "Período";
    const fmt = (s) => (s ? new Date(s).toLocaleDateString("pt-BR") : "");
    return `${fmt(filters.start)}${filters.start && filters.end ? " — " : ""}${fmt(filters.end)}`;
  }, [filters.start, filters.end]);

  // aplica filtros nos itens antes de montar colunas
  const filteredItems = useMemo(
    () => (items || []).filter(passesFilters),
    [items, passesFilters]
  );

  // bucketização por CODE a partir dos filtrados
  const dataByColumn = useMemo(() => {
    const bucket = { PROXIMAS: [], EM_ANDAMENTO: [], PENDENTE: [], HISTORICO: [] };
    filteredItems.forEach((a) => {
      const code = inferStatus(a);
      const key = code && Object.prototype.hasOwnProperty.call(bucket, code) ? code : "PENDENTE";
      bucket[key].push(a);
    });
    return bucket;
  }, [filteredItems]);

  /* ---------- ações ---------- */
  const onAction = useCallback(
    async (type, activity) => {
      try {
        if (type === "to_in_progress") {
          await updateAtividade(activity.id, patchForColumn("EM_ANDAMENTO"));
        } else if (type === "to_done") {
          await updateAtividade(activity.id, patchForColumn("HISTORICO"));
        } else if (type === "view") {
          console.log("view activity", activity);
        }
      } catch (e) {
        console.error(e);
      }
    },
    [updateAtividade]
  );

  // drag & drop entre colunas
  const onDragEnd = useCallback(
    async (result) => {
      if (!result.destination) return;
      const from = result.source.droppableId;
      const to = result.destination.droppableId;
      if (from === to) return;

      const fromList = dataByColumn[from] || [];
      const moved = fromList[result.source.index];
      if (!moved) return;

      try {
        await updateAtividade(moved.id, patchForColumn(to));
      } catch (e) {
        console.error(e);
      }
    },
    [dataByColumn, updateAtividade]
  );

  return (
    <KanbanContainer>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Quadro de atividades
      </Typography>

      {/* Header + Filtros */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          mb: 3,
          justifyContent: "space-between",
          alignItems: isSmall ? "flex-start" : "center",
          flexDirection: isSmall ? "column" : "row",
          gap: isSmall ? 2 : 0,
        }}
      >
        <StyledChip
          label={periodLabel}
          clickable
          onClick={openFilters}
          sx={{
            width: isSmall ? "100%" : "auto",
            textAlign: isSmall ? "center" : "left",
            mr: isSmall ? 0 : 1,
          }}
        />

        <Button
          variant="text"
          sx={{
            color: "#EA6037",
            width: isSmall ? "100%" : "auto",
            justifyContent: isSmall ? "center" : "flex-start",
          }}
          startIcon={<HomeRepairServiceIcon sx={{ width: 20, height: 20 }} />}
          onClick={openFilters}
        >
          Filtros
        </Button>

        {/* Popover de Filtros */}
        <Popover
          open={!!anchorEl}
          anchorEl={anchorEl}
          onClose={closeFilters}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          PaperProps={{ sx: { p: 2, width: 320 } }}
        >
          <Typography variant="subtitle2" gutterBottom>Período</Typography>

          <Stack direction="row" spacing={1} mb={2}>
            <TextField
              label="Início"
              type="date"
              size="small"
              fullWidth
              value={filters.start}
              onChange={(e) => setFilters((f) => ({ ...f, start: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Fim"
              type="date"
              size="small"
              fullWidth
              value={filters.end}
              onChange={(e) => setFilters((f) => ({ ...f, end: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <Divider sx={{ my: 1 }} />

          <Typography variant="subtitle2" gutterBottom>Status</Typography>
          <FormGroup>
            {ALL_STATUSES.map((code) => (
              <FormControlLabel
                key={code}
                control={
                  <Checkbox
                    checked={filters.statuses.has(code)}
                    onChange={() => toggleStatus(code)}
                  />
                }
                label={statusLabel(code)}
              />
            ))}
          </FormGroup>

          <Stack direction="row" spacing={1} justifyContent="space-between" mt={1}>
            <Button size="small" onClick={clearFilters}>Limpar</Button>
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={closeFilters}>Fechar</Button>
              <Button size="small" variant="contained" onClick={closeFilters}>Aplicar</Button>
            </Stack>
          </Stack>
        </Popover>
      </Box>

      {/* Conteúdo */}
      {loading && !items.length ? (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Stack>
      ) : error ? (
        <Typography color="error" sx={{ textAlign: "center", mt: 4 }}>
          {error}
        </Typography>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <GridContainer>
            {columns.map((col) => {
              const colLabel = statusLabel(col.code);
              const colColor = statusColor(col.code);
              const list = dataByColumn[col.code] || [];

              return (
                <Droppable droppableId={col.code} key={col.code}>
                  {(provided) => (
                    <Column ref={provided.innerRef} {...provided.droppableProps}>
                      <ColumnHeaderStatusSpan $color={colColor}>
                        <ColumnHeaderStatusCircle $color={colColor} />
                        <Typography>{colLabel}</Typography>
                      </ColumnHeaderStatusSpan>

                      {list.length > 0 ? (
                        list.map((activity, index) => (
                          <Draggable key={String(activity.id)} draggableId={String(activity.id)} index={index}>
                            {(p) => (
                              <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}>
                                <KanbanActivityCard
                                  activity={activity}
                                  statusCode={col.code}
                                  onAction={onAction}
                                  onEdit={onEdit}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 2 }}>
                          Não há atividades para mostrar
                        </Typography>
                      )}

                      {provided.placeholder}

                      {col.code === "PENDENTE" && nextCursor && (
                        <Stack alignItems="center" sx={{ mt: 2 }}>
                          <Button onClick={loadMore} variant="outlined">
                            Carregar mais
                          </Button>
                        </Stack>
                      )}
                    </Column>
                  )}
                </Droppable>
              );
            })}
          </GridContainer>
        </DragDropContext>
      )}
    </KanbanContainer>
  );
}
