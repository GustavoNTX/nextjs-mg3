// src/components/Responsive/Header.jsx
"use client";

import { useTheme, useMediaQuery } from "@mui/material";
import DesktopHeader from "../desktop/Header";
import MobileHeader  from "../mobile/Header";

export default function HeaderFacade(props) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  return isMdUp
    ? <DesktopHeader {...props} />
    : <MobileHeader  {...props} />;
}
