"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useLocale } from "../../../providers/LocaleProvider";

type EverflowRegion = "US" | "EU";
type EverflowAccessType = "Network" | "Affiliate" | "Advertiser";

type SavedFlags = {
  everflowApiKey: boolean;
  openAiApiKey: boolean;
  whatsapp: boolean;
};

export default function IntegracionesPage() {
  const { locale } = useLocale();
  const isEn = locale === "en";
  const [loading, setLoading] = useState(true);
  const [savingEverflow, setSavingEverflow] = useState(false);
  const [savingOpenAi, setSavingOpenAi] = useState(false);
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [verifyingWhatsapp, setVerifyingWhatsapp] = useState(false);
  const [savingWhatsappNotifications, setSavingWhatsappNotifications] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [openAiKey, setOpenAiKey] = useState("");
  const [everflowApiKey, setEverflowApiKey] = useState("");
  const [everflowRegion, setEverflowRegion] = useState<EverflowRegion>("US");
  const [everflowAccessType, setEverflowAccessType] = useState<EverflowAccessType>("Network");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappCode, setWhatsappCode] = useState("");
  const [whatsappVerified, setWhatsappVerified] = useState(false);
  const [whatsappHasPendingCode, setWhatsappHasPendingCode] = useState(false);
  const [editingWhatsappNumber, setEditingWhatsappNumber] = useState(false);
  const [whatsappNotificationsEnabled, setWhatsappNotificationsEnabled] = useState(true);
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
        setError(isEn ? "Could not validate session." : "No se pudo validar la sesion.");
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
        const loadedWhatsapp = data.whatsapp_number || "";
        setWhatsappNumber(loadedWhatsapp);
        setSavedWhatsappNumber(loadedWhatsapp.replace(/\D/g, ""));
        const { data: whatsappMeta, error: whatsappMetaError } = await supabase
          .from("user_integrations")
          .select("whatsapp_verified,whatsapp_verification_code,whatsapp_last_error,whatsapp_notifications_enabled")
          .eq("user_id", user.id)
          .maybeSingle();
        let whatsappIsConnected = Boolean(loadedWhatsapp);
        if (!whatsappMetaError) {
          setWhatsappVerified(Boolean(whatsappMeta?.whatsapp_verified));
          setWhatsappHasPendingCode(Boolean(whatsappMeta?.whatsapp_verification_code));
          setWhatsappError((whatsappMeta?.whatsapp_last_error as string | null) || null);
          setWhatsappNotificationsEnabled(
            (whatsappMeta?.whatsapp_notifications_enabled as boolean | null | undefined) ?? true
          );
          whatsappIsConnected = Boolean(loadedWhatsapp) && Boolean(whatsappMeta?.whatsapp_verified);
        } else {
          setWhatsappVerified(Boolean(loadedWhatsapp));
          setWhatsappHasPendingCode(false);
          setWhatsappError(null);
          setWhatsappNotificationsEnabled(true);
        }
        setSavedFlags({
          everflowApiKey: Boolean(data.everflow_api_key),
          openAiApiKey: Boolean(data.openai_api_key),
          whatsapp: whatsappIsConnected,
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
    setNotice(isEn ? "Everflow integration saved." : "Integracion Everflow guardada.");
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
    setNotice(isEn ? "OpenAI API key saved." : "OpenAI API Key guardada.");
    setSavingOpenAi(false);
  };

  const sendWhatsappCode = async () => {
    if (!userId) return;
    setSavingWhatsapp(true);
    setError(null);
    setNotice(null);
    setWhatsappError(null);

    const clean = whatsappNumber.trim();
    if (!clean) {
      setWhatsappError(isEn ? "Enter a WhatsApp number." : "Ingresa un numero de WhatsApp.");
      setSavingWhatsapp(false);
      return;
    }

    const response = await fetch("/api/integrations/whatsapp/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ number: clean }),
    });
    const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: string };
    if (!response.ok || !payload.success) {
      setWhatsappError(payload.error || (isEn ? "Could not send verification message." : "No se pudo enviar mensaje de verificacion."));
      setSavingWhatsapp(false);
      return;
    }

    setWhatsappVerified(false);
    setWhatsappHasPendingCode(true);
    setSavedWhatsappNumber(clean.replace(/\D/g, ""));
    setSavedFlags((prev) => ({ ...prev, whatsapp: false }));
    setNotice(isEn ? "Verification code sent to WhatsApp. Enter it to verify." : "Te enviamos un codigo por WhatsApp. Ingresalo para verificar.");
    setSavingWhatsapp(false);
  };

  const verifyWhatsappCode = async () => {
    if (!userId) return;
    setVerifyingWhatsapp(true);
    setError(null);
    setNotice(null);
    setWhatsappError(null);

    const clean = whatsappNumber.trim();
    const code = whatsappCode.trim().toUpperCase();
    if (!clean || code.length !== 4) {
      setWhatsappError(isEn ? "Enter the 4-character code." : "Ingresa el codigo de 4 caracteres.");
      setVerifyingWhatsapp(false);
      return;
    }

    const response = await fetch("/api/integrations/whatsapp/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ number: clean, code }),
    });
    const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: string };
    if (!response.ok || !payload.success) {
      setWhatsappError(payload.error || (isEn ? "Could not verify the code." : "No se pudo verificar el codigo."));
      setVerifyingWhatsapp(false);
      return;
    }

    const normalized = clean.replace(/\D/g, "");
    setWhatsappCode("");
    setWhatsappVerified(true);
    setWhatsappHasPendingCode(false);
    setEditingWhatsappNumber(false);
    setSavedWhatsappNumber(normalized);
    setSavedFlags((prev) => ({ ...prev, whatsapp: true }));
    setNotice(isEn ? "WhatsApp connected." : "WhatsApp conectado.");
    setVerifyingWhatsapp(false);
  };

  const toggleWhatsappNotifications = async () => {
    if (!userId) return;
    setSavingWhatsappNotifications(true);
    setError(null);
    setNotice(null);

    const next = !whatsappNotificationsEnabled;
    const { error: upsertError } = await supabase
      .from("user_integrations")
      .upsert({ user_id: userId, whatsapp_notifications_enabled: next });

    if (upsertError) {
      const message = (upsertError.message || "").toLowerCase();
      if (message.includes("whatsapp_notifications_enabled")) {
        setError(
          isEn
            ? "Missing whatsapp_notifications_enabled in user_integrations. Run the migration SQL."
            : "Falta la columna whatsapp_notifications_enabled en user_integrations. Ejecuta el SQL de actualizacion."
        );
      } else {
        setError(upsertError.message);
      }
      setSavingWhatsappNotifications(false);
      return;
    }

    setWhatsappNotificationsEnabled(next);
    setNotice(next ? (isEn ? "AI notifications enabled." : "Notificaciones AI activadas.") : (isEn ? "AI notifications paused." : "Notificaciones AI pausadas."));
    setSavingWhatsappNotifications(false);
  };

  const normalizedCurrentWhatsapp = whatsappNumber.replace(/\D/g, "");
  const whatsappSaved =
    savedFlags.whatsapp &&
    normalizedCurrentWhatsapp === savedWhatsappNumber &&
    savedWhatsappNumber !== "" &&
    whatsappVerified;
  const showWhatsappVerificationFlow = !whatsappSaved || editingWhatsappNumber;
  const whatsappCanSend = whatsappSaved && !whatsappError;

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header>
          <h1 className="text-3xl font-bold text-[#111827] sm:text-4xl">{isEn ? "Integrations" : "Integraciones"}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {isEn
              ? "Configure connections for campaign analysis and automation."
              : "Configura conexiones para analisis y automatizacion de campanas."}
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
                <p className="mt-1 text-sm text-slate-600">{isEn ? "Configure API for data writeback." : "Configura API para escritura de datos."}</p>
              </div>
              <span className="whitespace-nowrap rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                {isEn ? "Integration" : "Integracion"}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">API Key</span>
                <input
                  type="password"
                  value={everflowApiKey}
                  onChange={(event) => setEverflowApiKey(event.target.value)}
                  placeholder={isEn ? "Enter Everflow API key" : "Ingresa la API Key de Everflow"}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-0 focus:border-[#1D293D]"
                />
              </label>
              <SecretSavedDots show={savedFlags.everflowApiKey} label={isEn ? "Saved" : "Guardada"} />

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{isEn ? "Region" : "Region"}</span>
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
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{isEn ? "Access type" : "Tipo de acceso"}</span>
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
              {savingEverflow ? (isEn ? "Saving..." : "Guardando...") : (isEn ? "Save Everflow" : "Guardar Everflow")}
            </button>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">OpenAI API Key</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {isEn
                    ? "Core key for intelligent campaign analysis and recommendations."
                    : "Base para analisis inteligente de campanas y recomendaciones."}
                </p>
              </div>
              <span className="whitespace-nowrap rounded-full border border-sky-300 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">
                {isEn ? "Core ready" : "Base lista"}
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
              <SecretSavedDots show={savedFlags.openAiApiKey} label={isEn ? "Saved" : "Guardada"} />
            </div>

            <button
              type="button"
              onClick={saveOpenAi}
              disabled={loading || savingOpenAi}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#1D293D] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingOpenAi ? (isEn ? "Saving..." : "Guardando...") : (isEn ? "Save OpenAI" : "Guardar OpenAI")}
            </button>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">WhatsApp</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {isEn
                    ? "Number used for notifications and AI messages."
                    : "Numero para notificaciones y para recibir mensajes del AI."}
                </p>
              </div>
              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                {isEn ? "Configurable" : "Configurable"}
              </span>
            </div>

            <div className="mt-4 max-w-xl">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {isEn ? "Number" : "Numero"}
                </span>
                <div className="relative">
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(event) => {
                      setWhatsappNumber(event.target.value);
                      setWhatsappVerified(false);
                    }}
                    disabled={!showWhatsappVerificationFlow}
                    placeholder="+51 999 999 999"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-800 outline-none ring-0 focus:border-[#1D293D] disabled:cursor-not-allowed disabled:bg-slate-50"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center">
                    <FieldStatusIcon saved={whatsappSaved} />
                  </span>
                </div>
              </label>
              {whatsappError ? (
                <p className="mt-2 text-xs text-red-600">{whatsappError}</p>
              ) : whatsappSaved ? (
                <p className="mt-2 text-xs text-emerald-600">{isEn ? "WhatsApp connected." : "WhatsApp conectado."}</p>
              ) : whatsappHasPendingCode ? (
                <p className="mt-2 text-xs text-amber-600">{isEn ? "Code sent. Verify to save." : "Codigo enviado. Verifica para guardar."}</p>
              ) : (
                <p className="mt-2 text-xs text-slate-500">{isEn ? "Not verified yet." : "Aun no verificado."}</p>
              )}
              <p
                className={`mt-1 text-xs font-medium ${
                  whatsappCanSend ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {isEn ? "Connection status" : "Estado de conexion"}:{" "}
                {whatsappCanSend ? (isEn ? "Sending messages" : "Enviando mensajes") : (isEn ? "Cannot send messages" : "No se puede enviar mensajes")}
              </p>
              <p
                className={`mt-1 text-xs font-medium ${
                  whatsappNotificationsEnabled ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {isEn ? "AI notifications" : "Notificaciones IA"}: {whatsappNotificationsEnabled ? (isEn ? "Enabled" : "Activas") : (isEn ? "Paused" : "Pausadas")}
              </p>

              {showWhatsappVerificationFlow ? (
                <label className="mt-3 block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {isEn ? "Verification code" : "Codigo de verificacion"}
                  </span>
                  <input
                    type="text"
                    maxLength={4}
                    value={whatsappCode}
                    onChange={(event) => setWhatsappCode(event.target.value.toUpperCase())}
                    placeholder="AB12"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm uppercase tracking-[0.2em] text-slate-800 outline-none ring-0 focus:border-[#1D293D]"
                  />
                </label>
              ) : null}
            </div>

            {showWhatsappVerificationFlow ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={sendWhatsappCode}
                  disabled={loading || savingWhatsapp}
                  className="inline-flex items-center justify-center rounded-lg bg-[#1D293D] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingWhatsapp
                    ? (isEn ? "Sending..." : "Enviando...")
                    : whatsappHasPendingCode
                      ? (isEn ? "Resend code" : "Reenviar codigo")
                      : (isEn ? "Send code" : "Enviar codigo")}
                </button>
                <button
                  type="button"
                  onClick={verifyWhatsappCode}
                  disabled={loading || verifyingWhatsapp}
                  className="inline-flex items-center justify-center rounded-lg border border-[#1D293D] bg-white px-4 py-2 text-sm font-semibold text-[#1D293D] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {verifyingWhatsapp ? (isEn ? "Verifying..." : "Verificando...") : (isEn ? "Verify number" : "Verificar numero")}
                </button>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={toggleWhatsappNotifications}
                  disabled={loading || savingWhatsappNotifications}
                  className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                    whatsappNotificationsEnabled
                      ? "border border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100"
                      : "border border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  {savingWhatsappNotifications
                    ? (isEn ? "Saving..." : "Guardando...")
                    : whatsappNotificationsEnabled
                      ? (isEn ? "Pause AI notifications" : "Pausar notificaciones IA")
                      : (isEn ? "Resume AI notifications" : "Reanudar notificaciones IA")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingWhatsappNumber(true);
                    setWhatsappVerified(false);
                    setWhatsappHasPendingCode(false);
                    setWhatsappCode("");
                    setWhatsappError(null);
                    setSavedFlags((prev) => ({ ...prev, whatsapp: false }));
                  }}
                  className="inline-flex items-center justify-center rounded-lg border border-[#1D293D] bg-white px-4 py-2 text-sm font-semibold text-[#1D293D] hover:bg-slate-50"
                >
                  {isEn ? "Change number" : "Cambiar numero"}
                </button>
              </div>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}

function SecretSavedDots({ show, label }: { show: boolean; label: string }) {
  if (!show) return null;
  return (
    <div className="mt-2 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
      {Array.from({ length: 8 }).map((_, index) => (
        <span key={index} className="h-2 w-2 rounded-full bg-slate-400" />
      ))}
      <span className="ml-1 text-xs text-slate-500">{label}</span>
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
