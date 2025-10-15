"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { isTaskDueToday, getNextDueDate, sortTasksByNextDueDate } from "@/utils/dateLogic";

const mockActivities = [
  {
    id: 1,
    name: "Verificar extintores",
    frequency: "A cada seis meses",
    startDate: "2025-05-15",
  },
  {
    id: 2,
    name: "Limpeza diária do hall de entrada",
    frequency: "Todos os dias",
    startDate: "2025-01-01",
  },
  {
    id: 3,
    name: "Coleta de lixo orgânico",
    frequency: "Em dias alternados",
    startDate: "2025-10-14",
  },
  {
    id: 4,
    name: "Manutenção do portão da garagem",
    frequency: "A cada mês",
    startDate: "2025-09-15",
  },
  {
    id: 5,
    name: "Relatório financeiro semanal",
    frequency: "A cada semana",
    startDate: "2025-10-08",
  },
  {
    id: 6,
    name: "Limpeza da piscina",
    frequency: "Segunda a sábado",
    startDate: "2025-01-01",
  },
];

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
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState(mockActivities);

  const today = useMemo(() => new Date(), [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    setLoading(true);

    const timeout = setTimeout(() => {
      setActivities(sortTasksByNextDueDate(mockActivities, today));
      setLoading(false);
    }, 400);

    return () => clearTimeout(timeout);
  }, [open, today]);

  const todayTasks = useMemo(
    () => activities.filter((task) => isTaskDueToday(task, today)),
    [activities, today]
  );

  const upcomingTasks = useMemo(
    () =>
      activities
        .filter((task) => !isTaskDueToday(task, today))
        .map((task) => ({
          ...task,
          nextDueDate: getNextDueDate(task, today),
        }))
        .sort((a, b) => {
          if (!a.nextDueDate && !b.nextDueDate) return 0;
          if (!a.nextDueDate) return 1;
          if (!b.nextDueDate) return -1;
          return a.nextDueDate.getTime() - b.nextDueDate.getTime();
        }),
    [activities, today]
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

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <>
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
                        secondary={`Frequência: ${task.frequency}`}
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
                          task.nextDueDate
                            ? `Próxima ocorrência: ${formatDate(task.nextDueDate)} • Frequência: ${task.frequency}`
                            : `Frequência: ${task.frequency}`
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
