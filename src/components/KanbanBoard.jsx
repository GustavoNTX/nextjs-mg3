// src/components/KanbanBoard.jsx
"use client";

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Edit as EditIcon,
  Share as ShareIcon,
  InfoOutlined as InfoIcon,
  LowPriority as LowPriorityIcon,
} from '@mui/icons-material';
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService';
import { styled } from '@mui/material/styles';
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "react-beautiful-dnd";

// --- Estilos do Kanban Board (do código original) ---

const KanbanContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  borderRadius: '20px',
  marginBottom: theme.spacing(2),
  cursor: 'pointer',
}));

// GridContainer com a lógica de responsividade completa
const GridContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: '1fr',
    overflowX: 'hidden',
  },
  [theme.breakpoints.between('sm', 'md')]: {
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    overflowX: 'auto',
  },
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    overflowX: 'hidden',
  },
  gap: theme.spacing(2),
  paddingBottom: theme.spacing(2),
}));


const Column = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.default,
  minHeight: '400px',
  display: 'flex',
  flexDirection: 'column',
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(2),
  },
}));

const ColumnHeaderStatusSpan = styled('span')(({ theme, color }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  color: color || theme.palette.text.primary,
  fontWeight: 'bold',
  fontSize: '1rem',
}));

const ColumnHeaderStatusCircle = styled('div')(({ theme, color }) => ({
  width: 10,
  height: 10,
  borderRadius: '50%',
  backgroundColor: color || theme.palette.grey[500],
  marginRight: theme.spacing(1),
}));

// --- Estilos do Card (do código original) ---

const CardContainer = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
  border: '1px solid #e0e0e0',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  cursor: 'grab',
  '&:active': {
    cursor: 'grabbing',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
  },
}));

const IdTag = styled(Typography)({
  fontSize: '0.75rem',
  color: (theme) => theme.palette.text.secondary,
});

const CardTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  fontSize: '1rem',
  color: theme.palette.text.primary,
  flexGrow: 1,
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.9rem',
  },
}));

const CardMiddleElement = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(0.5),
  flexWrap: 'wrap',
  gap: theme.spacing(0.5),
}));

const CardLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  marginRight: theme.spacing(1),
  color: theme.palette.text.secondary,
  fontSize: '0.8rem',
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.75rem',
  },
}));

const CardContent = styled(Typography)(({ theme }) => ({
  fontSize: '0.8rem',
  color: theme.palette.text.primary,
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.75rem',
  },
}));

const CardStatusWrapper = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
}));

const CardStatusSpan = styled('span')(({ theme, color }) => ({
  display: 'flex',
  alignItems: 'center',
  color: color || theme.palette.text.secondary,
  fontSize: '0.75rem',
  fontWeight: 'bold',
}));

const CardStatusCircle = styled('div')(({ theme, color }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: color || theme.palette.grey[500],
  marginRight: theme.spacing(0.5),
}));


