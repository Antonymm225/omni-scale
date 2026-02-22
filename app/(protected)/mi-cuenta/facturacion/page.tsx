"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

type OnboardingPlanRow = {
  plan: string | null;
};

const PLAN_OPTIONS = ["Basic", "Standard", "Enterprise"];

export default function FacturacionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("Standard");

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

      const { data, error } = await supabase
        .from("user_onboarding")
        .select("plan")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const row = (data || null) as OnboardingPlanRow | null;
      if (row?.plan && PLAN_OPTIONS.includes(row.plan)) {
        setCurrentPlan(row.plan);
      }
      setLoading(false);
    };

    void load();
  }, []);

  const savePlan = async () => {
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

    const { data: updatedRows, error: updateError } = await supabase
      .from("user_onboarding")
      .update({ plan: currentPlan })
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
        plan: currentPlan,
      });
      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    setNotice("Plan actualizado correctamente.");
    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-[#f3f5f9] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#111827] sm:text-4xl">Facturación</h1>
            <p className="mt-2 text-sm text-slate-600">
              Gestiona tu plan, historial de cobros y cancelación.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/mi-cuenta")}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Volver a mi cuenta
          </button>
        </header>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}
        {notice ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>
        ) : null}

        <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-lg font-semibold text-[#111827]">Membresía actual</h2>
          {loading ? (
            <p className="mt-2 text-sm text-slate-500">Cargando plan actual...</p>
          ) : (
            <>
              <p className="mt-2 text-sm text-slate-600">Selecciona tu plan:</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {PLAN_OPTIONS.map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => setCurrentPlan(plan)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      currentPlan === plan
                        ? "border-[#1D293D] bg-[#1D293D] text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {plan}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={savePlan}
                disabled={saving}
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#1D293D] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Guardar plan"}
              </button>
            </>
          )}
        </section>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-[#111827]">Historial de cobros</h2>
          <p className="mt-2 text-sm text-slate-600">
            Próximamente mostraremos aquí tus cobros y facturas.
          </p>
        </section>

        <section className="mt-5 rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="text-lg font-semibold text-red-700">Cancelar membresía</h2>
          <p className="mt-2 text-sm text-red-600">
            Próximamente podrás cancelar tu membresía desde esta sección.
          </p>
        </section>
      </div>
    </main>
  );
}
