// src/app/selecione-o-condominio/layout.jsx
"use client";

import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { CondominoUIProvider } from "@/contexts/CondominoUIContext";
import { CondominiosProvider } from "@/contexts/CondominiosContext";
import { AtividadesProvider } from "@/contexts/AtividadesContext";

export default function SelecioneOCondominioLayout({ children }) {
  return (
    <ProtectedRoute>
      {/* Provider precisa ficar ACIMA do Layout para o Header enxergar o contexto */}
      <CondominoUIProvider>
        <CondominiosProvider>
          <AtividadesProvider>
            <Layout>{children}</Layout>
          </AtividadesProvider>
        </CondominiosProvider>
      </CondominoUIProvider>
    </ProtectedRoute>
  );
}
