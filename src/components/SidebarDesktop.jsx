// src/components/SidebarDesktop.jsx
"use client";

import React, { useState } from "react";
import {
  Drawer, Toolbar, Box, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, useTheme, Menu, MenuItem
} from "@mui/material";
import { menuItems } from "@/config/menuItems"; // Importa a estrutura do menu

const drawerWidth = 60;

export default function SidebarDesktop() {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event, item) => {
    if (item.children) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const drawerContent = (
    <>
      <Toolbar sx={{ justifyContent: "center" }}>
        <Box component="img" src="/simple-logo.png" alt="Logo" sx={{ height: 40 }}/>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onMouseEnter={(e) => handleMenuOpen(e, item)}
              onMouseLeave={handleMenuClose} // Fecha o menu se o mouse sair do botão
              sx={{ "&:hover .MuiListItemText-root": { opacity: 1 } }}
            >
              <ListItemIcon sx={{ minWidth: 0, justifyContent: "center" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{ whiteSpace: "nowrap", opacity: 0, transition: "opacity .2s", pl: 2 }}
              />

              {item.children && (
                <Menu
                  anchorEl={anchorEl}
                  open={open && anchorEl?.textContent.includes(item.text)}
                  onClose={handleMenuClose}
                  MenuListProps={{ onMouseLeave: handleMenuClose }} // Fecha o menu se o mouse sair da lista
                  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                  {item.children.map((child) => (
                    <MenuItem key={child.text} onClick={handleMenuClose}>
                      <ListItemIcon>{child.icon}</ListItemIcon>
                      <ListItemText>{child.text}</ListItemText>
                    </MenuItem>
                  ))}
                </Menu>
              )}
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
          "&:hover": { width: 240 },
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}