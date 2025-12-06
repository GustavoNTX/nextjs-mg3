"use client";

import { CondominoUIProvider } from "@/contexts/CondominoUIContext";
import { CondominiosProvider } from "@/contexts/CondominiosContext";
import { AtividadesProvider } from "@/contexts/AtividadesContext";
import Layout from "@/components/Layout";

export default function AtividadesLayout({ children }) {
  return (
    <CondominoUIProvider>
      <CondominiosProvider>
        <AtividadesProvider>
          <Layout>
            {children}
          </Layout>
        </AtividadesProvider>
      </CondominiosProvider>
    </CondominoUIProvider>
  );
}