// Componente Card do Kanban (do código original, com layout correto)
const KanbanActivityCard = ({ activity }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const getStatusColor = (status) => {
    switch (status) {
      case 'Próximas': return '#787878';
      case 'Em andamento': return '#2d96ff';
      case 'Pendente': return '#FF5959';
      case 'Histórico': return '#87E76A';
      default: return '#787878';
    }
  };

  return (
    <CardContainer elevation={1}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <IdTag>#{activity.id.substring(0, 8)}</IdTag> {/* Mostrando apenas parte do ID */}
        <Box>
          <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small"><ShareIcon fontSize="small" /></IconButton>
        </Box>
      </Box>

      <CardTitle>{activity.title}</CardTitle>
      <Divider sx={{ my: 1 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <CardMiddleElement>
          <LowPriorityIcon sx={{ marginRight: '8px', fontSize: '16px', color: 'text.secondary' }} />
          <CardLabel>Condomínio:</CardLabel>
          <CardContent>{activity.condominium}</CardContent>
        </CardMiddleElement>
        <CardMiddleElement>
          <CardLabel>Orçamento:</CardLabel>
          <CardContent>{activity.budgetStatus}</CardContent>
        </CardMiddleElement>
        <CardMiddleElement>
          <CardLabel>Data Prevista:</CardLabel>
          <CardContent>{activity.expectedDate}</CardContent>
        </CardMiddleElement>
      </Box>

      <Box sx={{
        display: 'flex',
        flexDirection: isSmallScreen ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isSmallScreen ? 'flex-start' : 'center',
        mt: 2,
        gap: isSmallScreen ? 1 : 0,
      }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<InfoIcon />}
          sx={{
            color: '#545454',
            borderColor: '#545454',
            width: isSmallScreen ? '100%' : 'auto',
          }}
        >
          Ver mais
        </Button>
        <CardStatusWrapper sx={{ mt: isSmallScreen ? 1 : 0, width: isSmallScreen ? '100%' : 'auto', justifyContent: isSmallScreen ? 'flex-start' : 'flex-end' }}>
            <CardStatusSpan color={getStatusColor(activity.status)}>
                <CardStatusCircle color={getStatusColor(activity.status)} />
                <Typography variant="body2">{activity.status}</Typography>
            </CardStatusSpan>
        </CardStatusWrapper>
      </Box>

       {/* Botões condicionais restaurados */}
      <Box sx={{
        display: 'flex',
        gap: 1,
        mt: 2,
        justifyContent: 'flex-end',
        flexDirection: isSmallScreen ? 'column' : 'row',
        width: isSmallScreen ? '100%' : 'auto',
      }}>
        {activity.status === 'Próximas' && (
          <Button variant="contained" size="small" sx={{
              backgroundColor: '#E6EAED',
              color: '#545454',
              width: isSmallScreen ? '100%' : 'auto',
              '&:hover': { backgroundColor: '#d1d6da' }
          }}>
            Iniciar atividade
          </Button>
        )}
        {activity.status === 'Em andamento' && (
          <Button variant="contained" size="small" sx={{
              backgroundColor: '#E6EAED',
              color: '#545454',
              width: isSmallScreen ? '100%' : 'auto',
               '&:hover': { backgroundColor: '#d1d6da' }
          }}>
            Concluir atividade
          </Button>
        )}
      </Box>
    </CardContainer>
  );
};


// --- Componente Principal KanbanBoard ---
const KanbanBoard = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Estado com a estrutura correta para react-beautiful-dnd
  const [columnsData, setColumnsData] = useState({
    "Próximas": [
      { id: '6283dc8d-229e-4a91-8678-afc9372e705f', title: 'Manutenção Preventiva Bloco C', status: 'Próximas', condominium: 'Condomínio XYZ', budgetStatus: 'sem orçamento', expectedDate: '12/07/2025' },
      { id: '409c2be3-ef67-42b3-8dd7-6691e5c9f229', title: 'Inspeção de Segurança Predial', status: 'Próximas', condominium: 'Condomínio ABC', budgetStatus: 'aprovado', expectedDate: '15/07/2025' }
    ],
    "Em andamento": [
      { id: 'task-003', title: 'Reparo de Portão Eletrônico', status: 'Em andamento', condominium: 'Condomínio Boa Vista', budgetStatus: 'aprovado', expectedDate: '18/07/2025' }
    ],
    "Pendente": [
        { id: 'task-004', title: 'Limpeza de Cisternas', status: 'Pendente', condominium: 'Condomínio Sol Nascente', budgetStatus: 'pendente', expectedDate: '25/07/2025' },
    ],
    "Histórico": [
        { id: 'task-005', title: 'Revisão do Sistema de Incêndio', status: 'Histórico', condominium: 'Condomínio Alto Padrão', budgetStatus: 'aprovado', expectedDate: '01/06/2025' },
    ],
  });

  const columns = [
    { id: "Próximas", color: "#787878" },
    { id: "Em andamento", color: "#2d96ff" },
    { id: "Pendente", color: "#FF5959" },
    { id: "Histórico", color: "#87E76A" },
  ];

  // Lógica onDragEnd mantida
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.droppableId === destination.droppableId) {
      const items = Array.from(columnsData[source.droppableId]);
      const [moved] = items.splice(source.index, 1);
      items.splice(destination.index, 0, moved);
      setColumnsData((prev) => ({ ...prev, [source.droppableId]: items }));
    } else {
      const sourceItems = Array.from(columnsData[source.droppableId]);
      const destItems = Array.from(columnsData[destination.droppableId]);
      const [moved] = sourceItems.splice(source.index, 1);
      moved.status = destination.droppableId;
      destItems.splice(destination.index, 0, moved);
      setColumnsData((prev) => ({
        ...prev,
        [source.droppableId]: sourceItems,
        [destination.droppableId]: destItems,
      }));
    }
  };

  return (
    <KanbanContainer>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Obs: Após recarregar a página, os cards serão mostrados novamente em ordem cronológica
      </Typography>

      {/* Seção de filtros com a lógica de responsividade restaurada */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          mb: 3,
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: isSmallScreen ? 'column' : 'row',
          alignItems: isSmallScreen ? 'flex-start' : 'center',
          gap: isSmallScreen ? 2 : 0,
        }}
      >
        <StyledChip
          label="12/04/2025 - 12/10/2025"
          clickable
          sx={{
            width: isSmallScreen ? '100%' : 'auto',
            textAlign: isSmallScreen ? 'center' : 'left',
            mr: isSmallScreen ? 0 : 1,
            mb: isSmallScreen ? 0 : 2, // Ajuste de margem
          }}
        />
        <Button
          variant="text"
          sx={{
            color: '#EA6037',
            width: isSmallScreen ? '100%' : 'auto',
            justifyContent: isSmallScreen ? 'center' : 'flex-start',
          }}
          startIcon={<HomeRepairServiceIcon sx={{ width: 20, height: 20 }} />}
        >
          Filtros
        </Button>
      </Box>

      <DragDropContext onDragEnd={onDragEnd}>
        <GridContainer>
          {columns.map((col) => (
            <Droppable droppableId={col.id} key={col.id}>
              {(provided) => (
                <Column ref={provided.innerRef} {...provided.droppableProps}>
                  <ColumnHeaderStatusSpan color={col.color}>
                    <ColumnHeaderStatusCircle color={col.color} />
                    <Typography>{col.id}</Typography>
                  </ColumnHeaderStatusSpan>

                  {columnsData[col.id].length > 0 ? (
                    columnsData[col.id].map((activity, index) => (
                      <Draggable key={activity.id} draggableId={activity.id} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                            <KanbanActivityCard activity={activity} />
                          </div>
                        )}
                      </Draggable>
                    ))
                  ) : (
                     <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                        Não há atividades para mostrar
                     </Typography>
                  )}
                  {provided.placeholder}
                </Column>
              )}
            </Droppable>
          ))}
        </GridContainer>
      </DragDropContext>
    </KanbanContainer>
  );
};

export default KanbanBoard;