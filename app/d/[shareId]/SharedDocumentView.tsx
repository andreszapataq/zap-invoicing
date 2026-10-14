"use client";

import { SheetData } from "@/lib/types";
import { DocumentSheet, useDocumentPrint } from "@/components/DocumentSheet";

// Vista del cliente: solo el documento y el botón para guardarlo, en inglés
export function SharedDocumentView({ doc }: { doc: SheetData }) {
  const { ref, print } = useDocumentPrint(doc);

  const download = (
    <button
      onClick={print}
      className="px-4 py-2.5 sm:py-2 text-sm sm:text-xs bg-zap-red hover:bg-zap-redDark text-white rounded-md font-medium"
    >
      Download PDF
    </button>
  );

  return (
    <div lang="en" className="max-w-3xl mx-auto px-3 pt-4 pb-28 sm:p-6 print:p-0 print:max-w-none">
      <div className="hidden sm:flex justify-end mb-5 no-print">{download}</div>

      <DocumentSheet doc={doc} ref={ref} />

      <div className="sm:hidden no-print fixed inset-x-0 bottom-0 z-10 grid px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur border-t border-stone-200">
        {download}
      </div>
    </div>
  );
}
