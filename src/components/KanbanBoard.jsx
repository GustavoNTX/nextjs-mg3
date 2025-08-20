// src/components/KanbanBoard.jsx
"use client";

import React, { useMemo, useCallback } from "react";
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

// --- Estilos idênticos (ou o mais próximo possível) ao seu layout anterior ---
const KanbanContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
}));

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
  minHeight: "400px",
  display: "flex",
  flexDirection: "column",
  [theme.breakpoints.down("sm")]: {
    marginBottom: theme.spacing(2),
  },
}));

const ColumnHeaderStatusSpan = styled("span")(({ theme, color }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(2),
  color: color || theme.palette.text.primary,
  fontWeight: "bold",
  fontSize: "1rem",
}));

const ColumnHeaderStatusCircle = styled("div")(({ theme, color }) => ({
  width: 10,
  height: 10,
  borderRadius: "50%",
  backgroundColor: color || theme.palette.grey[500],
  marginRight: theme.spacing(1),
}));

const CardContainer = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
  border: "1px solid #e0e0e0",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  cursor: "grab",
  "&:active": {
    cursor: "grabbing",
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(1.5),
  },
}));

const IdTag = styled(Typography)(({ theme }) => ({
  fontSize: "0.75rem",
  color: theme.palette.text.secondary,
}));

const CardTitle = styled(Typography)(({ theme }) => ({
  fontWeight: "bold",
  fontSize: "1rem",
  color: theme.palette.text.primary,
  flexGrow: 1,
  [theme.breakpoints.down("sm")]: {
    fontSize: "0.9rem",
  },
}));

const CardMiddleElement = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(0.5),
  flexWrap: "wrap",
  gap: theme.spacing(0.5),
}));

const CardLabel = styled(Typography)(({ theme }) => ({
  fontWeight: "bold",
  marginRight: theme.spacing(1),
  color: theme.palette.text.secondary,
  fontSize: "0.8rem",
  [theme.breakpoints.down("sm")]: {
    fontSize: "0.75rem",
  },
}));

const CardContentTx = styled(Typography)(({ theme }) => ({
  fontSize: "0.8rem",
  color: theme.palette.text.primary,
  [theme.breakpoints.down("sm")]: {
    fontSize: "0.75rem",
  },
}));

const CardStatusWrapper = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
}));

const CardStatusSpan = styled("span")(({ theme, color }) => ({
  display: "flex",
  alignItems: "center",
  color: color || theme.palette.text.secondary,
  fontSize: "0.75rem",
  fontWeight: "bold",
}));

const CardStatusCircle = styled("div")(({ theme, color }) => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  backgroundColor: color || theme.palette.grey[500],
  marginRight: theme.spacing(0.5),
}));

// --- Helpers ---

const normalizeStatus = (s) => {
  if (s === true || s === 1 || s === "EM_ANDAMENTO" || s === "IN_PROGRESS") return true;
  if (s === false || s === 0 || s === "PENDENTE" || s === "PENDING") return false;
  return false; // default seguro
};

const BACKEND_STATUS_MODE = "boolean"; // ou "enum"
const encodeStatus = (bool) =>
  BACKEND_STATUS_MODE === "enum" ? (bool ? "EM_ANDAMENTO" : "PENDENTE") : !!bool;

const COLORS = {
  "Próximas": "#787878",
  "Em andamento": "#2d96ff",
  "Pendente": "#FF5959",
  "Histórico": "#87E76A",
};

const fmtDate = (d) => {
  if (!d) return "—";
  try {
    const dt = typeof d === "string" ? new Date(d) : d;
    return dt.toLocaleDateString("pt-BR");
  } catch {
    return String(d);
  }
};

// Normaliza o "status de coluna" a partir dos campos atuais (boolean + datas)
function pickColumn(activity) {
  // completedAt manda para Histórico
  if (activity?.completedAt) return "Histórico";

  const statusBool = normalizeStatus(activity?.status);
  if (statusBool) return "Em andamento";

  // Sem completedAt e sem estar em andamento: Próximas vs Pendente por expectedDate
  const now = new Date();
  const exp = activity?.expectedDate ? new Date(activity.expectedDate) : null;
  if (exp && exp.getTime() > now.getTime()) return "Próximas";

  return "Pendente";
}

// Ao soltar o card em uma coluna, como persistir (compat com status boolean atual)
function patchForColumn(colId) {
  const base = { completedAt: null };
  if (colId === "Em andamento") return { ...base, status: encodeStatus(true) };
  if (colId === "Histórico")    return { status: encodeStatus(false), completedAt: new Date().toISOString() };
  // "Próximas" e "Pendente" ficam como "não em andamento"
  return { ...base, status: encodeStatus(false) };
}

