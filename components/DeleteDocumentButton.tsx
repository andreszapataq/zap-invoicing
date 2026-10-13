"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { DocType } from "@/lib/types";

type Props = {
  id: string;
  type: DocType;
  number: number;
  className?: string;
  children?: React.ReactNode;
};

export function DeleteDocumentButton({ id, type, number, className, children }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [deleting, setDeleting] = useState(false);
  const label = type === "invoice" ? "factura" : "cotización";

  async function remove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`¿Eliminar la ${label} #${number}? Esta acción no se puede deshacer.`)) return;

    setDeleting(true);
    const { data, error } = await supabase.from("documents").delete().eq("id", id).select("id");
    if (error || !data?.length) {
      setDeleting(false);
      alert("Error al eliminar: " + (error?.message ?? "documento no encontrado"));
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <button onClick={remove} disabled={deleting} className={className} type="button">
      {deleting ? "Eliminando..." : children ?? "Eliminar"}
    </button>
  );
}
