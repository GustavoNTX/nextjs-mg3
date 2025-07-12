// src/components/ListaAtividades.jsx
import React, { useState } from "react";
import { Box, Typography, Paper, Divider, Button } from "@mui/material"; // Certifique-se que Button está importado
import { LowPriority as LowPriorityIcon } from '@mui/icons-material';
import { styled } from "@mui/material/styles";

// --- Estilos compartilhados e corrigidos ---

const TabWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  width: '100%',
  overflowX: 'auto',
  borderBottom: `1px solid ${theme.palette.divider}`,
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
  '&:hover': {
    color: $isActive ? color : theme.palette.text.primary,
  },
  minWidth: 'fit-content',
}));

const TabCircle = styled('div')(({ theme, color }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: color,
}));

const CardContainer = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  border: "1px solid #e0e0e0",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
}));

// AQUI ESTÁ A MUDANÇA PRINCIPAL: usando shouldForwardProp
const IdTag = styled(Typography, {
  shouldForwardProp: (prop) => prop !== '$isClickable', // Não encaminhe '$isClickable' para o DOM
})(({ theme, $isClickable }) => ({
  fontSize: "0.75rem",
  color: $isClickable ? theme.palette.text.secondary : theme.palette.text.primary,
  cursor: $isClickable ? "pointer" : "default",
  "&:hover": {
    textDecoration: $isClickable ? "underline" : "none",
  },
}));

const StatusSpan = styled("span")(({ theme, color }) => ({
  display: "flex",
  alignItems: "center",
  color: color || theme.palette.text.primary,
  fontSize: "0.875rem",
}));

const StatusCircle = styled("div")(({ theme, color }) => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  backgroundColor: color || theme.palette.grey[500],
  marginRight: theme.spacing(0.5),
}));

const TitleAndStatusDiv = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "1rem",
});

const ComponentTitle = styled(Typography)(({ theme }) => ({
  fontWeight: "bold",
  fontSize: "1.25rem",
  color: theme.palette.text.primary,
}));

const MiddleElement = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(1),
}));

const Label = styled(Typography)(({ theme }) => ({
  fontWeight: "bold",
  marginRight: theme.spacing(1),
  color: theme.palette.text.secondary,
  fontSize: "0.875rem",
}));

const Content = styled(Typography)(({ theme }) => ({
  fontSize: "0.875rem",
  color: theme.palette.text.primary,
}));

// Este componente representa um "card" de atividade
const ActivityCard = ({ activity }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "Próximas":
        return "#787878";
      case "Em andamento":
        return "#2d96ff";
      case "Pendente":
        return "#FF5959";
      case "Histórico":
        return "#87E76A";
      default:
        return "#787878";
    }
  };

  return (
    <CardContainer>
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <IdTag $isClickable>Clique aqui para gerar o #ID</IdTag>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
        <IdTag>#{activity.id}</IdTag>
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <IdTag $isClickable>Clique aqui para gerar o #ID</IdTag>
        </Box>
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <StatusSpan color={getStatusColor(activity.status)}>
            <StatusCircle color={getStatusColor(activity.status)} />
            <Typography>{activity.status}</Typography>
          </StatusSpan>
        </Box>
      </Box>

      <TitleAndStatusDiv>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <ComponentTitle>{activity.title}</ComponentTitle>
        </Box>
      </TitleAndStatusDiv>

      <Divider sx={{ my: 1 }} />

      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between" }}>
        <MiddleElement>
          <LowPriorityIcon sx={{ marginRight: '8px', fontSize: '16px' }} />
          <MiddleElement>
            <Label>Condomínio</Label>
            <Content>{activity.condominium}</Content>
          </MiddleElement>
        </MiddleElement>

        <MiddleElement>
          <Label>Status:</Label>
          <Content>{activity.budgetStatus}</Content>
        </MiddleElement>

        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <StatusSpan color={getStatusColor(activity.status)}>
            <StatusCircle color={getStatusColor(activity.status)} />
            <Typography>{activity.status}</Typography>
          </StatusSpan>
        </Box>
      </Box>

      <Box sx={{ display: { xs: "none", md: "flex" }, justifyContent: "flex-end", alignItems: "center", mt: 2 }}>
        {/* Ícones de olho, editar e compartilhar */}
      </Box>

      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <MiddleElement>
          <Label>Data prevista:</Label>
          <Content>{activity.expectedDate}</Content>
        </MiddleElement>
      </Box>

      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
          <Box>
            <Label>Frequência</Label>
            <Content>{activity.frequency}</Content>
          </Box>
          <Box>
            <Label>Data prevista</Label>
            <Content>{activity.expectedDate}</Content>
          </Box>
          <Box>
            <Label>Equipe</Label>
            <Content>{activity.team}</Content>
          </Box>
          <Box>
            <Label>Norma aplicada</Label>
            <Content>{activity.appliedStandard}</Content>
          </Box>
          <Box>
            <Label>Local</Label>
            <Content>{activity.location}</Content>
          </Box>
          <Box>
            <Label>Responsáveis</Label>
            <Content>{activity.responsibles}</Content>
          </Box>
          <Box>
            <Label>Observações</Label>
            <Content>{activity.observations}</Content>
          </Box>
        </Box>
      </Box>
    </CardContainer>
  );
};

