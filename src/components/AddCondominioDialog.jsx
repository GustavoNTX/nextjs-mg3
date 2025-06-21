// src/components/AddCondominioDialog.jsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function AddCondominioDialog({ open, onClose, onSave }) {
  const [values, setValues] = useState({
    name: "",
    cnpj: "",
    address: "",
    neighborhood: "",
    state: "",
    city: "",
    type: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: false }));
  };

  const handleSubmit = () => {
    const newErrors = {};
    ["name", "address", "neighborhood"].forEach((f) => {
      if (!values[f].trim()) newErrors[f] = "Este campo é obrigatório";
    });
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    onSave(values);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        Adicionar Condomínio
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* 1ª linha: Nome / CNPJ */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="*Nome do condomínio"
              value={values.name}
              onChange={handleChange("name")}
              error={!!errors.name}
              helperText={errors.name}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="CNPJ"
              value={values.cnpj}
              onChange={handleChange("cnpj")}
              fullWidth
            />
          </Grid>

          {/* 2ª linha: Endereço / Bairro */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="*Endereço"
              value={values.address}
              onChange={handleChange("address")}
              error={!!errors.address}
              helperText={errors.address}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="*Bairro"
              value={values.neighborhood}
              onChange={handleChange("neighborhood")}
              error={!!errors.neighborhood}
              helperText={errors.neighborhood}
              fullWidth
            />
          </Grid>

          {/* 3ª linha: Estado / Cidade */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>*Estado</InputLabel>
              <Select
                value={values.state}
                label="*Estado"
                onChange={handleChange("state")}
              >
                <MenuItem value="">
                  <em>Selecione</em>
                </MenuItem>
                <MenuItem value="SP">São Paulo</MenuItem>
                <MenuItem value="RJ">Rio de Janeiro</MenuItem>
                {/* … */}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>*Cidade</InputLabel>
              <Select
                value={values.city}
                label="*Cidade"
                onChange={handleChange("city")}
              >
                <MenuItem value="">
                  <em>Selecione</em>
                </MenuItem>
                <MenuItem value="sao_paulo">São Paulo</MenuItem>
                <MenuItem value="rio">Rio de Janeiro</MenuItem>
                {/* … */}
              </Select>
            </FormControl>
          </Grid>

          {/* 4ª linha: Tipo / Anexar foto */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>*Tipo</InputLabel>
              <Select
                value={values.type}
                label="*Tipo"
                onChange={handleChange("type")}
              >
                <MenuItem value="">
                  <em>Selecione</em>
                </MenuItem>
                <MenuItem value="Residencial">Residencial</MenuItem>
                <MenuItem value="Comercial">Comercial</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            {/* Se quiser manter o campo desabilitado com ícone */}
            <TextField
              label="Anexar foto do condomínio"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <img
                      src="/assets/icons/attach-file.svg"
                      alt="Ícone de arquivo"
                    />
                  </InputAdornment>
                ),
              }}
              disabled
              fullWidth
            />
          </Grid>

          {/* 5ª linha: Condomínio de referência (único, ocupa fullWidth) */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Condomínio de referência</InputLabel>
              <Select
                value={values.reference}
                onChange={handleChange("reference")}
                label="Condomínio de referência"
              >
                <MenuItem value="">
                  <em>Selecione</em>
                </MenuItem>
                {/* … */}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Salvar Mudanças
        </Button>
      </DialogActions>
    </Dialog>
  );
}
