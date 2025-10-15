// src/components/EditCondominioDialog.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogActions,
  IconButton,
  Button,
  Box,
  Typography,
  Divider,
  Tabs,
  Tab,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useCondominoUI } from "@/contexts/CondominoUIContext";

// Componente auxiliar para as abas
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function EditCondominioDialog({
  open,
  onClose,
  onSave,
  condominio,
}) {
  const { enterAtividades } = useCondominoUI();

  const router = useRouter();
  const [values, setValues] = useState(condominio || {});
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    if (condominio) {
      setValues(condominio);
    }
  }, [condominio]);

  if (!condominio) return null;

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleChange = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
  };

  const handleSaveChanges = () => {
    onSave(values);
    onClose();
  };

  const handleOpenAtividades = (alvoId = condominio?.id) => {
    if (alvoId) {
      enterAtividades({
        id: alvoId,
        name: condominio?.name ?? "",
        logoUrl: condominio?.imageUrl ?? null,
      });
      router.push(`/atividades/${alvoId}`);
    } else {
      // modo "Todos"
      enterAtividades({
        id: null,
        name: "Todos os condomínios",
        logoUrl: null,
      });
      router.push(`/atividades`);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <img
            src={
              values.imageUrl ||
              "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1974&auto=format&fit=crop"
            }
            alt={`Foto de ${values.name}`}
            style={{
              width: 60,
              height: 60,
              borderRadius: "8px",
              objectFit: "cover",
              marginRight: "16px",
            }}
          />
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            {values.name}
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="abas de edição"
        >
          <Tab label="Visão Geral" />
          <Tab label="Anexos" />
          <Tab label="Anotações" />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        <Typography variant="h6" gutterBottom>
          Detalhes do Condomínio
        </Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nome do condomínio"
                value={values.name || ""}
                onChange={handleChange("name")}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="CNPJ"
                value={values.cnpj || ""}
                onChange={handleChange("cnpj")}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Endereço"
                value={values.address || ""}
                onChange={handleChange("address")}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Bairro"
                value={values.neighborhood || ""}
                onChange={handleChange("neighborhood")}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="city-select-label">Cidade</InputLabel>
                <Select
                  labelId="city-select-label"
                  value={values.city || ""}
                  onChange={handleChange("city")}
                  label="Cidade"
                >
                  <MenuItem value="">
                    <em>Selecione</em>
                  </MenuItem>
                  <MenuItem value="sao_paulo">São Paulo</MenuItem>
                  <MenuItem value="rio">Rio de Janeiro</MenuItem>
                  <MenuItem value="Fortaleza">Fortaleza</MenuItem>
                  {/* Adicione outras cidades aqui */}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="state-select-label">Estado</InputLabel>
                <Select
                  labelId="state-select-label"
                  value={values.state || ""}
                  onChange={handleChange("state")}
                  label="Estado"
                >
                  <MenuItem value="">
                    <em>Selecione</em>
                  </MenuItem>
                  <MenuItem value="SP">São Paulo</MenuItem>
                  <MenuItem value="RJ">Rio de Janeiro</MenuItem>
                  <MenuItem value="CE">Ceará</MenuItem>
                  {/* Adicione outros estados aqui */}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="type-select-label">Tipo</InputLabel>
                <Select
                  labelId="type-select-label"
                  value={values.type || ""}
                  onChange={handleChange("type")}
                  label="Tipo"
                >
                  <MenuItem value="">
                    <em>Selecione</em>
                  </MenuItem>
                  <MenuItem value="Residencial">Residencial</MenuItem>
                  <MenuItem value="Comercial">Comercial</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
        <Box
          sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}
        >
          {/* <<< MUDANÇA 4: Adicionar o onClick ao botão */}
          <Button
            variant="contained"
            endIcon={<ArrowForwardIosIcon />}
            onClick={() => handleOpenAtividades(condominio.id)}
          >
            Abrir Atividades
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<EditIcon />}
            onClick={handleSaveChanges}
          >
            Salvar Alterações
          </Button>
        </Box>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <Typography>Gerenciamento de Anexos (Em construção)</Typography>
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <Typography>Anotações (Em construção)</Typography>
      </TabPanel>
    </Dialog>
  );
}
