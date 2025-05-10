"use client";

import React from "react";
import {
  Drawer,
  Toolbar,
  Box,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme
} from "@mui/material";
import {
  Description as DescriptionIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon
} from "@mui/icons-material";

const drawerWidth = 60; // largura “minimizada”

export default function SidebarDesktop() {
  const theme = useTheme();

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
          /* Na montagem já fica minimizado; o hover você pode adicionar em desktop: */
          "&:hover": {
            width: 240,
            "& .MuiListItemText-root": { opacity: 1 },
          },
        },
      }}
    >
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
          { icon: <BarChartIcon />,   text: "Relatórios"      },
          { icon: <SettingsIcon />,   text: "Configurações"   },
        ].map(({ icon, text }) => (
          <ListItem button key={text}>
            <ListItemIcon sx={{ minWidth: 0, justifyContent: "center" }}>
              {icon}
            </ListItemIcon>
            <ListItemText
              primary={text}
              sx={{
                whiteSpace: "nowrap",
                opacity: 0,           // escondido no estado “minimizado”
                transition: "opacity .2s",
                pl: 2,
              }}
            />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
