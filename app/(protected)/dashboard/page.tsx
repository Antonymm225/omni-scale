"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardPage() {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-[#f3f5f9]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[280px] border-r border-slate-200 bg-white lg:block">
          <div className="border-b border-slate-200 px-6 py-5">
            <h1 className="text-2xl font-bold text-[#111827]">OMNI Scale</h1>
          </div>

          <div className="px-4 py-5">
            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Menu</p>
            <nav className="mt-2 space-y-1">
              <SidebarItem href="/onboarding" label="Onboarding" active={pathname === "/dashboard" || pathname === "/onboarding"} />
              <SidebarItem href="/campanas" label="Campanas" active={pathname === "/campanas"} />
              <SidebarItem href="/ai-ads" label="Ai Ads" active={pathname === "/ai-ads"} />
            </nav>
          </div>

          <div className="px-4 py-2">
            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Studio</p>
            <nav className="mt-2 space-y-1">
              <SidebarItem href="/studio/creativos" label="Creativos" active={pathname === "/studio/creativos"} />
              <SidebarItem href="/studio/audiencias" label="Audiencias" active={pathname === "/studio/audiencias"} />
              <SidebarItem href="/studio/multimedia" label="Multimedia" active={pathname === "/studio/multimedia"} />
            </nav>
          </div>

          <div className="px-4 py-2">
            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Insights</p>
            <nav className="mt-2 space-y-1">
              <SidebarItem href="/insights/rendimiento" label="Rendimiento" active={pathname === "/insights/rendimiento"} />
              <SidebarItem href="/insights/top-ads" label="Top Ads" active={pathname === "/insights/top-ads"} />
            </nav>
          </div>

          <div className="px-4 py-2">
            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Assets</p>
            <nav className="mt-2 space-y-1">
              <SidebarItem href="/assets/facebook-conexion" label="Facebook conexion" active={pathname === "/assets/facebook-conexion"} />
            </nav>
          </div>
        </aside>

        <section className="flex-1 px-4 py-6 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <h1 className="text-2xl font-bold text-[#111827]">Dashboard</h1>
              <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
                Menu
              </button>
            </div>

            <header>
              <h2 className="text-4xl font-bold text-[#111827]">Get Started</h2>
              <p className="mt-2 text-lg text-slate-600">
                Completa estos pasos para lanzar campanas a escala.
              </p>
            </header>

            <div className="mt-6 rounded-2xl bg-gradient-to-r from-[#161820] to-[#2a2b1e] p-5 text-white shadow-sm">
              <p className="text-2xl font-semibold">Guia de inicio y video</p>
              <p className="mt-1 text-base text-slate-200">
                Mira el tutorial completo para configurar todo rapidamente.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-2xl font-semibold text-[#111827]">Progreso de setup</p>
                <p className="text-sm font-semibold text-violet-600">60%</p>
              </div>
              <p className="mt-2 text-base text-slate-600">3 de 5 pasos completados</p>
              <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
                <div className="h-2 w-3/5 rounded-full bg-violet-600" />
              </div>
              <p className="mt-4 text-base text-slate-600">
                Completa los pasos siguientes para activar todo el sistema.
              </p>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <StepRow
                title="Conectar cuenta Meta"
                description="Tu cuenta de Meta esta conectada"
                status="ok"
                actionLabel="Ver"
              />
              <StepRow
                title="Conectar cuenta publicitaria"
                description="La cuenta publicitaria ya esta vinculada"
                status="ok"
                actionLabel="Ver"
              />
              <StepRow
                title="Importar campanas"
                description="Importa campanas existentes para analisis de IA"
                status="todo"
                actionLabel="Iniciar"
              />
              <StepRow
                title="Definir objetivos"
                description="Configura objetivos para potenciar insights"
                status="todo"
                actionLabel="Iniciar"
              />
              <StepRow
                title="Lanzar campana IA"
                description="Lanza tu primera campana automatizada"
                status="todo"
                actionLabel="Iniciar"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SidebarItem({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-violet-100 text-violet-700"
          : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );
}

function StepRow({
  title,
  description,
  status,
  actionLabel,
}: {
  title: string;
  description: string;
  status: "ok" | "todo";
  actionLabel: string;
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
