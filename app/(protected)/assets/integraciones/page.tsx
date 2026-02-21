"use client";

import { useState } from "react";

export default function IntegracionesPage() {
  const [openAiKey, setOpenAiKey] = useState("");
  const [everflowApiKey, setEverflowApiKey] = useState("");
  const [everflowAccountId, setEverflowAccountId] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header>
          <h1 className="text-3xl font-bold text-[#111827] sm:text-4xl">Integraciones</h1>
          <p className="mt-2 text-sm text-slate-600">
            Configura conexiones para analisis y automatizacion de campanas.
          </p>
        </header>

        <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">Everflow</h2>
                <p className="mt-1 text-sm text-slate-600">Conecta tracking externo y atribucion.</p>
              </div>
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                Proximamente
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Account ID
                </span>
                <input
                  type="text"
                  value={everflowAccountId}
                  onChange={(event) => setEverflowAccountId(event.target.value)}
                  placeholder="Ejemplo: 12345"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-0 focus:border-[#1D293D]"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  API Key
                </span>
                <input
                  type="password"
                  value={everflowApiKey}
                  onChange={(event) => setEverflowApiKey(event.target.value)}
                  placeholder="Ingresa tu API Key de Everflow"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-0 focus:border-[#1D293D]"
                />
              </label>
            </div>

            <button
              type="button"
              disabled
              className="mt-4 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500"
            >
              Guardar Everflow
            </button>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">OpenAI API Key</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Base para analisis inteligente de campanas y recomendaciones.
                </p>
              </div>
              <span className="whitespace-nowrap rounded-full border border-sky-300 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">
                Base lista
              </span>
            </div>

            <div className="mt-4">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Secret Key
                </span>
                <input
                  type="password"
                  value={openAiKey}
                  onChange={(event) => setOpenAiKey(event.target.value)}
                  placeholder="sk-..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-0 focus:border-[#1D293D]"
                />
              </label>
            </div>

            <button
              type="button"
              disabled
              className="mt-4 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500"
            >
              Guardar OpenAI
            </button>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">WhatsApp</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Numero para notificaciones y para recibir mensajes del AI.
                </p>
              </div>
              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                Configurable
              </span>
            </div>

            <div className="mt-4 max-w-md">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Numero
                </span>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(event) => setWhatsappNumber(event.target.value)}
                  placeholder="+51 999 999 999"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-0 focus:border-[#1D293D]"
                />
              </label>
            </div>

            <button
              type="button"
              disabled
              className="mt-4 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500"
            >
              Guardar WhatsApp
            </button>
          </article>
        </section>
      </div>
    </main>
  );
}
