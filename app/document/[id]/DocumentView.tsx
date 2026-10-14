"use client";

import { useRef } from "react";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";
import {
  DocumentRecord,
  calcTotals,
  fmtDocDate,
  fmtUSD,
  lineAmount,
  PAYMENT_TERMS,
  SC_TAX_RATE,
} from "@/lib/types";
import { COMPANY, INVOICE_TEXT, QUOTE_TEXT } from "@/lib/documentText";
import { ZapLogo } from "@/components/ZapLogo";
import { DeleteDocumentButton } from "@/components/DeleteDocumentButton";

// Hoja carta con márgenes reales (react-to-print por defecto deja margin: 0). En el margen inferior van
// el contacto y el contador de páginas, así no le quitan espacio al contenido y se repiten en cada hoja.
// Los dibuja el navegador: Chrome/Edge sí, Safari no (ahí el contacto igual aparece en el encabezado).
const marginText = { font: "9px Inter, system-ui, sans-serif", color: "#78716c" };
export const PRINT_PAGE_STYLE = `
  @page {
    size: letter;
    margin: 0.45in 0.55in 0.5in;
    @bottom-left {
      content: "PHONE: ${COMPANY.phone}  ·  E-mail: ${COMPANY.email}  ·  ${COMPANY.website}";
      font: ${marginText.font};
      color: ${marginText.color};
    }
    @bottom-right {
      content: "Page " counter(page) " of " counter(pages);
      font: ${marginText.font};
      color: ${marginText.color};
    }
  }
  html, body { background: white; }
`;

