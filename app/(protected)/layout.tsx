"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {

      // ✅ VALIDACIÓN REAL DE LOGIN
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        router.replace("/signin");
        return;
      }

      setLoading(false);
    };

    checkSession();
  }, [router]);

  // ✅ Evita flicker mientras valida sesión
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Cargando...
      </div>
    );
  }

  return <>{children}</>;
}
