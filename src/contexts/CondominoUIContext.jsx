
// src/contexts/CondominoUIContext.jsx
"use client";

import { createContext, useContext, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const CondominoUIContext = createContext(null);

export function CondominoUIProvider({ children }) {
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [selected, setSelected] = useState(null); // { id, name, logoUrl }
  const router = useRouter();

  const enterCronograma = useCallback((condomino) => {
    // condomino: { id, name, logoUrl }
    setSelected(condomino);
  }, []);

  const sair = useCallback(() => {
    setSelected(null);
    setSearch("");
    setFiltro("Todos");
    router.push("/selecione-o-condominio");
  }, [router]);

  const value = useMemo(
    () => ({ search, setSearch, filtro, setFiltro, selected, setSelected, enterCronograma, sair }),
    [search, filtro, selected, enterCronograma, sair]
  );

  return <CondominoUIContext.Provider value={value}>{children}</CondominoUIContext.Provider>;
}

// Útil quando você QUER garantir o provider
export function useCondominoUI() {
  const ctx = useContext(CondominoUIContext);
  if (!ctx) throw new Error("useCondominoUI deve ser usado dentro de CondominoUIProvider");
  return ctx;
}

// Útil nos Headers, onde o provider pode ainda não existir
export function useCondominoUIOptional() {
  return useContext(CondominoUIContext);
}