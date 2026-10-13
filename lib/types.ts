export const SC_TAX_RATE = 0.06;
export const DEMO_LIMIT = 2;

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

export function nextDocNumber(type: DocType, lastNumber: number | null) {
  return lastNumber === null ? (type === "invoice" ? 1054 : 2001) : lastNumber + 1;
}
