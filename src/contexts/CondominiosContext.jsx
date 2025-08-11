"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

const CondominiosContext = createContext(null);

async function parseError(res) {
  try {
    const data = await res.json();
    return data?.error || res.statusText || "Erro desconhecido";
  } catch {
    try {
      const text = await res.text();
      return text || res.statusText || "Erro desconhecido";
    } catch {
      return res.statusText || "Erro desconhecido";
    }
  }
}

async function api(url, options, token) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  // Evitar erro de JSON em respostas vazias (como DELETE)
  if (res.status === 204) {
    return null;
  }
  return res.json();
}

export function CondominiosProvider({ children }) {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const abortRef = useRef(null);

  const fetchAll = useCallback(async () => {
    if (!token) {
      setItems([]); // Limpa os itens se não houver token
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      abortRef.current?.abort?.();
      const controller = new AbortController();
      abortRef.current = controller;

      // Usando a função 'api' que já lida com o token e headers
      const data = await api(
        "/api/condominios",
        {
          cache: "no-store",
          signal: controller.signal,
        },
        token
      );

      setItems(data);
      setError(null);
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAll();
    return () => abortRef.current?.abort?.();
  }, [fetchAll]);

  const create = useCallback(
    async (payload) => {
      try {
        setCreating(true);
        const novo = await api(
          "/api/condominios",
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
          token
        ); // Passar o token
        setItems((prev) => [novo, ...prev]);
        return novo;
      } finally {
        setCreating(false);
      }
    },
    [token]
  );

  const update = useCallback(
    async (id, payload) => {
      setUpdatingId(id);
      const snapshot = items;
      try {
        setItems((prev) =>
          prev.map((x) => (x.id === id ? { ...x, ...payload } : x))
        );
        const upd = await api(
          `/api/condominios/${id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
          token
        );
        setItems((prev) => prev.map((x) => (x.id === id ? upd : x)));
        return upd;
      } catch (e) {
        setItems(snapshot);
        throw e;
      } finally {
        setUpdatingId(null);
      }
    },
    [items, token]
  );

  const remove = useCallback(
    async (id) => {
      setRemovingId(id);
      const snapshot = items;
      try {
        setItems((prev) => prev.filter((x) => x.id !== id));
        await api(`/api/condominios/${id}`, { method: "DELETE" }, token); // Passar o token
      } catch (e) {
        setItems(snapshot);
        throw e;
      } finally {
        setRemovingId(null);
      }
    },
    [items, token]
  );

  const value = useMemo(
    () => ({
      items,
      loading,
      error,
      creating,
      updatingId,
      removingId,
      fetchAll,
      create,
      update,
      remove,
    }),
    [
      items,
      loading,
      error,
      creating,
      updatingId,
      removingId,
      fetchAll,
      create,
      update,
      remove,
    ]
  );

  return (
    <CondominiosContext.Provider value={value}>
      {children}
    </CondominiosContext.Provider>
  );
}

export function useCondominios() {
  const ctx = useContext(CondominiosContext);
  if (!ctx)
    throw new Error(
      "useCondominios deve ser usado dentro de CondominiosProvider"
    );
  return ctx;
}
