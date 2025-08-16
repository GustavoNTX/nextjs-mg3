// src/config/menuItems.js
import {
  Description as DescriptionIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Tune as TuneIcon,
  School as SchoolIcon,
  SwapHoriz as SwapHorizIcon,
  CloudUpload as CloudUploadIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";

export const menuItems = [
  {
    text: "Lista de Ativos",
    icon: <DescriptionIcon />,
    path: "/lista-de-ativos", // Adicione os caminhos para navegação
  },
  {
    text: "Relatórios",
    icon: <BarChartIcon />,
    path: "/relatorios",
  },
  {
    text: "Configurações",
    icon: <SettingsIcon />,
    // Submenu para configurações
    children: [
      {
        text: "Minhas Informações",
        icon: <PersonIcon />,
        path: "/config/minhas-informacoes",
      },
      {
        text: "Configurações Gerais",
        icon: <TuneIcon />,
        path: "/config/gerais",
      },
      {
        text: "Tutoriais da Plataforma",
        icon: <SchoolIcon />,
        path: "/config/tutoriais",
      },
      {
        text: "Migrar de plano",
        icon: <SwapHorizIcon />,
        path: "/config/plano",
      },
      {
        text: "Upload de Logo",
        icon: <CloudUploadIcon />,
        path: "/config/logo",
      },
      {
        text: "Saldo Cashback",
        icon: <AccountBalanceWalletIcon />,
        path: "/config/cashback",
      },
    ],
  },
  { text: "Sair", icon: <LogoutIcon />, action: "logout" },
];
