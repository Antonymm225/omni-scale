"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function VerifyEmail() {
  const router = useRouter();

  useEffect(() => {
    const verify = async () => {
      const code = new URLSearchParams(window.location.search).get("code");

      if (!code) {
        router.replace("/signin");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Error exchanging code for session:", error.message);
        router.replace("/signin");
        return;
      }

      router.replace("/setup");
    };

    verify();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Verificando tu cuenta...</p>
    </div>
  );
}
