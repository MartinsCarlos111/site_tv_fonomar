import type { Metadata } from "next";
import "./globals.css";
import packageJson from "../../package.json";

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
      <body>
        {children}
        <span
          className="version-tag"
          style={{
            position: "fixed",
            bottom: 8,
            right: 8,
            fontSize: 11,
            color: "#888",
            fontFamily: "system-ui, sans-serif",
            userSelect: "none",
          }}
        >
          v{packageJson.version}
        </span>
      </body>
    </html>
  );
}
