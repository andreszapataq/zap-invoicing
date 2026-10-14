// Los clientes son de EE. UU.: los números de 10 dígitos se muestran como (864) 541-2327.
// Si se escribe con "+" (p. ej. +57 311 355 9747) se trata como internacional y se deja tal cual.
export function formatPhone(raw: string) {
  const s = raw.trim();
  let d = s.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  else if (s.startsWith("+")) return s;
  if (d.length !== 10) return s;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

// wa.me exige el número en formato internacional (código de país, sin "+" ni símbolos).
// Sin código de país, WhatsApp puede leer los primeros dígitos como el código de otro país
// (864… → +86 China), así que a los números de EE. UU. de 10 dígitos se les antepone el 1.
export function whatsappNumber(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (!d || raw.trim().startsWith("+")) return d;
  return d.length === 10 ? "1" + d : d;
}
