import "./globals.css";
import type { Metadata } from "next";

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