// --- Card (mantendo layout anterior) ---
const KanbanActivityCard = ({ activity, statusLabel, onAction }) => {
  const statusColor = COLORS[statusLabel] || "#787878";
  const budgetLabel = activity?.budgetStatus || "—";
  const condLabel = activity?.condominio?.name || activity?.condominium || activity?.location || "—";

  return (
    <CardContainer variant="outlined">
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <IdTag>#{String(activity.id || "").substring(0, 8)}</IdTag>
        <Box>
          <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small"><ShareIcon fontSize="small" /></IconButton>
        </Box>
      </Box>

      <CardTitle>{activity.name || activity.title}</CardTitle>
      <Divider sx={{ my: 1 }} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <CardMiddleElement>
          <LowPriorityIcon sx={{ marginRight: "8px", fontSize: "16px", color: "text.secondary" }} />
          <CardLabel>Condomínio:</CardLabel>
          <CardContentTx>{condLabel}</CardContentTx>
        </CardMiddleElement>

        <CardMiddleElement>
          <CardLabel>Orçamento:</CardLabel>
          <CardContentTx>{budgetLabel}</CardContentTx>
        </CardMiddleElement>

        <CardMiddleElement>
          <CardLabel>Data Prevista:</CardLabel>
          <CardContentTx>{fmtDate(activity?.expectedDate)}</CardContentTx>
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

        <CardStatusWrapper sx={{ mt: { xs: 1, sm: 0 }, width: { xs: "100%", sm: "auto" }, justifyContent: { xs: "flex-start", sm: "flex-end" } }}>
          <CardStatusSpan color={statusColor}>
            <CardStatusCircle color={statusColor} />
            <Typography variant="body2">{statusLabel}</Typography>
          </CardStatusSpan>
        </CardStatusWrapper>
      </Box>

      {/* Botões condicionais como no layout anterior */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          mt: 2,
          justifyContent: "flex-end",
          flexDirection: { xs: "column", sm: "row" },
          width: { xs: "100%", sm: "auto" },
        }}
      >
        {statusLabel === "Próximas" && (
          <Button
            variant="contained"
            size="small"
            sx={{ backgroundColor: "#E6EAED", color: "#545454", "&:hover": { backgroundColor: "#d1d6da" } }}
            onClick={() => onAction?.("to_in_progress", activity)}
          >
            Iniciar atividade
          </Button>
        )}
        {statusLabel === "Em andamento" && (
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

// --- Board (com 4 colunas como antes, mas ligado no contexto) ---
export default function KanbanBoard() {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const { items, loading, error, nextCursor, loadMore, updateAtividade } = useAtividades();

  const columns = useMemo(
    () => [
      { id: "Próximas", color: COLORS["Próximas"] },
      { id: "Em andamento", color: COLORS["Em andamento"] },
      { id: "Pendente", color: COLORS["Pendente"] },
      { id: "Histórico", color: COLORS["Histórico"] },
    ],
    []
  );

  const dataByColumn = useMemo(() => {
    const bucket = { "Próximas": [], "Em andamento": [], "Pendente": [], "Histórico": [] };
    (items || []).forEach((a) => {
      const col = pickColumn(a);
      bucket[col].push(a);
    });
    return bucket;
  }, [items]);

  const onAction = useCallback(
    async (type, activity) => {
      try {
        if (type === "to_in_progress") {
          await updateAtividade(activity.id, patchForColumn("Em andamento"));
        } else if (type === "to_done") {
          await updateAtividade(activity.id, patchForColumn("Histórico"));
        } else if (type === "view") {
          // TODO: abrir drawer/modal com detalhes
          // por ora, apenas loga:
          // eslint-disable-next-line no-console
          console.log("view activity", activity);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    },
    [updateAtividade]
  );

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
        // eslint-disable-next-line no-console
        console.error(e);
      }
    },
    [dataByColumn, updateAtividade]
  );

  return (
    <KanbanContainer>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Obs: Após recarregar a página, os cards serão mostrados novamente em ordem cronológica
      </Typography>

      {/* Header/Filtros preservado */}
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
          label="12/04/2025 - 12/10/2025"
          clickable
          sx={{
            width: isSmall ? "100%" : "auto",
            textAlign: isSmall ? "center" : "left",
            mr: isSmall ? 0 : 1,
            mb: isSmall ? 0 : 2,
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
        >
          Filtros
        </Button>
      </Box>

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
            {columns.map((col) => (
              <Droppable droppableId={col.id} key={col.id}>
                {(provided) => (
                  <Column ref={provided.innerRef} {...provided.droppableProps}>
                    <ColumnHeaderStatusSpan color={col.color}>
                      <ColumnHeaderStatusCircle color={col.color} />
                      <Typography>{col.id}</Typography>
                    </ColumnHeaderStatusSpan>

                    {(dataByColumn[col.id] || []).length > 0 ? (
                      dataByColumn[col.id].map((activity, index) => (
                        <Draggable key={activity.id} draggableId={activity.id} index={index}>
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                              <KanbanActivityCard activity={activity} statusLabel={col.id} onAction={onAction} />
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

                    {/* Botão "carregar mais" opcional (paginado do contexto) */}
                    {col.id === "Pendente" && nextCursor && (
                      <Stack alignItems="center" sx={{ mt: 2 }}>
                        <Button onClick={loadMore} variant="outlined">
                          Carregar mais
                        </Button>
                      </Stack>
                    )}
                  </Column>
                )}
              </Droppable>
            ))}
          </GridContainer>
        </DragDropContext>
      )}
    </KanbanContainer>
  );
}
