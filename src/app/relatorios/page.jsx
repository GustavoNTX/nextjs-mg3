"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
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
  Button,
  IconButton,
  Tooltip,
  Skeleton,
  useMediaQuery,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  AttachMoney as AttachMoneyIcon,
  Group as GroupIcon,
  PriorityHigh as PriorityHighIcon,
  Schedule as ScheduleIcon,
  Apartment as ApartmentIcon,
  BarChart as BarChartIcon,
  Refresh as RefreshIcon,
  AccessTime as AccessTimeIcon,
  TrendingFlat as TrendingFlatIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Timer as TimerIcon,
  Warning as WarningIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Speed as SpeedIcon,
  Download as DownloadIcon,
  Summarize as SummarizeIcon,
} from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { useCondominios } from "@/contexts/CondominiosContext";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ptBR } from "date-fns/locale";

// ============ COMPONENTES DE GRÁFICOS ============
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

// ============ CONSTANTES ============
const prioridadeColors = {
  BAIXO: "#4caf50",
  MEDIO: "#ff9800",
  ALTO: "#f44336",
  URGENTE: "#9c27b0",
};

const tipoAtividadeColors = {
  MANUTENCAO: "#0088FE",
  LIMPEZA: "#00C49F",
  SEGURANCA: "#FFBB28",
  ADMINISTRATIVO: "#FF8042",
  OUTROS: "#8884d8",
};

const budgetStatusLabels = {
  SEM_ORCAMENTO: "Sem Orçamento",
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  REPROVADO: "Reprovado",
};

const budgetStatusColors = {
  SEM_ORCAMENTO: "#9e9e9e",
  PENDENTE: "#ff9800",
  APROVADO: "#4caf50",
  REPROVADO: "#f44336",
};

const periodos = [
  { value: "todos", label: "Todo o período" },
  { value: "hoje", label: "Hoje" },
  { value: "semana", label: "Esta semana" },
  { value: "mes_atual", label: "Este mês" },
  { value: "mes_anterior", label: "Mês anterior" },
  { value: "trimestre", label: "Este trimestre" },
  { value: "ano", label: "Este ano" },
  { value: "personalizado", label: "Personalizado" },
];

// ============ UTILITÁRIOS ============
const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat("pt-BR").format(value || 0);
};

// ============ COMPONENTES AUXILIARES ============
const MetricCard = ({ title, value, subtitle, icon: Icon, color, trend, loading = false }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  if (loading) {
    return (
      <Card elevation={0} sx={{ height: "100%", borderRadius: 2, minHeight: 100 }}>
        <CardContent sx={{ p: 1.5 }}>
          <Skeleton variant="text" width="60%" height={16} />
          <Skeleton variant="text" width="80%" height={32} sx={{ mt: 0.5 }} />
          <Skeleton variant="text" width="40%" height={16} sx={{ mt: 0.5 }} />
        </CardContent>
      </Card>
    );
  }

  const showTrend = trend !== undefined && trend !== null && typeof trend === 'number';
  const TrendIcon = showTrend
    ? (trend > 0 ? ArrowUpwardIcon : trend < 0 ? ArrowDownwardIcon : TrendingFlatIcon)
    : null;
  const trendColor = showTrend
    ? (trend > 0 ? theme.palette.success.main : trend < 0 ? theme.palette.error.main : theme.palette.info.main)
    : null;

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        minHeight: 100,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        background: `linear-gradient(135deg, ${alpha(color || theme.palette.primary.main, 0.05)} 0%, ${alpha(color || theme.palette.primary.main, 0.02)} 100%)`,
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: theme.shadows[2],
          transform: "translateY(-1px)",
          borderColor: alpha(color || theme.palette.primary.main, 0.3),
        },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={0.5}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={500} gutterBottom noWrap>
              {title}
            </Typography>
            <Typography variant={isSmall ? "h6" : "h5"} fontWeight={700} sx={{ color: color || "text.primary", mb: 0.5 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {subtitle}
              </Typography>
            )}
          </Box>
          {Icon && (
            <Box
              sx={{
                p: 0.75,
                borderRadius: 1,
                bgcolor: alpha(color || theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon sx={{ fontSize: 20, color: color || theme.palette.primary.main }} />
            </Box>
          )}
        </Stack>
        {showTrend && (
          <Stack direction="row" alignItems="center" spacing={0.25} sx={{ mt: 0.5 }}>
            <TrendIcon sx={{ fontSize: 12, color: trendColor }} />
            <Typography
              variant="caption"
              sx={{ color: trendColor, fontWeight: 600 }}
            >
              {trend > 0 ? "+" : ""}{trend}%
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.25 }}>
              vs período
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

const ChartCard = ({ title, children, icon: Icon, action, loading = false, sx = {} }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  if (loading) {
    return (
      <Paper elevation={0} sx={{ p: 1.5, height: "100%", borderRadius: 2, ...sx }}>
        <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1.5 }} />
        <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 1 }} />
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        height: "100%",
        minHeight: isSmall ? 240 : 260,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        ...sx,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          {Icon && <Icon sx={{ color: "primary.main", fontSize: 16 }} />}
          <Typography variant="subtitle2" fontWeight={600} fontSize={isSmall ? "0.85rem" : "0.9rem"}>
            {title}
          </Typography>
        </Stack>
        {action && (
          <Button size="small" variant="outlined" onClick={action} sx={{ fontSize: '0.7rem', py: 0.25 }}>
            Ver mais
          </Button>
        )}
      </Stack>
      <Divider sx={{ mb: 1.5 }} />
      <Box sx={{ flex: 1, width: '100%', height: '100%', minHeight: isSmall ? 180 : 200 }}>
        {children}
      </Box>
    </Paper>
  );
};

