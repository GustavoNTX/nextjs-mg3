"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  InputAdornment,
  Box,
  Typography,
  FormHelperText,
  Stack,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AttachmentIcon from "@mui/icons-material/Attachment";
import LinkIcon from "@mui/icons-material/Link";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ApartmentIcon from "@mui/icons-material/Apartment";

import { formatCNPJ, isValidCNPJ } from "@/utils/cnpj";
import { useIBGELocations } from "@/hooks/useIBGELocations";
import { useCondominios } from "@/contexts/CondominiosContext"; // Importar o contexto

const INITIAL_VALUES = {
  name: "",
  cnpj: "",
  address: "",
  neighborhood: "",
  state: "",
  city: "",
  type: "",
  reference: "", // ID do condomínio referência
  referenceData: null, // Dados completos do condomínio referência
  relationshipType: "", // Tipo de relacionamento
};

export default function AddCondominioDialog({ open, onClose, onSave }) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Estados para o modal de busca
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Usar o contexto real de condomínios
  const { items: condominios } = useCondominios();

  const {
    states,
    cities,
    loadingStates,
    loadingCities,
  } = useIBGELocations(values.state);

  useEffect(() => {
    if (open) {
      setValues(INITIAL_VALUES);
      setErrors({});
    }
  }, [open]);

  // Efeito para atualizar os resultados da busca quando os condomínios mudam
  useEffect(() => {
    if (searchDialogOpen) {
      handleSearch();
    }
  }, [condominios, searchDialogOpen]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;

    setValues((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "state" ? { city: "" } : {}),
    }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Funções para o sistema de vinculação
  const handleSearch = () => {
    setSearchLoading(true);

    // Filtrar os condomínios reais do contexto
    setTimeout(() => {
      const results = condominios.filter(cond => {
        if (!cond) return false;

        // Não incluir o próprio condomínio que está sendo criado (se já existir temporariamente)
        const searchableText = `
          ${cond.name || ''} 
          ${cond.cnpj || ''} 
          ${cond.address || ''} 
          ${cond.city || ''} 
          ${cond.state || ''}
        `.toLowerCase();

        return searchableText.includes(searchTerm.toLowerCase());
      });

      setSearchResults(results);
      setSearchLoading(false);
    }, 300);
  };

  const handleOpenSearchDialog = () => {
    setSearchDialogOpen(true);
    setSearchTerm("");
    handleSearch(); // Busca inicial com termo vazio para mostrar todos
  };

  const handleCloseSearchDialog = () => {
    setSearchDialogOpen(false);
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleSelectCondominio = (condominio) => {
    setValues(v => ({
      ...v,
      reference: condominio.id,
      referenceData: condominio // Armazena todos os dados
    }));
    handleCloseSearchDialog();
  };

  const handleClearReference = () => {
    setValues(v => ({
      ...v,
      reference: "",
      referenceData: null,
      relationshipType: ""
    }));
  };

  const handleClose = () => {
    setValues(INITIAL_VALUES);
    setErrors({});
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    const requiredFields = [
      "name",
      "cnpj",
      "address",
      "neighborhood",
      "state",
      "city",
      "type",
    ];

    requiredFields.forEach((field) => {
      if (!values[field]?.trim()) {
        newErrors[field] = "Este campo é obrigatório";
      }
    });

    if (values.cnpj && !isValidCNPJ(values.cnpj)) {
      newErrors.cnpj = "CNPJ inválido";
    }

    // Se tiver referência, o tipo de relacionamento é obrigatório
    if (values.reference && !values.relationshipType) {
      newErrors.relationshipType = "Informe o tipo de relacionamento";
    }

    // Validação: não pode vincular a si mesmo (se já existir)
    if (values.reference && values.referenceData?.cnpj === values.cnpj) {
      newErrors.reference = "Não é possível vincular a um condomínio com o mesmo CNPJ";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);

      // Preparar dados para envio
      const dataToSave = {
        name: values.name,
        cnpj: values.cnpj,
        address: values.address,
        neighborhood: values.neighborhood,
        state: values.state,
        city: values.city,
        type: values.type,
        // Incluir dados de referência apenas se houver
        ...(values.reference && {
          referenceId: values.reference,
          relationshipType: values.relationshipType,
          referenceName: values.referenceData?.name,
          referenceCnpj: values.referenceData?.cnpj,
        })
      };

      await onSave(dataToSave);
      setValues(INITIAL_VALUES);
      setErrors({});
      onClose();
    } catch (err) {
      setErrors({
        form: err.message || "Erro ao salvar condomínio",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Adicionar Condomínio
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <DialogContent>
            <Stack spacing={3} sx={{ pt: 1 }}>
              {/* Seção 1: Dados básicos */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: "8px" }}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Dados Básicos
                </Typography>

                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="*Nome do condomínio"
                      value={values.name}
                      onChange={handleChange("name")}
                      error={!!errors.name}
                      helperText={errors.name || " "}
                      fullWidth
                      required
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="*CNPJ"
                      value={values.cnpj}
                      onChange={(e) =>
                        setValues((v) => ({
                          ...v,
                          cnpj: formatCNPJ(e.target.value),
                        }))
                      }
                      error={!!errors.cnpj}
                      helperText={errors.cnpj || " "}
                      fullWidth
                      required
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Seção 2: Localização */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: "8px" }}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Localização
                </Typography>

                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={12}>
                    <TextField
                      label="*Endereço"
                      value={values.address}
                      onChange={handleChange("address")}
                      error={!!errors.address}
                      helperText={errors.address || " "}
                      fullWidth
                      required
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="*Bairro"
                      value={values.neighborhood}
                      onChange={handleChange("neighborhood")}
                      error={!!errors.neighborhood}
                      helperText={errors.neighborhood || " "}
                      fullWidth
                      required
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth variant="outlined" error={!!errors.state} required>
                      <InputLabel shrink id="state-select-label">
                        Estado
                      </InputLabel>
                      <Select
                        labelId="state-select-label"
                        value={values.state}
                        label="Estado"
                        onChange={handleChange("state")}
                        disabled={loadingStates}
                        displayEmpty
                        inputProps={{
                          'aria-label': 'Selecione o estado'
                        }}
                      >
                        <MenuItem value="">
                          <em>Selecione o estado</em>
                        </MenuItem>
                        {states.map((s) => (
                          <MenuItem key={s.uf} value={s.uf}>
                            {s.name}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>{errors.state || " "}</FormHelperText>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl
                      fullWidth
                      variant="outlined"
                      error={!!errors.city}
                      required
                      disabled={!values.state || loadingCities}
                    >
                      <InputLabel
                        shrink
                        id="city-select-label"
                      >
                        Cidade
                      </InputLabel>
                      <Select
                        labelId="city-select-label"
                        value={values.city}
                        label="Cidade"
                        onChange={handleChange("city")}
                        disabled={!values.state || loadingCities}
                        displayEmpty
                        inputProps={{
                          'aria-label': 'Selecione a cidade'
                        }}
                      >
                        <MenuItem value="">
                          <em>Selecione a cidade</em>
                        </MenuItem>
                        {cities.map((city) => (
                          <MenuItem key={city} value={city}>
                            {city}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        {loadingCities
                          ? "Carregando cidades..."
                          : errors.city || " "}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>

              {/* Seção 3: Detalhes Adicionais */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: "8px" }}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Detalhes Adicionais
                </Typography>

                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={12} sm={6}>
                    <FormControl
                      fullWidth
                      variant="outlined"
                      error={!!errors.type}
                      required
                    >
                      <InputLabel shrink id="type-select-label">
                        *Tipo
                      </InputLabel>
                      <Select
                        labelId="type-select-label"
                        value={values.type}
                        label="*Tipo"
                        onChange={handleChange("type")}
                        displayEmpty
                      >
                        <MenuItem value="">
                          <em>Selecione o tipo</em>
                        </MenuItem>
                        <MenuItem value="Residencial">Residencial</MenuItem>
                        <MenuItem value="Comercial">Comercial</MenuItem>
                        <MenuItem value="Misto">Misto</MenuItem>
                        <MenuItem value="Horizontal">Horizontal</MenuItem>
                        <MenuItem value="Vertical">Vertical</MenuItem>
                      </Select>
                      <FormHelperText>{errors.type || " "}</FormHelperText>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Anexar foto"
                      disabled
                      fullWidth
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <AttachmentIcon />
                          </InputAdornment>
                        ),
                      }}
                      helperText=" "
                    />
                  </Grid>

                  {/* Nova seção: Vinculação a Condomínio Existente */}
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, border: '1px dashed #ddd', borderRadius: 1, backgroundColor: '#fafafa' }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinkIcon fontSize="small" />
                        Vincular a Condomínio Existente
                      </Typography>

                      {values.reference ? (
                        <>
                          <Box sx={{ mb: 2, p: 1.5, bgcolor: '#e8f5e9', borderRadius: 1 }}>
                            <Grid container alignItems="center" justifyContent="space-between">
                              <Grid item xs={10}>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  <ApartmentIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                                  Vinculado a: {values.referenceData?.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  CNPJ: {values.referenceData?.cnpj || 'Não informado'} |
                                  Tipo: {values.referenceData?.type || 'Não informado'}
                                </Typography>
                              </Grid>
                              <Grid item xs={2} textAlign="right">
                                <IconButton
                                  size="small"
                                  onClick={handleClearReference}
                                  title="Remover vínculo"
                                >
                                  <ClearIcon fontSize="small" />
                                </IconButton>
                              </Grid>
                            </Grid>
                          </Box>

                          <FormControl
                            fullWidth
                            variant="outlined"
                            error={!!errors.relationshipType}
                            required
                          >
                            <InputLabel shrink id="relationship-type-label">
                              Tipo de Relacionamento *
                            </InputLabel>
                            <Select
                              labelId="relationship-type-label"
                              value={values.relationshipType}
                              onChange={handleChange("relationshipType")}
                              label="Tipo de Relacionamento *"
                              displayEmpty
                            >
                              <MenuItem value="">
                                <em>Selecione o tipo</em>
                              </MenuItem>
                              <MenuItem value="same_condominium">
                                Mesmo Condomínio (Outro Bloco/Unidade)
                              </MenuItem>
                              <MenuItem value="same_group">
                                Mesmo Grupo/Família Administrativa
                              </MenuItem>
                              <MenuItem value="shared_services">
                                Compartilha Serviços/Fornecedores
                              </MenuItem>
                              <MenuItem value="sister_condominium">
                                Condomínio Irmão (Mesmo Construtor)
                              </MenuItem>
                            </Select>
                            <FormHelperText>
                              {errors.relationshipType || "Defina a relação com o condomínio vinculado"}
                            </FormHelperText>
                          </FormControl>
                        </>
                      ) : (
                        <Button
                          variant="outlined"
                          startIcon={<LinkIcon />}
                          onClick={handleOpenSearchDialog}
                          fullWidth
                          sx={{ mt: 1 }}
                          disabled={condominios.length === 0} // Desabilitar se não houver condomínios
                        >
                          {condominios.length === 0 ? 'Nenhum condomínio disponível' : 'Vincular a Condomínio Existente'}
                        </Button>
                      )}

                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Use esta opção para vincular a outro condomínio do mesmo grupo,
                        ou se este for um novo bloco/unidade de um condomínio já cadastrado.
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {errors.form && (
                <Typography color="error" align="center">
                  {errors.form}
                </Typography>
              )}
            </Stack>
          </DialogContent>

          <Divider />

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose} variant="outlined" color="secondary">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Modal de busca de condomínios */}
      <Dialog
        open={searchDialogOpen}
        onClose={handleCloseSearchDialog}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: { maxHeight: '80vh' }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Buscar Condomínio para Vincular
          </Typography>
          <IconButton onClick={handleCloseSearchDialog}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <DialogContent>
          <TextField
            fullWidth
            label="Buscar por nome, CNPJ ou endereço"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              // Busca em tempo real
              setTimeout(() => handleSearch(), 300);
            }}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            helperText={`${searchResults.length} condomínio(s) encontrado(s)`}
          />

          {searchLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : searchResults.length > 0 ? (
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {searchResults.map((cond) => (
                <ListItem
                  key={cond.id}
                  button
                  onClick={() => handleSelectCondominio(cond)}
                  sx={{
                    borderBottom: '1px solid #eee',
                    '&:hover': { backgroundColor: '#f5f5f5' }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#1976d2' }}>
                      <ApartmentIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={cond.name}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {cond.type || 'Sem tipo'} • CNPJ: {cond.cnpj || 'Não informado'}
                        </Typography>
                        <br />
                        {cond.address || 'Endereço não informado'}, {cond.city || ''} - {cond.state || ''}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography color="text.secondary">
                Nenhum condomínio encontrado
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {searchTerm ? 'Tente buscar com outros termos' : 'Não há condomínios cadastrados'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseSearchDialog} variant="outlined">
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}