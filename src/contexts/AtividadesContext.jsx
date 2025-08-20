"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { useAuth } from "@/contexts/AuthContext";

// Se estiver usando enums no backend, você pode importar AtividadeStatus/Prioridade do @prisma/client
// e usar aqui como string (ex.: "EM_ANDAMENTO") para montar a query.

const AtividadesContext = createContext(null);

export function AtividadesProvider({ children }) {
  const { fetchWithAuth } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [error, setError] = useState(null);

  const [condominioId, setCondominioId] = useState(null);
  const [filters, setFilters] = useState({
    q: "",
    prioridade: null,
    status: null,
  });

  // refs para ler o "valor atual" sem colocar nas dependências dos callbacks
  const filtersRef = useRef(filters);
  const condominioIdRef = useRef(condominioId);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);
  useEffect(() => {
    condominioIdRef.current = condominioId;
  }, [condominioId]);

  const buildQuery = (cId, f, opts = {}) => {
    const params = new URLSearchParams();
    if (!cId) return null;
    params.set("condominioId", cId);

    const { q, prioridade, status } = f || {};
    if (q) params.set("q", q);
    if (prioridade) params.set("prioridade", String(prioridade)); // ex.: "MEDIO"
    if (status) params.set("status", String(status)); // ex.: "EM_ANDAMENTO"

    if (opts.take) params.set("take", String(opts.take));
    if (opts.cursor) params.set("cursor", String(opts.cursor));
    return params.toString();
  };

  // ⚠️ load não depende mais de filters/condominioId para não ficar recriando a função
  const load = useCallback(
    async ({
      condominioId: cId,
      filters: f,
      reset = true,
      take = 50,
      cursor,
    } = {}) => {
      setError(null);

      // prioriza os parâmetros; se não vier, usa o que estiver em ref (estado atual)
      const finalCondo = cId ?? condominioIdRef.current;
      const finalFilters = f ?? filtersRef.current;

      const qs = buildQuery(finalCondo, finalFilters, { take, cursor });
      if (!qs) return;

      if (reset) {
        setLoading(true);
        setItems([]);
        setNextCursor(null);
        // atualiza estados apenas se mudarem de fato (evita renders desnecessários)
        if (finalCondo !== condominioIdRef.current) setCondominioId(finalCondo);
        setFilters((old) => {
          const same =
            old?.q === (finalFilters?.q ?? "") &&
            old?.prioridade === (finalFilters?.prioridade ?? null) &&
            old?.status === (finalFilters?.status ?? null);
          return same
            ? old
            : {
                q: finalFilters?.q ?? "",
                prioridade: finalFilters?.prioridade ?? null,
                status: finalFilters?.status ?? null,
              };
        });
      }

      try {
        const res = await fetchWithAuth(`/api/atividades?${qs}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Falha ao carregar atividades");
        const json = await res.json();
        setItems((old) => (reset ? json.items : [...old, ...json.items]));
        setNextCursor(json.nextCursor ?? null);
      } catch (e) {
        setError(e?.message || "Erro ao carregar atividades");
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth]
  );

  const loadMore = useCallback(async () => {
    if (!nextCursor) return;
    await load({ cursor: nextCursor, reset: false });
  }, [nextCursor, load]);

  const createAtividade = useCallback(
    async (data, fallbackCondominioId) => {
      const payload = {
        ...data,
        quantity: Number(data.quantity),
        condominioId:
          data.condominioId ??
          data.condominio?.id ??
          fallbackCondominioId ??
          condominioIdRef.current,
        photoUrl: data.photoUrl ?? null,
      };
      delete payload.photo;
      delete payload.condominio;

      if (!payload.condominioId)
        throw new Error("Selecione um condomínio para criar a atividade.");

      const res = await fetchWithAuth("/api/atividades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Erro ao criar atividade");
      }
      const created = await res.json();

      // só insere otimista se bater com o filtro ativo e condomínio atual
      setItems((old) => {
        const f = filtersRef.current;
        const okCondo = created.condominioId === condominioIdRef.current;
        const okStatus = !f?.status || created.status === f.status;
        const okPri = !f?.prioridade || created.prioridade === f.prioridade;
        return okCondo && okStatus && okPri ? [created, ...old] : old;
      });

      return created;
    },
    [fetchWithAuth]
  );

  const updateAtividade = useCallback(
    async (id, data) => {
      const res = await fetchWithAuth(`/api/atividades/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        let msg = "Não foi possível atualizar a atividade.";
        try {
          const err = await res.json();
          if (err?.error) msg = err.error;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      const updated = await res.json();
      setItems((old) => old.map((it) => (it.id === id ? updated : it)));
      return updated;
    },
    [fetchWithAuth, setItems]
  );

  const deleteAtividade = useCallback(
    async (id) => {
      const res = await fetchWithAuth(`/api/atividades/${id}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Erro ao excluir atividade");
      }
      setItems((old) => old.filter((it) => it.id !== id));
    },
    [fetchWithAuth]
  );

  const stats = useMemo(() => {
    const total = items.length;
    // Se status agora é enum (ex.: "EM_ANDAMENTO"), ajuste aqui seu agrupamento:
    const emAndamento = items.filter((i) => i.status === "EM_ANDAMENTO").length;
    const pendentes = items.filter((i) => i.status === "PENDENTE").length;
    return { total, emAndamento, pendentes };
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      loading,
      error,
      nextCursor,
      condominioId,
      filters,
      stats,
      load,
      loadMore,
      createAtividade,
      updateAtividade,
      deleteAtividade,
      setFilters,
      setCondominioId,
    }),
    [
      items,
      loading,
      error,
      nextCursor,
      condominioId,
      filters,
      stats,
      load,
      loadMore,
      createAtividade,
      updateAtividade,
      deleteAtividade,
    ]
  );

  return (
    <AtividadesContext.Provider value={value}>
      {children}
    </AtividadesContext.Provider>
  );
}

export const useAtividades = () => {
  const ctx = useContext(AtividadesContext);
  if (!ctx)
    throw new Error(
      "useAtividades deve ser usado dentro de AtividadesProvider"
    );
  return ctx;
};
