// src/components/AddAtividadeDialog.jsx
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, IconButton, Box, Typography, Grid,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  Autocomplete, InputAdornment, Divider, Paper, Stack, useMediaQuery, Chip,
} from "@mui/material";
import { useTheme, styled } from "@mui/material/styles";
import Popper from "@mui/material/Popper";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BusinessIcon from "@mui/icons-material/Business";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { FREQUENCIAS } from "@/utils/frequencias";

// --- helpers de normalização / sanitização ---
function normPrioridade(v) {
  return String(v || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, ""); // "MÉDIO" -> "MEDIO"
}

function formatYMD(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function sanitizeActivityForApi(raw) {
  const body = {
    id: raw.id, // se o backend não aceitar id no body, remova.
    name: raw.name?.trim(),
    type: raw.type?.trim(),
    quantity: Number(raw.quantity),
    model: raw.model?.trim(),
    location: raw.location?.trim(),
    prioridade: normPrioridade(raw.prioridade), // ALTO | MEDIO | BAIXO
    frequencia: raw.frequencia || "Não se repete",
    equipe: raw.equipe || "Equipe interna",
    tipoAtividade: raw.tipoAtividade || "Preventiva",
    observacoes: raw.observacoes || "",
    expectedDate: raw.expectedDate || null, // string YYYY-MM-DD (back converte pra Date)
    completionDate: raw.completionDate || null, // data de finalização do ciclo recorrente
    condominioId: raw.condominioId,
    // empresaId geralmente é anexado no onSave (lado da página)
  };

  Object.keys(body).forEach((k) => {
    if (body[k] === undefined || body[k] === null || body[k] === "") {
      delete body[k];
    }
  });

  return body;
}

// altura confortável nos selects
const StyledSelect = styled(Select)({
  "& .MuiSelect-select": { minHeight: 48, display: "flex", alignItems: "center" },
});

const WidePopper = styled(Popper)({
  width: 500,
  maxWidth: "90vw",
  zIndex: 1300,
});

const CondominioOption = styled("li")(({ theme }) => ({
  listStyle: "none",
  padding: "8px 12px",
  borderBottom: `1px solid ${theme.palette.divider}`,
  "&:last-child": { borderBottom: "none" },
  "&:hover": { backgroundColor: theme.palette.action.hover },
}));

function Section({ icon, title, children, dense = false }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: dense ? 1 : 2 }}>
        {icon}
        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
      </Stack>
      {children}
    </Paper>
  );
}

