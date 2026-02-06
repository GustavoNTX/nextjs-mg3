"use client";

import React, { useMemo } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  useTheme,
} from "@mui/material";

// Dados existentes no projeto
import { useAtividades } from "@/contexts/AtividadesContext";
import { adaptAtividadesToTasks } from "@/utils/atividadeDate"; // tarefas padronizadas

import {
  inferStatus,
  statusLabel,
  statusColor,
  startOfDayBrasilia,
  formatDate,
  isTaskDueToday,
  getNextDueDate,
} from "@/utils/atividadeStatus"; // status + TZ Brasília

/* ===============================================================
   Analytics local (sem tocar no backend)
   - Distribuição por STATUS
   - Distribuição por FREQUÊNCIA (string já existente em atividade)
   - Notificações (due hoje, pré-alerta próximos N dias, overdue pontuais)
   - Histórico (concluídas)
   =============================================================== */

function normalizeFreqLabel(v) {
  const s = String(v || "Não se repete").trim();
  if (!s) return "Não se repete";
  return s;
}

function isRecurringLabel(freq) {
  const s = normalizeFreqLabel(freq).toLowerCase();
  if (/(nao|não).*repete|pontual|única|unica/.test(s)) return false;
  return /(dia|seman|quinzen|mes|mensal|trimes|semes|ano|anual)/.test(s);
}

function computeResumo(atividades, { leadDays = 1 } = {}) {
  const today = startOfDayBrasilia(new Date());

  // 1) Por STATUS
  const porStatus = { PROXIMAS: 0, EM_ANDAMENTO: 0, PENDENTE: 0, HISTORICO: 0 };

  // 2) Por FREQUÊNCIA
  const porFrequencia = new Map();

  // 3) Notificações (due/pre/overdue)
  const tasks = adaptAtividadesToTasks(atividades);
  const notificacoes = [];

  // 3.1 pré-computa occurrences por data (para "próximos N dias")
  const proximosNDias = [];
  const dayISO = (d) =>
    new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);

  // dates window
  const windowDates = Array.from(
    { length: Math.max(leadDays, 0) + 1 },
    (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    }
  );
  const windowCount = windowDates.reduce((acc, d) => {
    acc[dayISO(d)] = { due: 0, pre: 0 };
    return acc;
  }, {});

  for (const a of atividades) {
    const st = inferStatus(a);
    porStatus[st] = (porStatus[st] || 0) + 1;

    const f = normalizeFreqLabel(a.frequencia);
    porFrequencia.set(f, (porFrequencia.get(f) || 0) + 1);
  }

  for (const t of tasks) {
    // ignora concluídas
    if (inferStatus(t.raw) === "HISTORICO") continue;

    const title = t.raw?.condominio?.name
      ? `${t.name ?? "Atividade"} · ${t.raw.condominio.name}`
      : String(t.name ?? "Atividade");

    // due hoje
    if (isTaskDueToday(t, today)) {
      const iso = dayISO(today);
      notificacoes.push({
        atividadeId: t.id,
        when: "due",
        dueDateISO: iso,
        title,
        nameOnly: t.name,
        details: "Vence hoje",
        condominioId: t.raw?.condominioId ?? null,
        condominioName: t.raw?.condominio?.name ?? null,
      });
      if (windowCount[iso]) windowCount[iso].due += 1;
      continue;
    }

    // próxima ocorrência
    const next = getNextDueDate(t, today);
    if (next) {
      const iso = dayISO(next);
      const diff = Math.round((next - today) / 86400000);
      if (diff >= 0 && diff <= leadDays) {
        notificacoes.push({
          atividadeId: t.id,
          when: diff === 0 ? "due" : "pre",
          dueDateISO: iso,
          title,
          nameOnly: t.name,
          details: diff === 0 ? "Vence hoje" : `Vence em ${diff} dia(s)`,
          condominioId: t.raw?.condominioId ?? null,
          condominioName: t.raw?.condominio?.name ?? null,
        });
        if (windowCount[iso]) {
          if (diff === 0) windowCount[iso].due += 1;
          else windowCount[iso].pre += 1;
        }
      }
      continue;
    }

    // overdue (somente não recorrentes com âncora passada)
    const freq = normalizeFreqLabel(t.raw?.frequencia);
    if (!isRecurringLabel(freq)) {
      const anchor = t.raw?.startAt || t.raw?.expectedDate || t.startDate;
      if (anchor) {
        const d = new Date(anchor);
        d.setHours(0, 0, 0, 0);
        if (d < today) {
          notificacoes.push({
            atividadeId: t.id,
            when: "overdue",
            dueDateISO: dayISO(d),
            title,
            nameOnly: t.name,
            details: "Atrasada",
            condominioId: t.raw?.condominioId ?? null,
            condominioName: t.raw?.condominio?.name ?? null,
          });
        }
      }
    }
  }

  for (const d of windowDates) {
    const iso = dayISO(d);
    proximosNDias.push({ dateISO: iso, ...windowCount[iso] });
  }

  // 4) Histórico simples (concluídas)
  const historicoConcluidas = [...atividades]
    .filter((a) => a?.completedAt)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 20)
    .map((a) => ({
      id: a.id,
      title: a.name,
      dateISO: dayISO(new Date(a.completedAt)),
      condominioName: a?.condominio?.name ?? null,
    }));

  return {
    porStatus,
    porFrequencia,
    notificacoes,
    proximosNDias,
    historicoConcluidas,
  };
}

