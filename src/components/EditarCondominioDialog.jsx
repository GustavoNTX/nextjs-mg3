// src/components/EditarCondominioDialog.jsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";

export default function EditarCondominioDialog({ open, onClose, condominio, onSave, onDelete }) {
  const theme = useTheme();

  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (condominio) {
      setFormData({
        name: condominio.name || "",
        cnpj: condominio.cnpj || "",
        address: condominio.address || "",
        // outros campos podem ser adicionados aqui
      });
    }
  }, [condominio]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSave = () => {
    onSave({ ...condominio, ...formData });
  };

  const handleDelete = () => {
    onDelete(condominio.id);
  };

  if (!condominio) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: theme.palette.text.primary,
        }}
      >
        <Typography variant="h6">Editar {condominio.name}</Typography>
        <IconButton
          onClick={onClose}
          aria-label="fechar"
          sx={{ color: theme.palette.text.secondary }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          "& .MuiTextField-root": { mb: 2 },
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Box component="form" noValidate autoComplete="off">
          <TextField
            fullWidth
            label="Nome do condomínio"
            name="name"
            value={formData.name}
            onChange={handleChange}
            variant="outlined"
            InputLabelProps={{ style: { color: theme.palette.text.secondary } }}
          />
          <TextField
            fullWidth
            label="CNPJ"
            name="cnpj"
            value={formData.cnpj}
            onChange={handleChange}
            variant="outlined"
            InputLabelProps={{ style: { color: theme.palette.text.secondary } }}
          />
          <TextField
            fullWidth
            label="Endereço"
            name="address"
            value={formData.address}
            onChange={handleChange}
            variant="outlined"
            InputLabelProps={{ style: { color: theme.palette.text.secondary } }}
          />
          {/* Adicione outros campos como Autocomplete para Estado/Cidade e Select para Tipo aqui */}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: "16px 24px",
          justifyContent: "space-between",
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleDelete}
        >
          Excluir
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          sx={{ backgroundColor: theme.palette.primary.main }}
        >
          Salvar Mudanças
        </Button>
      </DialogActions>
    </Dialog>
  );
}
