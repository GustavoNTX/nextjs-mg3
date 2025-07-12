"use client";

import React, { useState } from "react";
import {
  Drawer, Toolbar, Box, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, useTheme, Menu, MenuItem
} from "@mui/material";
import { menuItems } from "@/config/menuItems";

const drawerWidth = 60;
const expandedDrawerWidth = 240;

export default function SidebarDesktop({ expanded, onMouseEnter, onMouseLeave }) {
  const theme = useTheme();
  
  // Estado para controlar qual submenu está aberto e sua posição
  const [anchorEl, setAnchorEl] = useState(null);
  const [openedMenu, setOpenedMenu] = useState(null);

  const handleMenuOpen = (event, item) => {
    if (item.children) {
      setAnchorEl(event.currentTarget);
      setOpenedMenu(item.text);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setOpenedMenu(null);
  };
  
  // Quando o mouse sai da área do Drawer, fecha qualquer submenu aberto
  const handleDrawerMouseLeave = (event) => {
    onMouseLeave(event); // Chama a função do pai para recolher a sidebar
    handleMenuClose();   // Fecha o submenu
  }

  const drawerContent = (
    <>
      <Toolbar sx={{ justifyContent: "center" }}>
        <Box component="img" src="/simple-logo.png" alt="Logo" sx={{ height: 40 }} />
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <div key={item.text} onMouseLeave={item.children ? null : handleMenuClose}>
            <ListItem disablePadding>
              <ListItemButton
                onMouseEnter={(e) => handleMenuOpen(e, item)}
                sx={{
                  "& .MuiListItemText-root": { opacity: expanded ? 1 : 0 }
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, justifyContent: "center" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    whiteSpace: "nowrap",
                    pl: 2,
                    transition: theme.transitions.create("opacity", {
                      duration: theme.transitions.duration.shorter,
                    }),
                  }}
                />
              </ListItemButton>
            </ListItem>

            {item.children && (
              <Menu
                anchorEl={anchorEl}
                // O menu abre se o 'openedMenu' for o texto deste item
                open={openedMenu === item.text}
                onClose={handleMenuClose}
                // Fecha o menu quando o mouse sai da sua área
                MenuListProps={{ onMouseLeave: handleMenuClose }}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                // Impede que o foco automático role a página
                disableRestoreFocus 
              >
                {item.children.map((child) => (
                  <MenuItem key={child.text} onClick={handleMenuClose}>
                    <ListItemIcon>{child.icon}</ListItemIcon>
                    <ListItemText>{child.text}</ListItemText>
                  </MenuItem>
                ))}
              </Menu>
            )}
          </div>
        ))}
      </List>
    </>
  );

  return (
    <Drawer
      variant="permanent"
      open
      onMouseEnter={onMouseEnter}
      // Usamos o novo handler para garantir que o submenu feche também
      onMouseLeave={handleDrawerMouseLeave}
      sx={{
        width: expanded ? expandedDrawerWidth : drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: expanded ? expandedDrawerWidth : drawerWidth,
          boxSizing: "border-box",
          overflowX: "hidden",
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}