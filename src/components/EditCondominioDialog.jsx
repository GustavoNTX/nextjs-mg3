// src/components/EditCondominioDialog.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation'; // <<< MUDANÇA 1: Importar o useRouter
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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from '@mui/icons-material/Edit';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';


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

export default function EditCondominioDialog({ open, onClose, onSave, condominio }) {
  const router = useRouter(); // <<< MUDANÇA 2: Instanciar o roteador
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

  // <<< MUDANÇA 3: Criar a função para navegar
  const handleOpenCronograma = () => {
    // Se o cronograma for parte do mesmo app, o ideal é usar a rota relativa
    // router.push('/cronograma');
    
    // Para a sua URL específica:
    router.push('/cronograma');
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src={values.imageUrl || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1974&auto=format&fit=crop'} 
            alt={`Foto de ${values.name}`}
            style={{ width: 60, height: 60, borderRadius: '8px', objectFit: 'cover', marginRight: '16px' }}
          />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{values.name}</Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="abas de edição">
          <Tab label="Visão Geral" />
          <Tab label="Anexos" />
          <Tab label="Anotações" />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        <Typography variant="h6" gutterBottom>Detalhes do Condomínio</Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Grid container spacing={2}>
                 <Grid item xs={12} sm={6}>
                    <TextField label="Nome do condomínio" value={values.name || ""} onChange={handleChange("name")} fullWidth />
                </Grid>
                 <Grid item xs={12} sm={6}>
                    <TextField label="CNPJ" value={values.cnpj || ""} onChange={handleChange("cnpj")} fullWidth />
                </Grid>
                <Grid item xs={12}>
                    <TextField label="Endereço" value={values.address || ""} onChange={handleChange("address")} fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField label="Bairro" value={values.neighborhood || ""} onChange={handleChange("neighborhood")} fullWidth />
                </Grid>
                 <Grid item xs={12} sm={6}>
                    <TextField label="Tipo" value={values.type || ""} onChange={handleChange("type")} fullWidth />
                </Grid>
            </Grid>
        </Paper>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
             {/* <<< MUDANÇA 4: Adicionar o onClick ao botão */}
             <Button 
                variant="contained" 
                endIcon={<ArrowForwardIosIcon />}
                onClick={handleOpenCronograma}
             >
                Abrir Cronograma
            </Button>
            <Button variant="contained" color="secondary" startIcon={<EditIcon />} onClick={handleSaveChanges}>
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