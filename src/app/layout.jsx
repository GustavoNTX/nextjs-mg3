// src/app/layout.jsx
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import "../styles/swagger-ui.css";

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
        {children}
      </body>
    </html>
  );
}
