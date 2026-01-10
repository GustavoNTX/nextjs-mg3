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
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Chip,
    Avatar,
    LinearProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
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
    Language as LanguageIcon,
    Storage as StorageIcon,
    AutoAwesome as AutoAwesomeIcon,
    Backup as BackupIcon,
    RestartAlt as RestartAltIcon,
    Download as DownloadIcon,
    Delete as DeleteIcon,
    VerifiedUser as VerifiedUserIcon,
    Speed as SpeedIcon,
} from "@mui/icons-material";

export default function ConfiguracoesGeraisPage() {
    const router = useRouter();
    const { darkMode, toggleDarkMode } = useTheme();

    const [settings, setSettings] = useState({
        notificacoesEmail: true,
        notificacoesPush: false,
        idioma: "pt-BR",
        limiteUpload: "10",
        compactMode: false,
    });

    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success"
    });

    // Estados para dados reais de armazenamento
    const [storageData, setStorageData] = useState({
        settingsSize: 0,
        cacheSize: 0,
        totalUsed: 0,
        loading: true
    });

    // Carregar configurações salvas
    useEffect(() => {
        const savedSettings = localStorage.getItem("app-settings");
        if (savedSettings) {
            try {
                const parsedSettings = JSON.parse(savedSettings);
                const filteredSettings = {
                    notificacoesEmail: parsedSettings.notificacoesEmail !== undefined ? parsedSettings.notificacoesEmail : true,
                    notificacoesPush: parsedSettings.notificacoesPush !== undefined ? parsedSettings.notificacoesPush : false,
                    idioma: parsedSettings.idioma || "pt-BR",
                    limiteUpload: parsedSettings.limiteUpload || "10",
                    compactMode: parsedSettings.compactMode !== undefined ? parsedSettings.compactMode : false,
                };
                setSettings(filteredSettings);
            } catch (error) {
                console.error("Erro ao carregar configurações:", error);
            }
        }
    }, []);

    // Calcular tamanho real do armazenamento
    useEffect(() => {
        const calculateStorage = () => {
            try {
                let settingsSize = 0;
                let cacheSize = 0;
                let totalUsed = 0;

                // Calcular tamanho das configurações
                const settingsData = localStorage.getItem("app-settings");
                if (settingsData) {
                    settingsSize = new Blob([settingsData]).size / (1024 * 1024); // Convertendo para MB
                }

                // Calcular tamanho total do localStorage (cache aproximado)
                let total = 0;
                for (let key in localStorage) {
                    if (localStorage.hasOwnProperty(key)) {
                        const value = localStorage.getItem(key);
                        if (value) {
                            total += new Blob([key, value]).size;
                        }
                    }
                }

                cacheSize = (total / (1024 * 1024)) - settingsSize; // Cache em MB
                totalUsed = settingsSize + cacheSize;

                setStorageData({
                    settingsSize: parseFloat(settingsSize.toFixed(2)),
                    cacheSize: parseFloat(cacheSize.toFixed(2)),
                    totalUsed: parseFloat(totalUsed.toFixed(2)),
                    loading: false
                });
            } catch (error) {
                console.error("Erro ao calcular armazenamento:", error);
                setStorageData(prev => ({ ...prev, loading: false }));
            }
        };

        calculateStorage();
        // Recalcular a cada 5 segundos se necessário
        const interval = setInterval(calculateStorage, 5000);
        return () => clearInterval(interval);
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

            // Recalcular tamanho após salvar
            setTimeout(() => {
                const settingsData = localStorage.getItem("app-settings");
                if (settingsData) {
                    const newSize = new Blob([settingsData]).size / (1024 * 1024);
                    setStorageData(prev => ({
                        ...prev,
                        settingsSize: parseFloat(newSize.toFixed(2))
                    }));
                }
            }, 100);

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
            limiteUpload: "10",
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

    // Função para exportar configurações
    const handleExportSettings = () => {
        const dataStr = JSON.stringify(settings, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `configuracoes_${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    // Função REAL para limpar cache
    const handleClearCache = () => {
        try {
            // Salvar configurações antes de limpar
            const appSettings = localStorage.getItem("app-settings");

            // Limpar todo o localStorage
            localStorage.clear();

            // Restaurar configurações
            if (appSettings) {
                localStorage.setItem("app-settings", appSettings);
            }

            // Atualizar dados de armazenamento
            setStorageData({
                settingsSize: appSettings ? new Blob([appSettings]).size / (1024 * 1024) : 0,
                cacheSize: 0,
                totalUsed: appSettings ? new Blob([appSettings]).size / (1024 * 1024) : 0,
                loading: false
            });

            setSnackbar({
                open: true,
                message: "Cache limpo com sucesso!",
                severity: "success"
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: "Erro ao limpar cache",
                severity: "error"
            });
        }
    };

    // Formatar bytes para MB
    const formatMB = (size) => {
        return `${size.toFixed(2)} MB`;
    };

    return (
        <Box sx={{
            p: { xs: 3, sm: 4, md: 5 },
            minHeight: "100vh",
            backgroundColor: darkMode ? 'background.default' : 'grey.50'
        }}>
            {/* Cabeçalho melhorado */}
            <Box sx={{
                display: "flex",
                alignItems: "center",
                mb: 5,
                gap: 2,
                flexDirection: { xs: "column", sm: "row" },
                textAlign: { xs: "center", sm: "left" }
            }}>
                <Box sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    width: { xs: "100%", sm: "auto" },
                    justifyContent: { xs: "center", sm: "flex-start" }
                }}>
                    <IconButton
                        onClick={handleBackToCondominios}
                        size="large"
                        sx={{
                            backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                            '&:hover': {
                                backgroundColor: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'
                            }
                        }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" sx={{
                            fontWeight: "800",
                            background: darkMode
                                ? 'linear-gradient(45deg, #90caf9, #2196f3)'
                                : 'linear-gradient(45deg, #1976d2, #0d47a1)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent',
                            mb: 0.5
                        }}>
                            ⚙️ Configurações Gerais
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            Personalize a experiência da plataforma
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Grid container spacing={4}>
                {/* Coluna principal */}
                <Grid item xs={12} lg={8}>
                    {/* Tema e Aparência - Card melhorado */}
                    <Paper elevation={0} sx={{
                        p: 4,
                        mb: 4,
                        borderRadius: 3,
                        backgroundColor: darkMode ? 'grey.900' : 'white',
                        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                        boxShadow: darkMode
                            ? '0 8px 32px rgba(0,0,0,0.3)'
                            : '0 8px 32px rgba(0,0,0,0.05)'
                    }}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                            <Box sx={{
                                p: 1.5,
                                borderRadius: 2,
                                backgroundColor: darkMode ? 'rgba(144, 202, 249, 0.1)' : 'rgba(25, 118, 210, 0.1)',
                                mr: 2
                            }}>
                                <PaletteIcon sx={{ color: "primary.main", fontSize: 28 }} />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: "700" }}>
                                Tema e Aparência
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 4 }} />

                        {/* Card de tema */}
                        <Box sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 3,
                            borderRadius: 3,
                            mb: 4,
                            backgroundColor: darkMode ? 'rgba(144, 202, 249, 0.05)' : 'rgba(25, 118, 210, 0.05)',
                            border: `2px solid ${darkMode ? 'rgba(144, 202, 249, 0.2)' : 'rgba(25, 118, 210, 0.2)'}`,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                borderColor: darkMode ? 'rgba(144, 202, 249, 0.4)' : 'rgba(25, 118, 210, 0.4)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                            }
                        }}>
                            <Box>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: "700", display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {darkMode ? "🌙 Tema Escuro" : "☀️ Tema Claro"}
                                    <Chip
                                        label={darkMode ? "Ativo" : "Ativo"}
                                        size="small"
                                        color={darkMode ? "primary" : "default"}
                                        variant="outlined"
                                    />
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '500px' }}>
                                    {darkMode
                                        ? "Interface otimizada para uso noturno com cores escuras que reduzem a fadiga ocular"
                                        : "Interface clássica com cores vibrantes e ótima legibilidade para uso diário"}
                                </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <LightModeIcon sx={{
                                    color: darkMode ? "text.disabled" : "warning.main",
                                    fontSize: 30
                                }} />
                                <Switch
                                    checked={darkMode}
                                    onChange={toggleDarkMode}
                                    color="primary"
                                    size="large"
                                    sx={{
                                        '& .MuiSwitch-track': {
                                            backgroundColor: darkMode ? 'primary.main' : 'grey.400',
                                        }
                                    }}
                                />
                                <DarkModeIcon sx={{
                                    color: darkMode ? "primary.main" : "text.disabled",
                                    fontSize: 30
                                }} />
                            </Box>
                        </Box>

                        {/* Modo compacto */}
                        <Box sx={{
                            p: 2.5,
                            borderRadius: 2,
                            backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
                        }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settings.compactMode}
                                        onChange={handleChange("compactMode")}
                                        color="primary"
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="body1" sx={{ fontWeight: "600" }}>
                                            Modo compacto
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Reduz espaçamentos para mostrar mais conteúdo na tela
                                        </Typography>
                                    </Box>
                                }
                                sx={{ display: "flex", alignItems: "flex-start" }}
                            />
                        </Box>
                    </Paper>

                    {/* Notificações - Card melhorado */}
                    <Paper elevation={0} sx={{
                        p: 4,
                        mb: 4,
                        borderRadius: 3,
                        backgroundColor: darkMode ? 'grey.900' : 'white',
                        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                        boxShadow: darkMode
                            ? '0 8px 32px rgba(0,0,0,0.3)'
                            : '0 8px 32px rgba(0,0,0,0.05)'
                    }}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                            <Box sx={{
                                p: 1.5,
                                borderRadius: 2,
                                backgroundColor: darkMode ? 'rgba(255, 167, 38, 0.1)' : 'rgba(255, 167, 38, 0.1)',
                                mr: 2
                            }}>
                                <NotificationsIcon sx={{ color: "warning.main", fontSize: 28 }} />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: "700" }}>
                                Notificações
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 4 }} />

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Box sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                    border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
                                }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.notificacoesEmail}
                                                onChange={handleChange("notificacoesEmail")}
                                                color="warning"
                                            />
                                        }
                                        label={
                                            <Box>
                                                <Typography variant="body1" sx={{ fontWeight: "600" }}>
                                                    Notificações por e-mail
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Receba atualizações importantes por e-mail
                                                </Typography>
                                            </Box>
                                        }
                                        sx={{ display: "flex", alignItems: "flex-start" }}
                                    />
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Box sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                    border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
                                }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.notificacoesPush}
                                                onChange={handleChange("notificacoesPush")}
                                                color="warning"
                                            />
                                        }
                                        label={
                                            <Box>
                                                <Typography variant="body1" sx={{ fontWeight: "600" }}>
                                                    Notificações push
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Notificações em tempo real no navegador
                                                </Typography>
                                            </Box>
                                        }
                                        sx={{ display: "flex", alignItems: "flex-start" }}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Sistema - Card melhorado */}
                    <Paper elevation={0} sx={{
                        p: 4,
                        mb: 4,
                        borderRadius: 3,
                        backgroundColor: darkMode ? 'grey.900' : 'white',
                        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                        boxShadow: darkMode
                            ? '0 8px 32px rgba(0,0,0,0.3)'
                            : '0 8px 32px rgba(0,0,0,0.05)'
                    }}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                            <Box sx={{
                                p: 1.5,
                                borderRadius: 2,
                                backgroundColor: darkMode ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                                mr: 2
                            }}>
                                <SecurityIcon sx={{ color: "success.main", fontSize: 28 }} />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: "700" }}>
                                Sistema
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 4 }} />

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth sx={{ mb: 3 }}>
                                    <InputLabel>🌐 Idioma</InputLabel>
                                    <Select
                                        value={settings.idioma}
                                        label="Idioma"
                                        onChange={handleChange("idioma")}
                                        sx={{
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: darkMode ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)',
                                            }
                                        }}
                                    >
                                        <MenuItem value="pt-BR">
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: '#009c3b' }}>BR</Avatar>
                                                <Box>
                                                    <Typography variant="body1">Português (Brasil)</Typography>
                                                    <Typography variant="caption" color="text.secondary">Português</Typography>
                                                </Box>
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="en-US">
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: '#3c3b6e' }}>US</Avatar>
                                                <Box>
                                                    <Typography variant="body1">English (US)</Typography>
                                                    <Typography variant="caption" color="text.secondary">English</Typography>
                                                </Box>
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="es-ES">
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: '#c60b1e' }}>ES</Avatar>
                                                <Box>
                                                    <Typography variant="body1">Español</Typography>
                                                    <Typography variant="caption" color="text.secondary">Spanish</Typography>
                                                </Box>
                                            </Box>
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="📁 Limite de upload"
                                    value={settings.limiteUpload}
                                    onChange={handleChange("limiteUpload")}
                                    type="number"
                                    fullWidth
                                    sx={{ mb: 3 }}
                                    InputProps={{
                                        inputProps: { min: 1, max: 100 },
                                        startAdornment: <StorageIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                    }}
                                    helperText="Tamanho máximo para upload de arquivos em megabytes"
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Coluna lateral */}
                <Grid item xs={12} lg={4}>
                    {/* Informações do Sistema - Card melhorado */}
                    <Card elevation={0} sx={{
                        mb: 4,
                        borderRadius: 3,
                        backgroundColor: darkMode ? 'grey.900' : 'white',
                        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                        boxShadow: darkMode
                            ? '0 8px 32px rgba(0,0,0,0.3)'
                            : '0 8px 32px rgba(0,0,0,0.05)'
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                                <Box sx={{
                                    p: 1,
                                    borderRadius: 2,
                                    backgroundColor: darkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                                    mr: 2
                                }}>
                                    <InfoIcon sx={{ color: "primary.main", fontSize: 24 }} />
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: "700" }}>
                                    Informações do Sistema
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 3 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: "600" }}>
                                    TEMA ATUAL
                                </Typography>
                                <Chip
                                    icon={darkMode ? <DarkModeIcon /> : <LightModeIcon />}
                                    label={darkMode ? "Escuro" : "Claro"}
                                    color={darkMode ? "primary" : "default"}
                                    variant="filled"
                                    size="medium"
                                    sx={{
                                        mt: 1,
                                        fontWeight: "600",
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </Box>

                            <Box sx={{ mb: 3 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: "600" }}>
                                    STATUS DO SISTEMA
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                    <VerifiedUserIcon fontSize="small" color="success" />
                                    <Typography variant="body2">Tudo funcionando</Typography>
                                </Box>
                            </Box>

                            <Box sx={{ mb: 3 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: "600" }}>
                                    ÚLTIMA ATUALIZAÇÃO
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: "500" }}>
                                    Hoje às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: "600" }}>
                                    VERSÃO DA PLATAFORMA
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                    <Chip
                                        label="v2.1.0"
                                        size="small"
                                        color="primary"
                                        sx={{ fontWeight: "700" }}
                                    />
                                    <Typography variant="caption" color="success.main" sx={{ fontWeight: "600" }}>
                                        • Atualizado
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Uso de Armazenamento REAL - Card melhorado */}
                    <Card elevation={0} sx={{
                        mb: 4,
                        borderRadius: 3,
                        backgroundColor: darkMode ? 'grey.900' : 'white',
                        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                        boxShadow: darkMode
                            ? '0 8px 32px rgba(0,0,0,0.3)'
                            : '0 8px 32px rgba(0,0,0,0.05)'
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                                <Box sx={{
                                    p: 1,
                                    borderRadius: 2,
                                    backgroundColor: darkMode ? 'rgba(102, 187, 106, 0.1)' : 'rgba(102, 187, 106, 0.1)',
                                    mr: 2
                                }}>
                                    <BackupIcon sx={{ color: "success.main", fontSize: 24 }} />
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: "700" }}>
                                    Armazenamento Local
                                </Typography>
                            </Box>

                            {storageData.loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                    <CircularProgress size={30} />
                                </Box>
                            ) : (
                                <>
                                    {/* Configurações */}
                                    <Box sx={{ mb: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                            <Typography variant="body2" sx={{ fontWeight: "600" }}>
                                                Configurações
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: "600" }}>
                                                {formatMB(storageData.settingsSize)}
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(storageData.settingsSize / 10) * 100}
                                            sx={{
                                                height: 10,
                                                borderRadius: 5,
                                                backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                                '& .MuiLinearProgress-bar': {
                                                    backgroundColor: '#1976d2',
                                                    borderRadius: 5
                                                }
                                            }}
                                        />
                                    </Box>

                                    {/* Cache */}
                                    <Box sx={{ mb: 4 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                            <Typography variant="body2" sx={{ fontWeight: "600" }}>
                                                Cache
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: "600" }}>
                                                {formatMB(storageData.cacheSize)}
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(storageData.cacheSize / 50) * 100}
                                            sx={{
                                                height: 10,
                                                borderRadius: 5,
                                                backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                                '& .MuiLinearProgress-bar': {
                                                    backgroundColor: '#ff9800',
                                                    borderRadius: 5
                                                }
                                            }}
                                        />
                                    </Box>

                                    {/* Total e ação */}
                                    <Box sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                        mb: 3
                                    }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Total utilizado:
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: "600" }}>
                                                {formatMB(storageData.totalUsed)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Espaço disponível:
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: "600" }}>
                                                {formatMB(60 - storageData.totalUsed)}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        size="medium"
                                        onClick={handleClearCache}
                                        disabled={storageData.cacheSize === 0}
                                        sx={{
                                            borderRadius: 2,
                                            fontWeight: "600",
                                            py: 1.5,
                                            borderWidth: 2,
                                            '&:hover': {
                                                borderWidth: 2
                                            }
                                        }}
                                    >
                                        Limpar Cache
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Ações Rápidas - Card melhorado */}
                    <Card elevation={0} sx={{
                        borderRadius: 3,
                        backgroundColor: darkMode ? 'grey.900' : 'white',
                        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                        boxShadow: darkMode
                            ? '0 8px 32px rgba(0,0,0,0.3)'
                            : '0 8px 32px rgba(0,0,0,0.05)'
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                                <Box sx={{
                                    p: 1,
                                    borderRadius: 2,
                                    backgroundColor: darkMode ? 'rgba(171, 71, 188, 0.1)' : 'rgba(171, 71, 188, 0.1)',
                                    mr: 2
                                }}>
                                    <AutoAwesomeIcon sx={{ color: "secondary.main", fontSize: 24 }} />
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: "700" }}>
                                    Ações Rápidas
                                </Typography>
                            </Box>

                            <List dense>
                                <ListItemButton
                                    onClick={handleExportSettings}
                                    sx={{
                                        borderRadius: 2,
                                        mb: 2,
                                        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                                        '&:hover': {
                                            backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                            borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        <DownloadIcon fontSize="small" color="primary" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body2" sx={{ fontWeight: "600" }}>
                                                Exportar configurações
                                            </Typography>
                                        }
                                        secondary="Salve suas configurações em um arquivo"
                                    />
                                </ListItemButton>

                                <ListItemButton
                                    onClick={() => router.push('/logs')}
                                    sx={{
                                        borderRadius: 2,
                                        mb: 2,
                                        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                                        '&:hover': {
                                            backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                            borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        <CloudUploadIcon fontSize="small" color="info" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body2" sx={{ fontWeight: "600" }}>
                                                Ver logs do sistema
                                            </Typography>
                                        }
                                        secondary="Última atualização: hoje"
                                    />
                                </ListItemButton>

                                <ListItemButton
                                    onClick={handleReset}
                                    sx={{
                                        borderRadius: 2,
                                        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                                        '&:hover': {
                                            backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                            borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        <RestartAltIcon fontSize="small" color="warning" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body2" sx={{ fontWeight: "600" }}>
                                                Restaurar padrões
                                            </Typography>
                                        }
                                        secondary="Voltar para configurações iniciais"
                                    />
                                </ListItemButton>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Botões de ação - Footer melhorado */}
            <Box sx={{
                mt: 6,
                p: 4,
                borderRadius: 3,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 3,
                backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                border: `2px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
            }}>
                <Button
                    variant="outlined"
                    onClick={handleBackToCondominios}
                    startIcon={<ArrowBackIcon />}
                    size="large"
                    sx={{
                        borderRadius: 2,
                        fontWeight: "600",
                        px: 4,
                        py: 1.5
                    }}
                >
                    Voltar para Condomínios
                </Button>

                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handleReset}
                        startIcon={<RestartAltIcon />}
                        size="large"
                        sx={{
                            borderRadius: 2,
                            fontWeight: "600",
                            px: 4,
                            py: 1.5
                        }}
                    >
                        Restaurar
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={saving}
                        size="large"
                        sx={{
                            borderRadius: 2,
                            fontWeight: "600",
                            px: 5,
                            py: 1.5,
                            background: darkMode
                                ? 'linear-gradient(45deg, #1976d2, #2196f3)'
                                : 'linear-gradient(45deg, #1976d2, #0d47a1)',
                            '&:hover': {
                                background: darkMode
                                    ? 'linear-gradient(45deg, #1565c0, #1976d2)'
                                    : 'linear-gradient(45deg, #1565c0, #0a3d91)'
                            }
                        }}
                    >
                        {saving ? "Salvando..." : "Salvar Configurações"}
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
                    sx={{
                        width: "100%",
                        borderRadius: 2,
                        fontWeight: "600"
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}