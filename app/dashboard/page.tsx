import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";
import { ZapLogo } from "@/components/ZapLogo";
import { fmt, fmtDate, monthIndex, monthName, DocumentRecord } from "@/lib/types";
import { LogoutButton } from "./LogoutButton";
import { DeleteDocumentButton } from "@/components/DeleteDocumentButton";

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: records } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  const docs = (records || []) as DocumentRecord[];
  const invoices = docs.filter((r) => r.type === "invoice");
  const totalQuoted = docs.filter((r) => r.type === "quote").reduce((s, r) => s + Number(r.total), 0);
  const totalBilled = invoices.reduce((s, r) => s + Number(r.total), 0);

  const currentMonth = monthIndex(new Date());
  const invoicesThisMonth = invoices.filter((r) => monthIndex(r.created_at) === currentMonth);
  const billedThisMonth = invoicesThisMonth.reduce((s, r) => s + Number(r.total), 0);
  const billedLastMonth = invoices
    .filter((r) => monthIndex(r.created_at) === currentMonth - 1)
    .reduce((s, r) => s + Number(r.total), 0);
  const monthSub = monthComparison(billedThisMonth, billedLastMonth, currentMonth - 1, invoicesThisMonth.length);

  return (
    <div className="max-w-3xl mx-auto px-3 pt-4 pb-8 sm:p-6">
      <div className="flex justify-between items-center mb-5 sm:mb-6">
        <div>
          <ZapLogo size={64} />
          <div className="text-xs text-stone-500 mt-1">Greenville, SC</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-stone-500">{user.email}</span>
          <LogoutButton />
        </div>
      </div>

      {/* Celular: dos tarjetas arriba y "este mes" a lo ancho, para que los montos no se corten */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5">
        <Stat label="Cotizado" value={fmt(totalQuoted)} />
        <Stat label="Facturado" value={fmt(totalBilled)} />
        <Stat
          label="Facturado este mes"
          value={fmt(billedThisMonth)}
          sub={monthSub}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <div className="grid grid-cols-2 sm:flex gap-2 mb-6 sm:mb-5">
        <NewButton type="quote" />
        <NewButton type="invoice" />
      </div>

      <div className="text-sm font-medium mb-2">Actividad reciente</div>
      {docs.length === 0 ? (
        <div className="bg-stone-100 rounded-md p-8 text-center text-sm text-stone-500">
          Aún no hay documentos. Crea tu primera cotización o factura arriba.
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          {docs.map((r, i) => (
            <div
              key={r.id}
              className={`flex items-center hover:bg-stone-50 ${
                i < docs.length - 1 ? "border-b border-stone-100" : ""
              }`}
            >
              <Link
                href={`/document/${r.id}`}
                className="flex flex-1 min-w-0 justify-between items-center gap-3 pl-4 pr-1 py-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{r.client}</div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full font-medium ${
                        r.type === "invoice" ? "bg-red-50 text-red-900" : "bg-blue-50 text-blue-900"
                      }`}
                    >
                      {r.type === "invoice" ? `Factura #${r.number}` : `Cotización #${r.number}`}
                    </span>
                    <span className="shrink-0">{fmtDate(r.created_at)}</span>
                  </div>
                  {r.project && <div className="text-xs text-stone-500 mt-1 truncate">{r.project}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-medium">{fmt(Number(r.total))}</div>
                  <div className="text-xs text-blue-600">Ver →</div>
                </div>
              </Link>
              <DeleteDocumentButton
                id={r.id}
                type={r.type}
                number={r.number}
                className="self-stretch px-4 sm:px-3 text-stone-400 hover:text-red-600 text-lg disabled:opacity-50"
              >
                ×
              </DeleteDocumentButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, className = "" }: { label: string; value: string; sub?: string; className?: string }) {
  return (
    <div className={`bg-stone-100 rounded-md p-3.5 min-w-0 ${className}`}>
      <div className="text-xs text-stone-500 mb-1">{label}</div>
      <div className="text-lg sm:text-xl font-medium truncate">{value}</div>
      {sub && <div className="text-xs text-stone-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function monthComparison(current: number, previous: number, previousMonth: number, invoiceCount: number) {
  // Sin facturación el mes anterior el porcentaje no tiene sentido: mostrar el número de facturas
  if (previous <= 0) return `${invoiceCount} ${invoiceCount === 1 ? "factura" : "facturas"}`;
  const pct = Math.round(((current - previous) / previous) * 100);
  const arrow = pct > 0 ? "↑" : pct < 0 ? "↓" : "=";
  return `${arrow} ${Math.abs(pct)}% vs ${monthName(previousMonth)}`;
}

function NewButton({ type }: { type: "quote" | "invoice" }) {
  const label = type === "quote" ? "cotización" : "factura";

  return (
    <Link
      href={`/new?type=${type}`}
      className="bg-zap-red hover:bg-zap-redDark text-white text-center px-4 py-3 sm:py-2.5 rounded-md text-sm font-medium"
    >
      + Nueva {label}
    </Link>
  );
}
