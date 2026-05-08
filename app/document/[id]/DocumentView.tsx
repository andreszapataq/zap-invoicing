"use client";

import { useRef } from "react";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";
import { DocumentRecord, fmt, calcTotals } from "@/lib/types";
import { ZapLogo } from "@/components/ZapLogo";

export function DocumentView({ record }: { record: DocumentRecord }) {
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });
  const totals = calcTotals(record.items, record.type, record.discount);
  const isInvoice = record.type === "invoice";

  function shareWhatsApp() {
    const text = encodeURIComponent(
      `Hola ${record.client}, te comparto la ${
        isInvoice ? "factura" : "cotización"
      } #${record.number} de ZAP Blinds Solutions por ${fmt(Number(record.total))}. ` +
        `Cualquier inquietud quedo atento. — Ruben Zapata`
    );
    const phone = (record.phone || "").replace(/\D/g, "");
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-5 no-print">
        <Link
          href="/dashboard"
          className="text-xs px-3 py-1.5 border border-stone-200 rounded-md hover:bg-stone-50"
        >
          ← Volver
        </Link>
        <div className="flex gap-2">
          <button
            onClick={shareWhatsApp}
            className="text-xs px-3 py-2 border border-stone-200 rounded-md hover:bg-stone-50"
          >
            Compartir por WhatsApp
          </button>
          <button
            onClick={handlePrint}
            className="text-xs px-3 py-2 bg-zap-red hover:bg-zap-redDark text-white rounded-md font-medium"
          >
            Descargar PDF
          </button>
        </div>
      </div>

      <div
        ref={printRef}
        className="bg-white border border-stone-200 rounded-xl p-10 text-stone-900"
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <ZapLogo size={72} />
            <div className="text-xs text-stone-500 mt-3">114 Yukon Dr · Greenville, SC 29605</div>
            <div className="text-xs text-stone-500">954-470-4851 · info@zapblindsusa.com</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-medium">{isInvoice ? "Factura" : "Cotización"}</div>
            <div className="text-xs text-zap-red font-medium mt-0.5">
              {new Date(record.created_at).toLocaleDateString("es-CO")}
            </div>
            <div className="text-xs text-stone-500 mt-0.5">#{record.number}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 pb-4 mb-5 border-b border-stone-200">
          <div>
            <div className="text-xs text-stone-500 mb-1">{isInvoice ? "Facturar a" : "Cotizado para"}</div>
            <div className="text-sm">{record.client}</div>
            <div className="text-xs text-stone-500">{record.phone}</div>
          </div>
          <div>
            <div className="text-xs text-stone-500 mb-1">Proyecto</div>
            <div className="text-sm">{record.project}</div>
          </div>
        </div>

        <table className="w-full text-xs border-collapse mb-6">
          <thead>
            <tr className="border-b border-stone-300">
              <th className="text-left py-2 px-1 font-medium text-stone-500">Descripción</th>
              <th className="text-center py-2 px-1 font-medium text-stone-500">Cant.</th>
              <th className="text-center py-2 px-1 font-medium text-stone-500">Ft²</th>
              <th className="text-right py-2 px-1 font-medium text-stone-500">V. Unit</th>
              <th className="text-right py-2 px-1 font-medium text-stone-500">Total</th>
            </tr>
          </thead>
          <tbody>
            {record.items.map((it, i) => (
              <tr key={i} className="border-b border-stone-100">
                <td className="py-2.5 px-1">{it.desc || "—"}</td>
                <td className="text-center py-2.5 px-1">{it.qty}</td>
                <td className="text-center py-2.5 px-1 text-stone-500">{it.ft2 || "—"}</td>
                <td className="text-right py-2.5 px-1">{fmt(Number(it.unit) || 0)}</td>
                <td className="text-right py-2.5 px-1 font-medium">
                  {fmt((Number(it.qty) || 0) * (Number(it.unit) || 0))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-72 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-stone-500">Subtotal</span>
              <span>{fmt(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between py-1">
                <span className="text-stone-500">Descuento</span>
                <span className="text-zap-red">−{fmt(totals.discount)}</span>
              </div>
            )}
            {isInvoice && (
              <div className="flex justify-between py-1">
                <span className="text-stone-500">Impuesto (SC · 6%)</span>
                <span>{fmt(totals.tax)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 mt-2 border-t border-stone-300">
              <span className="text-sm font-medium">Total</span>
              <span className="text-base font-medium text-zap-red">{fmt(totals.total)}</span>
            </div>
          </div>
        </div>

        {record.notes && (
          <div className="mt-6 pt-4 border-t border-stone-200 text-xs text-stone-600 leading-relaxed">
            <div className="text-xs font-medium text-stone-900 mb-1">Notas</div>
            {record.notes}
          </div>
        )}

        <div className="mt-6 text-xs text-stone-500">
          Atentamente, <strong className="text-stone-900">Ruben Zapata</strong> — Coordinador de Proyectos
        </div>
      </div>
    </div>
  );
}
