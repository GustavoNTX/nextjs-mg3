"use client";

import React, { useMemo } from "react";
import { Autocomplete, TextField, Avatar, Stack } from "@mui/material";
import { useRouter } from "next/navigation";
import { useCondominios } from "@/contexts/CondominiosContext";
import { useCondominoUI } from "@/contexts/CondominoUIContext";

type SelectCondominioProps = {
  fullWidth?: boolean;
  size?: "small" | "medium"; 
  sx?: any;                  
};

export default function SelectCondominio({
  fullWidth = true,
  size = "small",
  sx,
}: SelectCondominioProps) {
  const router = useRouter();
  const { items: condominios = [], loading } = useCondominios();
  const { selected, setSelected } = useCondominoUI();

  const value = useMemo(
    () => condominios.find((c) => c.id === selected?.id) ?? null,
    [condominios, selected?.id]
  );

  return (
    <Autocomplete
      options={condominios}
      loading={loading}
      value={value}
      onChange={(_, newValue) => {
        if (!newValue) return;
        setSelected({
          id: newValue.id,
          name: newValue.name,
          logoUrl: newValue.imageUrl ?? null,
        });
        router.push(`/cronograma/${newValue.id}`);
      }}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      getOptionLabel={(o) => o?.name ?? ""}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar src={option.imageUrl ?? undefined} sx={{ width: 24, height: 24 }} />
            {option.name}
          </Stack>
        </li>
      )}
      renderInput={(params) => (
        <TextField {...params} label="Condomínio" placeholder="Selecione..." />
      )}
      fullWidth={fullWidth}
      size={size} // agora bate com o tipo
      sx={sx}
    />
  );
}
