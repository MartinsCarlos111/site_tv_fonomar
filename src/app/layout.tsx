import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Formulário de Anúncio",
  description: "Simulação de planos de anúncio TV Fonomar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
