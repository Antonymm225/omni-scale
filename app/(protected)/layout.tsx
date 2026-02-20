"use client";

import Link from "next/link";
import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

type NavItem = {
  href: string;
  label: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

type SidebarProfile = {
  name: string;
  email: string;
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: "",
    items: [
      { href: "/onboarding", label: "Onboarding" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/ai-ads", label: "Scale AI" },
    ],
  },
  {
    title: "Campañas",
    items: [
      { href: "/campanas/leads", label: "Leads" },
      { href: "/campanas/ventas", label: "Ventas" },
      { href: "/campanas/mensajes", label: "Mensajes" },
      { href: "/campanas/branding", label: "Branding" },
    ],
  },
  {
    title: "Studio",
    items: [
      { href: "/studio/creativos", label: "Creativos" },
      { href: "/studio/audiencias", label: "Audiencias" },
      { href: "/studio/multimedia", label: "Multimedia" },
    ],
  },
  {
    title: "Insights",
    items: [
      { href: "/insights/rendimiento", label: "Rendimiento" },
      { href: "/insights/top-ads", label: "Top Ads" },
    ],
  },
  {
    title: "Assets",
    items: [{ href: "/assets/facebook-conexion", label: "Facebook conexión" }],
  },
  {
    title: "Automatizacion",
    items: [
      { href: "/automatizacion/comentarios", label: "Comentarios" },
      { href: "/automatizacion/reglas-basicas", label: "Reglas básicas" },
      { href: "/automatizacion/conversacional", label: "Conversacional" },
    ],
  },
];

function isItemActive(pathname: string, href: string) {
  if (href === "/onboarding") {
    return pathname === "/onboarding";
  }
  return pathname === href;
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [showMenuScrollbar, setShowMenuScrollbar] = useState(false);
  const [profile, setProfile] = useState<SidebarProfile>({
    name: "Usuario",
    email: "",
  });

  const handleMenuMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const nearRightEdge = rect.right - event.clientX <= 24;
    if (nearRightEdge !== showMenuScrollbar) {
      setShowMenuScrollbar(nearRightEdge);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        router.replace("/signin");
        return;
      }

      const user = data.session.user;
      const fullName =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email?.split("@")[0] ||
        "Usuario";
      setProfile({
        name: fullName,
        email: user.email || "",
      });

      setLoading(false);
    };

    void checkSession();
  }, [router]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }

  const initials = profile.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return (
    <div className="min-h-screen bg-[#f3f5f9]">
      <div className="flex min-h-screen">
        <aside className="flex h-screen w-[250px] shrink-0 flex-col border-r border-slate-200 bg-white">
          <div className="shrink-0 border-b border-slate-200 px-5 py-4">
            <h1 className="text-2xl font-bold text-[#111827]">OMNI Scale</h1>
          </div>

          <div
            className={`menu-scroll flex-1 overflow-y-auto px-3 py-3 ${
              showMenuScrollbar ? "is-scrollbar-visible" : ""
            }`}
            onMouseMove={handleMenuMouseMove}
            onMouseLeave={() => setShowMenuScrollbar(false)}
          >
            <div className="space-y-2">
              {NAV_SECTIONS.map((section) => (
                <div key={section.title}>
                  {section.title ? (
                    <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {section.title}
                    </p>
                  ) : null}
                  <nav className="mt-1.5 space-y-0.5">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                          isItemActive(pathname, item.href)
                            ? "bg-violet-100 text-violet-700"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </div>
              ))}
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200 px-3 py-3">
            <Link
              href="/mi-cuenta"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isItemActive(pathname, "/mi-cuenta")
                  ? "bg-violet-100 text-violet-700"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1D293D] text-xs font-semibold text-white">
                {initials || "U"}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{profile.name}</span>
                <span className="block truncate text-xs text-slate-500">{profile.email}</span>
              </span>
            </Link>
          </div>
        </aside>

        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </div>
  );
}
