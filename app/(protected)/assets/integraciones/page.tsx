"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type EverflowRegion = "US" | "EU";
type EverflowAccessType = "Network" | "Affiliate" | "Advertiser";

type SavedFlags = {
  everflowApiKey: boolean;
  openAiApiKey: boolean;
  whatsapp: boolean;
};

export default function IntegracionesPage() {
  const [loading, setLoading] = useState(true);
  const [savingEverflow, setSavingEverflow] = useState(false);
  const [savingOpenAi, setSavingOpenAi] = useState(false);
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [openAiKey, setOpenAiKey] = useState("");
  const [everflowApiKey, setEverflowApiKey] = useState("");
  const [everflowRegion, setEverflowRegion] = useState<EverflowRegion>("US");
  const [everflowAccessType, setEverflowAccessType] = useState<EverflowAccessType>("Network");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [savedWhatsappNumber, setSavedWhatsappNumber] = useState("");
  const [savedFlags, setSavedFlags] = useState<SavedFlags>({
    everflowApiKey: false,
    openAiApiKey: false,
    whatsapp: false,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("No se pudo validar la sesion.");
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data, error: selectError } = await supabase
        .from("user_integrations")
        .select("everflow_api_key,everflow_region,everflow_access_type,openai_api_key,whatsapp_number")
        .eq("user_id", user.id)
        .maybeSingle();

      if (selectError) {
        setError(selectError.message);
        setLoading(false);
        return;
      }

      if (data) {
        if (data.everflow_region === "US" || data.everflow_region === "EU") {
          setEverflowRegion(data.everflow_region);
        }
        if (
          data.everflow_access_type === "Network" ||
          data.everflow_access_type === "Affiliate" ||
          data.everflow_access_type === "Advertiser"
        ) {
          setEverflowAccessType(data.everflow_access_type);
        }
        setWhatsappNumber(data.whatsapp_number || "");
        setSavedWhatsappNumber(data.whatsapp_number || "");
        setSavedFlags({
          everflowApiKey: Boolean(data.everflow_api_key),
          openAiApiKey: Boolean(data.openai_api_key),
          whatsapp: Boolean(data.whatsapp_number),
        });
      }

      setLoading(false);
    };

    void load();
  }, []);

  const saveEverflow = async () => {
    if (!userId) return;
    setSavingEverflow(true);
    setError(null);
    setNotice(null);

    const payload: Record<string, unknown> = {
      user_id: userId,
      everflow_region: everflowRegion,
      everflow_access_type: everflowAccessType,
    };
    if (everflowApiKey.trim()) {
      payload.everflow_api_key = everflowApiKey.trim();
    }

    const { error: upsertError } = await supabase.from("user_integrations").upsert(payload);
    if (upsertError) {
      setError(upsertError.message);
      setSavingEverflow(false);
      return;
    }

    setSavedFlags((prev) => ({ ...prev, everflowApiKey: prev.everflowApiKey || Boolean(everflowApiKey.trim()) }));
    setEverflowApiKey("");
    setNotice("Integracion Everflow guardada.");
    setSavingEverflow(false);
  };

  const saveOpenAi = async () => {
    if (!userId) return;
    setSavingOpenAi(true);
    setError(null);
    setNotice(null);

    const payload: Record<string, unknown> = { user_id: userId };
    if (openAiKey.trim()) {
      payload.openai_api_key = openAiKey.trim();
    }

    const { error: upsertError } = await supabase.from("user_integrations").upsert(payload);
    if (upsertError) {
      setError(upsertError.message);
      setSavingOpenAi(false);
      return;
    }

    setSavedFlags((prev) => ({ ...prev, openAiApiKey: prev.openAiApiKey || Boolean(openAiKey.trim()) }));
    setOpenAiKey("");
    setNotice("OpenAI API Key guardada.");
    setSavingOpenAi(false);
  };

  const saveWhatsapp = async () => {
    if (!userId) return;
    setSavingWhatsapp(true);
    setError(null);
    setNotice(null);

    const clean = whatsappNumber.trim();
    const { error: upsertError } = await supabase
      .from("user_integrations")
      .upsert({ user_id: userId, whatsapp_number: clean });

    if (upsertError) {
      setError(upsertError.message);
      setSavingWhatsapp(false);
      return;
    }

    setSavedWhatsappNumber(clean);
    setSavedFlags((prev) => ({ ...prev, whatsapp: Boolean(clean) }));
    setNotice("Numero de WhatsApp guardado.");
    setSavingWhatsapp(false);
  };

  const whatsappSaved = savedFlags.whatsapp && whatsappNumber.trim() === savedWhatsappNumber && savedWhatsappNumber !== "";

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header>
          <h1 className="text-3xl font-bold text-[#111827] sm:text-4xl">Integraciones</h1>
          <p className="mt-2 text-sm text-slate-600">
            Configura conexiones para analisis y automatizacion de campanas.
          </p>
        </header>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}
        {notice ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>
        ) : null}

        <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">Everflow</h2>
                <p className="mt-1 text-sm text-slate-600">Configura API para escritura de datos.</p>
              </div>
              <span className="whitespace-nowrap rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                Integracion
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">API Key</span>
                <input
                  type="password"
                  value={everflowApiKey}
                  onChange={(event) => setEverflowApiKey(event.target.value)}
                  placeholder="Ingresa la API Key de Everflow"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-0 focus:border-[#1D293D]"
                />
              </label>
              <SecretSavedDots show={savedFlags.everflowApiKey} />

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Region</span>
                <select
                  value={everflowRegion}
                  onChange={(event) => setEverflowRegion(event.target.value as EverflowRegion)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-0 focus:border-[#1D293D]"
                >
                  <option value="US">US</option>
                  <option value="EU">EU</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo de acceso</span>
                <select
                  value={everflowAccessType}
                  onChange={(event) => setEverflowAccessType(event.target.value as EverflowAccessType)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-0 focus:border-[#1D293D]"
                >
                  <option value="Network">Network</option>
                  <option value="Affiliate">Affiliate</option>
                  <option value="Advertiser">Advertiser</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={saveEverflow}
              disabled={loading || savingEverflow}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#1D293D] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingEverflow ? "Guardando..." : "Guardar Everflow"}
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
              <SecretSavedDots show={savedFlags.openAiApiKey} />
            </div>

            <button
              type="button"
              onClick={saveOpenAi}
              disabled={loading || savingOpenAi}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#1D293D] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingOpenAi ? "Guardando..." : "Guardar OpenAI"}
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

            <div className="mt-4 max-w-xl">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Numero
                </span>
                <div className="relative">
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(event) => setWhatsappNumber(event.target.value)}
                    placeholder="+51 999 999 999"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-800 outline-none ring-0 focus:border-[#1D293D]"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center">
                    <FieldStatusIcon saved={whatsappSaved} />
                  </span>
                </div>
              </label>
            </div>

            <button
              type="button"
              onClick={saveWhatsapp}
              disabled={loading || savingWhatsapp}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#1D293D] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingWhatsapp ? "Guardando..." : "Guardar WhatsApp"}
            </button>
          </article>
        </section>
      </div>
    </main>
  );
}

function SecretSavedDots({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="mt-2 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
      {Array.from({ length: 8 }).map((_, index) => (
        <span key={index} className="h-2 w-2 rounded-full bg-slate-400" />
      ))}
      <span className="ml-1 text-xs text-slate-500">Guardada</span>
    </div>
  );
}

function FieldStatusIcon({ saved }: { saved: boolean }) {
  if (saved) {
    return (
      <svg viewBox="0 0 16 16" className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3.2 8.3 2.8 2.8 6.8-6.8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 text-amber-500" fill="currentColor">
      <circle cx="8" cy="8" r="6" />
    </svg>
  );
}

