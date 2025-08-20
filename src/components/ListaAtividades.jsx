// src/components/ListaAtividades.jsx
"use client";

import React, { useMemo, useState, useCallback } from "react";
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
import { useAtividades } from "@/contexts/AtividadesContext";

// --- ESTILOS ---

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
  "&:hover": {
    color: $isActive ? color : theme.palette.text.primary,
  },
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
  color: color,
  fontSize: "0.875rem",
  fontWeight: "bold",
}));

const StatusCircle = styled("div")(({ color }) => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  backgroundColor: color,
  marginRight: "8px",
}));

const InfoItem = ({ label, children }) => (
  <Box>
    <Typography
      variant="caption"
      color="text.secondary"
      component="div"
      sx={{ fontWeight: "bold" }}
    >
      {label}
    </Typography>
    <Typography variant="body2" component="div">
      {children || "—"}
    </Typography>
  </Box>
);

// --- HELPERS ---

// Coloque no topo do arquivo
const normalizeStatus = (s) => {
  if (s === true || s === 1 || s === "EM_ANDAMENTO" || s === "IN_PROGRESS")
    return true;
  if (s === false || s === 0 || s === "PENDENTE" || s === "PENDING")
    return false;
  return false; // default seguro
};

const statusLabel = (bool) => (bool ? "Em andamento" : "Pendente");
const getStatusColor = (bool) => (bool ? "#2d96ff" : "#FF5959");

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    const d = new Date(value);
    // BR dd/mm/yyyy HH:MM
    return d.toLocaleString("pt-BR");
  } catch {
    return String(value);
  }
};

// --- CARD ---

const ActivityCard = ({ activity, onToggleStatus, onDelete }) => {
  const statusBool = normalizeStatus(activity.status);
  const statusColor = getStatusColor(statusBool);
  const hasPhoto = Boolean(activity.photoUrl);

  return (
    <CardContainer variant="outlined">
      {/* Cabeçalho */}
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
      >
        <Grid item xs={12} md={"auto"}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <BuildIcon fontSize="small" />
            <Typography variant="h6" component="h3" sx={{ fontWeight: "bold" }}>
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
        <Grid item xs={12} md={"auto"}>
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

      {/* Corpo */}
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

      {/* Ações */}
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

// --- COMPONENTE PRINCIPAL ---

const ListaAtividades = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

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

  // Abas baseadas no schema atual (boolean)
  const TABS = useMemo(
    () => [
      {
        key: "proximos",
        label: "Proximos",
        color: theme.palette.text.secondary,
      },
      {
        key: "EM_ANDAMENTO",
        label: "Em andamento",
        color: theme.palette.info.main,
      },
      { key: "PENDENTE", label: "Pendente", color: "#FF5959" },
      { key: "HISTORICO", label: "Histórico", color: "rgb(135, 231, 106)" },
    ],
    [theme.palette.text.secondary]
  );

  const [activeKey, setActiveKey] = useState("EM_ANDAMENTO");

  const filtered = useMemo(() => {
    if (activeKey === "EM_ANDAMENTO")
      return items.filter((a) => normalizeStatus(a.status) === true);
    if (activeKey === "PENDENTE")
      return items.filter((a) => normalizeStatus(a.status) === false);
    return items;
  }, [items, activeKey]);

  const handleRefresh = useCallback(() => {
    if (!condominioId) return;
    load({ condominioId, reset: true });
  }, [condominioId, load]);

  const handleToggleStatus = useCallback(
    async (activity) => {
      try {
        const current = normalizeStatus(activity.status);

        await updateAtividade(activity.id, { status: !current });
      } catch (e) {
        // TODO: snackbar/toast
        console.error(e);
      }
    },
    [updateAtividade]
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteAtividade(id);
      } catch (e) {
        console.error(e);
      }
    },
    [deleteAtividade]
  );

  return (
    <Box>
      {/* Abas de status */}
      <TabWrapper>
        {TABS.map((t) => (
          <StyledTab
            key={t.key}
            $isActive={activeKey === t.key}
            color={t.color}
            onClick={() => setActiveKey(t.key)}
          >
            <TabCircle color={t.color} />
            {t.label}
          </StyledTab>
        ))}
      </TabWrapper>

      {/* Barra de ações */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: isSmallScreen ? "column" : "row",
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
            width: isSmallScreen ? "100%" : "auto",
            textAlign: "center",
          }}
        >
          {/* Quando tiver expectedDate na V2, renderize o range aqui */}
          <Typography variant="body2" color="text.secondary">
            {items.length ? `${items.length} atividades` : "Sem atividades"}
          </Typography>
        </Paper>

        <Stack
          direction="row"
          spacing={1}
          sx={{ width: isSmallScreen ? "100%" : "auto" }}
        >
          <Button
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
            variant="outlined"
            fullWidth={isSmallScreen}
          >
            Atualizar
          </Button>
          <Button
            variant="text"
            sx={{ color: "#EA6037" }}
            startIcon={<BuildIcon />}
            fullWidth={isSmallScreen}
          >
            Filtros
          </Button>
        </Stack>
      </Box>

      {/* Lista / Estados */}
      {loading && !items.length ? (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Stack>
      ) : error ? (
        <Typography color="error" sx={{ textAlign: "center", mt: 4 }}>
          {error}
        </Typography>
      ) : filtered.length > 0 ? (
        <>
          {filtered.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDelete}
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