export function DocumentView({ record }: { record: DocumentRecord }) {
  const printRef = useRef<HTMLDivElement>(null);
  const isInvoice = record.type === "invoice";
  const docTitle = isInvoice ? "Invoice" : "Quote";
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `ZAP ${docTitle} ${record.number} - ${record.client}`,
    pageStyle: PRINT_PAGE_STYLE,
  });
  const totals = calcTotals(record.items, record.type, record.discount);
  // Facturas anteriores a los términos de pago se tratan como "Due on receipt"
  const terms = PAYMENT_TERMS[record.payment_terms ?? "due_on_receipt"];

  const meta: [string, string][] = isInvoice
    ? [
        ["Invoice #", String(record.number)],
        ["Invoice Date", fmtDocDate(record.created_at)],
        ["Due Date", fmtDocDate(record.created_at, terms.days)],
        ["Terms", terms.doc],
      ]
    : [
        ["Quote #", String(record.number)],
        ["Date", fmtDocDate(record.created_at)],
      ];

  // El mensaje va al cliente, por eso en inglés como el documento
  function shareWhatsApp() {
    const text = encodeURIComponent(
      `Hello ${record.client}, please find attached ${
        isInvoice ? "invoice" : "quote"
      } #${record.number} from ZAP Blinds Solutions for ${fmtUSD(Number(record.total))}. ` +
        `Please let me know if you have any questions. — Ruben Zapata`
    );
    const phone = (record.phone || "").replace(/\D/g, "");
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  }

  return (
    <div className="max-w-3xl mx-auto p-6 print:p-0 print:max-w-none">
      <div className="flex justify-between items-center mb-5 no-print">
        <Link
          href="/dashboard"
          className="text-xs px-3 py-1.5 border border-stone-200 rounded-md hover:bg-stone-50"
        >
          ← Volver
        </Link>
        <div className="flex gap-2">
          <DeleteDocumentButton
            id={record.id}
            type={record.type}
            number={record.number}
            className="text-xs px-3 py-2 border border-stone-200 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-50"
          />
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
        lang="en"
        className="bg-white border border-stone-200 rounded-xl p-10 text-stone-900 print:border-0 print:rounded-none print:p-0"
      >
        <div className="flex justify-between items-start mb-8 print:mb-5">
          <div>
            <ZapLogo size={72} />
            <div className="text-xs text-stone-500 mt-3">
              {COMPANY.address} · {COMPANY.city}
            </div>
            <div className="text-xs text-stone-500">
              {COMPANY.phone} · {COMPANY.email}
            </div>
            <div className="text-xs text-stone-500">{COMPANY.website}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-medium uppercase tracking-wide">{docTitle}</div>
            <table className="text-xs mt-2 ml-auto">
              <tbody>
                {meta.map(([k, v]) => (
                  <tr key={k}>
                    <td className="text-stone-500 pr-3 py-0.5 text-right">{k}</td>
                    <td className={`py-0.5 text-right ${k === "Due Date" ? "text-zap-red font-medium" : ""}`}>
                      {v}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 pb-4 mb-5 print:pb-3 print:mb-4 border-b border-stone-200">
          <div>
            <div className="text-xs text-stone-500 mb-1 uppercase tracking-wide">
              {isInvoice ? "Bill To" : "Prepared For"}
            </div>
            <div className="text-sm">{record.client}</div>
            {record.address && <div className="text-xs text-stone-500">{record.address}</div>}
            {record.city && <div className="text-xs text-stone-500">{record.city}</div>}
            <div className="text-xs text-stone-500">{record.phone}</div>
          </div>
          {record.project && (
            <div>
              <div className="text-xs text-stone-500 mb-1 uppercase tracking-wide">Project</div>
              <div className="text-sm">{record.project}</div>
            </div>
          )}
        </div>

        {!isInvoice && (
          <div className="text-xs text-stone-700 leading-relaxed mb-5 print:mb-3 space-y-2 print:space-y-1">
            <p>{QUOTE_TEXT.greeting(record.client)}</p>
            <p>{QUOTE_TEXT.intro}</p>
          </div>
        )}

        <table className="w-full text-xs border-collapse mb-6 print:mb-3">
          <thead>
            <tr className="border-b border-stone-300">
              <th className="text-center py-2 px-1 font-medium text-stone-500 w-12">Qty</th>
              <th className="text-left py-2 px-1 font-medium text-stone-500">Description</th>
              <th className="text-center py-2 px-1 font-medium text-stone-500">Sq. Ft.</th>
              <th className="text-right py-2 px-1 font-medium text-stone-500">Unit Price</th>
              <th className="text-right py-2 px-1 font-medium text-stone-500">Amount</th>
            </tr>
          </thead>
          <tbody>
            {record.items.map((it, i) => {
              const amount = lineAmount(it);
              return (
                <tr key={i} className="border-b border-stone-100">
                  <td className="text-center py-2.5 print:py-1.5 px-1">{it.qty}</td>
                  <td className="py-2.5 print:py-1.5 px-1">{it.desc || "—"}</td>
                  <td className="text-center py-2.5 print:py-1.5 px-1 text-stone-500">{it.ft2 || "—"}</td>
                  <td className="text-right py-2.5 print:py-1.5 px-1">
                    {Number(it.unit) ? fmtUSD(Number(it.unit)) : "—"}
                  </td>
                  <td className="text-right py-2.5 print:py-1.5 px-1 font-medium">
                    {amount ? fmtUSD(amount) : "No charge"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-72 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-stone-500">Subtotal</span>
              <span>{fmtUSD(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between py-1">
                <span className="text-stone-500">Discount</span>
                <span className="text-zap-red">−{fmtUSD(totals.discount)}</span>
              </div>
            )}
            {isInvoice && (
              <div className="flex justify-between py-1">
                <span className="text-stone-500">SC Sales Tax ({SC_TAX_RATE * 100}%)</span>
                <span>{fmtUSD(totals.tax)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 mt-2 print:pt-2 print:mt-1 border-t border-stone-300">
              <span className="text-sm font-medium">{isInvoice ? "Amount Due (USD)" : "Total"}</span>
              <span className="text-base font-medium text-zap-red">{fmtUSD(totals.total)}</span>
            </div>
            {!isInvoice && <div className="text-stone-500 text-right mt-1">{QUOTE_TEXT.taxNote}</div>}
          </div>
        </div>

        {(record.notes || !isInvoice) && (
          <div className="mt-6 pt-4 print:mt-4 print:pt-3 border-t border-stone-200 text-xs text-stone-600 leading-relaxed">
            <div className="text-xs font-medium text-stone-900 mb-1 uppercase tracking-wide">
              {isInvoice ? "Notes" : "Terms & Conditions"}
            </div>
            {record.notes && <div className="whitespace-pre-line">{record.notes}</div>}
            {!isInvoice && (
              <div>{QUOTE_TEXT.validity}</div>
            )}
          </div>
        )}

        {isInvoice && (
          <div className="mt-6 pt-4 print:mt-4 print:pt-3 border-t border-stone-200 text-xs text-stone-600 leading-relaxed">
            <div className="text-xs font-medium text-stone-900 mb-1 uppercase tracking-wide">
              Payment Methods
            </div>
            <ul>
              {INVOICE_TEXT.paymentMethods.map((m) => (
                <li key={m}>• {m}</li>
              ))}
            </ul>
            <div className="mt-1">{INVOICE_TEXT.paymentReference}</div>
          </div>
        )}

        {isInvoice ? (
          <div className="mt-6 text-xs text-stone-600 leading-relaxed">
            <div className="text-sm font-medium text-stone-900">{INVOICE_TEXT.thanks}</div>
            <div className="mt-1">{INVOICE_TEXT.contact}</div>
          </div>
        ) : (
          <>
            <p className="mt-5 print:mt-3 text-xs text-stone-700 leading-relaxed">{QUOTE_TEXT.closing}</p>

            {/* Firma de Ruben y aceptación del cliente lado a lado, para que la cotización quepa en una hoja */}
            <div className="grid grid-cols-2 gap-10 mt-5 print:mt-4 text-xs break-inside-avoid">
              <div className="text-stone-700">
                <p>Sincerely,</p>
                <p className="mt-8 print:mt-6 text-sm font-semibold text-stone-900">{COMPANY.signer}</p>
                <p>{COMPANY.signerTitle}</p>
                <p>{COMPANY.name}</p>
              </div>
              <div className="text-stone-600">
                <div className="font-medium text-stone-900 uppercase tracking-wide">
                  {QUOTE_TEXT.acceptanceTitle}
                </div>
                <p className="mt-1 text-[11px] leading-snug">{QUOTE_TEXT.acceptance}</p>
                <div className="grid grid-cols-[2fr_1fr] gap-4 mt-8 print:mt-6">
                  <div className="border-t border-stone-400 pt-1">Signature</div>
                  <div className="border-t border-stone-400 pt-1">Date</div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="mt-8 pt-3 border-t border-stone-200 text-center text-[11px] text-stone-500 print:hidden">
          PHONE: <strong className="text-stone-700">{COMPANY.phone}</strong> · E-mail: {COMPANY.email} ·{" "}
          {COMPANY.website}
        </div>
      </div>
    </div>
  );
}
