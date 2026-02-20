"use client";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-3xl font-semibold text-[#0f172a] sm:text-4xl">Dashboard</h1>
        <p className="mt-3 text-base text-slate-600">
          Conexion de Facebook completada. Tus assets ya fueron sincronizados.
        </p>
      </div>
    </main>
  );
}

