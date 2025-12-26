"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/providers";
import {
    Box,
    Typography,
    Paper,
    Grid,
    Switch,
    FormControlLabel,
    TextField,
    Button,
    Divider,
    Alert,
    Snackbar,
    Card,
    CardContent,
    CardActions,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
} from "@mui/material";
import {
    Save as SaveIcon,
    ArrowBack as ArrowBackIcon,
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
    Notifications as NotificationsIcon,
    Security as SecurityIcon,
    Palette as PaletteIcon,
    Info as InfoIcon,
    CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";

export default function ConfiguracoesGeraisPage() {
    const router = useRouter();
    const { darkMode, toggleDarkMode } = useTheme();

    const [settings, setSettings] = useState({
        notificacoesEmail: true,
        notificacoesPush: false,
        idioma: "pt-BR",
        timezone: "America/Sao_Paulo",
        limiteUpload: "10",
        autoSave: true,
        mostrarTutorial: false,
        compactMode: false,
    });

    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    useEffect(() => {
        const savedSettings = localStorage.getItem("app-settings");
        if (savedSettings) {
            setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
        }
    }, []);

    const handleChange = (field) => (event) => {
        const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            localStorage.setItem("app-settings", JSON.stringify(settings));

            setSnackbar({
                open: true,
                message: "Configurações salvas com sucesso!",
                severity: "success"
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: "Erro ao salvar configurações",
                severity: "error"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setSettings({
            notificacoesEmail: true,
            notificacoesPush: false,
            idioma: "pt-BR",
            timezone: "America/Sao_Paulo",
            limiteUpload: "10",
            autoSave: true,
            mostrarTutorial: false,
            compactMode: false,
        });

        setSnackbar({
            open: true,
            message: "Configurações resetadas para padrão",
            severity: "info"
        });
    };

    const handleBackToCondominios = () => {
        router.push("/selecione-o-condominio");
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, minHeight: "100vh" }}>
            {/* Cabeçalho */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 4, gap: 2 }}>
                <IconButton onClick={handleBackToCondominios}>
                    <ArrowBackIcon />
                </IconButton>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                        ⚙️ Configurações Gerais
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Personalize a experiência da plataforma
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Coluna principal */}
                <Grid item xs={12} lg={8}>
                    {/* Tema e Aparência */}
                    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                            <PaletteIcon sx={{ mr: 1, color: "primary.main" }} />
                            <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                                Tema e Aparência
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 3 }} />

                        <Box sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 2,
                            borderRadius: 1,
                            bgcolor: darkMode ? "rgba(144, 202, 249, 0.1)" : "rgba(25, 118, 210, 0.1)",
                            mb: 3
                        }}>
                            <Box>
                                <Typography variant="body1" gutterBottom>
                                    <strong>Tema {darkMode ? "Escuro" : "Claro"}</strong>
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {darkMode
                                        ? "Interface com cores escuras para uso noturno"
                                        : "Interface com cores claras padrão"}
                                </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <LightModeIcon sx={{ color: darkMode ? "text.disabled" : "warning.main" }} />
                                <Switch
                                    checked={darkMode}
                                    onChange={toggleDarkMode}
                                    color="primary"
                                    size="medium"
                                />
                                <DarkModeIcon sx={{ color: darkMode ? "primary.main" : "text.disabled" }} />
                            </Box>
                        </Box>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.compactMode}
                                    onChange={handleChange("compactMode")}
                                />
                            }
                            label="Modo compacto"
                            sx={{ display: "block", mb: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 4, display: "block" }}>
                            Reduz espaçamentos para mostrar mais conteúdo
                        </Typography>
                    </Paper>

                    {/* Notificações */}
                    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                            <NotificationsIcon sx={{ mr: 1, color: "primary.main" }} />
                            <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                                Notificações
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 3 }} />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.notificacoesEmail}
                                    onChange={handleChange("notificacoesEmail")}
                                />
                            }
                            label="Notificações por e-mail"
                            sx={{ mb: 2, display: "block" }}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.notificacoesPush}
                                    onChange={handleChange("notificacoesPush")}
                                />
                            }
                            label="Notificações push no navegador"
                            sx={{ mb: 2, display: "block" }}
                        />
                    </Paper>

                    {/* Sistema */}
                    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                            <SecurityIcon sx={{ mr: 1, color: "primary.main" }} />
                            <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                                Sistema
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 3 }} />

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    label="Idioma"
                                    value={settings.idioma}
                                    onChange={handleChange("idioma")}
                                    fullWidth
                                    sx={{ mb: 2 }}
                                    SelectProps={{ native: true }}
                                >
                                    <option value="pt-BR">Português (Brasil)</option>
                                    <option value="en-US">English (US)</option>
                                    <option value="es-ES">Español</option>
                                </TextField>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    label="Fuso horário"
                                    value={settings.timezone}
                                    onChange={handleChange("timezone")}
                                    fullWidth
                                    sx={{ mb: 2 }}
                                    SelectProps={{ native: true }}
                                >
                                    <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                                    <option value="America/New_York">Nova York (GMT-5)</option>
                                    <option value="Europe/London">Londres (GMT+0)</option>
                                </TextField>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Limite de upload (MB)"
                                    value={settings.limiteUpload}
                                    onChange={handleChange("limiteUpload")}
                                    type="number"
                                    fullWidth
                                    helperText="Tamanho máximo para upload de arquivos"
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Coluna lateral */}
                <Grid item xs={12} lg={4}>
                    {/* Ações rápidas */}
                    <Card elevation={2} sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: "medium" }}>
                                🚀 Ações Rápidas
                            </Typography>

                            <List>
                                <ListItem>
                                    <ListItemIcon>
                                        <CloudUploadIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Exportar configurações" />
                                </ListItem>

                                <ListItem>
                                    <ListItemIcon>
                                        <InfoIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Ver logs do sistema"
                                        secondary="Última atualização: hoje"
                                    />
                                </ListItem>
                            </List>
                        </CardContent>
                        <CardActions sx={{ p: 2, pt: 0 }}>
                            <Button fullWidth variant="outlined" onClick={handleReset}>
                                Restaurar padrões
                            </Button>
                        </CardActions>
                    </Card>

                    {/* Informações */}
                    <Card elevation={2}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: "medium" }}>
                                ℹ️ Informações
                            </Typography>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Tema atual:</strong>
                                </Typography>
                                <Chip
                                    label={darkMode ? "Escuro" : "Claro"}
                                    color={darkMode ? "primary" : "default"}
                                    size="small"
                                    sx={{ mt: 0.5 }}
                                />
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Última alteração:</strong>
                                </Typography>
                                <Typography variant="body2">Hoje, 14:30</Typography>
                            </Box>

                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Versão:</strong>
                                </Typography>
                                <Typography variant="body2">2.1.0</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Botões de ação */}
            <Box sx={{
                mt: 4,
                p: 3,
                borderRadius: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2
            }}>
                <Button
                    variant="outlined"
                    onClick={handleBackToCondominios}
                    startIcon={<ArrowBackIcon />}
                >
                    Voltar para Condomínios
                </Button>

                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handleReset}
                    >
                        Cancelar
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={saving}
                        sx={{ minWidth: 150 }}
                    >
                        {saving ? "Salvando..." : "Salvar"}
                    </Button>
                </Box>
            </Box>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}