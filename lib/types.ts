export const SC_TAX_RATE = 0.06;
// Zona horaria del negocio (Greenville, SC); el servidor de Vercel corre en UTC
export const BUSINESS_TZ = "America/New_York";

export type DocType = "quote" | "invoice";

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
  status: string;
  created_at: string;
};

export function calcTotals(items: LineItem[], type: DocType, discount = 0) {
  const subtotal = items.reduce(
    (s, i) => s + (Number(i.qty) || 0) * (Number(i.unit) || 0),
    0
  );
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
