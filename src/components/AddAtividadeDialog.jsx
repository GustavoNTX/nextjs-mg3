// src/components/AddAtividadeDialog.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, IconButton, Box, Typography, Grid,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  Autocomplete, InputAdornment, Divider, Paper, Stack, useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BusinessIcon from "@mui/icons-material/Business";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";

const frequenciaOptions = [
  "Não se repete","Todos os dias","Em dias alternados","Segunda a sexta","Segunda a sábado",
  "A cada semana","A cada duas semanas","A cada mês","A cada dois meses","A cada três meses",
  "A cada quatro meses","A cada cinco meses","A cada seis meses","A cada ano","A cada dois anos",
  "A cada três anos","A cada cinco anos","A cada dez anos",
];

function Section({ icon, title, children, noGap = false }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: noGap ? 0 : 1 }}>
        {icon}
        <Typography variant="subtitle1" fontWeight={700} sx={{ letterSpacing: 0.2 }}>
          {title}
        </Typography>
      </Stack>
      {children}
    </Paper>
  );
}

const AddAtividadeDialog = ({
  open,
  onClose,
  onSave,
  condominios,
  selectedCondominio,
  mode = "create",          // "create" | "edit"
  initialData = null,       // objeto opcional para edição
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // Refs para inputs NÃO-controlados (digitação fica leve)
  const nameRef = useRef(null);
  const typeRef = useRef(null);
  const qtyRef = useRef(null);
  const modelRef = useRef(null);
  const locationRef = useRef(null);
  const obsRef = useRef(null);

  // Estado mínimo para itens que fazem sentido controlados
  const [ui, setUi] = useState({
    condominio: null,
    status: true,
    prioridade: "Baixo",
    frequencia: "Não se repete",
    equipe: "Equipe interna",
    tipoAtividade: "Preventiva",
    photo: null,
  });
  const [errors, setErrors] = useState({});
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  // monta defaults quando o diálogo abre (como usamos keepMounted, precisamos setar valor "na mão")
  useEffect(() => {
    if (!open) return;

    const defaultCondo =
      (selectedCondominio?.id &&
        (condominios || []).find((c) => c.id === selectedCondominio.id)) || null;

    const d = initialData || {};
    // Preenche campos de texto
    if (nameRef.current) nameRef.current.value = d.name || "";
    if (typeRef.current) typeRef.current.value = d.type || "";
    if (qtyRef.current) qtyRef.current.value = d.quantity != null ? String(d.quantity) : "";
    if (modelRef.current) modelRef.current.value = d.model || "";
    if (locationRef.current) locationRef.current.value = d.location || "";
    if (obsRef.current) obsRef.current.value = d.observacoes || "";

    setUi({
      condominio: d.condominio || defaultCondo,
      status: d.status ?? true,
      prioridade: d.prioridade || "Baixo",
      frequencia: d.frequencia || "Não se repete",
      equipe: d.equipe || "Equipe interna",
      tipoAtividade: d.tipoAtividade || "Preventiva",
      photo: null,
    });
    setErrors({});
    setPhotoPreview(null);
  }, [open, initialData, selectedCondominio, condominios]);

  // Preview da imagem
  useEffect(() => {
    if (ui.photo) {
      const url = URL.createObjectURL(ui.photo);
      setPhotoPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPhotoPreview(null);
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

  const validate = () => {
    const newErrors = {};
    const name = nameRef.current?.value?.trim();
    const type = typeRef.current?.value?.trim();
    const quantityStr = qtyRef.current?.value?.trim();
    const model = modelRef.current?.value?.trim();
    const location = locationRef.current?.value?.trim();

    if (!name) newErrors.name = "Este campo é obrigatório";
    if (!type) newErrors.type = "Este campo é obrigatório";
    if (!quantityStr) newErrors.quantity = "Este campo é obrigatório";
    if (!model) newErrors.model = "Este campo é obrigatório";
    if (!location) newErrors.location = "Este campo é obrigatório";

    const condominioId = ui.condominio?.id || selectedCondominio?.id;
    if (!condominioId) newErrors.condominio = "Selecione um condomínio";

    // number check
    const qty = parseInt(quantityStr || "", 10);
    if (!Number.isFinite(qty) || qty < 1) newErrors.quantity = "Informe um número maior ou igual a 1";

    setErrors(newErrors);
    return { ok: Object.keys(newErrors).length === 0, qty };
  };

  const handleSave = async () => {
    const { ok, qty } = validate();
    console.log("ok, qty", ok, qty)
    if (!ok) return;

    const condominioId = ui.condominio?.id || selectedCondominio?.id;

    const payload = {
      id: initialData?.id, // útil para update
      name: nameRef.current?.value.trim(),
      type: typeRef.current?.value.trim(),
      quantity: qty,
      model: modelRef.current?.value.trim(),
      condominioId,
      location: locationRef.current?.value.trim(),
      prioridade: ui.prioridade,
      frequencia: ui.frequencia,
      equipe: ui.equipe,
      tipoAtividade: ui.tipoAtividade,
      observacoes: obsRef.current?.value || "",
      status: ui.status,
      photoUrl: null, // TODO: upload e setar URL
    };

    // Se for criação e você quer usar o default do banco para status, remova-o:
    if (mode === "create") delete payload.status;

    // Não enviamos o arquivo bruto
    // (suba antes, pegue a URL e preencha photoUrl)
    delete payload.photo;

    try {
      setSaving(true);
      await onSave(payload, { mode });
      onClose();
    } catch (err) {
      setErrors((e) => ({ ...e, _api: err?.message || "Falha ao salvar" }));
    } finally {
      setSaving(false);
    }
  };

  const selectMenuProps = useMemo(
    () => ({ MenuProps: { PaperProps: { style: { maxHeight: 48 * 6.5 } } } }),
    []
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      disableRestoreFocus
      keepMounted
    >
      <DialogTitle sx={{ pr: 7 }}>
        {mode === "edit" ? "Editar Ativo" : "Novo Ativo"}
        <IconButton
          aria-label="Fechar"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8, color: (t) => t.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
        <Grid container spacing={2}>
          {/* Identificação */}
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
                    InputProps={{ endAdornment: <InputAdornment position="end">un.</InputAdornment> }}
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
                  />
                </Grid>
              </Grid>
            </Section>
          </Grid>

          {/* Localização e condomínio */}
          <Grid item xs={12} md={6}>
            <Section icon={<BusinessIcon fontSize="small" />} title="Localização">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={condominios || []}
                    getOptionLabel={(option) => option?.name || ""}
                    isOptionEqualToValue={(opt, val) => opt?.id === val?.id || opt?.name === val?.name}
                    value={ui.condominio}
                    onChange={handleCondo}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Condomínio"
                        placeholder="Selecione"
                        error={!!errors.condominio}
                        helperText={errors.condominio}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Local (ex.: Bloco A / Casa de máquinas)"
                    inputRef={locationRef}
                    error={!!errors.location}
                    helperText={errors.location}
                    required
                  />
                </Grid>
              </Grid>
            </Section>
          </Grid>

          {/* Planejamento */}
          <Grid item xs={12} md={6}>
            <Section icon={<ScheduleIcon fontSize="small" />} title="Planejamento">
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Prioridade</InputLabel>
                    <Select
                      name="prioridade"
                      value={ui.prioridade}
                      label="Prioridade"
                      onChange={handleSelect}
                      {...selectMenuProps}
                    >
                      <MenuItem value="Alto">Alto</MenuItem>
                      <MenuItem value="Médio">Médio</MenuItem>
                      <MenuItem value="Baixo">Baixo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de atividade</InputLabel>
                    <Select
                      name="tipoAtividade"
                      value={ui.tipoAtividade}
                      label="Tipo de atividade"
                      onChange={handleSelect}
                      {...selectMenuProps}
                    >
                      <MenuItem value="Corretiva">Corretiva</MenuItem>
                      <MenuItem value="Melhoria">Melhoria</MenuItem>
                      <MenuItem value="Preventiva">Preventiva</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Frequência</InputLabel>
                    <Select
                      name="frequencia"
                      value={ui.frequencia}
                      label="Frequência"
                      onChange={handleSelect}
                      {...selectMenuProps}
                    >
                      {frequenciaOptions.map((opt) => (
                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Equipe</InputLabel>
                    <Select
                      name="equipe"
                      value={ui.equipe}
                      label="Equipe"
                      onChange={handleSelect}
                      {...selectMenuProps}
                    >
                      <MenuItem value="Equipe interna">Equipe interna</MenuItem>
                      <MenuItem value="Terceiros">Terceiros</MenuItem>
                      <MenuItem value="Construtora">Construtora</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Section>
          </Grid>

          {/* Observações & Status/Foto */}
          <Grid item xs={12} md={6}>
            <Section icon={<InfoOutlinedIcon fontSize="small" />} title="Observações">
              <TextField fullWidth label="Observações" multiline minRows={5} inputRef={obsRef} />
            </Section>
            <Box sx={{ height: 12 }} />
            <Section icon={<PhotoCameraIcon fontSize="small" />} title="Status e anexos" noGap>
              <Grid container spacing={2}>
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
                    label="Em andamento"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: "flex-start", sm: "flex-end" }}>
                    <Button variant="outlined" startIcon={<AttachFileIcon />} component="label">
                      Adicionar foto
                      <input type="file" hidden accept="image/*" onChange={handleFile} />
                    </Button>
                    {ui.photo && (
                      <Button size="small" onClick={() => setUi((p) => ({ ...p, photo: null }))}>
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
                          width: 96, height: 96, objectFit: "cover",
                          borderRadius: 2, border: "1px solid", borderColor: "divider",
                        }}
                      />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {ui.photo?.name}
                      </Typography>
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
          py: 1.5,
        }}
      >
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />} disabled={saving}>
          {saving ? "Salvando..." : (mode === "edit" ? "Salvar alterações" : "Salvar")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(AddAtividadeDialog);