/* ===============================================================
   Componente de UI
   =============================================================== */
export default function ResumoAtividades({ leadDays = 1 }) {
  const theme = useTheme();
  const { items = [] } = useAtividades();

  const data = useMemo(
    () => computeResumo(items, { leadDays }),
    [items, leadDays]
  );

  const statChip = (label, code) => (
    <Chip
      key={code}
      label={`${label}: ${data.porStatus[code] || 0}`}
      sx={{
        fontWeight: 700,
        bgcolor: theme.palette.background.default,
        color: statusColor(code),
        border: `1px solid ${statusColor(code)}`,
      }}
      size="small"
      variant="outlined"
    />
  );

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6" fontWeight={800}>
          Resumo
        </Typography>

        {/* Top: Status */}
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {statChip("Próximas", "PROXIMAS")}
          {statChip("Em andamento", "EM_ANDAMENTO")}
          {statChip("Pendente", "PENDENTE")}
          {statChip("Histórico", "HISTORICO")}
        </Stack>

        <Divider />

        {/* Frequências */}
        <Typography variant="subtitle2" fontWeight={800}>
          Frequências
        </Typography>
        <Table size="small" aria-label="Frequências">
          <TableHead>
            <TableRow>
              <TableCell>Frequência</TableCell>
              <TableCell align="right">Qtd.</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from(data.porFrequencia.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([freq, count]) => (
                <TableRow key={freq}>
                  <TableCell>{freq}</TableCell>
                  <TableCell align="right">{count}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        <Divider />

        {/* Notificações */}
        <Typography variant="subtitle2" fontWeight={800}>
          Notificações (hoje e próximos {leadDays} dia(s))
        </Typography>
        {data.notificacoes.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Sem notificações no período.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {data.notificacoes.map((n) => (
              <Box
                key={`${n.atividadeId}-${n.dueDateISO}`}
                sx={{ display: "flex", justifyContent: "space-between" }}
              >
                <Typography variant="body2">
                  <strong>{n.title}</strong> — {n.details}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {n.dueDateISO}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}

        <Divider />

        {/* Próximos dias (contagens) */}
        <Typography variant="subtitle2" fontWeight={800}>
          Próximos dias (contagem)
        </Typography>
        <Table size="small" aria-label="Próximos dias">
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell align="right">Due</TableCell>
              <TableCell align="right">Pré</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.proximosNDias.map((d) => (
              <TableRow key={d.dateISO}>
                <TableCell>{d.dateISO}</TableCell>
                <TableCell align="right">{d.due}</TableCell>
                <TableCell align="right">{d.pre}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Divider />

        {/* Histórico (concluídas) */}
        <Typography variant="subtitle2" fontWeight={800}>
          Histórico recente (concluídas)
        </Typography>
        {data.historicoConcluidas.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhuma atividade concluída ainda.
          </Typography>
        ) : (
          <Stack spacing={0.75}>
            {data.historicoConcluidas.map((h) => (
              <Box
                key={h.id}
                sx={{ display: "flex", justifyContent: "space-between" }}
              >
                <Typography variant="body2">
                  <strong>{h.title}</strong>
                  {h.condominioName ? ` · ${h.condominioName}` : ""}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {h.dateISO}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

/* ===============================================================
Como usar:

1) Importe e posicione onde quiser (por ex., ao lado do Kanban/Calendário):

  import ResumoAtividades from "@/components/ResumoAtividades";

  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
    <Box flex={2}><KanbanBoard /></Box>
    <Box flex={1} minWidth={320}><ResumoAtividades leadDays={1} /></Box>
  </Stack>

2) leadDays controla o pré-alerta (ex.: 3 para 72h).

3) A lógica é idempotente e usa os utilitários existentes (recorrência, status e TZ Brasília).
=============================================================== */
