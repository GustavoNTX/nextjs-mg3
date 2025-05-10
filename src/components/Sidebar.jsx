// components/Sidebar.jsx
"use client";

import { useState } from "react";
import {
  Drawer,
  Toolbar,
  Box,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Description as DescriptionIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";

// Larguras do drawer: mini e completa
const fullWidth = 240;
const miniWidth = 60;

// Itens do menu
const items = [
  { icon: <DescriptionIcon />, text: "Lista de Ativos" },
  { icon: <BarChartIcon />, text: "Relatórios" },
  { icon: <SettingsIcon />, text: "Configurações" },
];

export default function Sidebar({ mobileOpen, handleDrawerToggle }) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const [hovered, setHovered] = useState(false);

  // Determina largura: mini no desktop sem hover, completa caso contrário
  const drawerWidth = isMdUp && !hovered ? miniWidth : fullWidth;

  const drawerContent = (
    <>
      <Toolbar sx={{ justifyContent: isMdUp ? "center" : "flex-start" }}>
        {isMdUp && (
          <Box
            component="img"
            src="/assets/new_logo_small.svg"
            alt="Logo"
            sx={{ height: 32 }}
          />
        )}
      </Toolbar>
      <Divider />
      <List>
        {items.map(({ icon, text }) => (
          <ListItem button key={text}>
            <ListItemIcon>{icon}</ListItemIcon>
            {(!isMdUp || hovered) && <ListItemText primary={text} />}
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <>
      {/* MOBILE: temporário, fullWidth, sobreposto */}
      {!isMdUp && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: fullWidth,
              zIndex: theme.zIndex.appBar + 1,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* DESKTOP: permanente, miniWidth por padrão, expande por hover e sobrepõe o conteúdo */}
      {isMdUp && (
        <Drawer
          variant="permanent"
          open
          PaperProps={{
            onMouseEnter: () => setHovered(true),
            onMouseLeave: () => setHovered(false),
          }}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            position: "absolute", // sobrepõe o conteúdo
            top: 0,
            left: 0,
            height: "100vh",
            overflow: "visible",
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              overflowX: "hidden",
              transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              position: "absolute",
              zIndex: theme.zIndex.drawer + 1,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
}
