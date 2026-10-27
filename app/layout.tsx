import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";
import Header from "../components/layout/header";
import Footer from "../components/layout/footer";

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

export const metadata: Metadata = {
  title: "Unisalamanca Marketplace | Conectando empresas, estudiantes y emprendedores",
  description: "Marketplace del Consultorio Empresarial Winner - Universidad de Salamanca Colombia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${lato.className} flex min-h-screen flex-col antialiased`}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
