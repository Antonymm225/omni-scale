"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function SignIn() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

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
              Testea, escala y automatiza tus campanas - 10x mas rapido.
            </p>
          </div>

          <div className="space-y-8 text-slate-300">
            <Feature icon="zap" text="Lanza cientos de variaciones de anuncios" />
            <Feature icon="sparkles" text="Identifica los anuncios con mejor rendimiento" />
            <Feature icon="chart" text="Las campanas aprenden y evolucionan" />
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#F5F5F5]">
        <div className="max-w-md w-full space-y-6 bg-white rounded-xl shadow-sm border border-slate-200 p-10">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-semibold text-[#26251E] mb-2">
              Hola de nuevo
            </h2>
            <p className="text-slate-600 text-sm">
              Ingresa a tu cuenta OMNI Scale
            </p>
          </div>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 border border-slate-300 rounded-lg py-2.5 text-sm font-medium hover:bg-slate-50 transition"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              className="w-5 h-5"
              alt="Google"
            />
            Continuar con Google
          </button>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">O continuar con correo</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Correo electronico
              </label>
              <input
                type="email"
                placeholder="Ingresa tu correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700">
                  Contrasena
                </label>
                <a href="#" className="text-xs text-slate-500 hover:text-black">
                  Olvidaste tu contrasena?
                </a>
              </div>
              <input
                type="password"
                placeholder="Contrasena"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
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
              {isLoading ? "Ingresando..." : "Iniciar sesion"}
            </button>
          </form>

          <div className="text-center text-sm text-slate-600">
            No tienes una cuenta?{" "}
            <a href="/signup" className="font-medium text-black hover:underline">
              Registrate
            </a>
          </div>

          <p className="text-xs text-center text-slate-400 leading-relaxed">
            Al iniciar sesion, aceptas nuestros{" "}
            <a href="/terms-and-conditions" className="underline hover:text-black">
              Terminos y Condiciones
            </a>{" "}
            y{" "}
            <a href="/privacy-policy" className="underline hover:text-black">
              Politica de Privacidad
            </a>{" "}
            y{" "}
            <a href="/data-deletion-policy" className="underline hover:text-black">
              Politica de Eliminacion de Datos
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
