import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { DEMO_LIMIT, DocType, nextDocNumber } from "@/lib/types";
import { NewDocumentForm } from "./NewDocumentForm";

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const type: DocType = params.type === "invoice" ? "invoice" : "quote";

  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("type", type);

  const used = count || 0;
  if (used >= DEMO_LIMIT) redirect("/dashboard");

  // Basado en el número más alto (no en el conteo) para no repetir números tras eliminar documentos
  const { data: last } = await supabase
    .from("documents")
    .select("number")
    .eq("type", type)
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const number = nextDocNumber(type, last?.number ?? null);
  return <NewDocumentForm type={type} suggestedNumber={number} />;
}
