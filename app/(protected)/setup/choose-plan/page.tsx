"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

type BillingCycle = "monthly" | "yearly";

type Plan = {
  name: string;
  monthlyPrice: number;
  highlighted?: boolean;
  badge?: string;
  description: string;
  features: string[];
};

const plans: Plan[] = [
  {
    name: "Basic",
    monthlyPrice: 39,
    description: "Para empezar y validar tus campanas.",
    features: [
      "1 usuario",
      "1 BM",
      "Multiples cuentas publicitarias",
      "Multiples Fan Pages",
      "Variantes y plantillas de campana",
    ],
  },
  {
    name: "Standard",
    monthlyPrice: 59,
    highlighted: true,
    badge: "Mas vendida",
    description: "Para equipos que escalan con automatizacion.",
    features: [
      "3 usuarios",
      "Todo lo de Basic",
      "Automatizaciones y reglas",
      "Variantes y plantillas de campana",
      "Creativos con AI",
      "Respuestas a comentarios",
      "3 BM",
    ],
  },
  {
    name: "Enterprise",
    monthlyPrice: 129,
    description: "Para operacion avanzada y crecimiento sin limites.",
    features: [
      "Usuarios ilimitados",
      "BM y cuentas ilimitadas",
      "Automatizaciones",
      "Plantillas",
      "Creativos con AI",
      "Respuestas a comentarios",
      "Todo incluido",
    ],
  },
];

function formatPrice(monthlyPrice: number, cycle: BillingCycle) {
  if (cycle === "monthly") return monthlyPrice;
  return Math.round(monthlyPrice * 0.8);
}

export default function ChoosePlanPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [errorMessage, setErrorMessage] = useState("");
  const [savingPlan, setSavingPlan] = useState<string | null>(null);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/signin");
  };

  const subtitle = useMemo(() => {
    if (billingCycle === "yearly") {
      return "Facturacion anual activa: 20% OFF aplicado";
    }

    return "Elige el plan ideal para tu negocio";
  }, [billingCycle]);

  const handleSelectPlan = async (planName: string) => {
    setErrorMessage("");
    setSavingPlan(planName);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage("No se pudo identificar al usuario. Vuelve a iniciar sesion.");
      setSavingPlan(null);
      return;
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from("user_onboarding")
      .update({ plan: planName })
      .eq("user_id", user.id)
      .select("user_id");

    if (updateError) {
      setErrorMessage(updateError.message);
      setSavingPlan(null);
      return;
    }

    if (!updatedRows || updatedRows.length === 0) {
      const { error: insertError } = await supabase.from("user_onboarding").insert({
        user_id: user.id,
        plan: planName,
      });

      if (insertError) {
        setErrorMessage(insertError.message);
        setSavingPlan(null);
        return;
      }
    }

    router.push("/setup/connect-assets");
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
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

        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[#1D293D] sm:text-4xl">
            Elige tu plan
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">{subtitle}</p>
        </div>

        <div className="mx-auto mt-8 flex w-fit items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition sm:px-5 ${
              billingCycle === "monthly"
                ? "bg-[#1D293D] text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Mensual
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition sm:px-5 ${
              billingCycle === "yearly"
                ? "bg-[#1D293D] text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Anual
          </button>
          <span className="ml-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            20% OFF
          </span>
        </div>

        {errorMessage && (
          <p className="mt-4 text-center text-sm text-red-600">{errorMessage}</p>
        )}

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const price = formatPrice(plan.monthlyPrice, billingCycle);

            return (
              <article
                key={plan.name}
                className={`relative flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm transition ${
                  plan.highlighted
                    ? "border-[#1D293D] shadow-xl ring-2 ring-[#1D293D]/15"
                    : "border-slate-200"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-6 rounded-full bg-[#1D293D] px-3 py-1 text-xs font-semibold text-white">
                    {plan.badge}
                  </span>
                )}

                <h2 className="text-xl font-bold text-[#1D293D]">{plan.name}</h2>
                <p className="mt-2 text-sm text-slate-600">{plan.description}</p>

                <div className="mt-5">
                  <p className="flex items-end gap-1">
                    <span className="text-4xl font-bold tracking-tight text-[#1D293D]">
                      ${price}
                    </span>
                    <span className="mb-1 text-sm text-slate-500">/mes</span>
                  </p>
                  {billingCycle === "yearly" && (
                    <p className="mt-1 text-xs font-medium text-emerald-700">
                      Antes ${plan.monthlyPrice}/mes
                    </p>
                  )}
                </div>

                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="mt-0.5 text-[#1D293D]">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handleSelectPlan(plan.name)}
                  disabled={savingPlan !== null}
                  className={`mt-7 w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    plan.highlighted
                      ? "bg-[#1D293D] text-white hover:opacity-90"
                      : "border border-slate-300 text-[#1D293D] hover:border-[#1D293D]"
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  {savingPlan === plan.name ? "Guardando..." : `Elegir ${plan.name}`}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
