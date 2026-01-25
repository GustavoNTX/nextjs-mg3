"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  useTheme,
  alpha,
  Divider,
  Stack,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  AttachMoney as AttachMoneyIcon,
  Group as GroupIcon,
  Category as CategoryIcon,
  PriorityHigh as PriorityHighIcon,
  Schedule as ScheduleIcon,
  Apartment as ApartmentIcon,
  BarChart as BarChartIcon,
} from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { useCondominios } from "@/contexts/CondominiosContext";

const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => {
  const theme = useTheme();
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        transition: "box-shadow 0.3s, transform 0.2s",
        "&:hover": {
          boxShadow: theme.shadows[4],
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ color: color || "text.primary" }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {Icon && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(color || theme.palette.primary.main, 0.1),
              }}
            >
              <Icon sx={{ fontSize: 28, color: color || theme.palette.primary.main }} />
            </Box>
          )}
        </Stack>
        {trend !== undefined && (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
            <TrendingUpIcon
              sx={{ fontSize: 16, color: trend >= 0 ? "success.main" : "error.main" }}
            />
            <Typography
              variant="caption"
              sx={{ color: trend >= 0 ? "success.main" : "error.main", fontWeight: 600 }}
            >
              {trend >= 0 ? "+" : ""}{trend}%
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

const ChartCard = ({ title, children, icon: Icon }) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: "100%",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        {Icon && <Icon sx={{ color: "primary.main" }} />}
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
      </Stack>
      <Divider sx={{ mb: 2 }} />
      {children}
    </Paper>
  );
};

const ProgressBar = ({ label, value, total, color }) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="body2" fontWeight={500}>
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {value} ({percentage}%)
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: (theme) => alpha(color || theme.palette.primary.main, 0.1),
          "& .MuiLinearProgress-bar": {
            borderRadius: 4,
            bgcolor: color,
          },
        }}
      />
    </Box>
  );
};

