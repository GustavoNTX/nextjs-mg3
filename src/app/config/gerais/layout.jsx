// src/app/configuracoes/layout.jsx
"use client";

import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function ConfiguracoesLayout({ children }) {
    return (
        <ProtectedRoute>
            <Layout showTitleOnly={true}>
                {children}
            </Layout>
        </ProtectedRoute>
    );
}