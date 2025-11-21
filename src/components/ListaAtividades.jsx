// src/components/ListaAtividades.jsx
"use client";

import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  useMediaQuery,
  useTheme,
  Grid,
  Stack,
  Chip,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import RefreshIcon from "@mui/icons-material/Refresh";
import BuildIcon from "@mui/icons-material/Build";
import ImageIcon from "@mui/icons-material/Image";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";

import { useAtividades } from "@/contexts/AtividadesContext";
import { getStatusNoDia } from "@/utils/atividadeStatus";
import { adaptAtividadesToTasks } from "@/utils/atividadeDate";

/* ---------- helpers locais (status, data, recorrência) ---------- */

const pad2 = (n) => String(n).padStart(2, "0");

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const normalizeDate = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const todayDate = () => normalizeDate(new Date());

/** mapeia código de status lógico -> label */
const statusLabelOf = (code) => {
  const s = String(code || "").toUpperCase();
  if (s === "PROXIMAS") return "Próximas";
  if (s === "EM_ANDAMENTO") return "Em andamento";
  if (s === "PENDENTE") return "Pendente";
  if (s === "HISTORICO") return "Histórico";
  return code || "—";
};

/** mapeia código de status lógico -> cor */
const statusColorOf = (code) => {
  const s = String(code || "").toUpperCase();
  if (s === "PROXIMAS") return "#1976d2";
  if (s === "EM_ANDAMENTO") return "#ed6c02";
  if (s === "PENDENTE") return "#d32f2f";
  if (s === "HISTORICO") return "#2e7d32";
  return "#9e9e9e";
};

/** TaskLike para o helper de recorrência (mesmo adaptador da API) */
const atividadeToTask = (a) => {
  const arr = adaptAtividadesToTasks([a]);
  return arr && arr.length ? arr[0] : null;
};

/** HistoricoLike[] pro helper */
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

/**
 * inferStatus: bucket da atividade HOJE
 *  - PROXIMAS: não esperado hoje e nunca foi feito
 *  - HISTORICO: já tem FEITO (hoje ou antes)
 *  - EM_ANDAMENTO: esperado hoje e EM_ANDAMENTO hoje
 *  - PENDENTE: esperado hoje e não feito / não em andamento
 */
const inferStatus = (a) => {
  try {
    const hoje = todayDate();
    const task = atividadeToTask(a);
    if (!task) return "PENDENTE";

    const historico = atividadeHistoricoToList(a);
    const statusDia = getStatusNoDia(task, historico, hoje);

    if (!statusDia.esperadoHoje) {
      if (historico.some((h) => h.status === "FEITO")) return "HISTORICO";
      return "PROXIMAS";
    }

    switch (String(statusDia.statusHoje).toUpperCase()) {
      case "FEITO":
        return "HISTORICO";
      case "EM_ANDAMENTO":
        return "EM_ANDAMENTO";
      default:
        return "PENDENTE";
    }
  } catch {
    return "PENDENTE";
  }
};

/* ---------- estilos ---------- */
const TabWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  paddingBottom: theme.spacing(1),
}));

const StyledTab = styled("div")(({ theme, $isActive, color }) => ({
  padding: theme.spacing(1, 2),
  cursor: "pointer",
  fontWeight: $isActive ? "bold" : "normal",
  color: $isActive ? color : theme.palette.text.secondary,
  borderBottom: $isActive ? `2px solid ${color}` : "none",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  transition: "color 0.2s, border-bottom 0.2s",
  "&:hover": { color: $isActive ? color : theme.palette.text.primary },
}));

const TabCircle = styled("div")(({ color }) => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  backgroundColor: color,
}));

const CardContainer = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius * 1.25,
}));

const StatusSpan = styled("span")(({ color }) => ({
  display: "inline-flex",
  alignItems: "center",
  color,
  fontSize: "0.875rem",
  fontWeight: "bold",
}));

const StatusCircle = styled("div")(({ color }) => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  backgroundColor: color,
  marginRight: 8,
}));

const InfoItem = ({ label, children }) => (
  <Box>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ fontWeight: "bold" }}
    >
      {label}
    </Typography>
    <Typography variant="user-body2">{children || "—"}</Typography>
  </Box>
);

