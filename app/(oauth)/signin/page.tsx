"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { localizePublicPath } from "../../lib/locale";
import { useLocale } from "../../providers/LocaleProvider";
import { useTheme } from "../../providers/ThemeProvider";
import LocaleToggle from "../../components/locale-toggle";

export default function SignIn() {
  const router = useRouter();
  const { locale } = useLocale();
  const { theme } = useTheme();
  const isEn = locale === "en";
  const isDark = theme === "dark";

  const [email, setEmail] = useState("");
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    const password = passwordRef.current?.value || "";

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      if (passwordRef.current) passwordRef.current.value = "";
      setIsLoading(false);
      return;
    }

    if (passwordRef.current) passwordRef.current.value = "";
    router.replace("/setup");
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex w-1/2 relative bg-black text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-left"
          style={{ backgroundImage: "url('/gradient-patterns.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/70 to-black/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black via-transparent to-transparent" />

        <div className="relative z-10 flex flex-col justify-center px-20 space-y-12 max-w-xl">
          <div>
            <h1 className="text-4xl font-semibold mb-5 tracking-tight">
              OMNI Scale
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed">
              {isEn
                ? "Test, scale and automate your campaigns 10x faster."
                : "Testea, escala y automatiza tus campanas - 10x mas rapido."}
            </p>
          </div>

          <div className="space-y-8 text-slate-300">
            <Feature
              icon="zap"
              text={isEn ? "Launch hundreds of ad variations" : "Lanza cientos de variaciones de anuncios"}
            />
            <Feature
              icon="sparkles"
              text={
                isEn
                  ? "Identify top-performing ads faster"
                  : "Identifica los anuncios con mejor rendimiento"
              }
            />
            <Feature
              icon="chart"
              text={isEn ? "Campaigns learn and evolve over time" : "Las campanas aprenden y evolucionan"}
            />
          </div>
        </div>
      </div>

      <div
        className={`w-full lg:w-1/2 flex items-center justify-center p-8 ${
          isDark ? "bg-[#0a1322]" : "bg-[#F5F5F5]"
        }`}
      >
        <div
          className={`max-w-md w-full space-y-6 rounded-xl border p-10 ${
            isDark
              ? "border-slate-700/80 bg-[linear-gradient(165deg,#0f1b33_0%,#121a2a_45%,#0f172a_100%)] shadow-[0_28px_70px_rgba(2,6,23,0.55)]"
              : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex justify-end">
            <LocaleToggle />
          </div>
          <div className="text-center mb-6">
            <h2 className={`text-3xl font-semibold mb-2 ${isDark ? "text-slate-100" : "text-[#26251E]"}`}>
              {isEn ? "Welcome back" : "Hola de nuevo"}
            </h2>
            <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              {isEn ? "Sign in to your OMNI Scale account" : "Ingresa a tu cuenta OMNI Scale"}
            </p>
          </div>

          <button
            type="button"
            className={`w-full flex items-center justify-center gap-3 border rounded-lg py-2.5 text-sm font-medium transition ${
              isDark
                ? "border-slate-600 text-slate-100 hover:bg-slate-800/70"
                : "border-slate-300 hover:bg-slate-50"
            }`}
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              className="w-5 h-5"
              alt="Google"
            />
            {isEn ? "Continue with Google" : "Continuar con Google"}
          </button>

          <div className="flex items-center gap-4">
            <div className={`flex-1 h-px ${isDark ? "bg-slate-600" : "bg-slate-200"}`} />
            <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-400"}`}>
              {isEn ? "Or continue with email" : "O continuar con correo"}
            </span>
            <div className={`flex-1 h-px ${isDark ? "bg-slate-600" : "bg-slate-200"}`} />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                {isEn ? "Email" : "Correo electronico"}
              </label>
              <input
                type="email"
                placeholder={isEn ? "Enter your email" : "Ingresa tu correo"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`mt-1 w-full border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                  isDark
                    ? "border-slate-600 text-slate-100 placeholder:text-slate-400 focus:ring-slate-400"
                    : "border-slate-300 focus:ring-black"
                }`}
              />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                  {isEn ? "Password" : "Contrasena"}
                </label>
                <a href="#" className={`text-xs ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-black"}`}>
                  {isEn ? "Forgot your password?" : "Olvidaste tu contrasena?"}
                </a>
              </div>
              <input
                type="password"
                placeholder={isEn ? "Password" : "Contrasena"}
                ref={passwordRef}
                required
                autoComplete="current-password"
                spellCheck={false}
                className={`mt-1 w-full border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                  isDark
                    ? "border-slate-600 text-slate-100 placeholder:text-slate-400 focus:ring-slate-400"
                    : "border-slate-300 focus:ring-black"
                }`}
              />
            </div>

            {errorMessage && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-b from-black to-[#2C2C2C] text-white font-semibold py-2.5 px-6 rounded-lg hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (isEn ? "Signing in..." : "Ingresando...") : isEn ? "Sign in" : "Iniciar sesion"}
            </button>
          </form>

          <div className={`text-center text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            {isEn ? "Don't have an account?" : "No tienes una cuenta?"}{" "}
            <a
              href={localizePublicPath(locale, "/signup")}
              className={`font-medium hover:underline ${isDark ? "text-slate-100" : "text-black"}`}
            >
              {isEn ? "Create account" : "Registrate"}
            </a>
          </div>

          <p className={`text-xs text-center leading-relaxed ${isDark ? "text-slate-400" : "text-slate-400"}`}>
            {isEn ? "By signing in, you accept our" : "Al iniciar sesion, aceptas nuestros"}{" "}
            <a
              href={localizePublicPath(locale, "/terms-and-conditions")}
              className={`underline ${isDark ? "hover:text-white" : "hover:text-black"}`}
            >
              {isEn ? "Terms and Conditions" : "Terminos y Condiciones"}
            </a>{" "}
            {isEn ? "and" : "y"}{" "}
            <a
              href={localizePublicPath(locale, "/privacy-policy")}
              className={`underline ${isDark ? "hover:text-white" : "hover:text-black"}`}
            >
              {isEn ? "Privacy Policy" : "Politica de Privacidad"}
            </a>{" "}
            {isEn ? "and" : "y"}{" "}
            <a
              href={localizePublicPath(locale, "/data-deletion-policy")}
              className={`underline ${isDark ? "hover:text-white" : "hover:text-black"}`}
            >
              {isEn ? "Data Deletion Policy" : "Politica de Eliminacion de Datos"}
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: string; text: string }) {
  const icons = {
    zap: (
      <svg className="h-5 w-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
      </svg>
    ),
    sparkles: (
      <svg className="h-5 w-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
      </svg>
    ),
    chart: (
      <svg className="h-5 w-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3v16a2 2 0 0 0 2 2h16" />
        <path d="M18 17V9" />
        <path d="M13 17V5" />
        <path d="M8 17v-3" />
      </svg>
    ),
  };

  return (
    <div className="flex items-center gap-5">
      <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
        {icons[icon as keyof typeof icons]}
      </div>
      <span className="text-base">{text}</span>
    </div>
  );
}
