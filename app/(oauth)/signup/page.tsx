"use client";

import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { localizePublicPath, readCookie, TIMEZONE_COOKIE } from "../../lib/locale";
import { useLocale } from "../../providers/LocaleProvider";
import { useTheme } from "../../providers/ThemeProvider";
import LocaleToggle from "../../components/locale-toggle";

export default function SignUp() {
  const { locale } = useLocale();
  const { theme } = useTheme();
  const isEn = locale === "en";
  const isDark = theme === "dark";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");

      const { error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            language_code: locale,
            theme_mode: "light",
            timezone_name: readCookie(TIMEZONE_COOKIE) || "UTC",
          },
          emailRedirectTo: `${baseUrl}${localizePublicPath(locale, "/verify-email")}`,
        },
      });

      if (signupError) throw signupError;
      setEmailSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : isEn ? "Signup failed." : "No se pudo completar el registro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 overflow-hidden bg-black text-white lg:flex">
        <div
          className="absolute inset-0 bg-cover bg-left"
          style={{ backgroundImage: "url('/gradient-patterns.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/70 to-black/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="absolute bottom-0 left-0 h-1/2 w-full bg-gradient-to-t from-black via-transparent to-transparent" />

        <div className="relative z-10 flex max-w-xl flex-col justify-center space-y-12 px-20">
          <div>
            <h1 className="mb-5 text-4xl font-semibold tracking-tight">OMNI Scale</h1>
            <p className="text-lg leading-relaxed text-slate-300">
              {isEn
                ? "Test, scale and automate your campaigns 10x faster."
                : "Testea, escala y automatiza tus campanas 10x mas rapido."}
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
        className={`flex w-full items-center justify-center p-8 lg:w-1/2 ${
          isDark ? "bg-[#0a1322]" : "bg-[#F5F5F5]"
        }`}
      >
        <div
          className={`w-full max-w-md space-y-6 rounded-xl border p-10 ${
            isDark
              ? "border-slate-700/80 bg-[linear-gradient(165deg,#0f1b33_0%,#121a2a_45%,#0f172a_100%)] shadow-[0_28px_70px_rgba(2,6,23,0.55)]"
              : "border-slate-200 bg-white shadow-sm"
          }`}
        >
          <div className="flex justify-end">
            <LocaleToggle />
          </div>
          <div className="mb-6 text-center">
            <h2 className={`mb-2 text-3xl font-semibold ${isDark ? "text-slate-100" : "text-[#26251E]"}`}>
              {isEn ? "Create your account" : "Crea tu cuenta"}
            </h2>
            <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              {isEn ? "Start your 7-day free trial" : "Comienza tu prueba gratuita de 7 dias"}
            </p>
          </div>

          {emailSent ? (
            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="mt-0.5 shrink-0 text-green-600">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="m8.5 12 2.2 2.2 4.8-4.8" />
                </svg>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-green-700">
                  {isEn
                    ? "Done. Check your email to verify your account."
                    : "Listo. Revisa tu correo para verificar tu cuenta."}
                </p>
                <p className="mt-1 text-slate-600">
                  {isEn ? "We sent you a confirmation link." : "Te enviamos un enlace de confirmacion."}
                </p>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          <button
            type="button"
            className={`flex w-full items-center justify-center gap-3 rounded-lg border py-2.5 text-sm font-medium transition ${
              isDark
                ? "border-slate-600 text-slate-100 hover:bg-slate-800/70"
                : "border-slate-300 hover:bg-slate-50"
            }`}
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              className="h-5 w-5"
              alt="Google"
            />
            {isEn ? "Sign up with Google" : "Registrarse con Google"}
          </button>

          <div className="flex items-center gap-4">
            <div className={`h-px flex-1 ${isDark ? "bg-slate-600" : "bg-slate-200"}`} />
            <span className="text-xs text-slate-400">
              {isEn ? "Or continue with email" : "O continuar con correo"}
            </span>
            <div className={`h-px flex-1 ${isDark ? "bg-slate-600" : "bg-slate-200"}`} />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                {isEn ? "Full name" : "Nombre completo"}
              </label>
              <input
                type="text"
                placeholder={isEn ? "Enter your full name" : "Ingresa tu nombre"}
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={`mt-1 w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                  isDark
                    ? "border-slate-600 text-slate-100 placeholder:text-slate-400 focus:ring-slate-400"
                    : "border-slate-300 focus:ring-black"
                }`}
              />
            </div>

            <div>
              <label className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                {isEn ? "Email" : "Correo electronico"}
              </label>
              <input
                type="email"
                placeholder={isEn ? "Enter your email" : "Ingresa tu correo"}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={`mt-1 w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                  isDark
                    ? "border-slate-600 text-slate-100 placeholder:text-slate-400 focus:ring-slate-400"
                    : "border-slate-300 focus:ring-black"
                }`}
              />
            </div>

            <div>
              <label className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                {isEn ? "Password" : "Contrasena"}
              </label>
              <input
                type="password"
                placeholder={isEn ? "Create your password" : "Crea una contrasena"}
                required
                minLength={8}
                pattern="^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{8,}$"
                title={
                  isEn
                    ? "At least 8 characters, including one letter and one number."
                    : "Debe tener al menos 8 caracteres, incluir una letra y un numero."
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`mt-1 w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                  isDark
                    ? "border-slate-600 text-slate-100 placeholder:text-slate-400 focus:ring-slate-400"
                    : "border-slate-300 focus:ring-black"
                }`}
              />
              <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-400"}`}>
                {isEn
                  ? "Minimum 8 characters, at least one letter and one number."
                  : "Minimo 8 caracteres, al menos una letra y un numero."}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-b from-black to-[#2C2C2C] px-6 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (isEn ? "Creating account..." : "Creando cuenta...") : isEn ? "Create account" : "Crear cuenta"}
            </button>
          </form>

          <div className={`text-center text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            {isEn ? "Already have an account?" : "Ya tienes una cuenta?"}{" "}
            <a
              href={localizePublicPath(locale, "/signin")}
              className={`font-medium hover:underline ${isDark ? "text-slate-100" : "text-black"}`}
            >
              {isEn ? "Sign in" : "Inicia sesion"}
            </a>
          </div>

          <p className="text-center text-xs leading-relaxed text-slate-400">
            {isEn ? "By signing up, you accept our" : "Al registrarte, aceptas nuestros"}{" "}
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
      <div className="rounded-xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm">
        {icons[icon as keyof typeof icons]}
      </div>
      <span className="text-base">{text}</span>
    </div>
  );
}
