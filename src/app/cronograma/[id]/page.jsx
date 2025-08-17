// src/app/cronograma/[id]/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { Box, Tabs, Tab, Button, Stack } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import {
  CondominoUIProvider,
  useCondominoUI,
} from "@/contexts/CondominoUIContext";
import { useAuth } from "@/contexts/AuthContext";

// Componentes de visualização
import ListaAtividades from "@/components/ListaAtividades";
import KanbanBoard from "@/components/KanbanBoard";
import CalendarView from "@/components/CalendarView";

function CronogramaInner() {
  const { setSelected } = useCondominoUI();
  const { fetchWithAuth } = useAuth();
  const router = useRouter();

  const params = useParams();
  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : undefined;

  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);

  const handleTabChange = (_e, newValue) => setCurrentTab(newValue);

  useEffect(() => {
    if (!id) return;

    // Coloca um placeholder no header para ocultar busca/filtro enquanto carrega
    setSelected((prev) => prev ?? { id, name: "Carregando...", logoUrl: null });

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetchWithAuth(`/api/condominios/${id}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) {
          // 401/404/etc -> volta para a seleção
          router.replace("/selecione-o-condominio");
          return;
        }

        // A API retorna um array (findMany)
        const list = await res.json();
        const item = Array.isArray(list) ? list[0] : null;

        if (!item) {
          router.replace("/selecione-o-condominio");
          return;
        }

        setSelected({
          id: item.id,
          name: item.name,
          logoUrl: item.imageUrl ?? null,
        });
      } catch (err) {
        if (err?.name !== "AbortError") {
          // Em caso de erro inesperado, retorna para a seleção
          router.replace("/selecione-o-condominio");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [id, fetchWithAuth, router, setSelected]);

  if (!id || loading) {
    // Evita flicker da UI enquanto obtemos os dados
    return null;
  }

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="LISTA" />
          <Tab label="CALENDÁRIO" />
          <Tab label="KANBAN" />
        </Tabs>
      </Box>

      <Stack direction="row" justifyContent="flex-end" spacing={2} mb={3}>
        <Button variant="contained" startIcon={<AddIcon />}>
          Adicionar Atividade
        </Button>
        <Button variant="outlined">Filtros</Button>
      </Stack>

      <Box>
        {currentTab === 0 && <ListaAtividades />}
        {currentTab === 1 && <CalendarView />}
        {currentTab === 2 && <KanbanBoard />}
      </Box>
    </>
  );
}

export default function CronogramaPage() {
  return (
    // Deixe este Provider aqui se você NÃO tiver um global.
    // Se já existir um CondominoUIProvider global (ex.: em layout do segmento),
    // remova este wrapper para evitar duplicação.
    <CondominoUIProvider>
      <Layout>
        <CronogramaInner />
      </Layout>
    </CondominoUIProvider>
  );
}
