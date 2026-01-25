// src/app/configuracoes/layout.jsx
"use client";

import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/app/providers";

export default function ConfiguracoesLayout({ children }) {
    return (
        <ProtectedRoute>
            <Layout>{children}</Layout>
        </ProtectedRoute>
    );
}