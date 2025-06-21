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
} from "@mui/material";
import {
  Description as DescriptionIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";

const drawerWidth = 240;

export default function SidebarMobile({ mobileOpen, handleDrawerToggle }) {
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
          <ListItem button key={text} onClick={handleDrawerToggle}>
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary={text} />
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={handleDrawerToggle}
      ModalProps={{ keepMounted: true }}
      sx={{
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
