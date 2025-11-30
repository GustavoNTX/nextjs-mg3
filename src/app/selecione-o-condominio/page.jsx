// src/app/selecione-o-condominio/page.jsx
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
import ProtectedRoute from "@/components/ProtectedRoute";
import Image from "next/image";
import { useState, useMemo } from "react";
import {
  CondominoUIProvider,
  useCondominoUI,
} from "@/contexts/CondominoUIContext";

function PageInner() {
  const {
    items: condominios,
    create,
    update,
    remove,
    loading,
    error,
  } = useCondominios();
  const { search, filtro } = useCondominoUI();

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
  };
  const handleDelete = async (condoId) => {
    await remove(condoId);
    setEditDialogOpen(false);
  };

  const filtered = useMemo(() => {
    const s = (search || "").toLowerCase();
    const f = (filtro || "Todos").toLowerCase();
    return (condominios || []).filter((c) => {
      const matchName = !s || (c.name || "").toLowerCase().includes(s);
      const matchType = f === "todos" || (c.type || "").toLowerCase() === f;
      return matchName && matchType;
    });
  }, [condominios, search, filtro]);

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
            <Image src="/simple-logo.png" alt="Logo" width={150} height={150} />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: "center", width: "100%", mt: 8 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              alignItems: "stretch",
            }}
          >
            {filtered.length > 0 ? (
              filtered.map((condominio) => (
                <Grid
                  item
                  key={condominio.id}
                  xs={12}
                  sm={6}
                  md={4}
                  sx={{ display: "flex" }}
                >
                  <CondominioCard {...condominio} onEdit={handleEdit} />
                </Grid>
              ))
            ) : (
              <Box
                sx={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "50vh",
                  textAlign: "center",
                  mt: 4,
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  Nenhum condomínio encontrado
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Ajuste os filtros ou limpe a busca.
                </Typography>
              </Box>
            )}          </Box>
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
      {/* Provider precisa ficar ACIMA do Layout para o Header enxergar o contexto */}
      <CondominoUIProvider>
        <Layout>
          <CondominiosProvider>
            <PageInner />
          </CondominiosProvider>
        </Layout>
      </CondominoUIProvider>
    </ProtectedRoute>
  );
}
