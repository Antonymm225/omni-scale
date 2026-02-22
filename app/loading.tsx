export default function AppLoading() {
  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="h-10 w-56 rounded-lg bg-slate-200" />
        <div className="mt-3 h-5 w-80 max-w-full rounded bg-slate-200" />

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="h-6 w-64 rounded bg-slate-200" />
          <div className="mt-3 h-4 w-full rounded bg-slate-200" />
          <div className="mt-2 h-4 w-5/6 rounded bg-slate-200" />
          <div className="mt-8 h-11 w-40 rounded-lg bg-slate-200" />
        </div>
      </div>
    </main>
  );
}
