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

const useApi = () => {
  const { fetchWithAuth } = useAuth();
  return useCallback(async (url, options = {}) => {
    const res = await fetchWithAuth(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || "Erro desconhecido na API");
    }
    if (res.status === 204) return null;
    return res.json();
  }, [fetchWithAuth]);
};

export function CondominiosProvider({ children }) {
  const api = useApi();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  
  const abortRef = useRef(null);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      abortRef.current?.abort?.();
      const controller = new AbortController();
      abortRef.current = controller;
      
      const data = await api("/api/condominios", {
        cache: "no-store",
        signal: controller.signal,
      });

      setItems(data);
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user, api]);

  useEffect(() => {
    fetchAll();
    return () => abortRef.current?.abort?.();
  }, [fetchAll]);

  const create = useCallback(async (payload) => {
    try {
      setCreating(true);
      const novo = await api("/api/condominios", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setItems((prev) => [novo, ...prev]);
      return novo;
    } finally {
      setCreating(false);
    }
  }, [api]);

  const update = useCallback(async (id, payload) => {
    setUpdatingId(id);
    const snapshot = [...items];
    try {
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...payload } : x)));
      const upd = await api(`/api/condominios/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setItems((prev) => prev.map((x) => (x.id === id ? upd : x)));
      return upd;
    } catch (e) {
      setItems(snapshot);
      throw e;
    } finally {
      setUpdatingId(null);
    }
  }, [items, api]);

  const remove = useCallback(async (id) => {
    setRemovingId(id);
    const snapshot = [...items];
    try {
      setItems((prev) => prev.filter((x) => x.id !== id));
      await api(`/api/condominios/${id}`, { method: "DELETE" });
    } catch (e) {
      setItems(snapshot);
      throw e;
    } finally {
      setRemovingId(null);
    }
  }, [items, api]);
  
  const value = useMemo(
    () => ({
      items, loading, error, creating, updatingId, removingId,
      fetchAll, create, update, remove,
    }),
    [
      items, loading, error, creating, updatingId, removingId,
      fetchAll, create, update, remove,
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
  if (!ctx) throw new Error("useCondominios deve ser usado dentro de CondominiosProvider");
  return ctx;
}