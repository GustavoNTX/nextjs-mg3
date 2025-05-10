// src/components/Layout.jsx
"use client";

import { useState } from "react";
import { Box, Toolbar, useTheme, useMediaQuery } from "@mui/material";

import Sidebar from "./Responsive/Sidebar";
import Header  from "./Responsive/Header";

const drawerWidth = 240;

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch]     = useState("");
  const [filtro, setFiltro]     = useState("Todos");

  const theme  = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const handleDrawerToggle = () => setMobileOpen(o => !o);

  return (
    <Box sx={{ display: "flex" }}>
      {/* --- SIDEBAR --- */}
      <Sidebar
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
      />

      {/* --- MAIN --- */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          // deixa um “mini‐sidebar” de 60px sempre visível no desktop
          ml: { md: "60px" },
        }}
      >
        {/*
          Aqui chamamos o nosso Header.jsx, 
          que cuida de mobile e desktop automaticamente
        */}
        <Header
          filtro={filtro}
          setFiltro={setFiltro}
          search={search}
          setSearch={setSearch}
          onMenuClick={handleDrawerToggle}
        />

        {/* só no desktop: espaçador para o AppBar fixo */}
        {isMdUp && <Toolbar />}

        {/* conteúdo da página */}
        <Box sx={{ p: isMdUp ? 4 : 0 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
