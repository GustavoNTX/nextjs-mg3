"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { CondominoUIProvider } from "@/contexts/CondominoUIContext";
import { CondominiosProvider } from "@/contexts/CondominiosContext";
import Layout from "@/components/Layout";

export default function RelatoriosLayout({ children }) {
  return (
    <ProtectedRoute>
      <CondominoUIProvider>
        <CondominiosProvider>
          <Layout>{children}</Layout>
        </CondominiosProvider>
      </CondominoUIProvider>
    </ProtectedRoute>
  );
}
