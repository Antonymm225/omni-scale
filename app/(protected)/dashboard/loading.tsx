export default function DashboardLoading() {
  return (
    <main className="px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="h-10 w-56 rounded-lg bg-slate-200" />
        <div className="mt-3 h-5 w-96 max-w-full rounded bg-slate-200" />

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-36 rounded-2xl border border-slate-200 bg-white" />
          <div className="h-36 rounded-2xl border border-slate-200 bg-white" />
          <div className="h-36 rounded-2xl border border-slate-200 bg-white" />
        </div>
      </div>
    </main>
  );
}
