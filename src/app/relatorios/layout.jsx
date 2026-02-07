"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { CondominiosProvider } from "@/contexts/CondominiosContext";
import Layout from "@/components/Layout";

export default function RelatoriosLayout({ children }) {
  return (
    <ProtectedRoute>
      <CondominiosProvider>
        <Layout showTitleOnly={true}>
          {children}
        </Layout>
      </CondominiosProvider>
    </ProtectedRoute>
  );
}
