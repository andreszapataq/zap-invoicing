import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { fmtUSD, SheetData } from "@/lib/types";
import { docTitle } from "@/lib/documentText";
import { SharedDocumentView } from "./SharedDocumentView";

// Página pública que recibe el cliente por WhatsApp: sin sesión, solo lectura, en inglés.
// El documento se busca por share_id (no por id) mediante get_shared_document(), que salta RLS solo para esa fila.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getSharedDocument = cache(async (shareId: string) => {
  if (!UUID.test(shareId)) return null;
  const supabase = await createServerSupabase();
  const { data } = await supabase.rpc("get_shared_document", { p_share_id: shareId }).maybeSingle();
  return (data as SheetData | null) ?? null;
});

type Props = { params: Promise<{ shareId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doc = await getSharedDocument((await params).shareId);
  if (!doc) return { title: "ZAP Blinds Solutions", robots: { index: false } };
  const title = `${docTitle(doc)} #${doc.number} — ZAP Blinds Solutions`;
  const description = `Prepared for ${doc.client} · Total ${fmtUSD(Number(doc.total))}`;
  return { title, description, robots: { index: false, follow: false }, openGraph: { title, description } };
}

export default async function SharedDocumentPage({ params }: Props) {
  const doc = await getSharedDocument((await params).shareId);
  if (!doc) notFound();
  return <SharedDocumentView doc={doc} />;
}
