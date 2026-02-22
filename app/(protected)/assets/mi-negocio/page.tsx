"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type BusinessForm = {
  company_name: string;
  business_type: string;
  business_description: string;
  business_goals: string;
};

export default function MiNegocioPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState<BusinessForm>({
    company_name: "",
    business_type: "",
    business_description: "",
    business_goals: "",
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

      const onboardingRes = await supabase
        .from("user_onboarding")
        .select("company_name,business_type,business_description,business_goals")
        .eq("user_id", user.id)
        .maybeSingle();

      if (onboardingRes.error) {
        const fallbackRes = await supabase
          .from("user_onboarding")
          .select("company_name,business_type")
          .eq("user_id", user.id)
          .maybeSingle();

        if (fallbackRes.error) {
          setError(fallbackRes.error.message);
          setLoading(false);
          return;
        }

        setForm({
          company_name: (fallbackRes.data?.company_name as string | null) || "",
          business_type: (fallbackRes.data?.business_type as string | null) || "",
          business_description: "",
          business_goals: "",
        });
        setLoading(false);
        return;
      }

      setForm({
        company_name: (onboardingRes.data?.company_name as string | null) || "",
        business_type: (onboardingRes.data?.business_type as string | null) || "",
        business_description: (onboardingRes.data?.business_description as string | null) || "",
        business_goals: (onboardingRes.data?.business_goals as string | null) || "",
      });
      setLoading(false);
    };

    void load();
  }, []);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setError("No se pudo validar la sesion.");
      setSaving(false);
      return;
    }

    const payload = {
      company_name: form.company_name.trim(),
      business_type: form.business_type.trim(),
      business_description: form.business_description.trim(),
      business_goals: form.business_goals.trim(),
    };

    const { data: updatedRows, error: updateError } = await supabase
      .from("user_onboarding")
      .update(payload)
      .eq("user_id", user.id)
      .select("user_id");

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    if (!updatedRows || updatedRows.length === 0) {
      const { error: insertError } = await supabase.from("user_onboarding").insert({
        user_id: user.id,
        ...payload,
      });
      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    setNotice("Datos del negocio guardados correctamente.");
    setSaving(false);
  };

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <header>
          <h1 className="text-3xl font-bold text-[#111827] sm:text-4xl">Mi negocio</h1>
          <p className="mt-2 text-sm text-slate-600">
            Este contexto se usará para personalizar recomendaciones y respuestas del modelo.
          </p>
        </header>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}
        {notice ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>
        ) : null}

        <form onSubmit={handleSave} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-slate-500">Cargando datos...</p>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Nombre del negocio
                  </span>
                  <input
                    type="text"
                    value={form.company_name}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, company_name: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1D293D]"
                    placeholder="Ej: OMNI Agencia"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tipo de negocio
                  </span>
                  <select
                    value={form.business_type}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, business_type: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1D293D]"
                    required
                  >
                    <option value="" disabled>
                      Selecciona tipo
                    </option>
                    <option value="Marca">Marca</option>
                    <option value="Agencia">Agencia</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Descripción de la empresa
                </span>
                <textarea
                  value={form.business_description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, business_description: event.target.value }))
                  }
                  className="min-h-[120px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1D293D]"
                  placeholder="Describe tu propuesta de valor, nicho, ticket promedio y mercado."
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Objetivos de la empresa
                </span>
                <textarea
                  value={form.business_goals}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, business_goals: event.target.value }))
                  }
                  className="min-h-[120px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1D293D]"
                  placeholder="Ej: aumentar leads calificados, mejorar ROAS, escalar campañas."
                  required
                />
              </label>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-lg bg-[#1D293D] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