const HorizontalBar = ({ data, colorMap, showValues = true }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const maxValue = Math.max(...data.map((d) => d.count), 1);

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {data.map((item, idx) => {
        const percentage = (item.count / maxValue) * 100;
        const color = colorMap?.[item.label] || colorMap?.[item.name] || theme.palette.primary.main;

        return (
          <Box key={idx} sx={{ mb: 1 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
              <Typography variant="caption" fontWeight={500} sx={{ flex: 1 }} noWrap fontSize={isSmall ? "0.7rem" : "0.75rem"}>
                {item.label || item.name || "—"}
              </Typography>
              {showValues && (
                <Typography variant="caption" fontWeight={600} color="text.primary" fontSize={isSmall ? "0.7rem" : "0.75rem"}>
                  {item.count}
                </Typography>
              )}
            </Stack>
            <Box
              sx={{
                height: 4,
                bgcolor: alpha(theme.palette.grey[300], 0.5),
                borderRadius: 2,
                overflow: "hidden",
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  width: `${percentage}%`,
                  bgcolor: color,
                  backgroundImage: `linear-gradient(90deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
                  borderRadius: 2,
                  transition: "width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  position: 'relative',
                }}
              />
            </Box>
            {showValues && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block', fontSize: '0.65rem' }}>
                {Math.round(percentage)}%
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

const StatusChip = ({ status, count }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const statusConfig = {
    PENDENTE: { color: "warning", label: "Pendente", icon: PendingIcon },
    EM_ANDAMENTO: { color: "info", label: "Em And.", icon: AccessTimeIcon },
    FEITO: { color: "success", label: "Concluído", icon: CheckCircleIcon },
    ATRASADO: { color: "error", label: "Atrasado", icon: PriorityHighIcon },
    PROXIMAS: { color: "default", label: "Próximas", icon: ScheduleIcon },
    PULADO: { color: "default", label: "Pulado", icon: TrendingFlatIcon },
  };

  const config = statusConfig[status] || { color: "default", label: status, icon: AssignmentIcon };
  const Icon = config.icon;

  return (
    <Chip
      icon={<Icon />}
      label={isSmall ? `${count}` : `${config.label}: ${count}`}
      color={config.color}
      variant="outlined"
      size="small"
      sx={{
        fontWeight: 500,
        borderWidth: 1,
        fontSize: isSmall ? '0.7rem' : '0.75rem',
        height: isSmall ? 28 : 32,
        '& .MuiChip-icon': {
          fontSize: 14,
          mr: isSmall ? 0.25 : 0.5,
        }
      }}
    />
  );
};

// ============ COMPONENTES DE GRÁFICOS ESPECÍFICOS ============
const CustomBarChart = ({ data, xKey, yKey, colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'], height = 180 }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  if (!data || data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography color="text.secondary">Sem dados</Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 5, left: -10, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis
          dataKey={xKey}
          axisLine={false}
          tickLine={false}
          tick={{ fill: theme.palette.text.secondary, fontSize: isSmall ? 9 : 10 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: theme.palette.text.secondary, fontSize: isSmall ? 9 : 10 }}
        />
        <RechartsTooltip
          contentStyle={{
            borderRadius: 6,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            fontSize: isSmall ? 10 : 11,
          }}
          formatter={(value) => [formatNumber(value), "Quantidade"]}
        />
        <Bar
          dataKey={yKey}
          fill={colors[0]}
          radius={[2, 2, 0, 0]}
          name="Quantidade"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

const CustomPieChart = ({ data, dataKey, nameKey, colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'], height = 180 }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  if (!data || data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography color="text.secondary">Sem dados</Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={isSmall ? 50 : 60}
          fill="#8884d8"
          dataKey={dataKey}
          nameKey={nameKey}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <RechartsTooltip
          formatter={(value) => [formatNumber(value), "Quantidade"]}
          contentStyle={{
            borderRadius: 6,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            fontSize: isSmall ? 10 : 11,
          }}
        />
        <Legend wrapperStyle={{ fontSize: isSmall ? '10px' : '11px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

const CustomLineChart = ({ data, xKey, yKey, stroke = '#8884d8', height = 180 }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  if (!data || data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography color="text.secondary">Sem dados</Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 5, left: -10, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis
          dataKey={xKey}
          axisLine={false}
          tickLine={false}
          tick={{ fill: theme.palette.text.secondary, fontSize: isSmall ? 9 : 10 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: theme.palette.text.secondary, fontSize: isSmall ? 9 : 10 }}
        />
        <RechartsTooltip
          contentStyle={{
            borderRadius: 6,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            fontSize: isSmall ? 10 : 11,
          }}
          formatter={(value) => [formatNumber(value), "Quantidade"]}
        />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={stroke}
          strokeWidth={2}
          dot={{ r: 2, strokeWidth: 1 }}
          activeDot={{ r: 3, strokeWidth: 1 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const BudgetStatusChart = ({ porBudgetStatus, height = 180 }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  if (!porBudgetStatus || porBudgetStatus.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography color="text.secondary">Sem dados</Typography>
      </Box>
    );
  }

  const data = porBudgetStatus.map(b => ({
    name: budgetStatusLabels[b.status] || b.status,
    count: b.count,
    color: budgetStatusColors[b.status] || theme.palette.primary.main
  }));

  return (
    <Box sx={{ width: '100%', height: height }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 10, right: 5, left: -10, bottom: isSmall ? 40 : 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="name"
            angle={isSmall ? -60 : -45}
            textAnchor="end"
            height={isSmall ? 45 : 35}
            tick={{ fontSize: isSmall ? 9 : 10 }}
          />
          <YAxis tick={{ fontSize: isSmall ? 9 : 10 }} />
          <RechartsTooltip
            formatter={(value) => [formatNumber(value), "Quantidade"]}
            contentStyle={{ fontSize: isSmall ? 10 : 11 }}
          />
          <Bar
            dataKey="count"
            fill={theme.palette.primary.main}
            radius={[2, 2, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

// ============ FUNÇÃO PARA CALCULAR DADOS DINÂMICOS ============
const calcularDadosDinamicos = (data, periodo, theme) => {
  // ✅ Verificação segura de dados
  if (!data) {
    return {
      statusProgress: [],
      tempoMedioResolucao: "N/A",
      eficiencia: "0%",
      velocidadeResposta: "N/A",
      dailyEvolution: [],
      estatisticasDetalhadas: [],
      atividadesAtrasadas: 0,
      trends: {}
    };
  }

  const {
    resumo = {},
    statusHoje = [],
    porPrioridade = [],
    porBudgetStatus = [],
    evolucaoMensal = []
  } = data;

  const totalAtividades = resumo?.totalAtividades || 0;
  const totalAtividadesMes = totalAtividades > 0 ? totalAtividades : 1;
  const concluidasMes = resumo?.concluidasMes || 0;

  const getStatusCount = (status) => {
    return statusHoje?.find(s => s.status === status)?.count || 0;
  };

  const statusProgress = [
    {
      label: "Concluído",
      value: totalAtividadesMes > 0 ? Math.round((concluidasMes / totalAtividadesMes) * 100) : 0,
      count: concluidasMes
    },
    {
      label: "Em Andamento",
      value: totalAtividadesMes > 0 ? Math.round((getStatusCount('EM_ANDAMENTO') / totalAtividadesMes) * 100) : 0,
      count: getStatusCount('EM_ANDAMENTO')
    },
    {
      label: "Pendente",
      value: totalAtividadesMes > 0 ? Math.round((getStatusCount('PENDENTE') / totalAtividadesMes) * 100) : 0,
      count: getStatusCount('PENDENTE')
    },
    {
      label: "Atrasado",
      value: totalAtividadesMes > 0 ? Math.round((getStatusCount('ATRASADO') / totalAtividadesMes) * 100) : 0,
      count: getStatusCount('ATRASADO')
    },
  ];

  const tempoMedioResolucao = resumo?.tempoMedioResolucao
    ? `${resumo.tempoMedioResolucao} dias`
    : (concluidasMes > 0 ? `${Math.round((30 / concluidasMes) * 10) / 10} dias` : "N/A");

  const eficiencia = resumo?.eficiencia ||
    (totalAtividades > 0 ? `${Math.round((concluidasMes / totalAtividades) * 100)}%` : "0%");

  const atividadesUrgentes = porPrioridade?.find(p => p.prioridade === 'ALTO' || p.prioridade === 'URGENTE')?.count || 0;
  const velocidadeResposta = resumo?.velocidadeResposta ||
    (atividadesUrgentes > 0 ? `${Math.round(24 / (atividadesUrgentes + 1))}h` : "24h");

  // ✅ Processa evolucaoMensal corretamente
  let dailyEvolution = [];
  if (evolucaoMensal && Array.isArray(evolucaoMensal) && evolucaoMensal.length > 0) {
    dailyEvolution = evolucaoMensal.map(item => ({
      date: item.data ? new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '',
      activities: item.total || 0,
      concluidas: item.concluidas || 0
    }));
  }

  const orcamentosPendentes = porBudgetStatus?.find(b => b.status === 'PENDENTE')?.count || 0;
  const totalOrcamentos = porBudgetStatus?.reduce((acc, curr) => acc + curr.count, 0) || 1;
  const atividadesAtrasadas = getStatusCount('ATRASADO');

  const porcentagemConcluidas = totalAtividadesMes > 0 ? Math.round((concluidasMes / totalAtividadesMes) * 100) : 0;
  const porcentagemPendentes = totalAtividadesMes > 0 ? Math.round((getStatusCount('PENDENTE') / totalAtividadesMes) * 100) : 0;
  const porcentagemAtrasadas = totalAtividadesMes > 0 ? Math.round((atividadesAtrasadas / totalAtividadesMes) * 100) : 0;
  const porcentagemOrcamentosPendentes = totalOrcamentos > 0 ? Math.round((orcamentosPendentes / totalOrcamentos) * 100) : 0;

  const atividadesPorDia = Math.round(totalAtividades / 30);
  const metaAtividadesPorDia = 50;
  const porcentagemAtividadesPorDia = Math.min(100, Math.round((atividadesPorDia / metaAtividadesPorDia) * 100));

  const estatisticasDetalhadas = [
    {
      label: "Atividades Concluídas",
      value: concluidasMes,
      porcentagem: porcentagemConcluidas,
      color: theme.palette.success.main,
      meta: 100
    },
    {
      label: "Atividades Pendentes",
      value: getStatusCount('PENDENTE'),
      porcentagem: porcentagemPendentes,
      color: theme.palette.warning.main,
      meta: 10
    },
    {
      label: "Atividades Atrasadas",
      value: atividadesAtrasadas,
      porcentagem: porcentagemAtrasadas,
      color: theme.palette.error.main,
      meta: 0
    },
    {
      label: "Orçamentos Pendentes",
      value: orcamentosPendentes,
      porcentagem: porcentagemOrcamentosPendentes,
      color: theme.palette.info.main,
      meta: 10
    },
    {
      label: "Condomínios Ativos",
      value: resumo?.totalCondominios || 0,
      porcentagem: 100,
      color: theme.palette.primary.main,
      meta: 100
    },
    {
      label: "Atividades por Dia",
      value: atividadesPorDia,
      porcentagem: porcentagemAtividadesPorDia,
      color: theme.palette.secondary.main,
      meta: 100
    },
  ];

  const trends = {
    totalAtividades: null,
    totalCondominios: null,
    taxaConclusao: null,
    orcamentoAprovadoTotal: null,
    tempoMedioResolucao: null,
    atividadesAtrasadas: null
  };

  return {
    statusProgress,
    tempoMedioResolucao,
    eficiencia,
    velocidadeResposta,
    dailyEvolution,
    estatisticasDetalhadas,
    atividadesAtrasadas,
    trends
  };
};

// ============ PÁGINA PRINCIPAL ============
export default function RelatoriosPage() {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const { fetchWithAuth } = useAuth();
  const { items: condominios } = useCondominios();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [selectedCondominio, setSelectedCondominio] = useState("");
  const [periodo, setPeriodo] = useState("todos");
  const [dataInicio, setDataInicio] = useState(null);
  const [dataFim, setDataFim] = useState(null);
  const [exportingRelatorio, setExportingRelatorio] = useState(false);

  const fetchRelatorios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCondominio) params.append("condominioId", selectedCondominio);
      if (periodo) params.append("periodo", periodo);
      if (dataInicio && periodo === "personalizado") params.append("dataInicio", dataInicio.toISOString().split('T')[0]);
      if (dataFim && periodo === "personalizado") params.append("dataFim", dataFim.toISOString().split('T')[0]);

      const url = `/api/relatorios${params.toString() ? `?${params.toString()}` : ''}`;
      console.log("Buscando dados de:", url); // Debug

      const res = await fetchWithAuth(url);

      if (!res.ok) throw new Error("Falha ao carregar relatórios");

      const json = await res.json();
      console.log("Dados recebidos:", json); // Debug
      setData(json);

    } catch (err) {
      console.error("Erro ao buscar relatórios:", err);
      setError(err.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, selectedCondominio, periodo, dataInicio, dataFim]);

  const handleDownloadRelatorioPDF = async () => {
    setExportingRelatorio(true);
    try {
      const params = new URLSearchParams();
      if (selectedCondominio) params.append("condominioId", selectedCondominio);
      if (periodo) params.append("periodo", periodo);
      if (dataInicio && periodo === "personalizado") params.append("dataInicio", dataInicio.toISOString().split('T')[0]);
      if (dataFim && periodo === "personalizado") params.append("dataFim", dataFim.toISOString().split('T')[0]);

      const url = `/api/relatorios/gerar-relatorio${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetchWithAuth(url);

      if (!res.ok) throw new Error("Falha ao gerar relatório");

      const blob = await res.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      link.download = `relatorio-completo-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);
    } catch (err) {
      console.error("Erro ao gerar relatório:", err);
      alert("Erro ao gerar relatório: " + err.message);
    } finally {
      setExportingRelatorio(false);
    }
  };

  useEffect(() => {
    fetchRelatorios();
  }, [fetchRelatorios]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchRelatorios();
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchRelatorios]);

  if (loading && !data) {
    return (
      <Box sx={{ width: '100%', minHeight: '100vh', p: isSmall ? 1 : 2, overflow: 'auto', bgcolor: 'background.default' }}>
        <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 2 }} />
        <Grid container spacing={isSmall ? 1 : 2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={i}>
              <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width: '100%', minHeight: '100vh', display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", p: isSmall ? 1 : 2 }}>
        <Typography variant="h6" color="error" gutterBottom>Erro ao carregar relatórios</Typography>
        <Typography color="text.secondary" paragraph>{error}</Typography>
        <Button variant="contained" onClick={fetchRelatorios} startIcon={<RefreshIcon />} size={isSmall ? "small" : "medium"}>
          Tentar novamente
        </Button>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ width: '100%', minHeight: '100vh', display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", p: isSmall ? 1 : 2 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>Nenhum dado disponível</Typography>
        <Typography color="text.secondary" paragraph>Não há dados de relatórios para os filtros selecionados.</Typography>
        <Button variant="outlined" onClick={fetchRelatorios} startIcon={<RefreshIcon />} size={isSmall ? "small" : "medium"}>
          Recarregar
        </Button>
      </Box>
    );
  }

  // ✅ Extração segura dos dados
  const {
    resumo = {},
    statusHoje = [],
    porPrioridade = [],
    porTipoAtividade = [],
    porEquipe = [],
    porBudgetStatus = [],
    porCondominio = [],
    evolucaoMensal = []
  } = data;

  const topCondominios = porCondominio?.slice(0, 5) || [];
  const dadosCalculados = calcularDadosDinamicos(data, periodo, theme);

  const {
    statusProgress = [],
    tempoMedioResolucao = "N/A",
    eficiencia = "0%",
    velocidadeResposta = "N/A",
    dailyEvolution = [],
    estatisticasDetalhadas = [],
    atividadesAtrasadas = 0,
    trends = {}
  } = dadosCalculados;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ width: '100%', minHeight: '100vh', p: isSmall ? 1 : 2, overflow: 'auto', bgcolor: 'background.default' }}>

        {/* Cabeçalho com Filtros */}
        <Paper elevation={0} sx={{ p: isSmall ? 1.5 : 2, mb: isSmall ? 1.5 : 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={1}>
            <Box>
              <Typography variant={isSmall ? "subtitle1" : "h6"} fontWeight={700} gutterBottom sx={{ color: theme.palette.primary.main }}>
                Dashboard de Relatórios
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Visão geral das atividades e métricas do sistema
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center" sx={{ width: { xs: "100%", md: "auto" } }}>
              <Tooltip title="Recarregar dados">
                <IconButton onClick={fetchRelatorios} disabled={loading} size="small" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                  <RefreshIcon sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
                </IconButton>
              </Tooltip>

              <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 150 } }}>
                <InputLabel>Período</InputLabel>
                <Select value={periodo} label="Período" onChange={(e) => setPeriodo(e.target.value)}>
                  {periodos.map((p) => (
                    <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 200 } }}>
                <InputLabel>Condomínio</InputLabel>
                <Select value={selectedCondominio} label="Condomínio" onChange={(e) => setSelectedCondominio(e.target.value)}>
                  <MenuItem value="">Todos os Condomínios</MenuItem>
                  {condominios.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Tooltip title="Baixar Relatório PDF Completo">
                <IconButton onClick={handleDownloadRelatorioPDF} disabled={exportingRelatorio} size="small" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                  <DownloadIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          {periodo === "personalizado" && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1, pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
              <DatePicker label="Data Início" value={dataInicio} onChange={setDataInicio} slotProps={{ textField: { size: "small", fullWidth: true } }} />
              <DatePicker label="Data Fim" value={dataFim} onChange={setDataFim} slotProps={{ textField: { size: "small", fullWidth: true } }} />
            </Stack>
          )}
        </Paper>

        {/* Cards de Métricas */}
        <Grid container spacing={isSmall ? 1 : 2} sx={{ mb: isSmall ? 1.5 : 2 }}>
          <Grid item xs={6} sm={4} md={3} lg={2}>
            <MetricCard
              title="Total de Atividades"
              value={formatNumber(resumo?.totalAtividades || 0)}
              subtitle={periodo === "todos" ? "todo histórico" : "período selecionado"}
              icon={AssignmentIcon}
              color={theme.palette.primary.main}
              trend={trends.totalAtividades}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={3} lg={2}>
            <MetricCard
              title="Condomínios Ativos"
              value={formatNumber(resumo?.totalCondominios || 0)}
              subtitle="com atividades"
              icon={ApartmentIcon}
              color={theme.palette.info.main}
              trend={trends.totalCondominios}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={3} lg={2}>
            <MetricCard
              title="Taxa de Conclusão"
              value={`${estatisticasDetalhadas[0]?.porcentagem || 0}%`}
              subtitle={periodo === "todos" ? "todo histórico" : "este mês"}
              icon={TrendingUpIcon}
              color={estatisticasDetalhadas[0]?.porcentagem >= 70 ? theme.palette.success.main : theme.palette.warning.main}
              trend={trends.taxaConclusao}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={3} lg={2}>
            <MetricCard
              title="Orçamento Aprovado"
              value={formatCurrency(resumo?.orcamentoAprovadoTotal || 0)}
              subtitle={periodo === "todos" ? "total acumulado" : "total período"}
              icon={AttachMoneyIcon}
              color={theme.palette.success.main}
              trend={trends.orcamentoAprovadoTotal}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={3} lg={2}>
            <MetricCard
              title="Tempo Médio Resolução"
              value={tempoMedioResolucao}
              subtitle="por atividade"
              icon={TimerIcon}
              color={theme.palette.warning.main}
              trend={trends.tempoMedioResolucao}
              loading={loading}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={3} lg={2}>
            <MetricCard
              title="Atividades Atrasadas"
              value={formatNumber(atividadesAtrasadas)}
              subtitle="prioridade alta"
              icon={WarningIcon}
              color={theme.palette.error.main}
              trend={trends.atividadesAtrasadas}
              loading={loading}
            />
          </Grid>
        </Grid>

        {/* Status Hoje + Gráficos */}
        <Grid container spacing={isSmall ? 1 : 2} sx={{ mb: isSmall ? 1.5 : 2 }}>
          <Grid item xs={12} lg={4}>
            <Grid container spacing={isSmall ? 1 : 2}>
              <Grid item xs={12}>
                <ChartCard title="Status das Atividades Hoje" icon={ScheduleIcon}>
                  {statusHoje && statusHoje.length > 0 ? (
                    <Grid container spacing={isSmall ? 0.5 : 1} sx={{ mt: 0.5 }}>
                      {statusHoje.map((s) => (
                        <Grid item xs={6} sm={3} lg={6} key={s.status}>
                          <Box sx={{ p: isSmall ? 1 : 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.02), height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <StatusChip status={s.status} count={s.count} />
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>Sem atividades hoje</Typography>
                  )}
                </ChartCard>
              </Grid>
              <Grid item xs={12}>
                <ChartCard title="Métricas de Performance" icon={SpeedIcon}>
                  <Stack spacing={isSmall ? 0.75 : 1}>
                    <Box sx={{ p: isSmall ? 1 : 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Eficiência</Typography>
                      <Typography variant={isSmall ? "body1" : "h6"} fontWeight={700} color={theme.palette.success.main}>{eficiencia}</Typography>
                    </Box>
                    <Box sx={{ p: isSmall ? 1 : 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Velocidade Resposta</Typography>
                      <Typography variant={isSmall ? "body1" : "h6"} fontWeight={700} color={theme.palette.info.main}>{velocidadeResposta}</Typography>
                    </Box>
                  </Stack>
                </ChartCard>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} lg={8}>
            <Grid container spacing={isSmall ? 1 : 2}>
              <Grid item xs={12} md={6}>
                <ChartCard title="Top 5 Condomínios" icon={BusinessIcon}>
                  {topCondominios.length > 0 ? (
                    <CustomBarChart data={topCondominios} xKey="name" yKey="count" height={isSmall ? 160 : 180} />
                  ) : (
                    <Typography color="text.secondary" textAlign="center" sx={{ py: 6 }}>Sem dados de condomínios</Typography>
                  )}
                </ChartCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <ChartCard title="Distribuição por Tipo" icon={PieChartIcon}>
                  {porTipoAtividade && porTipoAtividade.length > 0 ? (
                    <CustomPieChart data={porTipoAtividade} dataKey="count" nameKey="tipo" height={isSmall ? 160 : 180} />
                  ) : (
                    <Typography color="text.secondary" textAlign="center" sx={{ py: 8 }}>Sem dados por tipo</Typography>
                  )}
                </ChartCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <ChartCard title="Evolução (7 dias)" icon={ShowChartIcon}>
                  {dailyEvolution.length > 0 ? (
                    <CustomLineChart data={dailyEvolution} xKey="date" yKey="activities" stroke={theme.palette.primary.main} height={isSmall ? 160 : 180} />
                  ) : (
                    <Typography color="text.secondary" textAlign="center" sx={{ py: 8 }}>Dados diários insuficientes</Typography>
                  )}
                </ChartCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <ChartCard title="Progresso por Status" icon={TrendingUpIcon}>
                  <Stack spacing={isSmall ? 0.75 : 1}>
                    {statusProgress.map((status, index) => (
                      <Box key={index}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography variant={isSmall ? "caption" : "body2"} fontWeight={500}>{status.label}</Typography>
                          <Typography variant={isSmall ? "caption" : "body2"} color="text.secondary">{status.value}%</Typography>
                        </Stack>
                        <LinearProgress variant="determinate" value={status.value} sx={{ height: 4, borderRadius: 2 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {formatNumber(status.count)} atividades
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </ChartCard>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Estatísticas Detalhadas + Gráficos Adicionais */}
        <Grid container spacing={isSmall ? 1 : 2}>
          <Grid item xs={12} lg={4}>
            <ChartCard title="Estatísticas Detalhadas" icon={SummarizeIcon} sx={{ minHeight: isSmall ? 350 : 380, height: '100%' }}>
              <Stack spacing={isSmall ? 1.5 : 2}>
                {estatisticasDetalhadas.map((estatistica, index) => (
                  <Box key={index}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant={isSmall ? "caption" : "body2"} fontWeight={500}>{estatistica.label}</Typography>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Typography variant={isSmall ? "caption" : "body2"} fontWeight={600}>{formatNumber(estatistica.value)}</Typography>
                        <Typography variant="caption" color="text.secondary">({estatistica.porcentagem}%)</Typography>
                      </Stack>
                    </Stack>
                    <LinearProgress variant="determinate" value={estatistica.porcentagem} sx={{ height: 4, borderRadius: 2 }} />
                  </Box>
                ))}
              </Stack>
            </ChartCard>
          </Grid>

          <Grid item xs={12} lg={8}>
            <Grid container spacing={isSmall ? 1 : 2}>
              <Grid item xs={12} md={6}>
                <ChartCard title="Distribuição por Prioridade" icon={PriorityHighIcon}>
                  {porPrioridade && porPrioridade.length > 0 ? (
                    <Box sx={{ height: isSmall ? 160 : 180, overflowY: 'auto', pr: 1 }}>
                      <HorizontalBar data={porPrioridade.map((p) => ({ label: p.prioridade, count: p.count }))} colorMap={prioridadeColors} showValues={true} />
                    </Box>
                  ) : (
                    <Typography color="text.secondary" textAlign="center" sx={{ py: 6 }}>Sem dados por prioridade</Typography>
                  )}
                </ChartCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <ChartCard title="Atividades por Equipe" icon={GroupIcon}>
                  {porEquipe && porEquipe.length > 0 ? (
                    <Box sx={{ height: isSmall ? 160 : 180, overflowY: 'auto', pr: 1 }}>
                      <HorizontalBar data={porEquipe.map((e) => ({ label: e.equipe, count: e.count }))} showValues={true} />
                    </Box>
                  ) : (
                    <Typography color="text.secondary" textAlign="center" sx={{ py: 8 }}>Sem dados por equipe</Typography>
                  )}
                </ChartCard>
              </Grid>

              <Grid item xs={12}>
                <ChartCard title="Status de Orçamento" icon={AttachMoneyIcon}>
                  {porBudgetStatus && porBudgetStatus.length > 0 ? (
                    <BudgetStatusChart porBudgetStatus={porBudgetStatus} height={isSmall ? 160 : 180} />
                  ) : (
                    <Typography color="text.secondary" textAlign="center" sx={{ py: 8 }}>Sem dados de orçamento</Typography>
                  )}
                </ChartCard>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Footer */}
        <Paper elevation={0} sx={{ mt: isSmall ? 1.5 : 2, p: isSmall ? 1 : 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={1}>
            <Box>
              <Typography variant="caption" color="text.secondary">Última atualização</Typography>
              <Typography variant="caption" fontWeight={500}>
                {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" justifyContent="center">
              <Chip icon={<AssignmentIcon />} label={`${formatNumber(resumo?.totalAtividades || 0)} atividades`} size="small" variant="outlined" />
              <Chip icon={<CheckCircleIcon />} label={`${estatisticasDetalhadas[0]?.porcentagem || 0}% concluído`} size="small" variant="outlined" color="success" />
              <Chip icon={<AssignmentTurnedInIcon />} label={`${formatNumber(atividadesAtrasadas)} atrasadas`} size="small" variant="outlined" color="error" />
              <Chip icon={<AttachMoneyIcon />} label={formatCurrency(resumo?.orcamentoAprovadoTotal || 0)} size="small" variant="outlined" color="warning" />
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
}