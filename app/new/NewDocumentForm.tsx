"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { calcTotals, DocType, fmt, lineAmount, LineItem, PAYMENT_TERMS, PaymentTerms, parseNum } from "@/lib/types";
import { DEFAULT_NOTES } from "@/lib/documentText";
import { formatPhone } from "@/lib/phone";

type Props = { type: DocType; suggestedNumber: number };

// Los campos numéricos se editan como texto (más cómodo que type="number") y se convierten al calcular
type FormItem = { desc: string; qty: string; unit: string; ft2: string };

const emptyItem = (): FormItem => ({ desc: "", qty: "1", unit: "", ft2: "" });

function toLineItem(it: FormItem): LineItem {
  const ft2 = parseNum(it.ft2);
  return { desc: it.desc, qty: parseNum(it.qty), unit: parseNum(it.unit), ft2: ft2 > 0 ? String(ft2) : "" };
}

export function NewDocumentForm({ type, suggestedNumber }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [client, setClient] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [project, setProject] = useState("");
  const [items, setItems] = useState<FormItem[]>([emptyItem()]);
  const [discount, setDiscount] = useState("");
  const [notes, setNotes] = useState(DEFAULT_NOTES[type]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>("due_on_receipt");
  const [saving, setSaving] = useState(false);

  const lineItems = items.map(toLineItem);
  const totals = calcTotals(lineItems, type, parseNum(discount));
  const label = type === "invoice" ? "factura" : "cotización";

  function updateItem(i: number, field: keyof FormItem, value: string) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  // Ruben siempre incluye la instalación como línea aparte, sin costo
  function addFreeInstallation() {
    const units = items.filter((it) => it.desc).reduce((s, it) => s + parseNum(it.qty), 0);
    setItems((prev) => [...prev, { desc: "Free installation", qty: String(units || 1), unit: "0", ft2: "" }]);
  }

  function removeItem(i: number) {
    if (items.length > 1) setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const { data, error } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        type,
        number: suggestedNumber,
        client,
        phone: formatPhone(phone),
        address,
        city,
        project,
        items: lineItems,
        discount: totals.discount,
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        notes,
        payment_terms: type === "invoice" ? paymentTerms : null,
        status: "draft",
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      alert("Error al guardar: " + error.message);
      return;
    }
    router.push(`/document/${data.id}`);
  }

  return (
    <div className="max-w-3xl mx-auto px-3 pt-4 pb-6 sm:p-6">
      <div className="flex items-center gap-3 mb-4 sm:mb-5">
        <Link
          href="/dashboard"
          className="text-sm sm:text-xs px-3 py-2 sm:py-1.5 border border-stone-200 rounded-md hover:bg-stone-50"
        >
          ← Volver
        </Link>
        <div className="text-base font-medium">Nueva {label}</div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <Field label="Cliente">
            <input
              className="zap-input"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Mr. Jason Smith / JAMa LLC"
              autoComplete="off"
            />
          </Field>
          <Field label="Teléfono">
            <input
              className="zap-input"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => setPhone(formatPhone(phone))}
              placeholder="(864) 451-2146"
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <Field label="Dirección">
            <input
              className="zap-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="215 Main St"
            />
          </Field>
          <Field label="Ciudad">
            <input
              className="zap-input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Greenville, SC 29601"
            />
          </Field>
        </div>
        <Field label="Proyecto (en inglés)">
          <input
            className="zap-input"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            placeholder="Motorized roller shades — residence"
          />
        </Field>
        {type === "invoice" && (
          <div className="mt-3">
            <Field label="Términos de pago">
              <select
                className="zap-input"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)}
              >
                {(Object.keys(PAYMENT_TERMS) as PaymentTerms[]).map((k) => (
                  <option key={k} value={k}>
                    {PAYMENT_TERMS[k].label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}
        <p className="text-xs text-stone-400 mt-3">
          El documento se genera en inglés: escribe en inglés el proyecto, las descripciones y las notas.
        </p>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5">
        {/* Mismo orden que el documento impreso y las cotizaciones de Ruben: Cant. · Descripción · Ft² · V. Unit */}
        <div className="hidden sm:grid grid-cols-[60px_2fr_80px_80px_100px_30px] gap-2 text-xs text-stone-500 pb-2 border-b border-stone-100">
          <div>Cant.</div>
          <div>Descripción</div>
          <div>
            Ft² <span className="text-stone-400">(opc.)</span>
          </div>
          <div>V. Unit</div>
          <div className="text-right">Total</div>
          <div></div>
        </div>

        {/* Celular: cada línea es una tarjeta (descripción arriba, números debajo).
            Computador: una fila con las columnas del encabezado */}
        {items.map((it, i) => (
          <div
            key={i}
            className="grid grid-cols-3 sm:grid-cols-[60px_2fr_80px_80px_100px_30px] gap-2 items-end sm:items-center py-3 sm:py-2 border-b border-stone-100"
          >
            <div className="col-span-3 sm:col-span-1 sm:order-2">
              <MobileLabel>Descripción</MobileLabel>
              <input
                className="zap-input"
                value={it.desc}
                onChange={(e) => updateItem(i, "desc", e.target.value)}
                placeholder="Motorized Roller Shades with Metal Structure"
              />
            </div>
            <div className="sm:order-1">
              <MobileLabel>Cant.</MobileLabel>
              <input
                className="zap-input"
                inputMode="decimal"
                value={it.qty}
                onChange={(e) => updateItem(i, "qty", e.target.value)}
              />
            </div>
            <div className="sm:order-3">
              <MobileLabel>Ft² (opc.)</MobileLabel>
              <input
                className="zap-input"
                inputMode="decimal"
                value={it.ft2}
                onChange={(e) => updateItem(i, "ft2", e.target.value)}
                placeholder="399"
              />
            </div>
            <div className="sm:order-4">
              <MobileLabel>V. Unit</MobileLabel>
              <input
                className="zap-input"
                inputMode="decimal"
                value={it.unit}
                onChange={(e) => updateItem(i, "unit", e.target.value)}
                placeholder="24.00"
              />
            </div>
            <div className="col-span-2 sm:col-span-1 sm:order-5 text-sm font-medium sm:text-right">
              <span className="sm:hidden text-stone-500 font-normal">Total línea: </span>
              {fmt(lineAmount(lineItems[i]))}
            </div>
            <button
              onClick={() => removeItem(i)}
              disabled={items.length === 1}
              className="sm:order-6 justify-self-end text-sm sm:text-lg text-stone-400 hover:text-red-500 disabled:opacity-30 px-1"
              type="button"
              aria-label="Quitar línea"
            >
              <span className="sm:hidden">Quitar</span>
              <span className="hidden sm:inline">×</span>
            </button>
          </div>
        ))}

        <p className="text-xs text-stone-400 mt-2">
          Con Ft², el total de la línea es Ft² × V. Unit (precio por ft²). Sin Ft², es Cant. × V. Unit.
        </p>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-[1fr_auto] gap-2">
          <button
            onClick={addItem}
            type="button"
            className="border border-dashed border-stone-300 px-3 py-2.5 sm:py-2 rounded-md text-sm sm:text-xs hover:bg-stone-50"
          >
            + Agregar línea
          </button>
          <button
            onClick={addFreeInstallation}
            type="button"
            className="border border-dashed border-stone-300 px-3 py-2.5 sm:py-2 rounded-md text-sm sm:text-xs hover:bg-stone-50"
          >
            + Instalación gratuita
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-stone-200 text-sm">
          <Row label="Subtotal" value={fmt(totals.subtotal)} />
          <div className="flex justify-between items-center py-1 gap-3">
            <span className="text-stone-500">Descuento</span>
            <input
              className="zap-input max-w-[8rem] text-right"
              inputMode="decimal"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          {type === "invoice" && <Row label="Impuesto (SC · 6%)" value={fmt(totals.tax)} />}
          <div className="flex justify-between pt-2 mt-2 border-t border-stone-200 font-medium">
            <span className="text-base">Total</span>
            <span className="text-base text-zap-red">{fmt(totals.total)}</span>
          </div>
        </div>

        <div className="mt-4">
          <Field label={type === "invoice" ? "Notas (en inglés)" : "Entrega y forma de pago (en inglés)"}>
            <textarea
              className="zap-input min-h-[140px] sm:min-h-[96px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={type === "invoice" ? "70% deposit invoice per signed agreement." : undefined}
            />
          </Field>
          {notes !== DEFAULT_NOTES[type] && (
            <button
              type="button"
              onClick={() => setNotes(DEFAULT_NOTES[type])}
              className="text-xs text-stone-500 hover:text-zap-red mt-1 py-1"
            >
              Restaurar texto predeterminado
            </button>
          )}
        </div>
      </div>

      {/* Celular: botones fijos abajo con el total a la vista */}
      <div className="sticky bottom-0 z-10 -mx-3 sm:mx-0 mt-4 px-3 sm:px-0 pt-3 sm:pt-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-0 bg-stone-50/95 sm:bg-transparent backdrop-blur sm:backdrop-blur-none border-t border-stone-200 sm:border-0 sm:static">
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving || !client}
            className="flex-1 sm:flex-none bg-zap-red hover:bg-zap-redDark disabled:opacity-50 text-white px-5 py-3 sm:py-2.5 rounded-md text-sm font-medium"
          >
            {saving ? "Guardando..." : `Generar ${label} · ${fmt(totals.total)}`}
          </button>
          <Link
            href="/dashboard"
            className="px-5 py-3 sm:py-2.5 border border-stone-200 bg-white rounded-md text-sm hover:bg-stone-50"
          >
            Cancelar
          </Link>
        </div>
      </div>

      <style jsx>{`
        .zap-input {
          width: 100%;
          padding: 8px 10px;
          /* 16px en el celular: con menos, Safari de iOS hace zoom al tocar el campo */
          font-size: 16px;
          border: 1px solid #e7e5e4;
          border-radius: 6px;
          background: white;
        }
        @media (min-width: 640px) {
          .zap-input {
            padding: 6px 10px;
            font-size: 13px;
          }
        }
        .zap-input:focus {
          outline: none;
          border-color: #E8211C;
          box-shadow: 0 0 0 2px rgba(232, 33, 28, 0.1);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-stone-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function MobileLabel({ children }: { children: React.ReactNode }) {
  return <div className="sm:hidden text-xs text-stone-500 mb-1">{children}</div>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-stone-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}
