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
import EditIcon from "@mui/icons-material/Edit";

export default function CondominioCard({
  id,
  imageUrl,
  name,
  address,
  type,
  cnpj,
  onEdit,
  city,
  state,
  neighborhood
}) {
  const handleEditClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const condominioData = {
      id,
      imageUrl: imageUrl || "",
      name,
      address,
      type,
      cnpj,
      city,
      state,
      neighborhood
    };

    onEdit?.(condominioData);
  };

  const fallbackImage =
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1974&auto=format&fit=crop";

  return (
    <Card
      sx={{
        // altura fixa (igual para todos) e responsiva
        height: { xs: 260, sm: 300, md: 250 },
        display: "flex",
        flexDirection: "column",
        flex: 1,            // ocupa toda a altura disponível do Grid item
        width: "100%",
        overflow: "hidden", // evita estouro de conteúdo
      }}
    >
      <Box
        sx={{
          position: "relative",
          "&:hover .overlay": { opacity: 1 },
          "&:hover .media": { opacity: 0.5 },
        }}
      >
        <CardMedia
          className="media"
          component="img"
          // altura fixa padronizada para a imagem
          // (pode ajustar se preferir mais/menos imagem)
          height="140"
          image={imageUrl || fallbackImage}
          alt={`Foto do ${name ?? "condomínio"}`}
          sx={{ transition: "opacity 0.3s ease-in-out" }}
        />

        <Box
          className="overlay"
          sx={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            color: "white",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0,
            transition: "opacity 0.3s ease-in-out",
            cursor: "pointer",
          }}
          onClick={handleEditClick}
        >
          <EditIcon />
          <Typography variant="caption">Editar</Typography>
        </Box>
      </Box>

      <CardContent
        sx={{
          flex: 1,                     // ocupa o restante da altura do Card
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",          // evita crescer além da altura
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
            minHeight: 32, // ajuda a manter consistência na faixa do título + chip
          }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{
              maxWidth: "calc(100% - 80px)",
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {name}
          </Typography>

          {!!type && (
            <Chip
              label={type}
              size="small"
              color={type?.toLowerCase() === "residencial" ? "primary" : "secondary"}
              sx={{ ml: 1, textTransform: "capitalize" }}
            />
          )}
        </Box>

        {address && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,     // limita a 2 linhas para padronizar altura
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {address}
          </Typography>
        )}

        {/* Se quiser reservar um “respiro” no fim do conteúdo */}
        <Box sx={{ mt: "auto" }} />
      </CardContent>
    </Card>
  );
}
