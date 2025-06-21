"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Grid,
  Stack,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  GetApp as GetAppIcon,
} from "@mui/icons-material";
import Layout from "@/components/Layout";
import AddCondominioDialog from "@/components/AddCondominioDialog";

export default function SelecioneOCondominioPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSave = (data) => {
    console.log("Dados do novo condomínio:", data);
    // TODO: chamar sua API aqui...
  };

  return (
    <Layout>
      {/* Header: título + ícone (empilha em coluna no xs, row no md) */}
      <Box
        display="flex"
        flexDirection={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        mb={4}
        gap={2}
      >
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            {/* subtítulo opcional */}
          </Typography>
        </Box>
      </Box>

      {/* Ações: empilha vertical no xs, horizontal no sm+ */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        mb={4}
        alignItems="center"
        sx={{
          // no xs centraliza, a partir de sm empurra pro final (direita)
          justifyContent: { xs: "center", sm: "flex-end" },
        }}
      >
        <Button
          startIcon={<AddIcon />}
          variant="text"
          sx={{ color: "#EA6037", whiteSpace: "nowrap" }}
          onClick={() => setDialogOpen(true)}
        >
          Adicionar condomínio
        </Button>
        <Button
          startIcon={<GetAppIcon />}
          variant="text"
          sx={{ color: "#787878", whiteSpace: "nowrap" }}
        >
          Extrair Relatório
        </Button>
      </Stack>

      {/* Estado vazio */}
      <Box textAlign="center" mt={8}>
        <Typography variant="h6" color="text.secondary">
          Não há condomínios para mostrar
        </Typography>
      </Box>

      <AddCondominioDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </Layout>
  );
}
