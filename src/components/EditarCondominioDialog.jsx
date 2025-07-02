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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";

// Este componente representa o formulário de edição dentro de um modal.
export default function EditarCondominioDialog({ open, onClose, condominio, onSave, onDelete }) {
  // Estado para guardar os dados do formulário
  const [formData, setFormData] = useState({});

  // `useEffect` para popular o formulário quando um condomínio é selecionado para edição
  useEffect(() => {
    if (condominio) {
      setFormData({
        name: condominio.name || "",
        cnpj: condominio.cnpj || "",
        address: condominio.address || "",
        // Adicione outros campos conforme necessário
      });
    }
  }, [condominio]);

  // Função para lidar com mudanças nos inputs do formulário
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSave = () => {
    // Passa os dados atualizados para a função onSave
    onSave({ ...condominio, ...formData });
  };
  
  const handleDelete = () => {
    // Chama a função onDelete passada como prop
    onDelete(condominio.id);
  }

  // Não renderiza nada se não houver um condomínio para editar
  if (!condominio) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Editar {condominio.name}</Typography>
        <IconButton onClick={onClose} aria-label="fechar">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box component="form" noValidate autoComplete="off" sx={{ '& .MuiTextField-root': { mb: 2 }}}>
          <TextField
            fullWidth
            label="Nome do condomínio"
            name="name"
            value={formData.name}
            onChange={handleChange}
            variant="outlined"
          />
          <TextField
            fullWidth
            label="CNPJ"
            name="cnpj"
            value={formData.cnpj}
            onChange={handleChange}
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Endereço"
            name="address"
            value={formData.address}
            onChange={handleChange}
            variant="outlined"
          />
          {/* Adicione outros campos como Autocomplete para Estado/Cidade e Select para Tipo aqui */}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: '16px 24px', justifyContent: 'space-between' }}>
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
        >
          Salvar Mudanças
        </Button>
      </DialogActions>
    </Dialog>
  );
}