import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import "../styles/swagger-ui.css";
import { AuthProvider } from "@/contexts/AuthContext";
import ThemeRegistry from "@/components/ThemeRegistry"; // novo wrapper

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "GMP + | Plataforma de Gestão de Manutenção",
  description: "Sistema de gestão de condomínios e manutenção predial.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeRegistry>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
