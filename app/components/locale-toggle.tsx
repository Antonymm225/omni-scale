"use client";

import { useLocale } from "../providers/LocaleProvider";

export default function LocaleToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
      <button
        type="button"
        onClick={() => setLocale("es")}
        className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
          locale === "es" ? "bg-[#1D293D] text-white" : "text-slate-600 hover:bg-slate-100"
        }`}
        aria-label="Cambiar a español"
      >
        ES
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
          locale === "en" ? "bg-[#1D293D] text-white" : "text-slate-600 hover:bg-slate-100"
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
    </div>
  );
}
