"use client";

import React, { useState } from "react";
import {
  Drawer,
  Toolbar,
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  Collapse,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material"; // Ícones para o dropdown
import { menuItems } from "@/config/menuItems";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

const drawerWidth = 60;
const expandedDrawerWidth = 240;

export default function SidebarDesktop({
  expanded,
  onMouseEnter,
  onMouseLeave,
}) {
  const theme = useTheme();
  const { logout } = useAuth();
  const router = useRouter();
  // Estado para controlar qual menu dropdown está aberto
  const [openMenu, setOpenMenu] = useState(null);

  // Função para abrir/fechar o dropdown
  const handleClick = (itemText) => {
    // Se o menu clicado já estiver aberto, fecha. Senão, abre.
    setOpenMenu(openMenu === itemText ? null : itemText);
  };

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
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding>
              {/* <ListItemButton
                // O clique agora abre o dropdown se houver sub-itens
                onClick={async () => {
                  if (item.action === "logout") {
                    await logout();
                    setOpenMenu(null);
                    router.push("/login");
                  } else if (item.children) {
                    handleClick(item.text);
                  }
                }}
                sx={{
                  "& .MuiListItemText-root": { opacity: expanded ? 1 : 0 },
                }}
              > */}

              {/* 1) Logout */}
              {item.action === "logout" && (
                <ListItemButton
                  onClick={async () => {
                    await logout();
                    setOpenMenu(null);
                    router.push("/login");
                  }}
                  sx={{
                    "& .MuiListItemText-root": { opacity: expanded ? 1 : 0 },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, justifyContent: "center" }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{ whiteSpace: "nowrap", pl: 2 }}
                  />
                </ListItemButton>
              )}

              {/* 2) Item com link direto */}
              {item.path && !item.children && !item.action && (
                <ListItemButton
                  component={Link}
                  href={item.path}
                  sx={{
                    "& .MuiListItemText-root": { opacity: expanded ? 1 : 0 },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, justifyContent: "center" }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{ whiteSpace: "nowrap", pl: 2 }}
                  />
                </ListItemButton>
              )}

              {/* 3) Item com submenu (não navega, só abre/fecha) */}
              {item.children && (
                <ListItemButton
                  onClick={() => handleClick(item.text)}
                  sx={{
                    "& .MuiListItemText-root": { opacity: expanded ? 1 : 0 },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, justifyContent: "center" }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{ whiteSpace: "nowrap", pl: 2 }}
                  />
                  {expanded &&
                    (openMenu === item.text ? <ExpandLess /> : <ExpandMore />)}
                </ListItemButton>
              )}
            </ListItem>

            {/* Submenu com Collapse (Dropdown) */}
            {item.children && (
              <Collapse
                in={openMenu === item.text && expanded}
                timeout="auto"
                unmountOnExit
              >
                <List component="div" disablePadding>
                  {item.children.map((child) => (
                    <ListItemButton
                      key={child.text}
                      component={Link}
                      href={child.path}
                      sx={{ pl: 4 }}
                    >
                      {" "}
                      {/* Adiciona um padding para indentar */}
                      <ListItemIcon>{child.icon}</ListItemIcon>
                      <ListItemText primary={child.text} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </>
  );

  return (
    <Drawer
      variant="permanent"
      open
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave} // Mantém a lógica de expandir/recolher
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
