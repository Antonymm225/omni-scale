"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function ConnectAssetsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/signin");
  };

  const message = useMemo(() => {
    if (status === "success") {
      return { type: "success", text: "Conexion completada. Se sincronizaron tus assets de Facebook." };
    }

    if (status === "error") {
      return { type: "error", text: searchParams.get("message") || "No se pudo completar la conexion con Facebook." };
    }

    return null;
  }, [searchParams, status]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 grid w-full grid-cols-[1fr_auto_1fr] items-center">
          <div />
          <div className="flex justify-center">
            <Image
              src="/omniscale-color-logo-complete.png"
              alt="OMNI Scale"
              width={260}
              height={144}
              priority
              className="h-auto w-[200px] sm:w-[240px]"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex translate-x-1 items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
              Cerrar sesion
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <h1 className="text-center text-3xl font-bold tracking-tight text-[#1D293D]">
            Conecta tus assets de Meta
          </h1>
          <p className="mt-3 text-center text-sm text-slate-600 sm:text-base">
            Conecta Facebook para importar BM, cuentas publicitarias, pixels, fanpages, cuentas de Instagram y adsets.
          </p>

          {message && (
            <div
              className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
                message.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <a
            href="/api/facebook/oauth/start"
            className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-[#1D293D] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Conectar con Facebook
          </a>

          <p className="mt-4 text-center text-xs text-slate-500">
            Solicitaremos permisos para leer y sincronizar los activos que administras.
          </p>
        </div>
      </div>
    </div>
  );
}
