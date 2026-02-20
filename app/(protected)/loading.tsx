export default function ProtectedLoading() {
  return (
    <main className="min-h-screen bg-[#f3f5f9] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="h-10 w-56 rounded-lg bg-slate-200" />
        <div className="mt-3 h-5 w-80 max-w-full rounded bg-slate-200" />

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <div className="h-48 rounded-2xl border border-slate-200 bg-white" />
          <div className="h-48 rounded-2xl border border-slate-200 bg-white" />
          <div className="h-48 rounded-2xl border border-slate-200 bg-white" />
        </div>
      </div>
    </main>
  );
}
