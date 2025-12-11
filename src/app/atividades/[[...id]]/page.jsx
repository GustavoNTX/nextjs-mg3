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
import SelectCondominio from "@/components/SelectCondominio";

/**
 * Observação importante:
 * - O backend NÃO aceita um campo "status" direto na entidade Atividade.
 * - O estado da execução é armazenado em AtividadeHistorico.
 * - Portanto aqui não há transformação de status para booleanos/enum antes de enviar.
 */

/* ---------- HeaderResumo (limpo) ---------- */
function HeaderResumo() {
  const { selected } = useCondominoUI();
  const { stats, loading, totalAtividadesNosCondominios } = useAtividades();

  const total = totalAtividadesNosCondominios ?? 0;
  const funcionando = stats?.emAndamento ?? 0;
  const pendentes = stats?.pendentes ?? 0;

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ mb: 2 }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar src={selected?.logoUrl || undefined} alt={selected?.name || ""} />
        <Typography variant="h6" fontWeight={700}>
          {selected?.name || "Condomínio"}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip label={`Total: ${total}`} />
        {!!funcionando && <Chip color="success" label={`Funcionando: ${funcionando}`} />}
        <Chip color="warning" label={`Pendentes: ${pendentes}`} />
        {loading && <CircularProgress size={18} />}
      </Stack>
    </Stack>
  );
}

/* ---------- CronogramaInner (corrigido) ---------- */
function CronogramaInner() {
  const { selected, setSelected } = useCondominoUI();
  const { fetchWithAuth } = useAuth();
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const id =
    typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : undefined;
  const singleMode = !!id;

  const [currentTab, setCurrentTab] = useState(0);
  const [loadingCondominio, setLoadingCondominio] = useState(true);
  const [addAtividadeOpen, setAddAtividadeOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const { items: condominios } = useCondominios();

  // do contexto de atividades
  const { load, createAtividade, updateAtividade } = useAtividades();

  const handleTabChange = (_e, newValue) => setCurrentTab(newValue);

  const handleOpenCreate = useCallback(() => {
    setEditingItem(null);
    setAddAtividadeOpen(true);
  }, []);

  const handleOpenEdit = useCallback((item) => {
    setEditingItem(item || null);
    setAddAtividadeOpen(true);
  }, []);

  /**
   * handleSaveDialog:
   * - Não altera "status" no payload (status é gerenciado via histórico)
   * - Para criação, envia o DTO esperado pelo backend (createAtividade)
   * - Para edição, envia apenas os campos do molde (sem status/histórico)
   */
  const handleSaveDialog = useCallback(
    async (payload, { mode }) => {
      try {
        // cria uma cópia simples e remove qualquer chave de status por segurança
        const dto = { ...payload };
        if ("status" in dto) delete dto.status;
        // remover campos que não são parte do modelo (se houver)
        if ("id" in dto && mode !== "edit") delete dto.id;

        const result =
          mode === "edit" && dto?.id
            ? await updateAtividade(dto.id, dto)
            : await createAtividade(dto, id ?? dto?.condominioId);

        if (id) await load({ condominioId: id, reset: true });
        return result;
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    [updateAtividade, createAtividade, id, load]
  );

  const handleCloseDialog = useCallback(() => setAddAtividadeOpen(false), []);

  // carrega dados do condomínio
  useEffect(() => {
    if (!singleMode) {
      setSelected({ id: null, name: "Selecione um condomínio", logoUrl: null });
      setLoadingCondominio(false);
      return;
    }
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
        if (err?.name !== "AbortError") router.replace("/selecione-o-condominio");
      } finally {
        setLoadingCondominio(false);
      }
    })();

    return () => controller.abort();
  }, [singleMode, id, fetchWithAuth, router, setSelected]);

  // consulta atividades — SOMENTE se houver condominioId (API exige)
  useEffect(() => {
    if (!id) return;
    load({ condominioId: id, reset: true });
  }, [id, load]);

  if (singleMode && loadingCondominio) return null;

  return (
    <>
      <HeaderResumo />

      <Divider sx={{ mb: 2 }} />
      <Stack direction="row" justifyContent="flex-end" spacing={2} mb={3}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} disabled={!singleMode}>
          Adicionar Atividade
        </Button>
      </Stack>
      <Box sx={{ mb: 2 }}>
        <SelectCondominio fullWidth />
      </Box>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="LISTA" />
          <Tab label="CALENDÁRIO" />
          <Tab label="KANBAN" />
        </Tabs>
      </Box>

      <Box>
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
  return <CronogramaInner />;
}
