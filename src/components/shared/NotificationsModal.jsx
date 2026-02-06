// components/NotificationsModal.jsx
"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Modal,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  useTheme,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { alpha } from "@mui/material/styles";
import { useAtividadesOptional } from "@/contexts/AtividadesContext";
import { APP_TIMEZONE } from "@/constants/timezone";

const modalStyle = (theme) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: theme.breakpoints.values.sm,
  maxWidth: "90vw",
  maxHeight: "80vh",
  overflowY: "auto",
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[6],
  padding: theme.spacing(4),
  outline: "none",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
});

const formatDate = (date) =>
  date?.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export default function NotificationsModal({ open, onClose }) {
  const theme = useTheme();
  const router = useRouter();
  const atividades = useAtividadesOptional();

  const notifications = atividades?.notifications ?? [];
  const notifLoading = atividades?.notifLoading ?? false;
  const notifError = atividades?.notifError ?? null;
  const loadNotifications = atividades?.loadNotifications;

  const today = useMemo(() => new Date(), [open]);

  useEffect(() => {
    if (!open || !loadNotifications) return;
    // só hoje
    loadNotifications({ leadDays: 0 });
  }, [open, loadNotifications]);

  // YYYY-MM-DD no fuso de Brasília (consistente com o resto do projeto)
  const todayISO = useMemo(() => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }, [open]);

  // Notificações de HOJE que NÃO foram feitas (when === "due" e não está FEITO)
  // A API já exclui atividades com status FEITO, então todas as notificações
  // retornadas são "não feitas"
  const naoFeitasHoje = useMemo(
    () =>
      notifications.filter(
        (n) =>
          n.when === "due" &&
          n.dueDateISO === todayISO &&
          !(n.isDoneOnDueDate || n.statusOnDueDate === "FEITO")
      ),
    [notifications, todayISO]
  );

  const handleNavigateToActivity = (n) => {
    if (!n.condominioId || !n.atividadeId) return;
    onClose(); // Fecha o modal
    router.push(`/atividades/${n.condominioId}?atividadeId=${n.atividadeId}`);
  };

  const renderItem = (n) => {
    const key = `${n.atividadeId ?? n.title}-${n.dueDateISO}`;
    const primary = n.nameOnly || n.title || "Atividade";
    const secondary = n.details || "Pendente para hoje";
    const canNavigate = Boolean(n.condominioId && n.atividadeId);

    return (
      <ListItem
        key={key}
        sx={{
          backgroundColor: alpha(theme.palette.warning.main, 0.12),
          borderRadius: 2,
          mb: 1,
          boxShadow: theme.shadows[1],
          "&:last-of-type": { mb: 0 },
          cursor: canNavigate ? "pointer" : "default",
          "&:hover": canNavigate ? {
            backgroundColor: alpha(theme.palette.warning.main, 0.2),
          } : {},
          pr: 7, // Espaço para o botão
        }}
        onClick={() => canNavigate && handleNavigateToActivity(n)}
      >
        <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
          <ListItemText
            primary={primary}
            secondary={[
              secondary,
              n.condominioName ? `Condomínio: ${n.condominioName}` : null,
            ]
              .filter(Boolean)
              .join(" • ")}
            primaryTypographyProps={{ fontWeight: 600 }}
          />
          <Chip
            size="small"
            label="Pendente"
            sx={{
              ml: 2,
              bgcolor: alpha(theme.palette.warning.main, 0.18),
              color: theme.palette.warning.main,
            }}
          />
        </Box>
        {canNavigate && (
          <ListItemSecondaryAction>
            <Tooltip title="Ir para atividade">
              <IconButton
                edge="end"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigateToActivity(n);
                }}
                sx={{ color: theme.palette.primary.main }}
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </ListItemSecondaryAction>
        )}
      </ListItem>
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="notifications-modal-title"
    >
      <Box sx={modalStyle(theme)}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography
            id="notifications-modal-title"
            variant="h6"
            component="h2"
          >
            Atividades de hoje
          </Typography>
          <Chip label={formatDate(today)} color="default" variant="outlined" />
        </Stack>

        {notifLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <>
            {notifError && (
              <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                {notifError}
              </Typography>
            )}

            {/* Não feitas hoje */}
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Não feitas hoje
                </Typography>
                <Chip
                  size="small"
                  label={naoFeitasHoje.length}
                  color={naoFeitasHoje.length ? "warning" : "default"}
                  variant={naoFeitasHoje.length ? "filled" : "outlined"}
                />
              </Stack>
              <List
                sx={{
                  bgcolor: theme.palette.background.default,
                  borderRadius: 2,
                  p: 1,
                }}
              >
                {naoFeitasHoje.length ? (
                  naoFeitasHoje.map((n) => renderItem(n))
                ) : (
                  <ListItem>
                    <ListItemText primary="Sem pendências para hoje." />
                  </ListItem>
                )}
              </List>
            </Box>
          </>
        )}
      </Box>
    </Modal>
  );
}
