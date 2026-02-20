"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

type FacebookConnection = {
  facebook_name: string | null;
  facebook_user_id: string | null;
  facebook_email: string | null;
  token_expires_at: string | null;
};

type BusinessManager = {
  facebook_business_id: string;
  name: string | null;
};

type AdAccount = {
  facebook_ad_account_id: string;
  account_id: string | null;
  name: string | null;
  currency: string | null;
};

type FanPage = {
  facebook_page_id: string;
  name: string | null;
  category: string | null;
};

type InstagramAccount = {
  instagram_account_id: string;
  username: string | null;
  name: string | null;
  facebook_page_id: string;
};

type Pixel = {
  facebook_pixel_id: string;
  name: string | null;
  facebook_ad_account_id: string;
};

type DisplayItem = {
  id: string;
  name: string;
  meta?: string;
};

export default function FacebookConexionPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const [connection, setConnection] = useState<FacebookConnection | null>(null);
  const [businessManagers, setBusinessManagers] = useState<BusinessManager[]>([]);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [fanPages, setFanPages] = useState<FanPage[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);
  const [pixels, setPixels] = useState<Pixel[]>([]);

  const [openSection, setOpenSection] = useState<string | null>(null);
  const [queries, setQueries] = useState({
    ad_accounts: "",
    fan_pages: "",
    business_managers: "",
    instagram: "",
    pixels: "",
  });

  useEffect(() => {
    const status = searchParams.get("status");
    const message = searchParams.get("message");

    if (status === "error") {
      setError(message || "No se pudo completar la acción.");
    }
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        if (mounted) {
          setError("No se pudo validar la sesión.");
          setLoading(false);
        }
        return;
      }

      const [connectionRes, bmRes, adRes, pagesRes, igRes, pixelsRes] = await Promise.all([
        supabase
          .from("facebook_connections")
          .select("facebook_name,facebook_user_id,facebook_email,token_expires_at")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("facebook_business_managers")
          .select("facebook_business_id,name")
          .eq("user_id", user.id)
          .order("name", { ascending: true }),
        supabase
          .from("facebook_ad_accounts")
          .select("facebook_ad_account_id,account_id,name,currency")
          .eq("user_id", user.id)
          .order("name", { ascending: true }),
        supabase
          .from("facebook_pages")
          .select("facebook_page_id,name,category")
          .eq("user_id", user.id)
          .order("name", { ascending: true }),
        supabase
          .from("facebook_instagram_accounts")
          .select("instagram_account_id,username,name,facebook_page_id")
          .eq("user_id", user.id)
          .order("name", { ascending: true }),
        supabase
          .from("facebook_pixels")
          .select("facebook_pixel_id,name,facebook_ad_account_id")
          .eq("user_id", user.id)
          .order("name", { ascending: true }),
      ]);

      const firstError =
        connectionRes.error ||
        bmRes.error ||
        adRes.error ||
        pagesRes.error ||
        igRes.error ||
        pixelsRes.error;

      if (firstError) {
        if (mounted) {
          setError(firstError.message || "No se pudo cargar los assets.");
          setLoading(false);
        }
        return;
      }

      if (!mounted) return;

      setConnection((connectionRes.data as FacebookConnection | null) || null);
      setBusinessManagers((bmRes.data as BusinessManager[]) || []);
      setAdAccounts((adRes.data as AdAccount[]) || []);
      setFanPages((pagesRes.data as FanPage[]) || []);
      setInstagramAccounts((igRes.data as InstagramAccount[]) || []);
      setPixels((pixelsRes.data as Pixel[]) || []);
      setLoading(false);
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/facebook/assets/disconnect", {
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "No se pudo desconectar.");
      }

      setConnection(null);
      setBusinessManagers([]);
      setAdAccounts([]);
      setFanPages([]);
      setInstagramAccounts([]);
      setPixels([]);
      setNotice("Facebook desconectado. Se eliminaron los assets de tu cuenta.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo desconectar.");
    } finally {
      setDisconnecting(false);
    }
  };

  const adAccountItems = useMemo<DisplayItem[]>(
    () =>
      adAccounts.map((row) => ({
        id: row.account_id || row.facebook_ad_account_id,
        name: row.name || "Sin nombre",
        meta: row.currency ? `Moneda: ${row.currency}` : undefined,
      })),
    [adAccounts]
  );

  const businessManagerItems = useMemo<DisplayItem[]>(
    () =>
      businessManagers.map((row) => ({
        id: row.facebook_business_id,
        name: row.name || "Sin nombre",
      })),
    [businessManagers]
  );

  const fanPageItems = useMemo<DisplayItem[]>(
    () =>
      fanPages.map((row) => ({
        id: row.facebook_page_id,
        name: row.name || "Sin nombre",
        meta: row.category || undefined,
      })),
    [fanPages]
  );

  const instagramItems = useMemo<DisplayItem[]>(
    () =>
      instagramAccounts.map((row) => ({
        id: row.instagram_account_id,
        name: row.username || row.name || "Sin nombre",
        meta: row.name && row.username ? row.name : undefined,
      })),
    [instagramAccounts]
  );

  const pixelItems = useMemo<DisplayItem[]>(
    () =>
      pixels.map((row) => ({
        id: row.facebook_pixel_id,
        name: row.name || "Sin nombre",
        meta: `Ad account: ${row.facebook_ad_account_id}`,
      })),
    [pixels]
  );

  const expiryText = connection?.token_expires_at
    ? new Date(connection.token_expires_at).toLocaleDateString("es-PE")
    : null;

  if (loading) {
    return (
      <main className="px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="h-10 w-72 rounded-lg bg-slate-200" />
          <div className="mt-3 h-5 w-96 max-w-full rounded bg-slate-200" />
          <div className="mt-6 h-28 rounded-2xl bg-slate-200" />
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            <div className="h-24 rounded-2xl bg-slate-200" />
            <div className="h-24 rounded-2xl bg-slate-200" />
            <div className="h-24 rounded-2xl bg-slate-200" />
            <div className="h-24 rounded-2xl bg-slate-200" />
            <div className="h-24 rounded-2xl bg-slate-200" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header>
          <h1 className="text-3xl font-bold text-[#111827] sm:text-4xl">Activos Publicitarios</h1>
          <p className="mt-2 text-base text-slate-600">
            Aquí ves los activos sincronizados desde Meta y almacenados en tu base de datos.
          </p>
        </header>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {notice && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </div>
        )}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-600">Conexión activa</p>
              <h2 className="mt-1 text-xl font-semibold text-[#111827]">
                {connection?.facebook_name || "Sin conexión activa"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                ID: {connection?.facebook_user_id || "No disponible"}
                {connection?.facebook_email ? ` | ${connection.facebook_email}` : ""}
                {expiryText ? ` | Expira: ${expiryText}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/api/facebook/assets/refresh"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <RefreshIcon />
                Refrescar
              </a>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <TrashIcon />
                {disconnecting ? "Desconectando..." : "Desconectar"}
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          <MetricCard label="Ad Accounts" value={adAccountItems.length} icon={<AdAccountIcon />} />
          <MetricCard
            label="Business Managers"
            value={businessManagerItems.length}
            icon={<BusinessIcon />}
          />
          <MetricCard label="Pixels / Datasets" value={pixelItems.length} icon={<PixelIcon />} />
          <MetricCard label="Instagram" value={instagramItems.length} icon={<InstagramIcon />} />
          <MetricCard label="Fan Pages" value={fanPageItems.length} icon={<PageIcon />} />
        </section>

        <section className="mt-6 space-y-4">
          <AssetAccordion
            id="ad_accounts"
            title={`Cuentas Publicitarias (${adAccountItems.length})`}
            description="Publicar campañas y revisar reportes."
            items={adAccountItems}
            openSection={openSection}
            setOpenSection={setOpenSection}
            query={queries.ad_accounts}
            onQueryChange={(value) => setQueries((prev) => ({ ...prev, ad_accounts: value }))}
          />

          <AssetAccordion
            id="fan_pages"
            title={`Fan Pages (${fanPageItems.length})`}
            description="Páginas disponibles para publicaciones y anuncios."
            items={fanPageItems}
            openSection={openSection}
            setOpenSection={setOpenSection}
            query={queries.fan_pages}
            onQueryChange={(value) => setQueries((prev) => ({ ...prev, fan_pages: value }))}
          />

          <AssetAccordion
            id="business_managers"
            title={`Business Managers (${businessManagerItems.length})`}
            description="Estructuras empresariales conectadas."
            items={businessManagerItems}
            openSection={openSection}
            setOpenSection={setOpenSection}
            query={queries.business_managers}
            onQueryChange={(value) =>
              setQueries((prev) => ({ ...prev, business_managers: value }))
            }
          />

          <AssetAccordion
            id="instagram"
            title={`Cuentas de Instagram (${instagramItems.length})`}
            description="Perfiles de Instagram vinculados vía páginas."
            items={instagramItems}
            openSection={openSection}
            setOpenSection={setOpenSection}
            query={queries.instagram}
            onQueryChange={(value) => setQueries((prev) => ({ ...prev, instagram: value }))}
          />

          <AssetAccordion
            id="pixels"
            title={`Pixels / Datasets (${pixelItems.length})`}
            description="Activos de medición y conversiones disponibles."
            items={pixelItems}
            openSection={openSection}
            setOpenSection={setOpenSection}
            query={queries.pixels}
            onQueryChange={(value) => setQueries((prev) => ({ ...prev, pixels: value }))}
          />
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef2ff] text-[#1D293D]">
        {icon}
      </div>
      <p className="mt-2 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-[#1D293D]">{value}</p>
    </div>
  );
}

function AssetAccordion({
  id,
  title,
  description,
  items,
  openSection,
  setOpenSection,
  query,
  onQueryChange,
}: {
  id: string;
  title: string;
  description: string;
  items: DisplayItem[];
  openSection: string | null;
  setOpenSection: (value: string | null) => void;
  query: string;
  onQueryChange: (value: string) => void;
}) {
  const isOpen = openSection === id;

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => {
      const haystack = `${item.name} ${item.id} ${item.meta || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [items, query]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpenSection(isOpen ? null : id)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
      >
        <div>
          <h3 className="text-xl font-semibold text-[#111827]">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>

        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-transform ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
            <path d="M5 8l5 5 5-5" />
          </svg>
        </span>
      </button>

      <div
        className={`grid transition-all duration-300 ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-slate-100 px-5 py-4 sm:px-6">
            <input
              type="text"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Buscar por nombre o ID"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#1D293D] outline-none ring-0 transition focus:border-[#1D293D]"
            />

            <div className="mt-4 max-h-[360px] overflow-auto rounded-xl border border-slate-100">
              {filteredItems.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-500">No hay resultados para tu búsqueda.</div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={`${id}-${item.id}`}
                    className="border-b border-slate-100 px-4 py-3 last:border-b-0"
                  >
                    <p className="text-sm font-semibold text-[#111827]">{item.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">ID: {item.id}</p>
                    {item.meta ? <p className="mt-0.5 text-xs text-slate-500">{item.meta}</p> : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdAccountIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 14h4" />
    </svg>
  );
}

function BusinessIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 21V7l8-4 8 4v14" />
      <path d="M9 21v-4h6v4" />
      <path d="M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
    </svg>
  );
}

function PixelIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 12h4l2-5 4 10 2-5h4" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 5h7v14H4z" />
      <path d="M13 5h7v14h-7z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
