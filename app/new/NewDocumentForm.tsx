"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { calcTotals, DocType, fmt, LineItem } from "@/lib/types";

type Props = { type: DocType; suggestedNumber: number };

export function NewDocumentForm({ type, suggestedNumber }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [client, setClient] = useState("");
  const [phone, setPhone] = useState("");
  const [project, setProject] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ desc: "", qty: 1, unit: 0, ft2: "" }]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const totals = calcTotals(items, type, discount);
  const label = type === "invoice" ? "factura" : "cotización";

  function updateItem(i: number, field: keyof LineItem, value: string | number) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { desc: "", qty: 1, unit: 0, ft2: "" }]);
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
        phone,
        project,
        items,
        discount,
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        notes,
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
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/dashboard"
          className="text-xs px-3 py-1.5 border border-stone-200 rounded-md hover:bg-stone-50"
        >
          ← Volver
        </Link>
        <div className="text-base font-medium">Nueva {label}</div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-4">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Cliente">
            <input
              className="zap-input"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Sr. José"
            />
          </Field>
          <Field label="Teléfono">
            <input
              className="zap-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(864) 451-2146"
            />
          </Field>
        </div>
        <Field label="Proyecto">
          <input
            className="zap-input"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            placeholder="Persianas motorizadas — residencia"
          />
        </Field>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <div className="grid grid-cols-[2fr_60px_80px_80px_100px_30px] gap-2 text-xs text-stone-500 pb-2 border-b border-stone-100">
          <div>Descripción</div>
          <div>Cant.</div>
          <div>V. Unit</div>
          <div>
            Ft² <span className="text-stone-400">(opc.)</span>
          </div>
          <div className="text-right">Total</div>
          <div></div>
        </div>

        {items.map((it, i) => (
          <div
            key={i}
            className="grid grid-cols-[2fr_60px_80px_80px_100px_30px] gap-2 items-center text-sm py-2 border-b border-stone-100"
          >
            <input
              className="zap-input"
              value={it.desc}
              onChange={(e) => updateItem(i, "desc", e.target.value)}
              placeholder="Persiana motorizada con estructura metálica"
            />
            <input
              className="zap-input"
              type="number"
              value={it.qty}
              onChange={(e) => updateItem(i, "qty", Number(e.target.value))}
            />
            <input
              className="zap-input"
              type="number"
              value={it.unit}
              onChange={(e) => updateItem(i, "unit", Number(e.target.value))}
              placeholder="21.00"
            />
            <input
              className="zap-input"
              value={it.ft2 || ""}
              onChange={(e) => updateItem(i, "ft2", e.target.value)}
              placeholder="380.50"
            />
            <div className="text-right font-medium">
              {fmt((Number(it.qty) || 0) * (Number(it.unit) || 0))}
            </div>
            <button
              onClick={() => removeItem(i)}
              className="text-stone-400 hover:text-red-500 text-lg"
              type="button"
            >
              ×
            </button>
          </div>
        ))}

        <button
          onClick={addItem}
          type="button"
          className="mt-3 w-full border border-dashed border-stone-300 py-2 rounded-md text-xs hover:bg-stone-50"
        >
          + Agregar línea
        </button>

        <div className="mt-4 pt-3 border-t border-stone-200 text-sm">
          <Row label="Subtotal" value={fmt(totals.subtotal)} />
          <div className="flex justify-between items-center py-1 gap-3">
            <span className="text-stone-500">Descuento</span>
            <input
              className="zap-input w-28 text-right"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
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
          <Field label="Notas">
            <textarea
              className="zap-input min-h-[72px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tiempo de entrega: 20-25 días calendario. Pago único anticipado."
            />
          </Field>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={save}
          disabled={saving || !client}
          className="bg-zap-red hover:bg-zap-redDark disabled:opacity-50 text-white px-5 py-2.5 rounded-md text-sm font-medium"
        >
          {saving ? "Guardando..." : `Generar ${label} →`}
        </button>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 border border-stone-200 rounded-md text-sm hover:bg-stone-50"
        >
          Cancelar
        </Link>
      </div>

      <style jsx>{`
        .zap-input {
          width: 100%;
          padding: 6px 10px;
          font-size: 13px;
          border: 1px solid #e7e5e4;
          border-radius: 6px;
          background: white;
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-stone-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}
