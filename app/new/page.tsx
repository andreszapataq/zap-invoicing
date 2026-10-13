import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { DocType, nextDocNumber } from "@/lib/types";
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
