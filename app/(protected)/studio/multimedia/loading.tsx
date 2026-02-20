export default function SectionLoading() {
  return (
    <main className="min-h-screen bg-[#f3f5f9] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="h-9 w-52 rounded-lg bg-slate-200 sm:h-11 sm:w-64" />
        <div className="mt-4 h-5 w-72 max-w-full rounded bg-slate-200" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-24 rounded-xl bg-slate-100" />
          <div className="h-24 rounded-xl bg-slate-100" />
        </div>
      </div>
    </main>
  );
}
