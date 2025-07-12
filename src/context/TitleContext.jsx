"use client";

import React, { createContext, useState, useMemo } from 'react';

// 1. Criar o Contexto
// O valor padrão pode ser útil para debug, mas será sobrescrito pelo Provider.
export const TitleContext = createContext({
  title: 'Carregando...',
  setTitle: () => {},
});

// 2. Criar o Provider (Provedor)
// Este componente irá gerenciar o estado do título e fornecer para seus filhos.
export function TitleProvider({ children }) {
  const [title, setTitle] = useState("Selecione o condomínio"); // Título inicial

  // Usamos useMemo para evitar recriações desnecessárias do objeto de valor.
  const value = useMemo(() => ({ title, setTitle }), [title]);

  return (
    <TitleContext.Provider value={value}>
      {children}
    </TitleContext.Provider>
  );
}