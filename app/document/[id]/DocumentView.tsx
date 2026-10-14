"use client";

import Link from "next/link";
import { DocumentRecord, fmtUSD } from "@/lib/types";
import { whatsappNumber } from "@/lib/phone";
import { DocumentSheet, useDocumentPrint } from "@/components/DocumentSheet";
import { DeleteDocumentButton } from "@/components/DeleteDocumentButton";

export function DocumentView({ record }: { record: DocumentRecord }) {
  const { ref, print } = useDocumentPrint(record);
  const isInvoice = record.type === "invoice";

  // wa.me solo admite texto (no archivos), así que se envía el enlace a la página pública del documento.
  // El mensaje va al cliente, por eso en inglés como el documento.
  function shareWhatsApp() {
    // En producción el enlace usa siempre el dominio oficial (NEXT_PUBLIC_SITE_URL), aunque Ruben haya
    // entrado por otra URL (p. ej. una de preview, que pide login de Vercel). Sin la variable, la URL actual.
    const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || window.location.origin;
    const link = `${base}/d/${record.share_id}`;
    const text = encodeURIComponent(
      `Hello ${record.client}, here is your ${isInvoice ? "invoice" : "quote"} #${record.number} ` +
        `from ZAP Blinds Solutions for ${fmtUSD(Number(record.total))}:\n${link}\n\n` +
        `Please let me know if you have any questions. — Ruben Zapata`
    );
    const phone = whatsappNumber(record.phone || "");
    window.open(phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`, "_blank");
  }

  const actions = (
    <>
      <button
        onClick={shareWhatsApp}
        className="px-3 py-2.5 sm:py-2 text-sm sm:text-xs bg-zap-red hover:bg-zap-redDark text-white rounded-md font-medium"
      >
        Enviar por WhatsApp
      </button>
      <button
        onClick={print}
        className="px-3 py-2.5 sm:py-2 text-sm sm:text-xs bg-white border border-stone-200 rounded-md hover:bg-stone-50 font-medium"
      >
        Descargar PDF
      </button>
    </>
  );

  return (
    <div className="max-w-3xl mx-auto px-3 pt-4 pb-28 sm:p-6 print:p-0 print:max-w-none">
      <div className="flex justify-between items-center gap-2 mb-4 sm:mb-5 no-print">
        <Link
          href="/dashboard"
          className="text-sm sm:text-xs px-3 py-2 sm:py-1.5 border border-stone-200 rounded-md hover:bg-stone-50"
        >
          ← Volver
        </Link>
        <div className="flex gap-2">
          <DeleteDocumentButton
            id={record.id}
            type={record.type}
            number={record.number}
            className="text-sm sm:text-xs px-3 py-2 border border-stone-200 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-50"
          />
          <div className="hidden sm:flex gap-2">{actions}</div>
        </div>
      </div>

      <DocumentSheet doc={record} ref={ref} />

      {/* Celular: acciones principales fijas abajo, al alcance del pulgar */}
      <div className="sm:hidden no-print fixed inset-x-0 bottom-0 z-10 grid grid-cols-2 gap-2 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur border-t border-stone-200">
        {actions}
      </div>
    </div>
  );
}
