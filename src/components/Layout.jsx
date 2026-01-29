"use client";

// Adicionado useEffect e usePathname
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Box, Toolbar, useTheme, useMediaQuery } from "@mui/material";

import Sidebar from "./Responsive/Sidebar";
import Header from "./Responsive/Header";

const sidebarWidth = 60;
const sidebarExpandedWidth = 240;

export default function Layout({ children, showTitleOnly = false }) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const pathname = usePathname(); // Hook para obter a rota atual

  // --- ESTADOS ---
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [pageTitle, setPageTitle] = useState(""); // Estado para o título dinâmico

  // Efeito para atualizar o título sempre que a rota mudar
  useEffect(() => {
    switch (pathname) {
      case "/selecione-o-condominio":
        setPageTitle("Selecione o Condomínio");
        break;
      case "/atividades":
        setPageTitle("Atividades");
        break;
      case "/configuracoes":
        setPageTitle("Configurações");
        break;
      case "/config/gerais":
        setPageTitle("Configurações Gerais");
        break;
      // Adicione outras rotas e seus respectivos títulos aqui
      default:
        setPageTitle("Início"); // Título padrão caso a rota não seja encontrada
    }
  }, [pathname]);

  // --- HANDLERS ---
  const handleDrawerToggle = () => setMobileOpen((o) => !o);
  const handleSidebarExpand = () => setSidebarExpanded(true);
  const handleSidebarCollapse = () => setSidebarExpanded(false);

  // Função para determinar se deve mostrar apenas o título
  const shouldShowTitleOnly = () => {
    // Adicione aqui as rotas que devem mostrar apenas o título
    const titleOnlyRoutes = [
      "/configuracoes",
      "/config/gerais",
      // Adicione outras rotas que precisam apenas do título
    ];
    return titleOnlyRoutes.includes(pathname);
  };

  return (
    <Box sx={{ display: "flex" }}>
      {/* --- SIDEBAR --- */}
      <Sidebar
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        expanded={sidebarExpanded}
        onMouseEnter={handleSidebarExpand}
        onMouseLeave={handleSidebarCollapse}
      />

      {/* --- ÁREA PRINCIPAL (HEADER + CONTEÚDO) --- */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: {
            md: sidebarExpanded
              ? `${sidebarExpandedWidth}px`
              : `${sidebarWidth}px`,
          },
          transition: theme.transitions.create("margin", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {/* O Header recebe o título dinâmico e a prop showTitleOnly */}
        <Header
          title={pageTitle}
          filtro={filtro}
          setFiltro={setFiltro}
          search={search}
          setSearch={setSearch}
          onMenuClick={handleDrawerToggle}
          sidebarExpanded={sidebarExpanded}
          showTitleOnly={shouldShowTitleOnly()}
        />

        {/* Espaçador para a AppBar fixa SOMENTE no desktop */}
        {isMdUp && <Toolbar />}

        {/* Conteúdo da página */}
        <Box sx={{ p: { xs: 0, md: 4 } }}>{children}</Box>
      </Box>
    </Box>
  );
}