"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

type OnboardingRow = {
  company_name: string | null;
  business_type: string | null;
  plan: string | null;
  assets_connected: boolean | null;
  business_description?: string | null;
  business_goals?: string | null;
};

type Step = {
  key: string;
  title: string;
  description: string;
  href: string;
  completed: boolean;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);

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

      let onboardingData: OnboardingRow | null = null;
      const onboardingRes = await supabase
        .from("user_onboarding")
        .select("company_name,business_type,plan,assets_connected,business_description,business_goals")
        .eq("user_id", user.id)
        .maybeSingle();

      if (onboardingRes.error) {
        const fallbackRes = await supabase
          .from("user_onboarding")
          .select("company_name,business_type,plan,assets_connected")
          .eq("user_id", user.id)
          .maybeSingle();

        if (fallbackRes.error) {
          setError(fallbackRes.error.message);
          setLoading(false);
          return;
        }
        onboardingData = (fallbackRes.data || null) as OnboardingRow | null;
      } else {
        onboardingData = (onboardingRes.data || null) as OnboardingRow | null;
      }

      const integrationsRes = await supabase
        .from("user_integrations")
        .select("openai_api_key")
        .eq("user_id", user.id)
        .maybeSingle();
      if (integrationsRes.error) {
        setError(integrationsRes.error.message);
        setLoading(false);
        return;
      }

      const profileRes = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

      const hasPlan = Boolean(onboardingData?.plan && onboardingData.plan.trim());
      const hasAssets = Boolean(onboardingData?.assets_connected);
      const hasOpenAi = Boolean(
        (integrationsRes.data?.openai_api_key as string | null) &&
          (integrationsRes.data?.openai_api_key as string).trim()
      );
      const hasBusinessGoals = Boolean(
        onboardingData?.business_description?.trim() && onboardingData?.business_goals?.trim()
      );
      const launchedAi = Boolean(profileRes.data?.onboarding_completed);

      const nextSteps: Step[] = [
        {
          key: "plan",
          title: "Seleccionar plan de OMNI Scale",
          description: hasPlan ? `Plan actual: ${onboardingData?.plan}` : "Elige el plan que usaras para operar.",
          href: hasPlan ? "/mi-cuenta/facturacion" : "/setup/choose-plan",
          completed: hasPlan,
        },
        {
          key: "assets",
          title: "Conectar cuenta de Facebook",
          description: hasAssets
            ? "Tu conexion y activos de Meta ya estan sincronizados."
            : "Conecta Meta para importar activos y metricas.",
          href: "/assets/facebook-conexion",
          completed: hasAssets,
        },
        {
          key: "credentials",
          title: "Agregar credenciales de IA",
          description: hasOpenAi
            ? "OpenAI API Key configurada."
            : "Configura tu API Key para analisis y recomendaciones.",
          href: "/assets/integraciones",
          completed: hasOpenAi,
        },
        {
          key: "business",
          title: "Definir objetivos de negocio",
          description: hasBusinessGoals
            ? "Descripcion y objetivos guardados para la IA."
            : "Completa contexto del negocio para personalizar el modelo.",
          href: "/assets/mi-negocio",
          completed: hasBusinessGoals,
        },
        {
          key: "launch",
          title: "Lanzar campaña IA",
          description: launchedAi
            ? "Scale AI ya esta operativo."
            : "Ingresa a Scale AI para iniciar tu primer flujo.",
          href: "/ai-ads",
          completed: launchedAi,
        },
      ];

      setSteps(nextSteps);
      setLoading(false);
    };

    void load();
  }, []);

  const completedCount = useMemo(() => steps.filter((step) => step.completed).length, [steps]);
  const totalSteps = steps.length || 5;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header>
          <h2 className="text-4xl font-bold text-[#111827]">Onboarding</h2>
          <p className="mt-2 text-lg text-slate-600">
            Completa estos pasos para lanzar campañas a escala.
          </p>
        </header>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="mt-6 rounded-2xl bg-gradient-to-r from-[#161820] to-[#2a2b1e] p-5 text-white shadow-sm">
          <p className="text-2xl font-semibold">Guía de inicio y video</p>
          <p className="mt-1 text-base text-slate-200">
            Mira el tutorial completo para configurar todo rápidamente.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-semibold text-[#111827]">Progreso de setup</p>
            <p className="text-sm font-semibold text-violet-600">{progressPercent}%</p>
          </div>
          <p className="mt-2 text-base text-slate-600">
            {completedCount} de {totalSteps} pasos completados
          </p>
          <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-violet-600 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-4 text-base text-slate-600">
            Completa los pasos siguientes para activar todo el sistema.
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="px-5 py-6 text-sm text-slate-500">Cargando pasos...</div>
          ) : (
            steps.map((step) => (
              <StepRow
                key={step.key}
                title={step.title}
                description={step.description}
                status={step.completed ? "ok" : "todo"}
                actionLabel={step.completed ? "Ver" : "Iniciar"}
                onClick={() => router.push(step.href)}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}

function StepRow({
  title,
  description,
  status,
  actionLabel,
  onClick,
}: {
  title: string;
  description: string;
  status: "ok" | "todo";
  actionLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 last:border-b-0">
      <div className="flex items-start gap-4">
        <div
          className={`mt-1 flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${
            status === "ok"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-violet-100 text-violet-700"
          }`}
        >
          {status === "ok" ? "✓" : "→"}
        </div>
        <div>
          <p className="text-xl font-semibold text-[#111827]">{title}</p>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </div>

      <button
        onClick={onClick}
        className={`rounded-lg px-4 py-2 text-sm font-semibold ${
          status === "ok"
            ? "text-slate-600 hover:bg-slate-100"
            : "bg-violet-600 text-white hover:bg-violet-700"
        }`}
      >
        {actionLabel}
      </button>
    </div>
  );
}