// Componente principal ListaAtividades
const ListaAtividades = () => {
  const [activeFilter, setActiveFilter] = useState("Próximas");

  const allActivities = [
    {
      id: "teste",
      title: "Manutenção Geral do Bloco A",
      status: "Próximas",
      condominium: "Condomínio Edifício Central",
      budgetStatus: "sem orçamento",
      expectedDate: "10/07/2025",
      frequency: "Não se repete",
      team: "Equipe interna",
      appliedStandard: "Não definida",
      location: "Condomínio",
      responsibles: "Não atribuídos",
      observations: "Verificar vazamento no telhado.",
    },
    {
        id: "abc-123",
        title: "Reparo da Bomba d'Água",
        status: "Em andamento",
        condominium: "Condomínio Residencial Vista Alegre",
        budgetStatus: "aprovado",
        expectedDate: "15/07/2025",
        frequency: "Mensal",
        team: "Terceirizada",
        appliedStandard: "ABNT NBR 1604",
        location: "Casa de Bombas",
        responsibles: "João Silva",
        observations: "Troca de selo mecânico e rolamentos.",
    },
    {
        id: "xyz-789",
        title: "Pintura da Fachada Principal",
        status: "Pendente",
        condominium: "Condomínio Jardins da Cidade",
        budgetStatus: "pendente",
        expectedDate: "30/07/2025",
        frequency: "Anual",
        team: "Equipe externa",
        appliedStandard: "NR-35",
        location: "Fachada principal",
        responsibles: "Maria Oliveira",
        observations: "Aguardando aprovação de cor e orçamento final.",
    },
    {
      id: "def-456",
      title: "Verificação de Incêndio Anual",
      status: "Próximas",
      condominium: "Condomínio Residencial Park",
      budgetStatus: "aprovado",
      expectedDate: "20/07/2025",
      frequency: "Anual",
      team: "Empresa de Segurança",
      appliedStandard: "ITCB N° 19",
      location: "Áreas Comuns",
      responsibles: "Pedro Santos",
      observations: "Verificar extintores e hidrantes.",
    },
    {
      id: "ghi-012",
      title: "Inspeção de Gás",
      status: "Histórico",
      condominium: "Condomínio Vila Nova",
      budgetStatus: "aprovado",
      expectedDate: "05/06/2025",
      frequency: "Semestral",
      team: "Comgás",
      appliedStandard: "NBR 15526",
      location: "Central de Gás",
      responsibles: "Equipe Comgás",
      observations: "Inspeção de rotina concluída.",
    },
  ];

  const filteredActivities = allActivities.filter(
    (activity) => activity.status === activeFilter
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "Próximas":
        return "#787878";
      case "Em andamento":
        return "#2d96ff";
      case "Pendente":
        return "#FF5959";
      case "Histórico":
        return "#87E76A";
      default:
        return "#787878";
    }
  };

  return (
    <Box>
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

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        {/* Chip de Data */}
        <Paper
          variant="outlined"
          sx={{
            px: 2,
            py: 1,
            borderRadius: "20px",
            fontSize: "0.875rem",
            color: "text.secondary",
            cursor: "pointer",
            mr: 2,
          }}
        >
          10/07/2025 - 31/08/2025
        </Paper>

        {/* Botão de Filtros */}

      </Box>

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