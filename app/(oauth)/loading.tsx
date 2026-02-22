export default function OAuthLoading() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-slate-900 lg:block" />
      <div className="flex w-full items-center justify-center bg-[#F5F5F5] p-8 lg:w-1/2">
        <div className="w-full max-w-md animate-pulse rounded-xl border border-slate-200 bg-white p-10 shadow-sm">
          <div className="mx-auto h-8 w-48 rounded bg-slate-200" />
          <div className="mx-auto mt-3 h-4 w-64 rounded bg-slate-200" />

          <div className="mt-8 h-10 w-full rounded-lg bg-slate-200" />
          <div className="mt-4 h-10 w-full rounded-lg bg-slate-200" />
          <div className="mt-4 h-10 w-full rounded-lg bg-slate-200" />

          <div className="mt-6 h-11 w-full rounded-lg bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
