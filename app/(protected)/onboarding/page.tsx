"use client";

export default function OnboardingPage() {
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header>
          <h2 className="text-4xl font-bold text-[#111827]">Onboarding</h2>
          <p className="mt-2 text-lg text-slate-600">
            Completa estos pasos para lanzar campañas a escala.
          </p>
        </header>

        <div className="mt-6 rounded-2xl bg-gradient-to-r from-[#161820] to-[#2a2b1e] p-5 text-white shadow-sm">
          <p className="text-2xl font-semibold">Guía de inicio y video</p>
          <p className="mt-1 text-base text-slate-200">
            Mira el tutorial completo para configurar todo rápidamente.
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
            title="Seleccionar Plan de Omni Scale"
            description="Tu plan es el Standard"
            status="ok"
            actionLabel="Ver"
          />
          <StepRow
            title="Conectar tu cuenta de Facebook"
            description="Nos permitirá ver tus activos publicitarios y rendimiento"
            status="ok"
            actionLabel="Ver"
          />
          <StepRow
            title="Agregar Credenciales IA"
            description="Agrega tu Clave Api Key de Open Ai para analizar tu rendimiento"
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
            title="Lanzar campaña IA"
            description="Lanza tu primera campaña automatizada"
            status="todo"
            actionLabel="Iniciar"
          />
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
