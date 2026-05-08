import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";
import { ZapLogo } from "@/components/ZapLogo";
import { fmt, DEMO_LIMIT, DocumentRecord } from "@/lib/types";
import { LogoutButton } from "./LogoutButton";

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: records } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  const docs = (records || []) as DocumentRecord[];
  const quotesUsed = docs.filter((r) => r.type === "quote").length;
  const invoicesUsed = docs.filter((r) => r.type === "invoice").length;
  const totalQuoted = docs.filter((r) => r.type === "quote").reduce((s, r) => s + Number(r.total), 0);
  const totalBilled = docs.filter((r) => r.type === "invoice").reduce((s, r) => s + Number(r.total), 0);
  const limitReached = quotesUsed >= DEMO_LIMIT && invoicesUsed >= DEMO_LIMIT;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <ZapLogo size={64} />
          <div className="text-xs text-stone-500 mt-1">Greenville, SC</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-500">{user.email}</span>
          <LogoutButton />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <Stat label="Cotizado" value={fmt(totalQuoted)} />
        <Stat label="Facturado" value={fmt(totalBilled)} />
        <Stat label="Uso demo" value={`${quotesUsed + invoicesUsed}/4`} />
      </div>

      <div className="flex gap-2 mb-5">
        <NewButton type="quote" used={quotesUsed} />
        <NewButton type="invoice" used={invoicesUsed} />
      </div>

      {limitReached && (
        <div className="bg-blue-50 rounded-xl p-4 mb-5">
          <div className="font-medium text-sm text-blue-900 mb-1">Límite de demo alcanzado</div>
          <div className="text-xs text-blue-800 leading-relaxed">
            Has usado los 4 documentos. Activa la versión completa: cotizaciones y facturas ilimitadas, alertas
            de seguimiento, base de datos de clientes y analítica.
          </div>
        </div>
      )}

      <div className="text-sm font-medium mb-2">Actividad reciente</div>
      {docs.length === 0 ? (
        <div className="bg-stone-100 rounded-md p-8 text-center text-sm text-stone-500">
          Aún no hay documentos. Crea tu primera cotización o factura arriba.
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          {docs.map((r, i) => (
            <Link
              key={r.id}
              href={`/document/${r.id}`}
              className={`flex justify-between items-center px-4 py-3 hover:bg-stone-50 ${
                i < docs.length - 1 ? "border-b border-stone-100" : ""
              }`}
            >
              <div>
                <div className="text-sm font-medium">
                  {r.client}
                  <span
                    className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.type === "invoice" ? "bg-red-50 text-red-900" : "bg-blue-50 text-blue-900"
                    }`}
                  >
                    {r.type === "invoice" ? `Factura #${r.number}` : `Cotización #${r.number}`}
                  </span>
                </div>
                <div className="text-xs text-stone-500 mt-0.5">
                  {r.project} · {new Date(r.created_at).toLocaleDateString("es-CO")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{fmt(Number(r.total))}</div>
                <div className="text-xs text-blue-600">Ver →</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-stone-100 rounded-md p-3.5">
      <div className="text-xs text-stone-500 mb-1">{label}</div>
      <div className="text-xl font-medium">{value}</div>
    </div>
  );
}

function NewButton({ type, used }: { type: "quote" | "invoice"; used: number }) {
  const remaining = DEMO_LIMIT - used;
  const disabled = remaining <= 0;
  const label = type === "quote" ? "cotización" : "factura";

  if (disabled) {
    return (
      <button
        disabled
        className="bg-zap-red text-white px-4 py-2.5 rounded-md text-sm font-medium opacity-40 cursor-not-allowed"
      >
        + Nueva {label} (límite)
      </button>
    );
  }

  return (
    <Link
      href={`/new?type=${type}`}
      className="bg-zap-red hover:bg-zap-redDark text-white px-4 py-2.5 rounded-md text-sm font-medium"
    >
      + Nueva {label} ({remaining} disponibles)
    </Link>
  );
}
