export const SC_TAX_RATE = 0.06;
// Zona horaria del negocio (Greenville, SC); el servidor de Vercel corre en UTC
export const BUSINESS_TZ = "America/New_York";

export type DocType = "quote" | "invoice";

export type PaymentTerms = "due_on_receipt" | "net_15" | "net_30";

// label: interfaz (español) · doc: texto impreso en la factura (inglés)
export const PAYMENT_TERMS: Record<PaymentTerms, { label: string; doc: string; days: number }> = {
  due_on_receipt: { label: "Pago al recibir", doc: "Due on receipt", days: 0 },
  net_15: { label: "Neto 15 días", doc: "Net 15", days: 15 },
  net_30: { label: "Neto 30 días", doc: "Net 30", days: 30 },
};

export type LineItem = {
  desc: string;
  qty: number;
  unit: number;
  ft2?: string;
};

export type DocumentRecord = {
  id: string;
  user_id: string;
  type: DocType;
  number: number;
  client: string;
  phone?: string;
  address?: string;
  city?: string;
  project?: string;
  items: LineItem[];
  discount: number;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  payment_terms?: PaymentTerms | null;
  status: string;
  created_at: string;
};

// Como en las cotizaciones de Ruben: si la línea tiene ft², el precio es por ft²; si no, por unidad
export function lineAmount(it: LineItem) {
  const ft2 = Number(it.ft2);
  const base = it.ft2 && ft2 > 0 ? ft2 : Number(it.qty) || 0;
  return base * (Number(it.unit) || 0);
}

// Lee lo que se escribe en los campos de texto: "24", "24.50", "24,50", "1,200", "$1,200.50"
export function parseNum(v: string) {
  let s = v.replace(/[^\d.,]/g, "");
  if (s.includes(".") && s.includes(",")) {
    // Con ambos separadores, el último es el decimal
    s = s.lastIndexOf(",") > s.lastIndexOf(".")
      ? s.replace(/\./g, "").replace(",", ".")
      : s.replace(/,/g, "");
  } else if (/,\d{1,2}$/.test(s)) {
    s = s.replace(",", "."); // coma decimal: "24,50"
  } else {
    s = s.replace(/,/g, ""); // coma de miles: "1,200"
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function calcTotals(items: LineItem[], type: DocType, discount = 0) {
  const subtotal = items.reduce((s, i) => s + lineAmount(i), 0);
  const desc = Number(discount) || 0;
  const subAfter = subtotal - desc;
  const tax = type === "invoice" ? subAfter * SC_TAX_RATE : 0;
  return {
    subtotal,
    discount: desc,
    subtotalAfter: subAfter,
    tax,
    total: subAfter + tax,
  };
}

export function fmt(n: number) {
  return (
    "$" +
    Number(n).toLocaleString("es-CO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString("es-CO", { timeZone: BUSINESS_TZ });
}

// Formatos para los documentos impresos (en inglés, convención de EE. UU.): $1,920.00
export function fmtUSD(n: number) {
  return Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// Fecha del documento + N días calendario en la zona del negocio → "October 13, 2026"
export function fmtDocDate(d: string | Date, addDays = 0) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date(d));
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const date = new Date(Date.UTC(get("year"), get("month") - 1, get("day") + addDays, 12));
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Mes como entero (año * 12 + mes) en la zona horaria del negocio, para comparar meses fácilmente
export function monthIndex(d: string | Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TZ,
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date(d));
  const year = Number(parts.find((p) => p.type === "year")!.value);
  const month = Number(parts.find((p) => p.type === "month")!.value);
  return year * 12 + (month - 1);
}

export function monthName(index: number) {
  return new Date(Date.UTC(Math.floor(index / 12), index % 12, 15)).toLocaleDateString("es-CO", {
    month: "long",
    timeZone: "UTC",
  });
}

export function nextDocNumber(type: DocType, lastNumber: number | null) {
  return lastNumber === null ? (type === "invoice" ? 1054 : 2001) : lastNumber + 1;
}
