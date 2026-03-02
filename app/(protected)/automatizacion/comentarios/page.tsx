"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocale } from "../../../providers/LocaleProvider";

type Rule = {
  id: string;
  facebook_page_id: string;
  keyword: string;
  reply_message: string;
  send_dm: boolean;
  dm_message: string | null;
  is_active: boolean;
  created_at: string;
};

type PageItem = {
  facebook_page_id: string;
  name: string | null;
};

type RunSummary = {
  pagesProcessed: number;
  processedComments: number;
  matchedComments: number;
  publicRepliesSent: number;
  dmSent: number;
  dmFailed: number;
};

export default function Page() {
  const { locale } = useLocale();
  const isEn = locale === "en";

  const [rules, setRules] = useState<Rule[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);

  const [selectedPageId, setSelectedPageId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [sendDm, setSendDm] = useState(false);
  const [dmMessage, setDmMessage] = useState("");

  const pagesMap = useMemo(() => new Map(pages.map((page) => [page.facebook_page_id, page.name || page.facebook_page_id])), [pages]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/automation/comments/rules", { cache: "no-store" });
      const payload = (await response.json()) as { rules?: Rule[]; pages?: PageItem[]; error?: string };
      if (!response.ok) throw new Error(payload.error || (isEn ? "Could not load comments automation." : "No se pudo cargar la automatizacion."));

      setRules(payload.rules || []);
      setPages(payload.pages || []);
      if (!selectedPageId && (payload.pages || []).length > 0) {
        setSelectedPageId((payload.pages || [])[0].facebook_page_id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : isEn ? "Could not load data." : "No se pudo cargar la data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/automation/comments/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          facebook_page_id: selectedPageId,
          keyword,
          reply_message: replyMessage,
          send_dm: sendDm,
          dm_message: sendDm ? dmMessage : null,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || (isEn ? "Could not create rule." : "No se pudo crear la regla."));

      setKeyword("");
      setReplyMessage("");
      setSendDm(false);
      setDmMessage("");
      setNotice(isEn ? "Rule created successfully." : "Regla creada correctamente.");
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : isEn ? "Could not save rule." : "No se pudo guardar la regla.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleRule(rule: Rule) {
    setError(null);
    try {
      const response = await fetch(`/api/automation/comments/rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ is_active: !rule.is_active }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || (isEn ? "Could not update rule." : "No se pudo actualizar la regla."));
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : isEn ? "Could not update rule." : "No se pudo actualizar la regla.");
    }
  }

  async function deleteRule(ruleId: string) {
    setError(null);
    try {
      const response = await fetch(`/api/automation/comments/rules/${ruleId}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || (isEn ? "Could not delete rule." : "No se pudo eliminar la regla."));
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : isEn ? "Could not delete rule." : "No se pudo eliminar la regla.");
    }
  }

  async function runNow() {
    setRunning(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/automation/comments/run", { method: "POST" });
      const payload = (await response.json()) as { summary?: RunSummary; error?: string };
      if (!response.ok) throw new Error(payload.error || (isEn ? "Could not run automation." : "No se pudo ejecutar la automatizacion."));
      setRunSummary(payload.summary || null);
      setNotice(isEn ? "Automation executed." : "Automatizacion ejecutada.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : isEn ? "Could not run automation." : "No se pudo ejecutar la automatizacion.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f5f9] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-[#111827] sm:text-4xl">{isEn ? "Comments Automation" : "Automatización de Comentarios"}</h1>
              <p className="mt-2 text-sm text-slate-600">
                {isEn
                  ? "Create keyword rules to auto-reply on comments and optionally send DM."
                  : "Crea reglas por keyword para responder comentarios y opcionalmente enviar DM."}
              </p>
            </div>
            <button
              type="button"
              onClick={runNow}
              disabled={running || loading}
              className="inline-flex items-center rounded-xl bg-[#1D293D] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running ? (isEn ? "Running..." : "Ejecutando...") : isEn ? "Run now" : "Ejecutar ahora"}
            </button>
          </div>

          {notice ? <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p> : null}
          {error ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          {runSummary ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Metric label={isEn ? "Pages" : "Páginas"} value={runSummary.pagesProcessed} />
              <Metric label={isEn ? "Comments" : "Comentarios"} value={runSummary.processedComments} />
              <Metric label={isEn ? "Matched" : "Coincidencias"} value={runSummary.matchedComments} />
              <Metric label={isEn ? "Public replies" : "Respuestas públicas"} value={runSummary.publicRepliesSent} />
              <Metric label="DM" value={runSummary.dmSent} />
              <Metric label={isEn ? "DM failed" : "DM fallidos"} value={runSummary.dmFailed} />
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-[#111827]">{isEn ? "New Rule" : "Nueva regla"}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {isEn
              ? "1) Choose page · 2) Define keyword · 3) Write comment reply · 4) Optional DM · 5) Publish"
              : "1) Elige página · 2) Define keyword · 3) Escribe respuesta · 4) DM opcional · 5) Publicar"}
          </p>

          <form onSubmit={handleCreateRule} className="mt-6 grid gap-4">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">{isEn ? "Page" : "Página"}</span>
              <select
                value={selectedPageId}
                onChange={(event) => setSelectedPageId(event.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none ring-[#1D293D] focus:ring-2"
                required
              >
                <option value="">{isEn ? "Select page..." : "Selecciona página..."}</option>
                {pages.map((page) => (
                  <option key={page.facebook_page_id} value={page.facebook_page_id}>
                    {page.name || page.facebook_page_id}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">{isEn ? "Keyword" : "Keyword"}</span>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder={isEn ? "Example: info" : "Ejemplo: info"}
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none ring-[#1D293D] focus:ring-2"
                required
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">{isEn ? "Public reply" : "Respuesta pública"}</span>
              <textarea
                value={replyMessage}
                onChange={(event) => setReplyMessage(event.target.value)}
                rows={3}
                placeholder={isEn ? "Thanks! We just sent details." : "¡Gracias! Te enviamos los detalles."}
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none ring-[#1D293D] focus:ring-2"
                required
              />
            </label>

            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={sendDm} onChange={(event) => setSendDm(event.target.checked)} />
              {isEn ? "Send DM too (if available)" : "Enviar DM también (si está disponible)"}
            </label>

            {sendDm ? (
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">DM</span>
                <textarea
                  value={dmMessage}
                  onChange={(event) => setDmMessage(event.target.value)}
                  rows={3}
                  placeholder={isEn ? "Hi! Here is the information..." : "¡Hola! Aquí tienes la información..."}
                  className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none ring-[#1D293D] focus:ring-2"
                  required
                />
              </label>
            ) : null}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || loading || pages.length === 0}
                className="inline-flex items-center rounded-xl bg-[#1D293D] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (isEn ? "Publishing..." : "Publicando...") : isEn ? "Publish rule" : "Publicar regla"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-[#111827]">{isEn ? "Rules" : "Reglas"}</h2>
          {loading ? (
            <p className="mt-3 text-sm text-slate-600">{isEn ? "Loading..." : "Cargando..."}</p>
          ) : rules.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">{isEn ? "No rules yet." : "Aún no hay reglas."}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {rules.map((rule) => (
                <article key={rule.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {pagesMap.get(rule.facebook_page_id) || rule.facebook_page_id}
                      </p>
                      <p className="text-sm text-slate-700">
                        <span className="font-medium">{isEn ? "Keyword:" : "Keyword:"}</span> {rule.keyword}
                      </p>
                      <p className="text-sm text-slate-700">
                        <span className="font-medium">{isEn ? "Reply:" : "Respuesta:"}</span> {rule.reply_message}
                      </p>
                      {rule.send_dm ? (
                        <p className="text-sm text-slate-700">
                          <span className="font-medium">DM:</span> {rule.dm_message}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleRule(rule)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          rule.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {rule.is_active ? (isEn ? "Active" : "Activa") : isEn ? "Paused" : "Pausada"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRule(rule.id)}
                        className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700"
                      >
                        {isEn ? "Delete" : "Eliminar"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

