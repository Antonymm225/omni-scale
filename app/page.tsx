"use client";

import Image from "next/image";
import { useState } from "react";
import LocaleToggle from "./components/locale-toggle";
import { localizePublicPath } from "./lib/locale";
import { useLocale } from "./providers/LocaleProvider";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { locale } = useLocale();
  const isEn = locale === "en";

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-[#111827]">
      <div className="border-b border-slate-800 bg-[#071325] px-4 py-1.5 text-center text-xs text-white">
        <span className="font-semibold">
          {isEn ? "Founding Offer:" : "Oferta de lanzamiento:"}
        </span>{" "}
        {isEn ? "20% off + up to 1,000 AI credits" : "20% off + hasta 1,000 creditos de IA"}
      </div>

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <Image
              src="/omniscale-color-logo-complete.png"
              alt="OMNI Scale"
              width={155}
              height={86}
              priority
              className="h-auto w-[115px] sm:w-[138px]"
            />
          </a>

          <div className="flex items-center gap-2 lg:hidden">
            <LocaleToggle />
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={isEn ? "Open menu" : "Abrir menu"}
            >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M3 6h18" />
              <path d="M3 12h18" />
              <path d="M3 18h18" />
            </svg>
            </button>
          </div>

          <div className="hidden items-center gap-8 lg:flex">
            <nav className="flex items-center gap-8 text-sm font-medium text-slate-700">
              <a href="#plataforma" className="transition hover:text-[#1D293D]">
                {isEn ? "Platform" : "Plataforma"}
              </a>
              <a href="#como-funciona" className="transition hover:text-[#1D293D]">
                {isEn ? "How it works" : "Como funciona"}
              </a>
              <a href="#blog" className="transition hover:text-[#1D293D]">
                Blog
              </a>
              <a href="#precios" className="transition hover:text-[#1D293D]">
                {isEn ? "Pricing" : "Precios"}
              </a>
            </nav>

            <div className="flex items-center gap-4">
              <a
                href={localizePublicPath(locale, "/signin")}
                className="text-sm font-medium text-slate-700 transition hover:text-[#1D293D]"
              >
                {isEn ? "Sign in" : "Iniciar sesion"}
              </a>
              <LocaleToggle />
              <a
                href={localizePublicPath(locale, "/signup")}
                className="rounded-xl bg-[#0f1d36] px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                {isEn ? "Start free trial" : "Probar gratis"}
              </a>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
            <nav className="flex flex-col gap-3 text-sm text-slate-700">
              <a href="#plataforma">{isEn ? "Platform" : "Plataforma"}</a>
              <a href="#como-funciona">{isEn ? "How it works" : "Como funciona"}</a>
              <a href="#blog">Blog</a>
              <a href="#precios">{isEn ? "Pricing" : "Precios"}</a>
            </nav>
            <div className="mt-4 flex gap-3">
              <LocaleToggle />
              <a
                href={localizePublicPath(locale, "/signin")}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
              >
                {isEn ? "Sign in" : "Iniciar sesion"}
              </a>
              <a
                href={localizePublicPath(locale, "/signup")}
                className="rounded-lg bg-[#0f1d36] px-4 py-2 text-sm font-semibold text-white"
              >
                {isEn ? "Start free trial" : "Probar gratis"}
              </a>
            </div>
          </div>
        )}
      </header>

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:72px_72px]" />

        <section className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-16 sm:px-6 lg:px-8 lg:pt-24">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              {isEn ? "Find winning ads faster" : "Encuentra anuncios ganadores mas rapido"}
            </span>
            <h1 className="mt-7 text-4xl font-semibold leading-tight text-[#0f172a] sm:text-5xl lg:text-7xl">
              {isEn
                ? "AI agents that launch 100+ Meta ad variations in seconds."
                : "Agentes IA que lanzan 100+ variaciones en Meta en segundos."}
            </h1>
            <p className="mt-4 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-4xl font-semibold leading-tight text-transparent sm:text-5xl lg:text-7xl">
              {isEn ? "Built from your proven winners." : "Construido desde tus ganadores reales."}
            </p>
            <p className="mt-8 max-w-3xl text-lg leading-relaxed text-slate-600">
              {isEn
                ? "OMNI Scale analyzes historical campaigns, ranks creatives, copy, and audiences by performance, and automatically activates optimized combinations."
                : "OMNI Scale analiza campañas historicas, ordena creativos, copies y audiencias por rendimiento, y activa combinaciones optimizadas de forma automatica."}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={localizePublicPath(locale, "/signup")}
                className="rounded-xl bg-[#0f1d36] px-8 py-3 text-base font-semibold text-white transition hover:opacity-90"
              >
                {isEn ? "Start with AI" : "Empezar con IA"}
              </a>
              <a
                href={localizePublicPath(locale, "/signin")}
                className="rounded-xl border border-slate-300 bg-white px-8 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {isEn ? "I already have an account" : "Ya tengo cuenta"}
              </a>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="relative mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <h2 className="text-center text-4xl font-semibold text-[#0f172a] sm:text-5xl">
            {isEn ? "How it works" : "Como funciona"}
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-center text-lg text-slate-600">
            {isEn
              ? "From importing your data to launching AI campaigns in minutes."
              : "Desde importar datos hasta lanzar campañas con IA en minutos."}
          </p>

          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-2xl font-semibold text-[#0f172a]">
                {isEn ? "Import and rank" : "Importa y rankea"}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-slate-600">
                {isEn
                  ? "We pull historical data and rank each ad component by ROAS and conversions."
                  : "Traemos data historica y rankeamos cada elemento publicitario por ROAS y conversiones."}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-2xl font-semibold text-[#0f172a]">
                {isEn ? "Build campaigns" : "Construye campañas"}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-slate-600">
                {isEn
                  ? "AI builds campaign structures with audiences, copy, and creatives ready to scale."
                  : "La IA arma estructuras de campaña con audiencias, copies y creativos listos para escalar."}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-2xl font-semibold text-[#0f172a]">
                {isEn ? "Launch and learn" : "Lanza y aprende"}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-slate-600">
                {isEn
                  ? "Launch ad variations in Meta and let the system learn in real time."
                  : "Lanzas variaciones en Meta y el sistema aprende en tiempo real para mejorar resultados."}
              </p>
            </article>
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
            <div className="space-y-7">
              <FeatureItem
                icon={<ChartBarIcon className="h-6 w-6 text-white" />}
                title={isEn ? "Analyze your historical data" : "Analiza tu data historica"}
                description={
                  isEn
                    ? "AI scores each creative, copy and audience using real account performance."
                    : "La IA evalua cada creativo, copy y audiencia con base en rendimiento real."
                }
              />
              <FeatureItem
                icon={<FlaskIcon className="h-6 w-6 text-white" />}
                title={isEn ? "Build complete structures" : "Construye estructuras completas"}
                description={
                  isEn
                    ? "Select top elements and generate campaigns with optimized ad sets and targeting."
                    : "Selecciona elementos top y genera campañas con ad sets y targets optimizados."
                }
              />
              <FeatureItem
                icon={<BulbIcon className="h-6 w-6 text-white" />}
                title={isEn ? "Explain every decision" : "Explica cada decision"}
                description={
                  isEn
                    ? "Full transparency on why each creative and audience was chosen."
                    : "Transparencia total sobre por que cada creativo y audiencia fue elegida."
                }
              />
              <FeatureItem
                icon={<RefreshIcon className="h-6 w-6 text-white" />}
                title={isEn ? "Continuous learning" : "Aprendizaje continuo"}
                description={
                  isEn
                    ? "Every new result trains the system so your next campaign performs better."
                    : "Cada resultado nuevo mejora al sistema para que tu siguiente campaña rinda mejor."
                }
              />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="rounded-2xl bg-gradient-to-r from-[#101f38] to-[#1f2f4f] p-4 text-white">
                <div className="flex items-center justify-between">
                  <p className="text-xl font-semibold">
                    {isEn ? "AI Campaign Summary" : "Resumen de campaña IA"}
                  </p>
                  <div className="rounded-lg bg-white/15 px-3 py-1 text-[11px] font-semibold">
                    {isEn ? "Summary" : "Resumen"}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white">
                  <SparklesIcon className="h-6 w-6 text-white" />
                </div>
                <h4 className="mt-3 text-3xl font-semibold text-[#0f172a] sm:text-4xl">
                  {isEn ? "Your AI campaign is ready" : "Tu campaña IA esta lista"}
                </h4>
                <p className="mt-2 text-base text-slate-600">
                  {isEn ? "Review the strategy and validate each section." : "Revisa la estrategia y valida cada seccion."}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <StatCard value="LEADS" label={isEn ? "Objective" : "Objetivo"} />
                <StatCard value="10" label="Ad Sets" />
                <StatCard value="60" label="Ads" />
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xl font-semibold text-emerald-800">
                  {isEn ? "Built with proven winners" : "Construido con ganadores probados"}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <MiniStat value="$90.46" label="avg CPA" />
                  <MiniStat value="$116.13" label="avg CPA" />
                  <MiniStat value="$103.99" label="avg CPA" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
          <h2 className="text-center text-4xl font-semibold text-[#0f172a] sm:text-5xl">
            {isEn ? "Control how AI builds your campaigns" : "Controla como la IA construye tus campañas"}
          </h2>
          <p className="mx-auto mt-4 max-w-4xl text-center text-lg leading-relaxed text-slate-600">
            {isEn
              ? "Decide whether AI focuses on winners, explores new ideas, or blends both."
              : "Define si la IA prioriza ganadores, explora ideas nuevas o combina ambos enfoques."}
          </p>

          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-2xl font-semibold text-[#0f172a]">
                {isEn ? "Audience strategy" : "Estrategia de audiencia"}
              </h3>
              <div className="mt-5 space-y-3">
                <OptionCard
                  title={isEn ? "Conservative" : "Conservadora"}
                  subtitle={isEn ? "Only top-performing audiences" : "Solo audiencias con mejor rendimiento"}
                />
                <OptionCard
                  title={isEn ? "Balanced" : "Balanceada"}
                  subtitle={isEn ? "Winners + new audiences" : "Ganadores + audiencias nuevas"}
                />
                <OptionCard
                  title={isEn ? "Experimental" : "Experimental"}
                  subtitle={isEn ? "Test new audiences" : "Prueba audiencias nuevas"}
                  active="violet"
                />
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-2xl font-semibold text-[#0f172a]">
                {isEn ? "Copy and creative strategy" : "Estrategia de copy y creativo"}
              </h3>
              <div className="mt-5 space-y-3">
                <OptionCard
                  title={isEn ? "Conservative" : "Conservadora"}
                  subtitle={isEn ? "Proven copy and creatives" : "Copy y creativos probados"}
                />
                <OptionCard
                  title={isEn ? "Balanced" : "Balanceada"}
                  subtitle={isEn ? "Top creatives + fresh copy" : "Top creativos + copy nuevo"}
                  active="blue"
                />
                <OptionCard
                  title={isEn ? "Experimental" : "Experimental"}
                  subtitle={isEn ? "Generate fully new copy" : "Genera copy totalmente nuevo"}
                />
              </div>
            </article>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 text-center text-xs text-slate-600 sm:px-6 lg:px-8">
          <p className="mt-1">{isEn ? "All rights reserved" : "Derechos reservados"}</p>
          <p className="mt-1">OMNI AGENCIA S.A.C - RUC 20612101648</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <a href={localizePublicPath(locale, "/terms-and-conditions")} className="underline hover:text-slate-900">
              {isEn ? "Terms and Conditions" : "Terminos y Condiciones"}
            </a>
            <a href={localizePublicPath(locale, "/privacy-policy")} className="underline hover:text-slate-900">
              {isEn ? "Privacy Policy" : "Politica de Privacidad"}
            </a>
            <a href={localizePublicPath(locale, "/data-deletion-policy")} className="underline hover:text-slate-900">
              {isEn ? "Data Deletion Policy" : "Politica de Eliminacion de Datos"}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0f1d36]">{icon}</div>
      <div>
        <h3 className="text-2xl font-semibold text-[#0f172a] sm:text-3xl">{title}</h3>
        <p className="mt-2 text-base leading-relaxed text-slate-600 sm:text-lg">{description}</p>
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
      <p className="text-2xl font-semibold text-[#0f172a]">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-white p-3 text-center">
      <p className="text-2xl font-semibold text-emerald-700">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

function OptionCard({
  title,
  subtitle,
  active,
}: {
  title: string;
  subtitle: string;
  active?: "blue" | "violet";
}) {
  const activeClass =
    active === "blue"
      ? "border-blue-300 bg-blue-50"
      : active === "violet"
      ? "border-violet-200 bg-violet-50"
      : "border-slate-200";

  return (
    <div className={`rounded-xl border p-4 ${activeClass}`}>
      <p className="text-xl font-semibold text-[#0f172a]">{title}</p>
      <p className="text-base text-slate-600">{subtitle}</p>
    </div>
  );
}

function ChartBarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M4 20h16" />
      <rect x="6" y="11" width="3" height="7" rx="1" />
      <rect x="11" y="7" width="3" height="11" rx="1" />
      <rect x="16" y="4" width="3" height="14" rx="1" />
    </svg>
  );
}

function FlaskIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M9 3h6" />
      <path d="M10 3v5l-5 8a3 3 0 0 0 2.6 5h8.8A3 3 0 0 0 19 16l-5-8V3" />
      <path d="M8 14h8" />
    </svg>
  );
}

function BulbIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12c.6.4 1 1.1 1.2 2h5.6c.2-.9.6-1.6 1.2-2A7 7 0 0 0 12 2Z" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M21 12a9 9 0 0 1-15.4 6.4" />
      <path d="M3 12a9 9 0 0 1 15.4-6.4" />
      <path d="M3 4v4h4" />
      <path d="M21 20v-4h-4" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="m12 3 1.3 3.2L16.5 7.5l-3.2 1.3L12 12l-1.3-3.2-3.2-1.3 3.2-1.3L12 3Z" />
      <path d="m18 12 1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1 1-2.4Z" />
      <path d="m6 13 .8 1.8 1.8.8-1.8.8L6 18l-.8-1.8-1.8-.8 1.8-.8L6 13Z" />
    </svg>
  );
}


