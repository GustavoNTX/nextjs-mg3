// src/app/selecione-o-condominio/page.jsx
"use client";

import { useState } from "react";
import { Box, Typography, Button, Grid, Stack } from "@mui/material";
import { Add as AddIcon, GetApp as GetAppIcon } from "@mui/icons-material";
import Layout from "@/components/Layout";
import AddCondominioDialog from "@/components/AddCondominioDialog";
import CondominioCard from "@/components/CondominioCard";
import EditCondominioDialog from "@/components/EditCondominioDialog";

// Dados de exemplo (substitua pela sua chamada de API)
const condominiosMock = [
  // ...seus dados de exemplo permanecem aqui...
  {
    id: 1,
    name: "Residencial Jardins",
    cnpj: "11.111.111/0001-11",
    address: "Rua das Flores, 123, São Paulo",
    neighborhood: "Jardins",
    type: "Residencial",
    imageUrl:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1974&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Business Tower",
    cnpj: "22.222.222/0001-22",
    address: "Av. Principal, 456, Rio de Janeiro",
    neighborhood: "Centro",
    type: "Comercial",
    imageUrl:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Condomínio Central",
    cnpj: "33.333.333/0001-33",
    address: "Praça da Cidade, 789, Belo Horizonte",
    neighborhood: "Savassi",
    type: "Residencial",
    imageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop",
  },
];

export default function SelecioneOCondominioPage() {
  const [condominios, setCondominios] = useState(condominiosMock);
  const [addDialogOpen, setAddDialogOpen] = useState(false); // Estado unificado para o diálogo de adição
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCondo, setSelectedCondo] = useState(null);

  // Abre o diálogo de edição com os dados do condomínio
  const handleEdit = (condo) => {
    setSelectedCondo(condo);
    setEditDialogOpen(true);
  };

  // Salva um novo condomínio
  const handleSaveNew = (data) => {
    console.log("Salvando novo condomínio:", data);
    const newCondominio = { ...data, id: condominios.length + 1 };
    setCondominios((prev) => [...prev, newCondominio]);
    setAddDialogOpen(false);
  };

  // Atualiza um condomínio existente
  const handleSaveEdit = (updatedData) => {
    console.log("Atualizando condomínio:", updatedData);
    setCondominios((prev) =>
      prev.map((c) => (c.id === updatedData.id ? updatedData : c))
    );
    setEditDialogOpen(false);
  };

  // <<< MUDANÇA AQUI: Adicionada a função para deletar
  const handleDelete = (condoId) => {
    console.log("Excluindo condomínio com ID:", condoId);
    setCondominios((prev) => prev.filter((c) => c.id !== condoId));
    setEditDialogOpen(false);
  };

  return (
    <Layout>
      {/* Ações */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        mb={4}
        alignItems="center"
        sx={{ justifyContent: "flex-end" }}
      >
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          onClick={() => setAddDialogOpen(true)} // <<< MUDANÇA AQUI: Simplificado
        >
          Adicionar condomínio
        </Button>
        <Button startIcon={<GetAppIcon />} variant="outlined" color="secondary">
          Extrair Relatório
        </Button>
      </Stack>

      {/* Grid de Condomínios */}
      <Grid container spacing={3}>
        {condominios.length > 0 ? (
          condominios.map((condominio) => (
            <Grid item key={condominio.id} xs={12} sm={6} md={4}>
              {/* <<< MUDANÇA AQUI: Passando a função onEdit */}
              <CondominioCard {...condominio} onEdit={handleEdit} />
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

      {/* Diálogo para Adicionar */}
      <AddCondominioDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSave={handleSaveNew}
      />

      {/* Diálogo para Editar */}
      {selectedCondo && ( // Renderiza o diálogo apenas se houver um condomínio selecionado
        <EditCondominioDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onSave={handleSaveEdit}
          onDelete={handleDelete} // <<< MUDANÇA AQUI: Passando a função onDelete
          condominio={selectedCondo}
        />
      )}
    </Layout>
  );
}