"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import {
  Box,
  Tabs,
  Tab,
  Button,
  Stack,
  Chip,
  Avatar,
  Typography,
  Divider,
  CircularProgress,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import {
  CondominoUIProvider,
  useCondominoUI,
} from "@/contexts/CondominoUIContext";
import { useAuth } from "@/contexts/AuthContext";
import ListaAtividades from "@/components/ListaAtividades";
import KanbanBoard from "@/components/KanbanBoard";
import CalendarView from "@/components/CalendarView";
import AddAtividadeDialog from "@/components/AddAtividadeDialog";
import {
  CondominiosProvider,
  useCondominios,
} from "@/contexts/CondominiosContext";
import {
  AtividadesProvider,
  useAtividades,
} from "@/contexts/AtividadesContext";

function HeaderResumo() {
  const { selected } = useCondominoUI();
  const { stats, loading } = useAtividades();

  const total = stats?.total ?? 0;
  const pendentes = stats?.pendentes ?? 0;
  const funcionando = stats?.emAndamento ?? 0; 

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ mb: 2 }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar
          src={selected?.logoUrl || undefined}
          alt={selected?.name || ""}
        />
        <Typography variant="h6" fontWeight={700}>
          {selected?.name || "Condomínio"}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip label={`Total: ${total}`} />
        {!!funcionando && (
          <Chip color="success" label={`Funcionando: ${funcionando}`} />
        )}
        <Chip color="warning" label={`Pendentes: ${pendentes}`} />
        {loading && <CircularProgress size={18} />}
      </Stack>
    </Stack>
  );
}

function CronogramaInner() {
  const { selected, setSelected } = useCondominoUI();
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
  const [loadingCondominio, setLoadingCondominio] = useState(true);
  const [addAtividadeOpen, setAddAtividadeOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // <- item sendo editado

  const { items: condominios } = useCondominios();

  // Garanta que seu contexto exponha updateAtividade
  const { load, createAtividade, updateAtividade } = useAtividades();

  const handleTabChange = (_e, newValue) => setCurrentTab(newValue);

  // Abrir para criar
  const handleOpenCreate = useCallback(() => {
    setEditingItem(null);
    setAddAtividadeOpen(true);
  }, []);

  // Abrir para editar (recebe o item da lista/kanban/calendário)
  const handleOpenEdit = useCallback((item) => {
    setEditingItem(item || null);
    setAddAtividadeOpen(true);
  }, []);

  // Salvar (criar/editar) — compatível com o AddAtividadeDialog proposto
  const handleSaveDialog = useCallback(
    async (payload, { mode }) => {
      try {
        // NÃO engula o erro aqui; deixe-o subir pro diálogo
        const result =
          mode === "edit" && payload?.id
            ? await updateAtividade(payload.id, payload)
            : await createAtividade(payload, id);

        // sucesso: recarrega lista; o próprio diálogo fechará após o await onSave
        await load({ condominioId: id, reset: true });
        return result;
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    [updateAtividade, createAtividade, id, load]
  );

  const handleCloseDialog = useCallback(() => {
    setAddAtividadeOpen(false);
  }, []);

  // carrega dados do condomínio e define selected
  useEffect(() => {
    if (!id) return;
    setSelected((prev) => prev ?? { id, name: "Carregando...", logoUrl: null });

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetchWithAuth(`/api/condominios/${id}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) {
          router.replace("/selecione-o-condominio");
          return;
        }
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
          router.replace("/selecione-o-condominio");
        }
      } finally {
        setLoadingCondominio(false);
      }
    })();

    return () => controller.abort();
  }, [id, fetchWithAuth, router, setSelected]);

  // carrega atividades ao trocar o condomínio
  useEffect(() => {
    if (!id) return;
    load({ condominioId: id, reset: true });
  }, [id, load]);

  if (!id || loadingCondominio) return null;

  return (
    <>
      <HeaderResumo />

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="LISTA" />
          <Tab label="CALENDÁRIO" />
          <Tab label="KANBAN" />
        </Tabs>
      </Box>

      <Stack direction="row" justifyContent="flex-end" spacing={2} mb={3}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          Adicionar Atividade
        </Button>
        <Button variant="outlined">Filtros</Button>
      </Stack>

      <Box>
        {/* Passe onEdit para permitir abrir o diálogo em modo edição (se o componente consumir) */}
        {currentTab === 0 && <ListaAtividades onEdit={handleOpenEdit} />}
        {currentTab === 1 && <CalendarView onEdit={handleOpenEdit} />}
        {currentTab === 2 && <KanbanBoard onEdit={handleOpenEdit} />}
      </Box>

      <AddAtividadeDialog
        open={addAtividadeOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveDialog}
        condominios={condominios}
        selectedCondominio={selected}
        mode={editingItem ? "edit" : "create"}
        initialData={editingItem}
      />
    </>
  );
}

export default function CronogramaPage() {
  return (
    <CondominoUIProvider>
      <Layout>
        <CondominiosProvider>
          <AtividadesProvider>
            <CronogramaInner />
          </AtividadesProvider>
        </CondominiosProvider>
      </Layout>
    </CondominoUIProvider>
  );
}
