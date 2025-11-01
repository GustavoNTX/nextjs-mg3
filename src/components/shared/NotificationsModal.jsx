// components/NotificationsModal.jsx
"use client";

import React, { useEffect, useMemo } from "react";
import {
  Modal,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Chip,
  Stack,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useAtividadesOptional } from "@/contexts/AtividadesContext";

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

  // YYYY-MM-DD no fuso de Fortaleza
  const todayISO = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Fortaleza" })
  )
    .toISOString()
    .slice(0, 10);

  // Notificações de HOJE (when === "due")
  const dueToday = useMemo(
    () =>
      notifications.filter(
        (n) => n.when === "due" && n.dueDateISO === todayISO
      ),
    [notifications, todayISO]
  );

  const feitasHoje = useMemo(
    () =>
      dueToday.filter(
        (n) => n.isDoneOnDueDate || n.statusOnDueDate === "FEITO"
      ),
    [dueToday]
  );

  const naoFeitasHoje = useMemo(
    () =>
      dueToday.filter(
        (n) => !(n.isDoneOnDueDate || n.statusOnDueDate === "FEITO")
      ),
    [dueToday]
  );

  const renderItem = (n, done) => {
    const key = `${n.atividadeId ?? n.title}-${n.dueDateISO}`;
    const primary = n.title || n.nameOnly || "Atividade";
    const secondary =
      n.details ||
      (done ? "Concluída hoje" : "Pendente para hoje");

    return (
      <ListItem
        key={key}
        sx={{
          backgroundColor: done
            ? alpha(theme.palette.success.main, 0.18)
            : alpha(theme.palette.warning.main, 0.12),
          borderRadius: 2,
          mb: 1,
          boxShadow: theme.shadows[1],
          "&:last-of-type": { mb: 0 },
        }}
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
            label={done ? "Feito" : "Pendente"}
            sx={{
              ml: 2,
              bgcolor: alpha(
                done ? theme.palette.success.main : theme.palette.warning.main,
                0.18
              ),
              color: done
                ? theme.palette.success.main
                : theme.palette.warning.main,
            }}
          />
        </Box>
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

            {/* Feitas hoje */}
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Feitas hoje
                </Typography>
                <Chip
                  size="small"
                  label={feitasHoje.length}
                  color={feitasHoje.length ? "success" : "default"}
                  variant={feitasHoje.length ? "filled" : "outlined"}
                />
              </Stack>
              <List
                sx={{
                  bgcolor: theme.palette.background.default,
                  borderRadius: 2,
                  p: 1,
                }}
              >
                {feitasHoje.length ? (
                  feitasHoje.map((n) => renderItem(n, true))
                ) : (
                  <ListItem>
                    <ListItemText primary="Nada concluído ainda hoje." />
                  </ListItem>
                )}
              </List>
            </Box>

            <Divider />

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
                  naoFeitasHoje.map((n) => renderItem(n, false))
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
