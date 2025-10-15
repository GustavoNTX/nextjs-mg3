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

const AtividadesContext = createContext(null);

// endpoints comuns p/ descobrir empresa do usuário
const EMPRESA_ENDPOINTS = ["/api/empresas/minha"];

export function AtividadesProvider({ children }) {
  const { fetchWithAuth, user } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [error, setError] = useState(null);

  const [empresaId, setEmpresaId] = useState(() => user?.empresaId ?? null);
  const [condominioId, setCondominioId] = useState(null);
  const [filters, setFilters] = useState({ q: "", prioridade: null, status: null });

  // refs para leituras estáveis
  const empresaIdRef = useRef(empresaId);
  const condominioIdRef = useRef(condominioId);
  const filtersRef = useRef(filters);

  useEffect(() => { empresaIdRef.current = empresaId; }, [empresaId]);
  useEffect(() => { condominioIdRef.current = condominioId; }, [condominioId]);
  useEffect(() => { filtersRef.current = filters; }, [filters]);

  // se o Auth povoar depois
  useEffect(() => {
    if (user?.empresaId && !empresaIdRef.current) {
      setEmpresaId(user.empresaId);
    }
  }, [user]);

  // tenta descobrir empresaId quando faltar
  const resolveEmpresaId = useCallback(async () => {
    if (empresaIdRef.current) return empresaIdRef.current;
    if (user?.empresaId) {
      setEmpresaId(user.empresaId);
      return user.empresaId;
    }
    for (const url of EMPRESA_ENDPOINTS) {
      try {
        const r = await fetchWithAuth(url, { cache: "no-store" });
        if (!r.ok) continue;
        const j = await r.json().catch(() => ({}));
        const eid =
          j?.empresaId ||
          j?.user?.empresaId ||
          j?.me?.empresaId ||
          j?.profile?.empresaId;
        if (eid) {
          setEmpresaId(eid);
          return eid;
        }
      } catch {
        // tenta o próximo
      }
    }
    throw new Error("empresaId ausente.");
  }, [fetchWithAuth, user]);

  const buildQuery = (empId, cId, f, opts = {}) => {
    if (!empId || !cId) return null;
    const params = new URLSearchParams();
    params.set("empresaId", empId);
    params.set("condominioId", cId);
    const { q, prioridade, status } = f || {};
    if (q) params.set("q", q);
    if (prioridade) params.set("prioridade", String(prioridade));
    if (status) params.set("status", String(status));
    if (opts.take) params.set("take", String(opts.take));
    if (opts.cursor) params.set("cursor", String(opts.cursor));
    return params.toString();
  };

  const load = useCallback(
    async ({ empresaId: emp, condominioId: cId, filters: f, reset = true, take = 50, cursor } = {}) => {
      setError(null);
      try {
        const finalEmpresa = emp ?? empresaIdRef.current ?? (await resolveEmpresaId());
        const finalCondo = cId ?? condominioIdRef.current;
        const finalFilters = f ?? filtersRef.current;

        if (!finalCondo) {
          setError("Defina um condomínio.");
          return;
        }

        const qs = buildQuery(finalEmpresa, finalCondo, finalFilters, { take, cursor });
        if (!qs) {
          setError("Parâmetros inválidos.");
          return;
        }

        if (reset) {
          setLoading(true);
          setItems([]);
          setNextCursor(null);
          if (finalCondo !== condominioIdRef.current) setCondominioId(finalCondo);
          if (finalEmpresa !== empresaIdRef.current) setEmpresaId(finalEmpresa);
          setFilters((old) => ({
            q: finalFilters?.q ?? "",
            prioridade: finalFilters?.prioridade ?? null,
            status: finalFilters?.status ?? null,
          }));
        }

        const res = await fetchWithAuth(`/api/atividades?${qs}`, { cache: "no-store" });
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
    [fetchWithAuth, resolveEmpresaId]
  );

  const loadMore = useCallback(async () => {
    if (!nextCursor) return;
    await load({ cursor: nextCursor, reset: false });
  }, [nextCursor, load]);

  const createAtividade = useCallback(
    async (data, fallbackCondominioId) => {
      const emp = empresaIdRef.current ?? (await resolveEmpresaId());
      const condo =
        data.condominioId ??
        data.condominio?.id ??
        fallbackCondominioId ??
        condominioIdRef.current;

      if (!emp) throw new Error("empresaId ausente.");
      if (!condo) throw new Error("condominioId ausente.");

      const payload = {
        ...data,
        empresaId: emp,
        condominioId: condo,
        quantity: Number(data.quantity),
        photoUrl: data.photoUrl ?? null,
      };
      delete payload.photo;
      delete payload.condominio;

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

      // otimista se combina com filtro/condomínio atual
      setItems((old) => {
        const f = filtersRef.current;
        const okCondo = created.condominioId === condominioIdRef.current;
        const okStatus = !f?.status || created.status === f.status;
        const okPri = !f?.prioridade || created.prioridade === f.prioridade;
        return okCondo && okStatus && okPri ? [created, ...old] : old;
      });

      return created;
    },
    [fetchWithAuth, resolveEmpresaId]
  );

  const updateAtividade = useCallback(
    async (id, data, fallbackCondominioId) => {
      const emp = empresaIdRef.current ?? (await resolveEmpresaId());
      const existing = items.find((i) => i.id === id);
      const condo =
        data?.condominioId ??
        existing?.condominioId ??
        fallbackCondominioId ??
        condominioIdRef.current;

      if (!emp) throw new Error("empresaId ausente.");
      if (!condo) throw new Error("condominioId ausente.");

      const payload = { ...data, empresaId: emp, condominioId: condo };

      const res = await fetchWithAuth(`/api/atividades/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = "Não foi possível atualizar a atividade.";
        try {
          const err = await res.json();
          if (err?.error) msg = err.error;
        } catch {}
        throw new Error(msg);
      }

      const updated = await res.json();
      setItems((old) => old.map((it) => (it.id === id ? updated : it)));
      return updated;
    },
    [fetchWithAuth, items, resolveEmpresaId]
  );

  const deleteAtividade = useCallback(
    async (id, fallbackCondominioId) => {
      const emp = empresaIdRef.current ?? (await resolveEmpresaId());
      const existing = items.find((i) => i.id === id);
      const condo =
        existing?.condominioId ??
        fallbackCondominioId ??
        condominioIdRef.current;

      if (!emp) throw new Error("empresaId ausente.");
      if (!condo) throw new Error("condominioId ausente.");

      const qs = new URLSearchParams({ empresaId: emp, condominioId: String(condo) }).toString();

      const res = await fetchWithAuth(`/api/atividades/${id}?${qs}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Erro ao excluir atividade");
      }
      setItems((old) => old.filter((it) => it.id !== id));
    },
    [fetchWithAuth, items, resolveEmpresaId]
  );

  const stats = useMemo(() => {
    const total = items.length;
    const emAndamento = items.filter((i) => i.status === "EM_ANDAMENTO" || i.status === true).length;
    const pendentes = items.filter((i) => i.status === "PENDENTE" || i.status === false).length;
    return { total, emAndamento, pendentes };
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      loading,
      error,
      nextCursor,
      empresaId,
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
      setEmpresaId,
    }),
    [
      items,
      loading,
      error,
      nextCursor,
      empresaId,
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

  return <AtividadesContext.Provider value={value}>{children}</AtividadesContext.Provider>;
}

export const useAtividades = () => {
  const ctx = useContext(AtividadesContext);
  if (!ctx) throw new Error("useAtividades deve ser usado dentro de AtividadesProvider");
  return ctx;
};
