"use client";

import { Box, Typography, Button, Grid, Stack } from "@mui/material";
import { Add as AddIcon, GetApp as GetAppIcon } from "@mui/icons-material";
import Layout from "@/components/Layout";
import AddCondominioDialog from "@/components/AddCondominioDialog";
import CondominioCard from "@/components/CondominioCard";
import EditCondominioDialog from "@/components/EditCondominioDialog";
import {
  CondominiosProvider,
  useCondominios,
} from "@/contexts/CondominiosContext";
import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Image from 'next/image';

function PageInner() {
  const {
    items: condominios,
    create,
    update,
    remove,
    loading,
    error,
  } = useCondominios();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCondo, setSelectedCondo] = useState(null);

  const handleEdit = (condo) => {
    setSelectedCondo(condo);
    setEditDialogOpen(true);
  };

  const handleSaveNew = async (data) => {
    await create(data);
    setAddDialogOpen(false);
  };

  const handleSaveEdit = async (updatedData) => {
    await update(updatedData.id, updatedData);
    // setEditDialogOpen(false);
  };

  const handleDelete = async (condoId) => {
    await remove(condoId);
    setEditDialogOpen(false);
  };

  return (
    <>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
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
            onClick={() => setAddDialogOpen(true)}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Adicionar condomínio
          </Button>
          <Button
            startIcon={<GetAppIcon />}
            variant="outlined"
            color="secondary"
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Extrair Relatório
          </Button>
        </Stack>

        {loading ? (
          <Box sx={{ textAlign: "center", width: "100%", mt: 8 }}>
             <Image
                       src="/simple-logo.png"
                       alt="Logo"
                       width={150}
                       height={150}
                     />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: "center", width: "100%", mt: 8 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {condominios.length > 0 ? (
              condominios.map((condominio) => (
                <Grid item key={condominio.id} xs={12} sm={6} md={4}>
                  {console.log("Condominhos: ", condominio)}
                  <CondominioCard {...condominio} onEdit={handleEdit} />
                </Grid>
              ))
            ) : (
              <Grid sx={{ textAlign: "center", width: "100%", mt: 8 }} item xs={12}>
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
        )}
      </Box>

      <AddCondominioDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSave={handleSaveNew}
      />
      {selectedCondo && (
        <EditCondominioDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onSave={handleSaveEdit}
          onDelete={handleDelete}
          condominio={selectedCondo}
        />
      )}
    </>
  );
}

export default function SelecioneOCondominioPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <CondominiosProvider>
          <PageInner />
        </CondominiosProvider>
      </Layout>
    </ProtectedRoute>
  );
}
