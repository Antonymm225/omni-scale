"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function SignUp() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ NUEVO: estado para mostrar mensaje bonito (sin alert)
  const [emailSent, setEmailSent] = useState(false);

  const handleSignup = async (e: any) => {
    e.preventDefault();

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${baseUrl}/verify-email`,
      },
    });

    if (error) {
      alert(error.message);
    } else {
      // ✅ NUEVO: mostramos mensaje dentro de la misma página
      setEmailSent(true);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* LEFT PANEL */}
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
              Testea, escala y automatiza tus campañas — 10x más rápido.
            </p>
          </div>

          <div className="space-y-8 text-slate-300">
            <Feature icon="zap" text="Lanza cientos de variaciones de anuncios" />
            <Feature
              icon="sparkles"
              text="Identifica los anuncios con mejor rendimiento"
            />
            <Feature icon="chart" text="Las campañas aprenden y evolucionan" />
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#F5F5F5]">
        <div className="max-w-md w-full space-y-6 bg-white rounded-xl shadow-sm border border-slate-200 p-10">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-semibold text-[#26251E] mb-2">
              Crea tu cuenta
            </h2>
            <p className="text-slate-600 text-sm">
              Comienza tu prueba gratuita de 7 días
            </p>
          </div>

          {/* ✅ NUEVO: Mensaje bonito dentro de la página (sin quitar nada del layout) */}
          {emailSent && (
            <div className="border border-green-200 bg-green-50 rounded-xl p-4 flex gap-3 items-start">
              <div className="text-green-600 mt-0.5 shrink-0">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 32 32"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  fill="currentColor"
                >
                  <g id="icomoon-ignore"></g>
                  <path d="M16 2.672c-7.361 0-13.328 5.967-13.328 13.328s5.968 13.328 13.328 13.328c7.361 0 13.328-5.967 13.328-13.328s-5.967-13.328-13.328-13.328zM16 28.262c-6.761 0-12.262-5.501-12.262-12.262s5.5-12.262 12.262-12.262c6.761 0 12.262 5.501 12.262 12.262s-5.5 12.262-12.262 12.262z" />
                  <path d="M22.667 11.241l-8.559 8.299-2.998-2.998c-0.312-0.312-0.818-0.312-1.131 0s-0.312 0.818 0 1.131l3.555 3.555c0.156 0.156 0.361 0.234 0.565 0.234 0.2 0 0.401-0.075 0.556-0.225l9.124-8.848c0.317-0.308 0.325-0.814 0.018-1.131-0.309-0.318-0.814-0.325-1.131-0.018z" />
                </svg>
              </div>

              <div className="text-sm">
                <p className="font-semibold text-green-700">
                  ¡Listo! Revisa tu correo para verificar tu cuenta
                </p>
                <p className="text-slate-600 mt-1">
                  Te enviamos un enlace de confirmación.
                </p>
              </div>
            </div>
          )}

          {/* GOOGLE SIGNUP */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 border border-slate-300 rounded-lg py-2.5 text-sm font-medium hover:bg-slate-50 transition"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              className="w-5 h-5"
              alt="Google"
            />
            Registrarse con Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">
              O continuar con correo
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* FORM */}
          <form onSubmit={handleSignup} className="space-y-4">
            {/* NOMBRE */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Nombre completo
              </label>
              <input
                type="text"
                placeholder="Ingresa tu nombre"
                required
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Correo electrónico
              </label>
              <input
                type="email"
                placeholder="Ingresa tu correo"
                required
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <input
                type="password"
                placeholder="Crea una contraseña"
                required
                minLength={8}
                pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$"
                title="Debe tener al menos 8 caracteres, incluir una letra y un número"
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <p className="text-xs text-slate-400 mt-1">
                Mínimo 8 caracteres, al menos una letra y un número.
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-b from-black to-[#2C2C2C] text-white font-semibold py-2.5 px-6 rounded-lg hover:opacity-90 transition"
            >
              Crear cuenta
            </button>
          </form>

          {/* SIGN IN LINK */}
          <div className="text-center text-sm text-slate-600">
            ¿Ya tienes una cuenta?{" "}
            <a href="/signin" className="font-medium text-black hover:underline">
              Inicia sesión
            </a>
          </div>

          {/* TERMS */}
          <p className="text-xs text-center text-slate-400 leading-relaxed">
            Al registrarte, aceptas nuestros{" "}
            <a href="#" className="underline hover:text-black">
              Términos
            </a>{" "}
            y{" "}
            <a href="#" className="underline hover:text-black">
              Política de Privacidad
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
      <svg
        className="h-5 w-5 text-white/80"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
      </svg>
    ),
    sparkles: (
      <svg
        className="h-5 w-5 text-white/80"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
      </svg>
    ),
    chart: (
      <svg
        className="h-5 w-5 text-white/80"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
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
