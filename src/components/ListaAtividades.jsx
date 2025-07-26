// src/components/ListaAtividades.jsx
"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  useMediaQuery,
  useTheme,
  Grid, // Importe o Grid
} from "@mui/material";
import { LowPriority as LowPriorityIcon } from '@mui/icons-material';
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService';
import { styled } from "@mui/material/styles";

// --- ESTILOS ---

const TabWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  paddingBottom: theme.spacing(1),
}));

const StyledTab = styled('div')(({ theme, $isActive, color }) => ({
  padding: theme.spacing(1, 2),
  cursor: 'pointer',
  fontWeight: $isActive ? 'bold' : 'normal',
  color: $isActive ? color : theme.palette.text.secondary,
  borderBottom: $isActive ? `2px solid ${color}` : 'none',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  transition: 'color 0.2s, border-bottom 0.2s',
  '&:hover': {
    color: $isActive ? color : theme.palette.text.primary,
  },
}));

const TabCircle = styled('div')(({ color }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: color,
}));

const CardContainer = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
}));

const StatusSpan = styled("span")(({ color }) => ({
  display: "inline-flex",
  alignItems: "center",
  color: color,
  fontSize: "0.875rem",
  fontWeight: 'bold',
}));

const StatusCircle = styled("div")(({ color }) => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  backgroundColor: color,
  marginRight: '8px',
}));

const InfoItem = ({ label, children }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" component="div" sx={{ fontWeight: 'bold' }}>
      {label}
    </Typography>
    <Typography variant="body2" component="div">
      {children}
    </Typography>
  </Box>
);

// --- COMPONENTE DO CARD DE ATIVIDADE (Refatorado) ---

const ActivityCard = ({ activity }) => {
  const theme = useTheme();
  
  const getStatusColor = (status) => {
    const colors = {
      "Próximas": "#787878",
      "Em andamento": "#2d96ff",
      "Pendente": "#FF5959",
      "Histórico": "#87E76A",
    };
    return colors[status] || "#787878";
  };
  const statusColor = getStatusColor(activity.status);

  return (
    <CardContainer variant="outlined">
      {/* Cabeçalho do Card */}
      <Grid container spacing={2} alignItems="center" justifyContent="space-between">
        <Grid item xs={12} sm="auto">
          <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
            {activity.title}
          </Typography>
        </Grid>
        <Grid item xs={12} sm="auto">
          <StatusSpan color={statusColor}>
            <StatusCircle color={statusColor} />
            {activity.status}
          </StatusSpan>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 2 }} />

      {/* Corpo do Card com Detalhes */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <InfoItem label="Condomínio">
            <LowPriorityIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
            {activity.condominium}
          </InfoItem>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <InfoItem label="Orçamento">{activity.budgetStatus}</InfoItem>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <InfoItem label="Data Prevista">{activity.expectedDate}</InfoItem>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
           <InfoItem label="Equipe">{activity.team}</InfoItem>
        </Grid>
         <Grid item xs={12}>
          <InfoItem label="Observações">{activity.observations}</InfoItem>
        </Grid>
      </Grid>
    </CardContainer>
  );
};

// --- COMPONENTE PRINCIPAL ---

const ListaAtividades = () => {
  const [activeFilter, setActiveFilter] = useState("Próximas");
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const allActivities = [
    // ...seus dados de atividades permanecem os mesmos
    { id: "teste", title: "Manutenção Geral do Bloco A", status: "Próximas", condominium: "Condomínio Edifício Central", budgetStatus: "sem orçamento", expectedDate: "10/07/2025", frequency: "Não se repete", team: "Equipe interna", appliedStandard: "Não definida", location: "Condomínio", responsibles: "Não atribuídos", observations: "Verificar vazamento no telhado.", },
    { id: "abc-123", title: "Reparo da Bomba d'Água", status: "Em andamento", condominium: "Condomínio Residencial Vista Alegre", budgetStatus: "aprovado", expectedDate: "15/07/2025", frequency: "Mensal", team: "Terceirizada", appliedStandard: "ABNT NBR 1604", location: "Casa de Bombas", responsibles: "João Silva", observations: "Troca de selo mecânico e rolamentos.", },
    { id: "xyz-789", title: "Pintura da Fachada Principal", status: "Pendente", condominium: "Condomínio Jardins da Cidade", budgetStatus: "pendente", expectedDate: "30/07/2025", frequency: "Anual", team: "Equipe externa", appliedStandard: "NR-35", location: "Fachada principal", responsibles: "Maria Oliveira", observations: "Aguardando aprovação de cor e orçamento final.", },
    { id: "def-456", title: "Verificação de Incêndio Anual", status: "Próximas", condominium: "Condomínio Residencial Park", budgetStatus: "aprovado", expectedDate: "20/07/2025", frequency: "Anual", team: "Empresa de Segurança", appliedStandard: "ITCB N° 19", location: "Áreas Comuns", responsibles: "Pedro Santos", observations: "Verificar extintores e hidrantes.", },
    { id: "ghi-012", title: "Inspeção de Gás", status: "Histórico", condominium: "Condomínio Vila Nova", budgetStatus: "aprovado", expectedDate: "05/06/2025", frequency: "Semestral", team: "Comgás", appliedStandard: "NBR 15526", location: "Central de Gás", responsibles: "Equipe Comgás", observations: "Inspeção de rotina concluída.", },
  ];

  const filteredActivities = allActivities.filter(
    (activity) => activity.status === activeFilter
  );

  const getStatusColor = (status) => {
    const colors = {
      "Próximas": "#787878",
      "Em andamento": "#2d96ff",
      "Pendente": "#FF5959",
      "Histórico": "#87E76A",
    };
    return colors[status] || "#787878";
  };

  return (
    <Box>
      {/* Abas de status */}
      <TabWrapper>
        {["Próximas", "Em andamento", "Pendente", "Histórico"].map((status) => (
          <StyledTab
            key={status}
            $isActive={activeFilter === status}
            color={getStatusColor(status)}
            onClick={() => setActiveFilter(status)}
          >
            <TabCircle color={getStatusColor(status)} />
            {status}
          </StyledTab>
        ))}
      </TabWrapper>

      {/* Seção de Chip de Data e Botão de Filtros */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: isSmallScreen ? 'column' : 'row',
          gap: 2,
          mb: 3,
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            px: 2, py: 1, borderRadius: "20px", cursor: "pointer",
            width: isSmallScreen ? '100%' : 'auto',
            textAlign: 'center',
          }}
        >
          10/07/2025 - 31/08/2025
        </Paper>
        <Button variant="text" sx={{ color: '#EA6037', width: isSmallScreen ? '100%' : 'auto' }} startIcon={<HomeRepairServiceIcon />}>
          Filtros
        </Button>
      </Box>

      {/* Renderização dos cards de atividade */}
      {filteredActivities.length > 0 ? (
        filteredActivities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))
      ) : (
        <Typography variant="h6" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
          Não há atividades para mostrar neste filtro.
        </Typography>
      )}
    </Box>
  );
};

export default ListaAtividades;