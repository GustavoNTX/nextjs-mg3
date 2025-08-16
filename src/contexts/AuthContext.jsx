"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useState,
  useContext,
  useEffect,
} from "react";
import { jwtDecode } from "jwt-decode";

function isExpired(token) {
  try {
    const { exp } = jwtDecode(token);
    return !exp || exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyToken = useCallback((token) => {
    if (typeof token !== "string" || !token.trim()) {
      setAccessToken(null);
      setUser(null);
      return;
    }
    setAccessToken(token);
    try {
      const decoded = jwtDecode(token);
      setUser({
        id: decoded.sub,
        email: decoded.email,
        roles: decoded.roles || [],
      });
    } catch {
      setUser(null);
    }
  }, []);

  const login = useCallback(
    async (paramsOrEmail, maybePassword) => {
      const { email, password } =
        typeof paramsOrEmail === "object" && paramsOrEmail !== null
          ? paramsOrEmail
          : { email: paramsOrEmail, password: maybePassword };

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include", // importante se o refresh vier via cookie HttpOnly
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Login falhou");
      const data = await res.json();
      applyToken(data.accessToken);
      return data;
    },
    [applyToken]
  );

  const refresh = useCallback(async () => {
    const res = await fetch("/api/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) throw new Error("refresh_failed");
    const data = await res.json().catch(() => ({}));
    const { accessToken } = data || {};
    if (typeof accessToken !== "string" || !accessToken) {
      throw new Error("no_access_token");
    }
    applyToken(accessToken);
    return accessToken;
  }, [applyToken]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } catch {}
    setAccessToken(null);
    setUser(null);
  }, []);

  // Bootstrapping: tenta restaurar a sessão no carregamento inicial
  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  // Ao voltar o foco para a aba, se o token estiver ausente/expirado, tenta renovar
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        if (!accessToken || isExpired(accessToken)) {
          refresh().catch(() => {});
        }
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [accessToken, refresh]);

  const fetchWithAuth = useCallback(
    async (input, init = {}) => {
      let token = accessToken;

      if (!token || isExpired(token)) {
        try {
          token = await refresh();
        } catch {
          setAccessToken(null);
          setUser(null);
          throw new Error("Sessão expirada");
        }
      }

      const doFetch = (t) =>
        fetch(input, {
          ...init,
          headers: {
            ...(init.headers || {}),
            Authorization: `Bearer ${t}`,
          },
        });

      let resp = await doFetch(token);

      if (resp.status === 401) {
        // tenta renovar 1x e repetir
        try {
          const newToken = await refresh();
          resp = await doFetch(newToken);
        } catch {
          setAccessToken(null);
          setUser(null);
          throw new Error("Sessão expirada");
        }
      }

      return resp;
    },
    [accessToken, refresh]
  );

  const value = useMemo(
    () => ({
      user,
      accessToken,
      loading,
      login,
      refresh,
      fetchWithAuth,
      logout,
    }),
    [user, accessToken, loading, login, refresh, fetchWithAuth, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// exporta o hook que seu page.js está tentando usar
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
