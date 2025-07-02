// src/components/CondominioCard.jsx
"use client";

import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
  Box,
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';

// O componente recebe as props individuais e a função onEdit
export default function CondominioCard({ id, imageUrl, name, address, type, cnpj, onEdit }) {

  const handleEditClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    // ✅ Cria o objeto do condomínio a partir das props
    const condominioData = { id, imageUrl, name, address, type, cnpj };
    
    // Chama a função onEdit passando o objeto completo
    onEdit(condominioData);
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box
            sx={{
                position: 'relative',
                '&:hover .overlay': { opacity: 1 },
                '&:hover .media': { opacity: 0.5 },
            }}
        >
            <CardMedia
                className="media"
                component="img"
                height="140"
                image={imageUrl || 'https://via.placeholder.com/300x140?text=Sem+Imagem'}
                alt={`Foto do ${name}`}
                sx={{ transition: 'opacity 0.3s ease-in-out' }}
            />
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
                onClick={handleEditClick}
            >
                <EditIcon />
                <Typography variant="caption">Editar</Typography>
            </Box>
        </Box>
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