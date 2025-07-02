"use client";

import React from "react";
import {
  Drawer,
  Toolbar,
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton, // 1. Importe o ListItemButton
  ListItemIcon,
  ListItemText,
  useTheme,
} from "@mui/material";
import {
  Description as DescriptionIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";

const drawerWidth = 60; // largura “minimizada”

export default function SidebarDesktop() {
  const theme = useTheme();

  const drawerContent = (
    <>
      <Toolbar sx={{ justifyContent: "center" }}>
        <Box
          component="img"
          src="/simple-logo.png"
          alt="Logo"
          sx={{ height: 40 }}
        />
      </Toolbar>
      <Divider />
      <List>
        {[
          { icon: <DescriptionIcon />, text: "Lista de Ativos" },
          { icon: <BarChartIcon />, text: "Relatórios" },
          { icon: <SettingsIcon />, text: "Configurações" },
        ].map(({ icon, text }) => (
          // 2. Altere a estrutura aqui
          <ListItem key={text} disablePadding>
            <ListItemButton
              sx={{
                "&:hover .MuiListItemText-root": { opacity: 1 },
                "&:hover": { width: 240 }, // Mova o hover para o ListItemButton
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, justifyContent: "center" }}>
                {icon}
              </ListItemIcon>
              <ListItemText
                primary={text}
                sx={{
                  whiteSpace: "nowrap",
                  opacity: 0, // escondido no estado “minimizado”
                  transition: "opacity .2s",
                  pl: 2,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <Drawer
      variant="permanent"
      open
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          overflowX: "hidden",
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          // O hover agora é controlado pelo ListItemButton
          "&:hover": {
            width: 240,
          },
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}