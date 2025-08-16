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

    onEdit?.(condominioData); // chama só se onEdit existir
  };

  const fallbackImage =
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1974&auto=format&fit=crop";

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
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

      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography
            gutterBottom
            variant="h6"
            component="div"
            noWrap
            sx={{ maxWidth: "calc(100% - 80px)" }}
          >
            {name}
          </Typography>

          {!!type && (
            <Chip
              label={type}
              size="small"
              color={
                type?.toLowerCase() === "residencial" ? "primary" : "secondary"
              }
              sx={{ ml: 1, textTransform: "capitalize" }}
            />
          )}
        </Box>

        {address && (
          <Typography variant="body2" color="text.secondary">
            {address}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
