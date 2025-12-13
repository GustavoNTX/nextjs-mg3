// contexts/AtividadesContext.jsx
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
import { getStatusNoDia } from "@/utils/atividadeStatus";

const AtividadesContext = createContext(null);

// endpoints comuns p/ descobrir empresa do usuário
const EMPRESA_ENDPOINTS = ["/api/empresas/minha"];

const DEFAULT_FILTERS = { q: "", prioridade: null, status: null };
const normalizeFilters = (value) => ({
  q: value?.q ?? "",
  prioridade: value?.prioridade ?? null,
  status: value?.status ?? null,
});
const startOfDayBrasilia = () => {
  // pega "agora" em Brasília
  const nowInBrasilia = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );

  // força pra 00:00:00.000 no fuso de Brasília
  nowInBrasilia.setHours(0, 0, 0, 0);

  return nowInBrasilia;
};

const todayISOBrasilia = () =>
  startOfDayBrasilia().toISOString().slice(0, 10); // "YYYY-MM-DD"

const todayISOFortaleza = () =>
  startOfDayBrasilia().toISOString().slice(0, 10);

export function AtividadesProvider({ children }) {
  const { fetchWithAuth, user } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [error, setError] = useState(null);
  const [totalAtividadesNosCondominios, setTotalAtividadesNosCondominios] =
    useState(0);

  const [empresaItems, setEmpresaItems] = useState([]);
  const [empresaLoading, setEmpresaLoading] = useState(false);
  const [empresaNextCursor, setEmpresaNextCursor] = useState(null);
  const [empresaError, setEmpresaError] = useState(null);

  const [empresaId, setEmpresaId] = useState(() => user?.empresaId ?? null);
  const [condominioId, setCondominioId] = useState(null);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });

  // --- NOTIFICAÇÕES ---
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState(null);

  // refs para leituras estáveis
  const empresaIdRef = useRef(empresaId);
  const condominioIdRef = useRef(condominioId);
  const filtersRef = useRef(filters);
  const empresaFiltersRef = useRef(normalizeFilters());

  useEffect(() => {
    empresaIdRef.current = empresaId;
  }, [empresaId]);
  useEffect(() => {
    condominioIdRef.current = condominioId;
  }, [condominioId]);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

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
    if (!empId) return null;
    const params = new URLSearchParams();
    params.set("empresaId", empId);
    if (cId) params.set("condominioId", cId);
    const { q, prioridade, status } = f || {};
    if (q) params.set("q", q);
    if (prioridade) params.set("prioridade", String(prioridade));
    if (status) params.set("status", String(status));
    if (opts.take) params.set("take", String(opts.take));
    if (opts.cursor) params.set("cursor", String(opts.cursor));
    return params.toString();
  };

  // normaliza histórico para manter apenas o mais recente
  const normalizeHistorico = (atividade) => {
    if (!Array.isArray(atividade.historico) || !atividade.historico.length)
      return atividade;
    const lastHist = atividade.historico.reduce((prev, curr) => {
      return new Date(curr.dataReferencia) > new Date(prev.dataReferencia)
        ? curr
        : prev;
    });
    return { ...atividade, historico: [lastHist] };
  };

  const load = useCallback(
    async ({
      empresaId: emp,
      condominioId: cId,
      filters: f,
      reset = true,
      take = 50,
      cursor,
    } = {}) => {
      setError(null);
      try {
        const finalEmpresa =
          emp ?? empresaIdRef.current ?? (await resolveEmpresaId());
        const finalCondo = cId ?? condominioIdRef.current;
        const finalFilters = f ?? filtersRef.current;

        if (!finalCondo) {
          setError("Defina um condomínio.");
          return;
        }

        const qs = buildQuery(finalEmpresa, finalCondo, finalFilters, {
          take,
          cursor,
        });
        if (!qs) {
          setError("Parâmetros inválidos.");
          return;
        }

        if (reset) {
          setLoading(true);
          setItems([]);
          setNextCursor(null);
          setTotalAtividadesNosCondominios(0);
          if (finalCondo !== condominioIdRef.current)
            setCondominioId(finalCondo);
          if (finalEmpresa !== empresaIdRef.current) setEmpresaId(finalEmpresa);
          setFilters((old) => ({
            q: finalFilters?.q ?? "",
            prioridade: finalFilters?.prioridade ?? null,
            status: finalFilters?.status ?? null,
          }));
        }

        const res = await fetchWithAuth(`/api/atividades?${qs}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Falha ao carregar atividades");
        const json = await res.json();

        setItems((old) =>
          reset
            ? json.items.map(normalizeHistorico)
            : [...old, ...json.items.map(normalizeHistorico)]
        );
        setNextCursor(json.nextCursor ?? null);

        if (reset) {
          setTotalAtividadesNosCondominios(
            Number.isFinite(json.totalAtividadesNosCondominios)
              ? json.totalAtividadesNosCondominios
              : json.total ?? 0
          );
        }
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

  const loadEmpresa = useCallback(
    async ({
      empresaId: emp,
      filters: f,
      reset = true,
      take = 100,
      cursor,
    } = {}) => {
      setEmpresaError(null);
      try {
        const finalEmpresa =
          emp ?? empresaIdRef.current ?? (await resolveEmpresaId());
        if (!finalEmpresa) {
          setEmpresaError("empresaId ausente.");
          return;
        }

        const normalizedFilters = f
          ? normalizeFilters(f)
          : { ...empresaFiltersRef.current };

        if (reset) {
          empresaFiltersRef.current = normalizedFilters;
          setEmpresaNextCursor(null);
        }

        setEmpresaLoading(true);

        const qs = buildQuery(finalEmpresa, undefined, normalizedFilters, {
          take,
          cursor,
        });
        if (!qs) {
          setEmpresaError("Parâmetros inválidos.");
          return;
        }

        const res = await fetchWithAuth(`/api/atividades?${qs}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Falha ao carregar atividades da empresa");
        const json = await res.json();
        setEmpresaItems((old) =>
          reset ? json.items.map(normalizeHistorico) : [...old, ...json.items.map(normalizeHistorico)]
        );
        setEmpresaNextCursor(json.nextCursor ?? null);
      } catch (e) {
        setEmpresaError(e?.message || "Erro ao carregar atividades da empresa");
      } finally {
        setEmpresaLoading(false);
      }
    },
    [fetchWithAuth, resolveEmpresaId]
  );

  const loadEmpresaMore = useCallback(async () => {
    if (!empresaNextCursor) return;
    await loadEmpresa({ cursor: empresaNextCursor, reset: false });
  }, [empresaNextCursor, loadEmpresa]);

  useEffect(() => {
    loadEmpresa({ reset: true });
  }, [loadEmpresa]);

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
        return okCondo && okStatus && okPri ? [normalizeHistorico(created), ...old] : old;
      });

      setEmpresaItems((old) => {
        if (!old?.length) return [normalizeHistorico(created)];
        const exists = old.some((item) => item.id === created.id);
        if (exists)
          return old.map((item) => (item.id === created.id ? normalizeHistorico(created) : item));
        return [normalizeHistorico(created), ...old];
      });

      const f = filtersRef.current;
      const okCondo = created.condominioId === condominioIdRef.current;
      const okStatus = !f?.status || created.status === f.status;
      const okPri = !f?.prioridade || created.prioridade === f.prioridade;
      if (okCondo && okStatus && okPri) {
        setTotalAtividadesNosCondominios((t) => t + 1);
      }

      try {
        await loadNotifications();
      } catch { }
      return created;
    },
    [fetchWithAuth, resolveEmpresaId]
  );

  const updateAtividade = useCallback(
    async (id, data, fallbackCondominioId) => {
      const emp = empresaIdRef.current ?? (await resolveEmpresaId());
      const existing = items.find((i) => i.id === id);
      const condo =
        data?.condominioId ?? existing?.condominioId ?? fallbackCondominioId ?? condominioIdRef.current;

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
        } catch { }
        throw new Error(msg);
      }

      const updated = await res.json();

      const normalizeUpdated = (atividade) => {
        if (!Array.isArray(atividade.historico) || !atividade.historico.length) return atividade;
        const lastHist = atividade.historico.reduce((prev, curr) => {
          return new Date(curr.dataReferencia) > new Date(prev.dataReferencia) ? curr : prev;
        });
        return { ...atividade, historico: [lastHist] };
      };

      const normalizedUpdated = normalizeUpdated(updated);

      // 🔥 NOVA LÓGICA: Filtrar após atualização
      const currentFilters = filtersRef.current;
      const itemBelongsToCurrentFilter = (item) => {
        // Se temos filtro de status, verifica
        if (currentFilters?.status) {
          const itemStatus = inferStatus(item); // Usa a mesma lógica
          return itemStatus === currentFilters.status;
        }
        return true;
      };

      // Atualiza items (lista do condomínio)
      setItems((old) => {
        // Remove a atividade atualizada
        const withoutUpdated = old.filter((it) => it.id !== id);

        // Se ainda pertence aos filtros atuais, adiciona de volta
        if (itemBelongsToCurrentFilter(normalizedUpdated)) {
          return withoutUpdated.map((it) =>
            it.id === id ? normalizedUpdated : it
          );
        }

        // Se não pertence, remove completamente
        return withoutUpdated;
      });

      // Atualiza empresaItems (lista global da empresa)
      setEmpresaItems((old) =>
        old.map((it) => it.id === id ? normalizedUpdated : it)
      );

      try {
        await loadNotifications();
      } catch { }
      return normalizedUpdated;
    },
    [fetchWithAuth, items, resolveEmpresaId]
  );

  const deleteAtividade = useCallback(
    async (id, fallbackCondominioId) => {
      const emp = empresaIdRef.current ?? (await resolveEmpresaId());
      const existing = items.find((i) => i.id === id);
      const condo =
        existing?.condominioId ?? fallbackCondominioId ?? condominioIdRef.current;

      if (!emp) throw new Error("empresaId ausente.");
      if (!condo) throw new Error("condominioId ausente.");

      const qs = new URLSearchParams({
        empresaId: emp,
        condominioId: String(condo),
      }).toString();

      const res = await fetchWithAuth(`/api/atividades/${id}?${qs}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Erro ao excluir atividade");
      }
      setItems((old) => old.filter((it) => it.id !== id));
      setEmpresaItems((old) => old.filter((it) => it.id !== id));

      if (existing) {
        setTotalAtividadesNosCondominios((t) => (t > 0 ? t - 1 : 0));
      }

      try {
        await loadNotifications();
      } catch { }
    },
    [fetchWithAuth, items, resolveEmpresaId]
  );

  // --- NOTIFICAÇÕES: dismiss/snooze local por usuário/empresa/condo ---
  const scopeKey = useCallback(() => {
    return `${user?.id || "anon"}:${empresaIdRef.current || "-"}:${condominioIdRef.current || "-"
      }`;
  }, [user]);
  const readDismissMap = () => {
    try {
      return JSON.parse(localStorage.getItem("notif.dismiss") || "{}");
    } catch {
      return {};
    }
  };
  const writeDismissMap = (map) => {
    try {
      localStorage.setItem("notif.dismiss", JSON.stringify(map));
    } catch { }
  };
  const dismissNotification = useCallback(
    (key, untilISO) => {
      const map = readDismissMap();
      const scope = scopeKey();
      const scoped = map[scope] || {};
      scoped[key] = untilISO || todayISOFortaleza();
      map[scope] = scoped;
      writeDismissMap(map);
      setNotifications((old) =>
        old.filter((n) => `${n.atividadeId}|${n.when}|${n.dueDateISO}` !== key)
      );
    },
    [scopeKey]
  );

  const loadNotifications = useCallback(
    async ({ leadDays = 1 } = {}) => {
      setNotifError(null);
      setNotifLoading(true);
      try {
        const emp = empresaIdRef.current ?? (await resolveEmpresaId());
        const params = new URLSearchParams({
          empresaId: emp,
          leadDays: String(Number(leadDays) || 0),
        });
        const res = await fetchWithAuth(
          `/api/atividades/notifications?${params.toString()}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("Falha ao carregar notificações");
        const json = await res.json();
        const arr = Array.isArray(json) ? json : json.items ?? [];

        const scope = `${user?.id || "anon"}:${emp}:${condominioIdRef.current || "-"}`;
        const map = readDismissMap();
        const dismissed = map[scope] || {};
        const todayISO = todayISOBrasilia();
        const filtered = arr.filter((n) => {
          const k = `${n.atividadeId}|${n.when}|${n.dueDateISO}`;
          const until = dismissed[k];
          return !until || String(until) < todayISO;
        });
        setNotifications(filtered);
      } catch (e) {
        setNotifications([]);
        setNotifError(e?.message || "Erro ao carregar notificações");
      } finally {
        setNotifLoading(false);
      }
    },
    [fetchWithAuth, resolveEmpresaId, user]
  );

  useEffect(() => {
    if (empresaId && condominioId) loadNotifications();
  }, [empresaId, condominioId, loadNotifications]);

  // virada do dia (TZ Fortaleza)
  useEffect(() => {
    let tm;
    const arm = () => {
      const now = new Date(
        new Date().toLocaleString("en-US", { timeZone: "America/Fortaleza" })
      );
      const next = new Date(now);
      next.setHours(24, 0, 0, 0);
      const ms = Math.max(next - now + 500, 60_000);
      tm = setTimeout(async () => {
        await loadNotifications();
        arm();
      }, ms);
    };
    arm();
    return () => {
      if (tm) clearTimeout(tm);
    };
  }, [loadNotifications]);

  const inferStatus = (it) => {
    try {
      const hojeISO = todayISOFortaleza();
      const hoje = new Date(hojeISO);

      const task = {
        id: it.id,
        name: it.name,
        frequency: it.frequencia || it.frequency || "Não se repete",
        startDate:
          (it.expectedDate instanceof Date
            ? it.expectedDate.toISOString()
            : it.expectedDate) ||
          (it.createdAt instanceof Date
            ? it.createdAt.toISOString()
            : it.createdAt) ||
          hoje.toISOString(),
      };

      const historico = Array.isArray(it.historico)
        ? it.historico.map((h) => ({
          atividadeId: it.id,
          dataReferencia:
            h.dataReferencia instanceof Date
              ? h.dataReferencia.toISOString()
              : h.dataReferencia,
          status: h.status,
          completedAt:
            h.completedAt instanceof Date
              ? h.completedAt.toISOString()
              : h.completedAt ?? null,
          observacoes: h.observacoes ?? null,
        }))
        : [];

      const statusDia = getStatusNoDia(task, historico, hoje);

      if (!statusDia.esperadoHoje) {
        if (historico.some((h) => h.status === "FEITO")) return "HISTORICO";
        return "PROXIMAS";
      }

      switch (statusDia.statusHoje) {
        case "FEITO":
          return "HISTORICO";
        case "EM_ANDAMENTO":
          return "EM_ANDAMENTO";
        default:
          return "PENDENTE";
      }
    } catch (e) {
      return "PENDENTE";
    }
  };

  const stats = useMemo(() => {
    const out = {
      PROXIMAS: 0,
      EM_ANDAMENTO: 0,
      PENDENTE: 0,
      HISTORICO: 0,
      total: items.length,
    };
    for (const it of items) out[inferStatus(it)]++;
    return { ...out, emAndamento: out.EM_ANDAMENTO, pendentes: out.PENDENTE };
  }, [items]);

  const notifStats = useMemo(() => {
    const s = { pre: 0, due: 0, overdue: 0, total: 0 };
    for (const n of notifications) {
      if (n.when === "pre") s.pre++;
      else if (n.when === "due") s.due++;
      else if (n.when === "overdue") s.overdue++;
    }
    s.total = notifications.length;
    return s;
  }, [notifications]);

  const value = useMemo(
    () => ({
      items,
      loading,
      error,
      nextCursor,
      empresaItems,
      empresaLoading,
      empresaError,
      empresaNextCursor,
      empresaId,
      condominioId,
      filters,
      stats,
      totalAtividadesNosCondominios,

      // listagem
      load,
      loadMore,
      loadEmpresa,
      loadEmpresaMore,

      // CRUD
      createAtividade,
      updateAtividade,
      deleteAtividade,

      // notificações
      notifications,
      notifLoading,
      notifError,
      notifStats,
      loadNotifications,
      dismissNotification,

      // setters
      setFilters,
      setCondominioId,
      setEmpresaId,
    }),
    [
      items,
      loading,
      error,
      nextCursor,
      empresaItems,
      empresaLoading,
      empresaError,
      empresaNextCursor,
      empresaId,
      condominioId,
      filters,
      stats,
      totalAtividadesNosCondominios,
      load,
      loadMore,
      loadEmpresa,
      loadEmpresaMore,
      createAtividade,
      updateAtividade,
      deleteAtividade,
      notifications,
      notifLoading,
      notifError,
      notifStats,
      loadNotifications,
      dismissNotification,
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

export const useAtividadesOptional = () => {
  return useContext(AtividadesContext);
};