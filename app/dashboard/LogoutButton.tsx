"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={logout} className="text-sm sm:text-xs text-stone-500 hover:text-stone-900 underline py-2">
      Salir
    </button>
  );
}
