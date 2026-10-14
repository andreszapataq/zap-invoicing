import { Ref, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { calcTotals, fmtDocDate, fmtUSD, lineAmount, PAYMENT_TERMS, SC_TAX_RATE, SheetData } from "@/lib/types";
import { COMPANY, docTitle, INVOICE_TEXT, QUOTE_TEXT } from "@/lib/documentText";
import { formatPhone } from "@/lib/phone";
import { ZapLogo } from "@/components/ZapLogo";

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

export function useDocumentPrint(doc: SheetData) {
  const ref = useRef<HTMLDivElement>(null);
  const print = useReactToPrint({
    contentRef: ref,
    documentTitle: `ZAP ${docTitle(doc)} ${doc.number} - ${doc.client}`,
    pageStyle: PRINT_PAGE_STYLE,
  });
  return { ref, print };
}

// En el celular los párrafos suben a 14px para leerse cómodos; en computador e impresión quedan en 12px
const body = "text-sm sm:text-xs print:text-xs";

export function DocumentSheet({ doc, ref }: { doc: SheetData; ref?: Ref<HTMLDivElement> }) {
  const isInvoice = doc.type === "invoice";
  const title = docTitle(doc);
  const totals = calcTotals(doc.items, doc.type, doc.discount);
  // Facturas anteriores a los términos de pago se tratan como "Due on receipt"
  const terms = PAYMENT_TERMS[doc.payment_terms ?? "due_on_receipt"];

  const meta: [string, string][] = isInvoice
    ? [
        ["Invoice #", String(doc.number)],
        ["Invoice Date", fmtDocDate(doc.created_at)],
        ["Due Date", fmtDocDate(doc.created_at, terms.days)],
        ["Terms", terms.doc],
      ]
    : [
        ["Quote #", String(doc.number)],
        ["Date", fmtDocDate(doc.created_at)],
      ];

  return (
    <div
      ref={ref}
      lang="en"
      className="bg-white border border-stone-200 rounded-xl p-5 sm:p-10 text-stone-900 print:border-0 print:rounded-none print:p-0"
    >
      {/* Celular: logo y título arriba, datos debajo. Computador e impresión: dos columnas */}
      <div className="sm:flex print:flex justify-between items-start mb-6 sm:mb-8 print:mb-5">
        <div>
          <div className="flex justify-between items-start">
            <ZapLogo size={72} />
            <div className="sm:hidden print:hidden text-xl font-medium uppercase tracking-wide">{title}</div>
          </div>
          <div className="text-xs text-stone-500 mt-3">
            {COMPANY.address} · {COMPANY.city}
          </div>
          <div className="text-xs text-stone-500">
            {COMPANY.phone} · {COMPANY.email}
          </div>
          <div className="text-xs text-stone-500">{COMPANY.website}</div>
        </div>
        <div className="mt-4 sm:mt-0 print:mt-0 sm:text-right print:text-right">
          <div className="hidden sm:block print:block text-2xl font-medium uppercase tracking-wide">{title}</div>
          <table className="text-xs sm:mt-2 print:mt-2 sm:ml-auto print:ml-auto">
            <tbody>
              {meta.map(([k, v]) => (
                <tr key={k}>
                  <td className="text-stone-500 pr-3 py-0.5 sm:text-right print:text-right whitespace-nowrap">{k}</td>
                  <td
                    className={`py-0.5 sm:text-right print:text-right whitespace-nowrap ${
                      k === "Due Date" ? "text-zap-red font-medium" : ""
                    }`}
                  >
                    {v}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 sm:gap-6 print:gap-6 pb-4 mb-5 print:pb-3 print:mb-4 border-b border-stone-200">
        <div>
          <div className="text-xs text-stone-500 mb-1 uppercase tracking-wide">
            {isInvoice ? "Bill To" : "Prepared For"}
          </div>
          <div className="text-sm">{doc.client}</div>
          {doc.address && <div className="text-xs text-stone-500">{doc.address}</div>}
          {doc.city && <div className="text-xs text-stone-500">{doc.city}</div>}
          {doc.phone && <div className="text-xs text-stone-500">{formatPhone(doc.phone)}</div>}
        </div>
        {doc.project && (
          <div>
            <div className="text-xs text-stone-500 mb-1 uppercase tracking-wide">Project</div>
            <div className="text-sm">{doc.project}</div>
          </div>
        )}
      </div>

      {!isInvoice && (
        <div className={`${body} text-stone-700 leading-relaxed mb-5 print:mb-3 space-y-2 print:space-y-1`}>
          <p>{QUOTE_TEXT.greeting(doc.client)}</p>
          <p>{QUOTE_TEXT.intro}</p>
        </div>
      )}

      {/* Computador e impresión: tabla con las columnas de Ruben */}
      <table className="hidden sm:table print:table w-full text-xs border-collapse mb-6 print:mb-3">
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
          {doc.items.map((it, i) => {
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

      {/* Celular: cada línea como fila de dos niveles, sin columnas apretadas */}
      <ul className="sm:hidden print:hidden border-t border-stone-300 mb-5">
        {doc.items.map((it, i) => {
          const amount = lineAmount(it);
          const unit = Number(it.unit);
          const detail =
            `Qty ${it.qty}` +
            (it.ft2 ? ` · ${it.ft2} sq ft × ${fmtUSD(unit)}` : unit ? ` × ${fmtUSD(unit)}` : "");
          return (
            <li key={i} className="flex justify-between gap-3 py-3 border-b border-stone-100">
              <div className="min-w-0">
                <div className="text-sm">{it.desc || "—"}</div>
                <div className="text-xs text-stone-500 mt-0.5">{detail}</div>
              </div>
              <div className="text-sm font-medium whitespace-nowrap">{amount ? fmtUSD(amount) : "No charge"}</div>
            </li>
          );
        })}
      </ul>

      <div className="flex justify-end">
        <div className="w-full sm:w-72 print:w-72 text-sm sm:text-xs print:text-xs">
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
          <div className="flex justify-between items-baseline pt-3 mt-2 print:pt-2 print:mt-1 border-t border-stone-300">
            <span className="text-sm font-medium">{isInvoice ? "Amount Due (USD)" : "Total"}</span>
            <span className="text-lg sm:text-base print:text-base font-medium text-zap-red">{fmtUSD(totals.total)}</span>
          </div>
          {!isInvoice && <div className="text-xs text-stone-500 text-right mt-1">{QUOTE_TEXT.taxNote}</div>}
        </div>
      </div>

      {(doc.notes || !isInvoice) && (
        <div className={`${body} mt-6 pt-4 print:mt-4 print:pt-3 border-t border-stone-200 text-stone-600 leading-relaxed`}>
          <div className="text-xs font-medium text-stone-900 mb-1 uppercase tracking-wide">
            {isInvoice ? "Notes" : "Terms & Conditions"}
          </div>
          {doc.notes && <div className="whitespace-pre-line">{doc.notes}</div>}
          {!isInvoice && <div>{QUOTE_TEXT.validity}</div>}
        </div>
      )}

      {isInvoice && (
        <div className={`${body} mt-6 pt-4 print:mt-4 print:pt-3 border-t border-stone-200 text-stone-600 leading-relaxed`}>
          <div className="text-xs font-medium text-stone-900 mb-1 uppercase tracking-wide">Payment Methods</div>
          <ul>
            {INVOICE_TEXT.paymentMethods.map((m) => (
              <li key={m}>• {m}</li>
            ))}
          </ul>
          <div className="mt-1">{INVOICE_TEXT.paymentReference}</div>
        </div>
      )}

      {isInvoice ? (
        <div className={`${body} mt-6 text-stone-600 leading-relaxed`}>
          <div className="text-sm font-medium text-stone-900">{INVOICE_TEXT.thanks}</div>
          <div className="mt-1">{INVOICE_TEXT.contact}</div>
        </div>
      ) : (
        <>
          <p className={`${body} mt-5 print:mt-3 text-stone-700 leading-relaxed`}>{QUOTE_TEXT.closing}</p>

          {/* Firma de Ruben y aceptación del cliente lado a lado, para que la cotización quepa en una hoja */}
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-8 sm:gap-10 print:gap-10 mt-5 print:mt-4 text-xs break-inside-avoid">
            <div className="text-stone-700">
              <p>Sincerely,</p>
              <p className="mt-8 print:mt-6 text-sm font-semibold text-stone-900">{COMPANY.signer}</p>
              <p>{COMPANY.signerTitle}</p>
              <p>{COMPANY.name}</p>
            </div>
            <div className="text-stone-600">
              <div className="font-medium text-stone-900 uppercase tracking-wide">{QUOTE_TEXT.acceptanceTitle}</div>
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
  );
}
