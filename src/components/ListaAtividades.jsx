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
    <Typography variant="body2">{children || "—"}</Typography>
  </Box>
);

/* ---------- helpers ---------- */

const normalizeStatus = (s) => {
  if (s === true || s === 1 || s === "EM_ANDAMENTO" || s === "IN_PROGRESS")
    return true;
  if (s === false || s === 0 || s === "PENDENTE" || s === "PENDING")
    return false;
  return false;
};
const statusLabel = (bool) => (bool ? "Em andamento" : "Pendente");
const getStatusColor = (bool) => (bool ? "#2d96ff" : "#FF5959");
const formatDateTime = (v) => (v ? new Date(v).toLocaleString("pt-BR") : "—");

/* ---------- card ---------- */

const ActivityCard = ({ activity, onToggleStatus, onDelete, onEdit  }) => {
  const statusBool = normalizeStatus(activity.status);
  const statusColor = getStatusColor(statusBool);
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
              {statusLabel(statusBool)}
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
          <InfoItem label="Tipo de Atividade">
            {activity.tipoAtividade}
          </InfoItem>
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
          Marcar como {statusBool ? "Pendente" : "Em andamento"}
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
      { key: "PROXIMAS",     label: "Próximas",    color: theme.palette.text.secondary, status: "PROXIMAS" },
      { key: "EM_ANDAMENTO", label: "Em andamento", color: theme.palette.info.main,      status: "EM_ANDAMENTO" },
      { key: "PENDENTE",     label: "Pendente",    color: "#FF5959",                      status: "PENDENTE" },
      { key: "HISTORICO",    label: "Histórico",   color: "rgb(135, 231, 106)",           status: "HISTORICO" },
    ],
    [theme.palette.text.secondary, theme.palette.info.main]
  );

  const [activeKey, setActiveKey] = useState("EM_ANDAMENTO");
  const lastQueryRef = useRef({ condo: null, status: null });

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
    load({ condominioId, reset: true, filters: { status: t?.status ?? undefined } });
  }, [condominioId, activeKey, TABS, load]);

  const handleToggleStatus = useCallback(
    async (activity) => {
      try {
        const current = normalizeStatus(activity.status);
        await updateAtividade(activity.id, { status: !current });
        handleRefresh();
      } catch (e) {
        console.error(e);
      }
    },
    [updateAtividade, handleRefresh]
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
    [deleteAtividade, handleRefresh]
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

        <Stack direction="row" spacing={1} sx={{ width: isSmall ? "100%" : "auto" }}>
          <Button onClick={handleRefresh} startIcon={<RefreshIcon />} variant="outlined" fullWidth={isSmall}>
            Atualizar
          </Button>
          <Button variant="text" sx={{ color: "#EA6037" }} startIcon={<BuildIcon />} fullWidth={isSmall}>
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
        <Typography variant="h6" color="text.secondary" sx={{ mt: 4, textAlign: "center" }}>
          Não há atividades para mostrar neste filtro.
        </Typography>
      )}
    </Box>
  );
};

export default ListaAtividades;
