"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function BusinessTypePage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSaving(true);

    const payload = {
      company_name: companyName.trim(),
      business_type: businessType,
    };

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage("No se pudo identificar al usuario. Vuelve a iniciar sesion.");
      setIsSaving(false);
      return;
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from("user_onboarding")
      .update(payload)
      .eq("user_id", user.id)
      .select("user_id");

    if (updateError) {
      setErrorMessage(updateError.message);
      setIsSaving(false);
      return;
    }

    if (!updatedRows || updatedRows.length === 0) {
      const { error: insertError } = await supabase.from("user_onboarding").insert({
        user_id: user.id,
        ...payload,
      });

      if (insertError) {
        setErrorMessage(insertError.message);
        setIsSaving(false);
        return;
      }
    }

    router.push("/setup/choose-plan");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] px-6 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
        <div className="mb-10 flex justify-center">
          <Image
            src="/omniscale-color-logo-complete.png"
            alt="OMNI Scale"
            width={220}
            height={122}
            priority
            className="h-auto w-[220px]"
          />
        </div>

        <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <h1 className="text-center text-3xl font-semibold tracking-tight text-slate-900">
            Cuentanos sobre tu negocio
          </h1>
          <p className="mt-3 text-center text-sm text-slate-500 sm:text-base">
            Esto nos ayudara a personalizar tu experiencia en OMNI Scale
          </p>

          <form onSubmit={handleContinue} className="mt-10 space-y-6">
            <div>
              <label
                htmlFor="company_name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Nombre de la empresa
              </label>
              <input
                id="company_name"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Divina SAC"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label
                htmlFor="business_type"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Tipo de negocio
              </label>
              <select
                id="business_type"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                required
                className={`w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 ${
                  businessType ? "text-[#1D293D]" : "text-slate-400"
                }`}
              >
                <option value="" disabled hidden>
                  Selecciona el tipo de negocio
                </option>
                <option value="Marca" className="text-[#1D293D]">
                  Marca
                </option>
                <option value="Agencia" className="text-[#1D293D]">
                  Agencia
                </option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="mt-2 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Guardando..." : "Continuar"}
            </button>

            {errorMessage && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
