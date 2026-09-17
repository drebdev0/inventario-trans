import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InventarioTRANS - Gestión de Inventario y Préstamos",
  description: "Sistema de gestión de inventario, activos en bodega y control de préstamos a oficinas remotas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen bg-background">
        {children}
      </body>
    </html>
  );
}
