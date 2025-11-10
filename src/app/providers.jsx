"use client";

import { useMemo } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter"; // Next 15
// Se não resolver o módulo, troque para: "@mui/material-nextjs/v14-appRouter"
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

export default function Providers({ children }) {
  // crie o tema no client (evita serializar funções no boundary)
  const theme = useMemo(() => createTheme({}), []);

  return (
    <AppRouterCacheProvider options={{ key: "css" }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
