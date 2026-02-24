"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { localizePublicPath } from "../lib/locale";
import { useLocale } from "../providers/LocaleProvider";
import { useTheme } from "../providers/ThemeProvider";

export default function VerifyEmail() {
  const router = useRouter();
  const { locale } = useLocale();
  const { theme } = useTheme();
  const isEn = locale === "en";

  useEffect(() => {
    const verify = async () => {
      const code = new URLSearchParams(window.location.search).get("code");

      if (!code) {
        router.replace(localizePublicPath(locale, "/signin"));
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Error exchanging code for session:", error.message);
        router.replace(localizePublicPath(locale, "/signin"));
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            email: user.email || null,
            name:
              (user.user_metadata?.full_name as string | undefined) ||
              (user.user_metadata?.name as string | undefined) ||
              user.email?.split("@")[0] ||
              null,
            language_code: locale,
            theme_mode: theme,
          },
          { onConflict: "id" }
        );
      }

      router.replace("/setup");
    };

    verify();
  }, [router, locale, theme]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>{isEn ? "Verifying your account..." : "Verificando tu cuenta..."}</p>
    </div>
  );
}
