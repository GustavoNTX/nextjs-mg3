// src/components/SidebarMobile.jsx
"use client";

import React, { useState } from "react";
import {
  Drawer,
  Toolbar,
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { menuItems } from "@/config/menuItems";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const drawerWidth = 240;

export default function SidebarMobile({ mobileOpen, handleDrawerToggle }) {
  const [openSettings, setOpenSettings] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  const handleClick = async (item) => {
    if (item.children) {
      setOpenSettings(!openSettings); // Abre ou fecha o submenu
    } else if (item.action === "logout") {
      await logout();
      setOpenSettings(false);
      handleDrawerToggle();
      router.push("/login");
    } else {
      // Adicione a lógica de navegação aqui, ex: router.push(item.path)
      console.log(`Navegando para: ${item.path}`);
      handleDrawerToggle();
    }
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
            <ListItemButton onClick={() => handleClick(item)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
              {item.children &&
                (openSettings ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
            {item.children && (
              <Collapse in={openSettings} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.children.map((child) => (
                    <ListItemButton
                      key={child.text}
                      sx={{ pl: 4 }}
                      onClick={handleDrawerToggle}
                    >
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
      variant="temporary"
      open={mobileOpen}
      onClose={handleDrawerToggle}
      ModalProps={{ keepMounted: true }}
      sx={{
        "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