/* ---------- card ---------- */
const ActivityCard = ({ activity, onToggleStatus, onDelete, onEdit }) => {
  const st = inferStatus(activity);
  const statusText = statusLabelOf(st);
  const statusColor = statusColorOf(st);
  const hasPhoto = Boolean(activity.photoUrl);

  return (
    <CardContainer variant="outlined">
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
      >
        <Grid item xs={12} md="auto">
          <Stack direction="row" alignItems="center" spacing={1}>
            <ImageIcon fontSize="small" />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {activity.name}
            </Typography>
            {activity.prioridade && (
              <Chip
                size="small"
                label={`Prioridade: ${activity.prioridade}`}
                variant="outlined"
              />
            )}
          </Stack>
        </Grid>
        <Grid item xs={12} md="auto">
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent={{ xs: "flex-start", md: "flex-end" }}
          >
            <StatusSpan color={statusColor}>
              <StatusCircle color={statusColor} />
              {statusText}
            </StatusSpan>

            <IconButton
              aria-label="Editar"
              onClick={() => onEdit?.(activity)}
              size="small"
              sx={{ ml: 1 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              aria-label="Excluir"
              onClick={() => onDelete?.(activity.id)}
              size="small"
              sx={{ ml: 1 }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <InfoItem label="Local">{activity.location}</InfoItem>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <InfoItem label="Tipo / Categoria">{activity.type}</InfoItem>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <InfoItem label="Quantidade">{activity.quantity}</InfoItem>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <InfoItem label="Frequência">{activity.frequencia}</InfoItem>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <InfoItem label="Equipe">{activity.equipe}</InfoItem>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <InfoItem label="Tipo de Atividade">{activity.tipoAtividade}</InfoItem>
        </Grid>

        <Grid item xs={12} md={8}>
          <InfoItem label="Modelo / Descrição">{activity.model}</InfoItem>
        </Grid>
        <Grid item xs={12} md={4}>
          <InfoItem label="Criado em">
            {formatDateTime(activity.createdAt)}
          </InfoItem>
        </Grid>

        <Grid item xs={12}>
          <InfoItem label="Observações">{activity.observacoes}</InfoItem>
        </Grid>

        {hasPhoto && (
          <Grid item xs={12}>
            <Stack direction="row" spacing={1} alignItems="center">
              <ImageIcon fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                Foto vinculada
              </Typography>
              <Box
                component="img"
                src={activity.photoUrl}
                alt={activity.name}
                sx={{
                  ml: 1,
                  width: 120,
                  height: 80,
                  objectFit: "cover",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              />
            </Stack>
          </Grid>
        )}
      </Grid>

      <Stack
        direction="row"
        spacing={1}
        sx={{ mt: 2 }}
        justifyContent="flex-end"
      >
        <Button
          size="small"
          variant="outlined"
          onClick={() => onToggleStatus?.(activity)}
        >
          {/* toggle só alterna EM_ANDAMENTO <-> PENDENTE (ou PROXIMAS vira EM_ANDAMENTO) */}
          Marcar como{" "}
          {inferStatus(activity) === "EM_ANDAMENTO"
            ? "Pendente"
            : "Em andamento"}
        </Button>
      </Stack>
    </CardContainer>
  );
};

/* ---------- componente principal ---------- */
const ListaAtividades = ({ onEdit }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  const {
    items,
    loading,
    error,
    nextCursor,
    load,
    loadMore,
    updateAtividade,
    deleteAtividade,
    condominioId,
  } = useAtividades();

  const TABS = useMemo(
    () => [
      {
        key: "PROXIMAS",
        label: "Próximas",
        color: theme.palette.text.secondary,
        status: "PROXIMAS",
      },
      {
        key: "EM_ANDAMENTO",
        label: "Em andamento",
        color: theme.palette.info.main,
        status: "EM_ANDAMENTO",
      },
      {
        key: "PENDENTE",
        label: "Pendente",
        color: "#FF5959",
        status: "PENDENTE",
      },
      {
        key: "HISTORICO",
        label: "Histórico",
        color: "rgb(135, 231, 106)",
        status: "HISTORICO",
      },
    ],
    [theme.palette.text.secondary, theme.palette.info.main],
  );

  const [activeKey, setActiveKey] = useState("EM_ANDAMENTO");
  const lastQueryRef = useRef({ condo: null, status: null });

  // auto-load por aba + condomínio (filtro de status é no backend)
  useEffect(() => {
    if (!condominioId) return;
    const tab = TABS.find((t) => t.key === activeKey);
    const status = tab?.status;
    const sameCondo = lastQueryRef.current.condo === condominioId;
    const sameStatus = lastQueryRef.current.status === status;
    if (sameCondo && sameStatus) return;
    lastQueryRef.current = { condo: condominioId, status };
    load({ condominioId, reset: true, filters: { status } });
  }, [condominioId, activeKey, TABS, load]);

  const handleTabClick = useCallback((tabKey) => setActiveKey(tabKey), []);

  const handleRefresh = useCallback(() => {
    if (!condominioId) return;
    const t = TABS.find((x) => x.key === activeKey);
    load({
      condominioId,
      reset: true,
      filters: { status: t?.status ?? undefined },
    });
  }, [condominioId, activeKey, TABS, load]);

  const handleToggleStatus = useCallback(
    async (activity) => {
      try {
        const cur = inferStatus(activity);
        const now = new Date();
        const dataRefISO = now.toISOString();

        // alterna EM_ANDAMENTO <-> PENDENTE; PROXIMAS/HISTORICO => força EM_ANDAMENTO hoje
        let newHistStatus;
        if (cur === "EM_ANDAMENTO") newHistStatus = "PENDENTE";
        else newHistStatus = "EM_ANDAMENTO";

        const patch = {
          status: newHistStatus, // status do HISTÓRICO
          dataReferencia: dataRefISO,
          completedAt: null,
        };

        await updateAtividade(activity.id, patch);
        handleRefresh();
      } catch (e) {
        console.error(e);
      }
    },
    [updateAtividade, handleRefresh],
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteAtividade(id);
        handleRefresh();
      } catch (e) {
        console.error(e);
      }
    },
    [deleteAtividade, handleRefresh],
  );

  return (
    <Box>
      {/* Abas */}
      <TabWrapper>
        {TABS.map((t) => (
          <StyledTab
            key={t.key}
            $isActive={activeKey === t.key}
            color={t.color}
            onClick={() => handleTabClick(t.key)}
          >
            <TabCircle color={t.color} />
            {t.label}
          </StyledTab>
        ))}
      </TabWrapper>

      {/* Ações */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: isSmall ? "column" : "row",
          gap: 2,
          mb: 3,
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            px: 2,
            py: 1,
            borderRadius: "20px",
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            width: isSmall ? "100%" : "auto",
            textAlign: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {items.length ? `${items.length} atividades` : "Sem atividades"}
          </Typography>
        </Paper>

        <Stack
          direction="row"
          spacing={1}
          sx={{ width: isSmall ? "100%" : "auto" }}
        >
          <Button
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
            variant="outlined"
            fullWidth={isSmall}
          >
            Atualizar
          </Button>
          <Button
            variant="text"
            sx={{ color: "#EA6037" }}
            startIcon={<BuildIcon />}
            fullWidth={isSmall}
          >
            Filtros
          </Button>
        </Stack>
      </Box>

      {/* Lista */}
      {loading && !items.length ? (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Stack>
      ) : error ? (
        <Typography color="error" sx={{ textAlign: "center", mt: 4 }}>
          {error}
        </Typography>
      ) : items.length > 0 ? (
        <>
          {items.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDelete}
              onEdit={onEdit}
            />
          ))}
          {nextCursor && (
            <Stack alignItems="center" sx={{ mt: 2 }}>
              <Button onClick={loadMore} variant="outlined">
                Carregar mais
              </Button>
            </Stack>
          )}
        </>
      ) : (
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ mt: 4, textAlign: "center" }}
        >
          Não há atividades para mostrar neste filtro.
        </Typography>
      )}
    </Box>
  );
};

export default ListaAtividades;
