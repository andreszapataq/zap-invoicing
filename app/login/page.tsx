"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ZapLogo } from "@/components/ZapLogo";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("info@zapblindsusa.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError("Credenciales incorrectas");
    else router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-stone-100">
      <form onSubmit={handleLogin} className="bg-white rounded-2xl border border-stone-200 p-8 w-full max-w-sm">
        <div className="mb-6">
          <ZapLogo size={64} />
          <div className="text-xs text-stone-500 mt-3">Portal de facturación</div>
        </div>

        <label className="block text-xs text-stone-500 mb-1">Correo</label>
        <input
          className="w-full px-3 py-2 text-base sm:text-sm border border-stone-200 rounded-md mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="username"
        />
        <label className="block text-xs text-stone-500 mb-1">Contraseña</label>
        <input
          className="w-full px-3 py-2 text-base sm:text-sm border border-stone-200 rounded-md mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
        />

        {error && <div className="text-xs text-red-600 mb-3">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-zap-red hover:bg-zap-redDark text-white font-medium py-2.5 rounded-md text-sm disabled:opacity-50"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
