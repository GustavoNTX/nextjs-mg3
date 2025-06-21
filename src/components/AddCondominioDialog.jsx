// src/components/AddCondominioDialog.jsx
"use client";

import { useState } from "react";
import {
  Dialog,
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
  Box,
  Typography,
  FormHelperText,
  Stack,
  Paper,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AttachmentIcon from "@mui/icons-material/Attachment";

export default function AddCondominioDialog({ open, onClose, onSave }) {
  const [values, setValues] = useState({
    name: "",
    cnpj: "",
    address: "",
    neighborhood: "",
    state: "",
    city: "",
    type: "",
    reference: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((err) => ({ ...err, [field]: undefined }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const newErrors = {};
    const requiredFields = [
      "name",
      "address",
      "neighborhood",
      "state",
      "city",
      "type",
    ];

    requiredFields.forEach((field) => {
      if (!values[field]?.trim()) {
        newErrors[field] = "Este campo é obrigatório";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave(values);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
        }}
      >
        <Typography variant="h6" component="h2" sx={{ fontWeight: "bold" }}>
          Adicionar Condomínio
        </Typography>
        <IconButton onClick={onClose} aria-label="Fechar">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            {/* Seção 1: Dados básicos */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: "8px" }}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ fontWeight: "medium" }}
              >
                Dados Básicos
              </Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    variant="outlined"
                    label="*Nome do condomínio"
                    value={values.name}
                    onChange={handleChange("name")}
                    error={!!errors.name}
                    helperText={errors.name || " "}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    variant="outlined"
                    label="CNPJ"
                    value={values.cnpj}
                    onChange={handleChange("cnpj")}
                    fullWidth
                    helperText=" "
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Seção 2: Localização */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: "8px" }}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ fontWeight: "medium" }}
              >
                Localização
              </Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    label="*Endereço"
                    value={values.address}
                    onChange={handleChange("address")}
                    error={!!errors.address}
                    helperText={errors.address || " "}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    variant="outlined"
                    label="*Bairro"
                    value={values.neighborhood}
                    onChange={handleChange("neighborhood")}
                    error={!!errors.neighborhood}
                    helperText={errors.neighborhood || " "}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl
                    fullWidth
                    variant="outlined"
                    error={!!errors.state}
                    required
                    sx={{ minWidth: 220 }}
                  >
                    <InputLabel id="state-select-label">*Estado</InputLabel>
                    <Select
                      labelId="state-select-label"
                      id="state-select"
                      value={values.state}
                      onChange={handleChange("state")}
                      label="*Estado"
                    >
                      <MenuItem value="">
                        <em>Selecione</em>
                      </MenuItem>
                      <MenuItem value="SP">São Paulo</MenuItem>
                      <MenuItem value="RJ">Rio de Janeiro</MenuItem>
                    </Select>
                    <FormHelperText>{errors.state || " "}</FormHelperText>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl
                    fullWidth
                    variant="outlined"
                    error={!!errors.city}
                    required
                    sx={{ minWidth: 220 }}
                  >
                    <InputLabel id="city-select-label">*Cidade</InputLabel>
                    <Select
                      labelId="city-select-label"
                      id="city-select"
                      value={values.city}
                      onChange={handleChange("city")}
                      label="*Cidade"
                    >
                      <MenuItem value="">
                        <em>Selecione</em>
                      </MenuItem>
                      <MenuItem value="sao_paulo">São Paulo</MenuItem>
                      <MenuItem value="rio">Rio de Janeiro</MenuItem>
                    </Select>
                    <FormHelperText>{errors.city || " "}</FormHelperText>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {/* Seção 3: Detalhes Adicionais */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: "8px" }}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ fontWeight: "medium" }}
              >
                Detalhes Adicionais
              </Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl
                    fullWidth
                    variant="outlined"
                    error={!!errors.type}
                    required
                    sx={{ minWidth: 250 }}
                  >
                    <InputLabel id="type-select-label">*Tipo</InputLabel>
                    <Select
                      labelId="type-select-label"
                      id="type-select"
                      value={values.type}
                      onChange={handleChange("type")}
                      label="*Tipo"
                    >
                      <MenuItem value="">
                        <em>Selecione</em>
                      </MenuItem>
                      <MenuItem value="Residencial">Residencial</MenuItem>
                      <MenuItem value="Comercial">Comercial</MenuItem>
                    </Select>
                    <FormHelperText>{errors.type || " "}</FormHelperText>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    variant="outlined"
                    label="Anexar foto"
                    disabled
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          {" "}
                          <AttachmentIcon />{" "}
                        </InputAdornment>
                      ),
                    }}
                    helperText=" "
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl
                    fullWidth
                    sx={{ minWidth: 250 }}
                    variant="outlined"
                  >
                    <InputLabel id="reference-select-label">
                      Condomínio de referência
                    </InputLabel>
                    <Select
                      labelId="reference-select-label"
                      id="reference-select"
                      value={values.reference}
                      onChange={handleChange("reference")}
                      label="Condomínio de referência"
                    >
                      <MenuItem value="">
                        <em>Nenhum</em>
                      </MenuItem>
                      {/* Mapear outras opções aqui, se necessário */}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined" color="secondary">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            onClick={() => {
              // opcional: validações aqui também
              onSave(values);
              onClose();
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
