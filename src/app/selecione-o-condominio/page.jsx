// src/app/selecione-o-condominio/page.jsx
"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Stack,
} from "@mui/material";
import {
  Add as AddIcon,
  GetApp as GetAppIcon,
} from "@mui/icons-material";
import Layout from "@/components/Layout";
import AddCondominioDialog from "@/components/AddCondominioDialog";
import CondominioCard from "@/components/CondominioCard"; // Importe o novo componente

// Dados de exemplo (substitua pela sua chamada de API)
const condominiosMock = [
  { id: 1, name: "Residencial Jardins", address: "Rua das Flores, 123, São Paulo", type: "Residencial", imageUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1974&auto=format&fit=crop" },
  { id: 2, name: "Business Tower", address: "Av. Principal, 456, Rio de Janeiro", type: "Comercial", imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop" },
  { id: 3, name: "Condomínio Central", address: "Praça da Cidade, 789, Belo Horizonte", type: "Residencial", imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop" },
  { id: 4, name: "Edifício Sol Nascente", address: "Rua do Sol, 101, Salvador", type: "Residencial", imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop" },
];


export default function SelecioneOCondominioPage() {
  const [condominios, setCondominios] = useState(condominiosMock); // Usando os dados de exemplo
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSave = (data) => {
    console.log("Dados do novo condomínio:", data);
    // TODO: Chamar sua API para salvar o novo condomínio
    // e depois atualizar o estado 'condominios'
    const newCondominio = { ...data, id: condominios.length + 1 };
    setCondominios(prev => [...prev, newCondominio]);
    setDialogOpen(false);
  };

  return (
    <Layout>
      {/* Ações */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        mb={4}
        alignItems="center"
        sx={{ justifyContent: 'flex-end' }}
      >
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          onClick={() => setDialogOpen(true)}
        >
          Adicionar condomínio
        </Button>
        <Button
          startIcon={<GetAppIcon />}
          variant="outlined"
          color="secondary"
        >
          Extrair Relatório
        </Button>
      </Stack>

      {/* Grid de Condomínios */}
      <Grid container spacing={3}>
        {condominios.length > 0 ? (
          condominios.map((condominio) => (
            <Grid item key={condominio.id} xs={12} sm={6} md={4}>
              <CondominioCard {...condominio} />
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Box textAlign="center" mt={8}>
              <Typography variant="h6" color="text.secondary">
                Não há condomínios para mostrar
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Clique em "Adicionar condomínio" para começar.
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      <AddCondominioDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </Layout>
  );
}