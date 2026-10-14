import "./globals.css";
import type { Metadata, Viewport } from "next";

// viewport-fit=cover: las barras fijas inferiores usan env(safe-area-inset-bottom) para no quedar
// debajo de la barra de inicio del iPhone
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fafaf9",
};

export const metadata: Metadata = {
  title: "ZAP Blinds Solutions — Portal de facturación",
  description: "Cotizaciones y facturas para ZAP Blinds Solutions",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
