// src/components/ProtectedRoute.jsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Box, Typography } from "@mui/material";
import Image from "next/image";

export default function ProtectedRoute({ children }) {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const tried = useRef(false);

  useEffect(() => {
    if (loading) return;

    if (user) return;
    if (tried.current) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    tried.current = true;
    refresh().catch(() => {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    });
  }, [loading, user, refresh, router, pathname]);

  if (loading || !user) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Image src="/simple-logo.png" alt="Logo" width={150} height={150} />
      </Box>
    );
  }

  return children;
}
