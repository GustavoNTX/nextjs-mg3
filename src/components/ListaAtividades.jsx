// src/components/ListaAtividades.jsx
"use client"; // Adicionado para garantir que o componente é um Client Component

import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  useMediaQuery, // Importe useMediaQuery
  useTheme, // Importe useTheme
} from "@mui/material";
import { LowPriority as LowPriorityIcon } from '@mui/icons-material';
import { styled } from "@mui/material/styles";
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService'; // Ícone para o botão "Filtros"

// --- Estilos compartilhados e corrigidos ---

const TabWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  // Flex wrap para que as abas quebrem em várias linhas em telas pequenas
  flexWrap: 'wrap',
  justifyContent: 'flex-start', // Alinha ao início para evitar espaçamento excessivo em poucas abas
  gap: theme.spacing(1), // Espaçamento entre as abas
  marginBottom: theme.spacing(2),
  width: '100%',
  overflowX: 'auto', // Permite rolagem horizontal se necessário (principalmente em gaps menores)
  borderBottom: `1px solid ${theme.palette.divider}`,
  paddingBottom: theme.spacing(1), // Espaço para a borda inferior
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
  // Adiciona margem inferior para as abas quando elas quebram em várias linhas
  marginBottom: theme.spacing(0.5),
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

const IdTag = styled(Typography, {
  shouldForwardProp: (prop) => prop !== '$isClickable',
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
  // Garante que o título e o status se ajustem em telas pequenas
  flexWrap: 'wrap',
});

const ComponentTitle = styled(Typography)(({ theme }) => ({
  fontWeight: "bold",
  fontSize: "1.25rem",
  color: theme.palette.text.primary,
  // Ajusta o tamanho da fonte em telas menores
  [theme.breakpoints.down('sm')]: {
    fontSize: "1rem", // Menor em telas pequenas
  },
}));

const MiddleElement = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(1),
  // Permite que os elementos quebrem em telas pequenas
  flexWrap: 'wrap',
  gap: theme.spacing(0.5), // Espaço entre os itens internos
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
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md')); // Define o breakpoint para small/medium screens

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
      {/* Oculta em telas pequenas, mostra em md e acima */}
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <IdTag $isClickable>Clique aqui para gerar o #ID</IdTag>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
        <IdTag>#{activity.id}</IdTag>
        {/* Mostra em telas pequenas, oculta em md e acima */}
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <IdTag $isClickable>Clique aqui para gerar o #ID</IdTag>
        </Box>
        {/* Oculta em telas pequenas, mostra em md e acima */}
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

      <Box sx={{
          display: "flex",
          // Em telas pequenas, a direção é coluna; em telas maiores, é linha
          flexDirection: isSmallScreen ? 'column' : 'row',
          // Envolve os itens para que quebrem em várias linhas se não houver espaço
          flexWrap: 'wrap',
          justifyContent: "space-between",
          gap: isSmallScreen ? 1 : 2, // Reduz o gap em telas pequenas
      }}>
        <MiddleElement>
          <LowPriorityIcon sx={{ marginRight: '8px', fontSize: '16px' }} />
          <Label>Condomínio:</Label>
          <Content>{activity.condominium}</Content>
        </MiddleElement>

        <MiddleElement>
          <Label>Status:</Label>
          <Content>{activity.budgetStatus}</Content>
        </MiddleElement>

        {/* Mostra o status do card aqui em telas pequenas */}
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <StatusSpan color={getStatusColor(activity.status)}>
            <StatusCircle color={getStatusColor(activity.status)} />
            <Typography>{activity.status}</Typography>
          </StatusSpan>
        </Box>
      </Box>

      {/* Ícones de olho, editar e compartilhar: mostra em md e acima */}
      <Box sx={{ display: { xs: "none", md: "flex" }, justifyContent: "flex-end", alignItems: "center", mt: 2 }}>
        {/* Adicione seus ícones aqui, se desejar */}
      </Box>

      {/* Seções inferiores (mostra em telas pequenas, oculta em md e acima) */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2, flexDirection: 'column' }}> {/* Força coluna para os detalhes */}
          <Box>
            <Label>Frequência:</Label>
            <Content>{activity.frequency}</Content>
          </Box>
          <Box>
            <Label>Data prevista:</Label>
            <Content>{activity.expectedDate}</Content>
          </Box>
          <Box>
            <Label>Equipe:</Label>
            <Content>{activity.team}</Content>
          </Box>
          <Box>
            <Label>Norma aplicada:</Label>
            <Content>{activity.appliedStandard}</Content>
          </Box>
          <Box>
            <Label>Local:</Label>
            <Content>{activity.location}</Content>
          </Box>
          <Box>
            <Label>Responsáveis:</Label>
            <Content>{activity.responsibles}</Content>
          </Box>
          <Box>
            <Label>Observações:</Label>
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
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md')); // Usado para responsividade

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
          mb: 2,
          // Em telas pequenas, empilha os itens verticalmente
          flexDirection: isSmallScreen ? 'column' : 'row',
          alignItems: isSmallScreen ? 'flex-start' : 'center', // Alinha ao início em coluna
          gap: isSmallScreen ? 2 : 0, // Aumenta o gap em coluna
        }}
      >
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
            // Remove margin-right em telas pequenas se for o único item na linha
            mr: isSmallScreen ? 0 : 2,
            width: isSmallScreen ? '100%' : 'auto', // Ocupa largura total em telas pequenas
            textAlign: isSmallScreen ? 'center' : 'left',
          }}
        >
          10/07/2025 - 31/08/2025
        </Paper>

        {/* Botão de Filtros */}
        <Button
          variant="text"
          sx={{ color: '#EA6037' }}
          startIcon={<HomeRepairServiceIcon sx={{ width: 20, height: 20 }} />}
        >
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