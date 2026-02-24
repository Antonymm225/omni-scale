"use client";
import { useLocale } from "../../../providers/LocaleProvider";

export default function Page() {
  const { locale } = useLocale();
  const isEn = locale === "en";

  return (
    <main className="min-h-screen bg-[#f3f5f9] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-3xl font-semibold text-[#111827] sm:text-4xl">{isEn ? "Audiences" : "Audiencias"}</h1>
        <p className="mt-3 text-base text-slate-600">
          {isEn ? "Define segments and targeting strategies." : "Define segmentos y estrategias de publico objetivo."}
        </p>
      </div>
    </main>
  );
}
