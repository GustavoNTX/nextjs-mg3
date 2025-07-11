// src/components/ListaAtividades.jsx
import React from "react";
import { Box, Typography, Paper, Divider } from "@mui/material";
import {
  // ...outros ícones
  LowPriority as LowPriorityIcon, // Ícone de baixa prioridade
} from '@mui/icons-material';
// Estilos para os elementos do card, baseados no seu HTML fornecido
import { styled } from "@mui/material/styles";

const CardContainer = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  border: "1px solid #e0e0e0", // Uma borda sutil
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
}));

const IdTag = styled(Typography)(({ theme, clickable }) => ({
  fontSize: "0.75rem",
  color: clickable ? theme.palette.text.secondary : theme.palette.text.primary,
  cursor: clickable ? "pointer" : "default",
  "&:hover": {
    textDecoration: clickable ? "underline" : "none",
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
  marginBottom: "1rem", // Espaçamento inferior para separar do restante do conteúdo
});

const ComponentTitle = styled(Typography)(({ theme }) => ({
  fontWeight: "bold",
  fontSize: "1.25rem",
  color: theme.palette.text.primary,
}));

const MiddleElement = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(1), // Espaçamento entre os elementos do meio
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
      case "a fazer":
        return "#787878"; // Cor cinza do seu HTML
      // Adicione outros status e cores conforme necessário
      default:
        return "#787878";
    }
  };

  return (
    <CardContainer>
     <Box sx={{ display: { xs: "none", md: "block" } }}>
        <IdTag clickable="true">Clique aqui para gerar o #ID</IdTag> {/* <--- Passe como string */}
     </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
        <IdTag>#{activity.id}</IdTag>
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <IdTag clickable>Clique aqui para gerar o #ID</IdTag>
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
        {/* Aqui você pode adicionar os botões "Iniciar atividade" e "Concluir atividade"
            se desejar que eles apareçam em cada card. Por enquanto, vou omitir para focar na estrutura.
        */}
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
        {/* Você pode adicionar os botões aqui ou como parte da estrutura original se preferir */}
      </Box>

      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <MiddleElement>
          <Label>Data prevista:</Label>
          <Content>{activity.expectedDate}</Content>
        </MiddleElement>
      </Box>

      {/* Seções inferiores */}
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
  // Dados mockados para simular suas atividades.
  // Em um cenário real, isso viria de uma API ou de um estado global.
  const mockActivities = [
    {
      id: "teste",
      title: "teste",
      status: "a fazer",
      condominium: "sem orçamento",
      budgetStatus: "sem orçamento",
      expectedDate: "10/07/2025",
      frequency: "Não se repete",
      team: "Equipe interna",
      appliedStandard: "Não definida",
      location: "Condomínio",
      responsibles: "Não atribuídos",
      observations: "teste",
    },
    {
        id: "abc-123",
        title: "Manutenção de Elevadores",
        status: "em andamento",
        condominium: "Com orçamento",
        budgetStatus: "aprovado",
        expectedDate: "15/07/2025",
        frequency: "Mensal",
        team: "Terceirizada",
        appliedStandard: "ABNT NBR 1604",
        location: "Bloco B",
        responsibles: "João Silva",
        observations: "Verificar ruídos no elevador social.",
    },
    {
        id: "xyz-789",
        title: "Pintura Fachada",
        status: "pendente",
        condominium: "Com orçamento",
        budgetStatus: "pendente",
        expectedDate: "30/07/2025",
        frequency: "Anual",
        team: "Equipe externa",
        appliedStandard: "NR-35",
        location: "Fachada principal",
        responsibles: "Maria Oliveira",
        observations: "Aguardando aprovação de cor.",
    },
  ];

  return (
    <Box>
      {/* Aqui você pode adicionar os chips de filtro de data, se desejar */}
      <Box sx={{ display: "flex", mb: 2 }}>
        <Paper
          variant="outlined"
          sx={{
            px: 2,
            py: 1,
            borderRadius: "20px",
            fontSize: "0.875rem",
            color: "text.secondary",
            cursor: "pointer",
          }}
        >
          10/07/2025 - 31/08/2025
        </Paper>
      </Box>

      {/* Mapeia os dados mockados para renderizar os cards de atividade */}
      {mockActivities.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </Box>
  );
};

export default ListaAtividades;