export default function AddAtividadeDialog({
  open,
  onClose,
  onSave,
  condominios,
  selectedCondominio,
  mode = "create",
  initialData = null,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  // refs
  const nameRef = useRef(null);
  const typeRef = useRef(null);
  const qtyRef = useRef(null);
  const modelRef = useRef(null);
  const locationRef = useRef(null);
  const obsRef = useRef(null);

  // estado
  const [ui, setUi] = useState({
    condominio: null,
    status: true, // só UI, não vai mais pro backend
    prioridade: "BAIXO",
    frequencia: "Não se repete",
    equipe: "Equipe interna",
    tipoAtividade: "Preventiva",
    expectedDate: "", // YYYY-MM-DD
    completionDate: "", // YYYY-MM-DD - data de finalização do ciclo
    photo: null,
  });
  const [errors, setErrors] = useState({});
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    const defaultCondo =
      (selectedCondominio?.id &&
        (condominios || []).find((c) => c.id === selectedCondominio.id)) || null;

    const d = initialData || {};

    if (nameRef.current) nameRef.current.value = d.name || "";
    if (typeRef.current) typeRef.current.value = d.type || "";
    if (qtyRef.current) qtyRef.current.value =
      d.quantity != null ? String(d.quantity) : "";
    if (modelRef.current) modelRef.current.value = d.model || "";
    if (locationRef.current) locationRef.current.value = d.location || "";
    if (obsRef.current) obsRef.current.value = d.observacoes || "";

    setUi({
      condominio: d.condominio || defaultCondo,
      status: true, // não integra mais com status de histórico aqui
      prioridade: normPrioridade(d.prioridade) || "BAIXO",
      frequencia: d.frequencia || "Não se repete",
      equipe: d.equipe || "Equipe interna",
      tipoAtividade: d.tipoAtividade || "Preventiva",
      expectedDate: d.expectedDate ? formatYMD(d.expectedDate) : "",
      completionDate: d.completionDate ? formatYMD(d.completionDate) : "",
      photo: null,
    });
    setErrors({});
    setPhotoPreview(null);
  }, [open, initialData, selectedCondominio, condominios]);

  useEffect(() => {
    if (!ui.photo) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(ui.photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [ui.photo]);

  const handleSelect = (e) => {
    const { name, value } = e.target;
    setUi((p) => ({ ...p, [name]: value }));
  };

  const handleSwitch = (e) => {
    const { name, checked } = e.target;
    setUi((p) => ({ ...p, [name]: checked }));
  };

  const handleCondo = (_e, value) => setUi((p) => ({ ...p, condominio: value }));

  const handleFile = (e) => {
    const file = e.target.files?.[0] || null;
    setUi((p) => ({ ...p, photo: file }));
  };

  const handleExpectedDate = (e) => {
    setUi((p) => ({ ...p, expectedDate: e.target.value || "" }));
  };

  const handleCompletionDate = (e) => {
    setUi((p) => ({ ...p, completionDate: e.target.value || "" }));
  };

  const validate = useCallback(() => {
    const newErrors = {};
    const name = nameRef.current?.value?.trim();
    const type = typeRef.current?.value?.trim();
    const quantityStr = qtyRef.current?.value?.trim();
    const model = modelRef.current?.value?.trim();
    const location = locationRef.current?.value?.trim();

    if (!name) newErrors.name = "Obrigatório";
    if (!type) newErrors.type = "Obrigatório";
    if (!quantityStr) newErrors.quantity = "Obrigatório";
    if (!model) newErrors.model = "Obrigatório";
    if (!location) newErrors.location = "Obrigatório";

    const condominioId = ui.condominio?.id || selectedCondominio?.id;
    if (!condominioId) newErrors.condominio = "Selecione um condomínio";

    const qty = parseInt(quantityStr || "", 10);
    if (!Number.isFinite(qty) || qty < 1) newErrors.quantity = "Número ≥ 1";

    setErrors(newErrors);
    return { ok: Object.keys(newErrors).length === 0, qty };
  }, [ui.condominio?.id, selectedCondominio?.id]);

  const handleSave = async () => {
    const { ok, qty } = validate();
    if (!ok) return;

    const condominioId = ui.condominio?.id || selectedCondominio?.id;

    const raw = {
      id: initialData?.id,
      name: nameRef.current?.value,
      type: typeRef.current?.value,
      quantity: qty,
      model: modelRef.current?.value,
      location: locationRef.current?.value,
      prioridade: ui.prioridade,
      frequencia: ui.frequencia,
      equipe: ui.equipe,
      tipoAtividade: ui.tipoAtividade,
      observacoes: obsRef.current?.value || "",
      expectedDate: ui.expectedDate || null, // YYYY-MM-DD ou null
      completionDate: ui.completionDate || null, // YYYY-MM-DD ou null
      condominioId,
    };

    const body = sanitizeActivityForApi(raw);

    try {
      setSaving(true);
      // onSave deve anexar empresaId e chamar a API /api/atividades ou /api/atividades/[id]
      await onSave(body, { mode });
      onClose();
    } catch (err) {
      console.error("Erro ao salvar atividade:", err);
      setErrors((e) => ({
        ...e,
        _api:
          err?.message ||
          "Falha ao salvar. Verifique os dados e tente novamente.",
      }));
    } finally {
      setSaving(false);
    }
  };

  const selectMenuProps = {
    MenuProps: {
      PaperProps: {
        sx: {
          maxHeight: 400,
          minWidth: 320,
          "& .MuiMenuItem-root": {
            whiteSpace: "normal",
            minHeight: 48,
            display: "flex",
            alignItems: "center",
            px: 2,
            py: 1.5,
            fontSize: "0.875rem",
          },
        },
      },
    },
  };

  const canSubmit = !!(ui.condominio?.id || selectedCondominio?.id);

  const onEnter = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  }, []);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={fullScreen}
      disableRestoreFocus
      keepMounted
      sx={{ "& .MuiDialog-paper": { minHeight: fullScreen ? "100vh" : "auto" } }}
    >
      <DialogTitle
        sx={{
          pr: 7,
          display: "flex",
          alignItems: "center",
          gap: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          pb: 2,
        }}
      >
        {mode === "edit" ? "Editar Atividade" : "Nova Atividade"}
        <IconButton
          aria-label="Fechar"
          onClick={onClose}
          sx={{
            ml: "auto",
            color: (t) => t.palette.grey[500],
            position: "absolute",
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ p: { xs: 2, sm: 3 }, overflow: "visible" }}
        onKeyDown={onEnter}
      >
        <Grid container spacing={3}>
          {/* Coluna esquerda */}
          <Grid item xs={12} md={6}>
            <Section icon={<InfoOutlinedIcon fontSize="small" />} title="Identificação">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nome do ativo"
                    inputRef={nameRef}
                    error={!!errors.name}
                    helperText={errors.name}
                    required
                    InputLabelProps={{ shrink: true }}
                    sx={{ "& .MuiOutlinedInput-root": { height: 48 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tipo/Categoria"
                    inputRef={typeRef}
                    error={!!errors.type}
                    helperText={errors.type}
                    required
                    InputLabelProps={{ shrink: true }}
                    sx={{ "& .MuiOutlinedInput-root": { height: 48 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Quantidade"
                    type="number"
                    inputRef={qtyRef}
                    error={!!errors.quantity}
                    helperText={errors.quantity}
                    required
                    inputProps={{ min: 1 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">un.</InputAdornment>
                      ),
                    }}
                    InputLabelProps={{ shrink: true }}
                    sx={{ "& .MuiOutlinedInput-root": { height: 48 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Modelo/Descrição"
                    inputRef={modelRef}
                    error={!!errors.model}
                    helperText={errors.model}
                    required
                    InputLabelProps={{ shrink: true }}
                    sx={{ "& .MuiOutlinedInput-root": { height: 48 } }}
                  />
                </Grid>
              </Grid>
            </Section>

            <Box sx={{ height: 16 }} />

            <Section icon={<ScheduleIcon fontSize="small" />} title="Planejamento">
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Prioridade</InputLabel>
                    <StyledSelect
                      name="prioridade"
                      value={ui.prioridade}
                      label="Prioridade"
                      onChange={handleSelect}
                      {...selectMenuProps}
                    >
                      <MenuItem value="ALTO">
                        <Chip label="Alto" color="error" size="small" />
                      </MenuItem>
                      <MenuItem value="MEDIO">
                        <Chip label="Médio" color="warning" size="small" />
                      </MenuItem>
                      <MenuItem value="BAIXO">
                        <Chip label="Baixo" color="success" size="small" />
                      </MenuItem>
                    </StyledSelect>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de atividade</InputLabel>
                    <StyledSelect
                      name="tipoAtividade"
                      value={ui.tipoAtividade}
                      label="Tipo de atividade"
                      onChange={handleSelect}
                      {...selectMenuProps}
                    >
                      <MenuItem value="Corretiva">Corretiva</MenuItem>
                      <MenuItem value="Melhoria">Melhoria</MenuItem>
                      <MenuItem value="Preventiva">Preventiva</MenuItem>
                    </StyledSelect>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Frequência</InputLabel>
                    <StyledSelect
                      name="frequencia"
                      value={ui.frequencia}
                      label="Frequência"
                      onChange={handleSelect}
                      {...selectMenuProps}
                    >
                      {FREQUENCIAS.map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    </StyledSelect>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Data inicial (âncora)"
                    type="date"
                    value={ui.expectedDate}
                    onChange={handleExpectedDate}
                    InputLabelProps={{ shrink: true }}
                    helperText="Primeira data de referência para o cronograma"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Data de finalização"
                    type="date"
                    value={ui.completionDate}
                    onChange={handleCompletionDate}
                    InputLabelProps={{ shrink: true }}
                    helperText="Opcional: quando o ciclo recorrente deve parar"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Equipe</InputLabel>
                    <StyledSelect
                      name="equipe"
                      value={ui.equipe}
                      label="Equipe"
                      onChange={handleSelect}
                      {...selectMenuProps}
                    >
                      <MenuItem value="Equipe interna">Equipe interna</MenuItem>
                      <MenuItem value="Terceiros">Terceiros</MenuItem>
                      <MenuItem value="Construtora">Construtora</MenuItem>
                    </StyledSelect>
                  </FormControl>
                </Grid>
              </Grid>
            </Section>
          </Grid>

          {/* Coluna direita */}
          <Grid item xs={12} md={6}>
            <Section icon={<BusinessIcon fontSize="small" />} title="Localização">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth error={!!errors.condominio}>
                    <Autocomplete
                      options={condominios || []}
                      getOptionLabel={(option) => option?.name || ""}
                      isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                      value={ui.condominio}
                      onChange={handleCondo}
                      disablePortal
                      PopperComponent={WidePopper}
                      ListboxProps={{ style: { maxHeight: 400, padding: 0 } }}
                      autoHighlight
                      openOnFocus
                      clearOnEscape
                      noOptionsText="Nenhum condomínio encontrado"
                      renderOption={(props, option) => (
                        <CondominioOption {...props}>
                          <Box>
                            <Typography variant="body1" fontWeight={600}>
                              {option?.name}
                            </Typography>
                            {option?.endereco && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.5 }}
                              >
                                {option.endereco}
                              </Typography>
                            )}
                          </Box>
                        </CondominioOption>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Condomínio"
                          placeholder="Digite para buscar condomínios..."
                          error={!!errors.condominio}
                          helperText={
                            errors.condominio || "Selecione um condomínio da lista"
                          }
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              height: 48,
                              alignItems: "center",
                            },
                          }}
                        />
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Localização específica"
                    placeholder="Ex.: Bloco A, Casa de máquinas, Piscina, Garagem..."
                    inputRef={locationRef}
                    error={!!errors.location}
                    helperText={errors.location || "Informe a localização exata do ativo"}
                    required
                    InputLabelProps={{ shrink: true }}
                    sx={{ "& .MuiOutlinedInput-root": { height: 48 } }}
                  />
                </Grid>
              </Grid>
            </Section>

            <Box sx={{ height: 16 }} />

            <Section icon={<InfoOutlinedIcon fontSize="small" />} title="Observações">
              <TextField
                fullWidth
                label="Observações adicionais"
                placeholder="Descreva informações relevantes sobre o ativo..."
                multiline
                minRows={4}
                maxRows={6}
                inputRef={obsRef}
                InputLabelProps={{ shrink: true }}
              />
            </Section>

            <Box sx={{ height: 16 }} />

            <Section icon={<PhotoCameraIcon fontSize="small" />} title="Status e anexos">
              <Grid container spacing={2} alignItems="center">
                {mode === "edit" && (
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!ui.status}
                          onChange={handleSwitch}
                          name="status"
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2">Em andamento</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Apenas visual (não altera histórico)
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>
                )}

                <Grid item xs={12} sm={mode === "edit" ? 6 : 12}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ xs: "stretch", sm: "center" }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<AttachFileIcon />}
                      component="label"
                    >
                      Adicionar foto
                      <input type="file" hidden accept="image/*" onChange={handleFile} />
                    </Button>
                    {ui.photo && (
                      <Button
                        size="small"
                        onClick={() => setUi((p) => ({ ...p, photo: null }))}
                      >
                        Remover
                      </Button>
                    )}
                  </Stack>
                </Grid>

                {photoPreview && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        component="img"
                        src={photoPreview}
                        alt={ui.photo?.name || "Pré-visualização"}
                        sx={{
                          width: 96,
                          height: 96,
                          objectFit: "cover",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      />
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {ui.photo?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(ui.photo?.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                )}
              </Grid>
            </Section>
          </Grid>
        </Grid>

        {errors._api && (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            {errors._api}
          </Typography>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          position: { xs: "static", sm: "sticky" },
          bottom: 0,
          bgcolor: "background.paper",
          borderTop: "1px solid",
          borderColor: "divider",
          zIndex: 1,
          px: { xs: 2, sm: 3 },
          py: 2,
        }}
      >
        <Button onClick={onClose} disabled={saving} size="large">
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={saving || !canSubmit}
          size="large"
        >
          {saving ? "Salvando..." : mode === "edit" ? "Salvar alterações" : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
