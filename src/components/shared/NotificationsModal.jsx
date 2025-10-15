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
import { adaptAtividadesToTasks } from "@/utils/atividadeDate";
import { isTaskDueToday, getNextDueDate, sortTasksByNextDueDate } from "@/utils/dateLogic";

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
  date?.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function NotificationsModal({ open, onClose }) {
  const theme = useTheme();
  const atividades = useAtividadesOptional();
  const empresaItems = atividades?.empresaItems ?? [];
  const empresaLoading = atividades?.empresaLoading ?? false;
  const empresaError = atividades?.empresaError ?? null;
  const loadEmpresa = atividades?.loadEmpresa;

  const today = useMemo(() => new Date(), [open]);

  useEffect(() => {
    if (!open || !loadEmpresa) return;
    loadEmpresa({ reset: true });
  }, [open, loadEmpresa]);

  const tasks = useMemo(() => {
    const adapted = adaptAtividadesToTasks(empresaItems);
    return sortTasksByNextDueDate(adapted, today);
  }, [empresaItems, today]);

  const todayTasks = useMemo(
    () => tasks.filter((task) => isTaskDueToday(task, today)),
    [tasks, today]
  );

  const upcomingTasks = useMemo(
    () =>
      tasks
        .filter((task) => !isTaskDueToday(task, today))
        .map((task) => ({
          ...task,
          nextDueDate: getNextDueDate(task, today),
        })),
    [tasks, today]
  );

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="notifications-modal-title">
      <Box sx={modalStyle(theme)}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography id="notifications-modal-title" variant="h6" component="h2">
            Atividades pendentes
          </Typography>
          <Chip label={formatDate(today)} color="default" variant="outlined" />
        </Stack>

        {empresaLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <>
            {empresaError && (
              <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                {empresaError}
              </Typography>
            )}

            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Para hoje
                </Typography>
                <Chip
                  size="small"
                  label={todayTasks.length}
                  color={todayTasks.length ? "success" : "default"}
                  variant={todayTasks.length ? "filled" : "outlined"}
                />
              </Stack>
              <List sx={{ bgcolor: theme.palette.background.default, borderRadius: 2, p: 1 }}>
                {todayTasks.length ? (
                  todayTasks.map((task) => (
                    <ListItem
                      key={task.id}
                      sx={{
                        backgroundColor: alpha(theme.palette.success.main, 0.18),
                        borderRadius: 2,
                        mb: 1,
                        boxShadow: theme.shadows[1],
                        "&:last-of-type": { mb: 0 },
                      }}
                    >
                      <ListItemText
                        primary={task.name}
                        secondary={
                          [
                            `Frequência: ${task.frequency}`,
                            task.condominioName ? `Condomínio: ${task.condominioName}` : null,
                          ]
                            .filter(Boolean)
                            .join(" • ")
                        }
                        primaryTypographyProps={{ fontWeight: 600 }}
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="Nenhuma atividade prevista para hoje." />
                  </ListItem>
                )}
              </List>
            </Box>

            <Divider />

            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Próximas atividades
                </Typography>
                <Chip
                  size="small"
                  label={upcomingTasks.length}
                  color={upcomingTasks.length ? "primary" : "default"}
                  variant={upcomingTasks.length ? "filled" : "outlined"}
                />
              </Stack>
              <List sx={{ p: 0 }}>
                {upcomingTasks.length ? (
                  upcomingTasks.map((task) => (
                    <ListItem
                      key={task.id}
                      sx={{
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        mb: 1,
                        "&:last-of-type": { mb: 0 },
                      }}
                    >
                      <ListItemText
                        primary={task.name}
                        secondary={
                          [
                            task.nextDueDate
                              ? `Próxima ocorrência: ${formatDate(task.nextDueDate)}`
                              : "Sem próximas ocorrências definidas",
                            `Frequência: ${task.frequency}`,
                            task.condominioName ? `Condomínio: ${task.condominioName}` : null,
                          ]
                            .filter(Boolean)
                            .join(" • ")
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="Todas as atividades estão atualizadas." />
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
