// src/components/CondominioCard.jsx
"use client";

import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit'; // Importe o ícone de edição

export default function CondominioCard({ id, imageUrl, name, address, type, onEdit  }) {

  // Função placeholder para o clique no botão de editar
  const handleEditClick = (event) => {
    event.preventDefault(); // Impede que o clique se propague para outros elementos
    event.stopPropagation();
    console.log(`Clicou para editar o condomínio com ID: ${id}`);
     onEdit(condominio);
    // Futuramente, aqui você pode abrir o diálogo ou navegar para a página de edição.
    // Ex: setEditDialogOpen(true);
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Container da Imagem com o efeito de hover */}
        <Box
            sx={{
                position: 'relative',
                // Seletores para o efeito de hover
                '&:hover .overlay': {
                    opacity: 1,
                },
                '&:hover .media': {
                    opacity: 0.5,
                },
            }}
        >
            {/* Imagem do Card */}
            <CardMedia
                className="media"
                component="img"
                height="140"
                image={imageUrl || 'https://via.placeholder.com/300x140?text=Sem+Imagem'}
                alt={`Foto do ${name}`}
                sx={{
                    transition: 'opacity 0.3s ease-in-out',
                }}
            />
            {/* Overlay que aparece no hover */}
            <Box
                className="overlay"
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.3s ease-in-out',
                    cursor: 'pointer',
                }}
                onClick={handleEditClick} // Ação de clique para editar
            >
                <EditIcon />
                <Typography variant="caption">Editar</Typography>
            </Box>
        </Box>

        {/* Conteúdo do Card */}
        <CardContent sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography gutterBottom variant="h6" component="div" noWrap sx={{ maxWidth: 'calc(100% - 80px)' }}>
                {name}
                </Typography>
                <Chip
                    label={type}
                    size="small"
                    color={type === 'Residencial' ? 'primary' : 'secondary'}
                    sx={{ ml: 1, textTransform: 'capitalize' }}
                />
            </Box>
            <Typography variant="body2" color="text.secondary">
                {address}
            </Typography>
        </CardContent>
    </Card>
  );
}