const HorizontalBar = ({ data, colorMap }) => {
  const theme = useTheme();
  const maxValue = Math.max(...data.map((d) => d.count), 1);

  return (
    <Box>
      {data.map((item, idx) => (
        <Box key={idx} sx={{ mb: 2 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: "60%" }}>
              {item.label || item.name || "—"}
            </Typography>
            <Typography variant="body2" fontWeight={600} color="primary.main">
              {item.count}
            </Typography>
          </Stack>
          <Box
            sx={{
              height: 8,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                height: "100%",
                width: `${(item.count / maxValue) * 100}%`,
                bgcolor: colorMap?.[item.label] || theme.palette.primary.main,
                borderRadius: 4,
                transition: "width 0.5s ease",
              }}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
};

const StatusChip = ({ status, count }) => {
  const statusConfig = {
    PENDENTE: { color: "warning", label: "Pendente" },
    EM_ANDAMENTO: { color: "info", label: "Em Andamento" },
    FEITO: { color: "success", label: "Concluído" },
    ATRASADO: { color: "error", label: "Atrasado" },
    PROXIMAS: { color: "default", label: "Próximas" },
    PULADO: { color: "default", label: "Pulado" },
  };

  const config = statusConfig[status] || { color: "default", label: status };

  return (
    <Chip
      label={`${config.label}: ${count}`}
      color={config.color}
      size="medium"
      sx={{ fontWeight: 600 }}
    />
  );
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
};

const prioridadeColors = {
  BAIXO: "#4caf50",
  MEDIO: "#ff9800",
  ALTO: "#f44336",
  URGENTE: "#9c27b0",
};

const budgetStatusLabels = {
  SEM_ORCAMENTO: "Sem Orçamento",
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  REPROVADO: "Reprovado",
};

export default function RelatoriosPage() {
  const theme = useTheme();
  const { fetchWithAuth } = useAuth();
  const { items: condominios } = useCondominios();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [selectedCondominio, setSelectedCondominio] = useState("");

  const fetchRelatorios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = selectedCondominio
        ? `/api/relatorios?condominioId=${selectedCondominio}`
        : "/api/relatorios";
      const res = await fetchWithAuth(url);
      if (!res.ok) {
        throw new Error("Falha ao carregar relatórios");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError(err.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, selectedCondominio]);

  useEffect(() => {
    fetchRelatorios();
  }, [fetchRelatorios]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography color="text.secondary">Nenhum dado disponível</Typography>
      </Box>
    );
  }

  const { resumo, statusHoje, porPrioridade, porTipoAtividade, porEquipe, porFrequencia, porBudgetStatus, porCondominio, evolucaoMensal } = data;

  return (
    <Box sx={{ pb: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Relatórios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visão geral das atividades e métricas do sistema
          </Typography>
        </Box>
        <FormControl sx={{ minWidth: 250 }} size="small">
          <InputLabel>Filtrar por Condomínio</InputLabel>
          <Select
            value={selectedCondominio}
            label="Filtrar por Condomínio"
            onChange={(e) => setSelectedCondominio(e.target.value)}
          >
            <MenuItem value="">Todos os Condomínios</MenuItem>
            {condominios.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Cards de Resumo */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total de Atividades"
            value={resumo.totalAtividades}
            icon={AssignmentIcon}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Condomínios"
            value={resumo.totalCondominios}
            icon={ApartmentIcon}
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Concluídas este Mês"
            value={resumo.concluidasMes}
            icon={CheckCircleIcon}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Taxa de Conclusão"
            value={`${resumo.taxaConclusao}%`}
            subtitle="baseado no histórico"
            icon={TrendingUpIcon}
            color={resumo.taxaConclusao >= 70 ? theme.palette.success.main : theme.palette.warning.main}
          />
        </Grid>
      </Grid>

      {/* Custos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <StatCard
            title="Custo Estimado Total"
            value={formatCurrency(resumo.custoEstimadoTotal)}
            icon={AttachMoneyIcon}
            color={theme.palette.warning.main}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <StatCard
            title="Orçamento Aprovado Total"
            value={formatCurrency(resumo.orcamentoAprovadoTotal)}
            icon={AttachMoneyIcon}
            color={theme.palette.success.main}
          />
        </Grid>
      </Grid>

      {/* Status Hoje */}
      {statusHoje && statusHoje.length > 0 && (
        <Paper elevation={0} sx={{ p: 3, mb: 4, border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <ScheduleIcon sx={{ color: "primary.main" }} />
            <Typography variant="h6" fontWeight={600}>
              Status das Atividades Hoje
            </Typography>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {statusHoje.map((s) => (
              <StatusChip key={s.status} status={s.status} count={s.count} />
            ))}
          </Stack>
        </Paper>
      )}

      {/* Gráficos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Por Prioridade */}
        <Grid item xs={12} md={6}>
          <ChartCard title="Por Prioridade" icon={PriorityHighIcon}>
            {porPrioridade && porPrioridade.length > 0 ? (
              <HorizontalBar
                data={porPrioridade.map((p) => ({ label: p.prioridade, count: p.count }))}
                colorMap={prioridadeColors}
              />
            ) : (
              <Typography color="text.secondary">Sem dados</Typography>
            )}
          </ChartCard>
        </Grid>

        {/* Por Tipo de Atividade */}
        <Grid item xs={12} md={6}>
          <ChartCard title="Por Tipo de Atividade" icon={CategoryIcon}>
            {porTipoAtividade && porTipoAtividade.length > 0 ? (
              <HorizontalBar
                data={porTipoAtividade.map((t) => ({ label: t.tipo, count: t.count }))}
              />
            ) : (
              <Typography color="text.secondary">Sem dados</Typography>
            )}
          </ChartCard>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Por Equipe */}
        <Grid item xs={12} md={6}>
          <ChartCard title="Por Equipe" icon={GroupIcon}>
            {porEquipe && porEquipe.length > 0 ? (
              <HorizontalBar
                data={porEquipe.map((e) => ({ label: e.equipe, count: e.count }))}
              />
            ) : (
              <Typography color="text.secondary">Sem dados</Typography>
            )}
          </ChartCard>
        </Grid>

        {/* Por Frequência */}
        <Grid item xs={12} md={6}>
          <ChartCard title="Por Frequência" icon={ScheduleIcon}>
            {porFrequencia && porFrequencia.length > 0 ? (
              <HorizontalBar
                data={porFrequencia.map((f) => ({ label: f.frequencia, count: f.count }))}
              />
            ) : (
              <Typography color="text.secondary">Sem dados</Typography>
            )}
          </ChartCard>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Por Status de Orçamento */}
        <Grid item xs={12} md={6}>
          <ChartCard title="Status de Orçamento" icon={AttachMoneyIcon}>
            {porBudgetStatus && porBudgetStatus.length > 0 ? (
              <HorizontalBar
                data={porBudgetStatus.map((b) => ({
                  label: budgetStatusLabels[b.status] || b.status,
                  count: b.count,
                }))}
              />
            ) : (
              <Typography color="text.secondary">Sem dados</Typography>
            )}
          </ChartCard>
        </Grid>

        {/* Por Condomínio (Top 10) */}
        <Grid item xs={12} md={6}>
          <ChartCard title="Atividades por Condomínio (Top 10)" icon={BusinessIcon}>
            {porCondominio && porCondominio.length > 0 ? (
              <HorizontalBar
                data={porCondominio.map((c) => ({ label: c.name, count: c.count }))}
              />
            ) : (
              <Typography color="text.secondary">Sem dados</Typography>
            )}
          </ChartCard>
        </Grid>
      </Grid>

      {/* Evolução Mensal */}
      {evolucaoMensal && (evolucaoMensal.criadas?.length > 0 || evolucaoMensal.concluidas?.length > 0) && (
        <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <BarChartIcon sx={{ color: "primary.main" }} />
            <Typography variant="h6" fontWeight={600}>
              Evolução Mensal (Últimos 6 meses)
            </Typography>
          </Stack>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom color="text.secondary">
                Atividades Criadas
              </Typography>
              {evolucaoMensal.criadas?.length > 0 ? (
                evolucaoMensal.criadas.map((m) => (
                  <ProgressBar
                    key={m.mes}
                    label={m.mes}
                    value={m.count}
                    total={Math.max(...evolucaoMensal.criadas.map((x) => x.count))}
                    color={theme.palette.primary.main}
                  />
                ))
              ) : (
                <Typography color="text.secondary" variant="body2">Sem dados</Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom color="text.secondary">
                Atividades Concluídas
              </Typography>
              {evolucaoMensal.concluidas?.length > 0 ? (
                evolucaoMensal.concluidas.map((m) => (
                  <ProgressBar
                    key={m.mes}
                    label={m.mes}
                    value={m.count}
                    total={Math.max(...evolucaoMensal.concluidas.map((x) => x.count))}
                    color={theme.palette.success.main}
                  />
                ))
              ) : (
                <Typography color="text.secondary" variant="body2">Sem dados</Typography>
              )}
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}
