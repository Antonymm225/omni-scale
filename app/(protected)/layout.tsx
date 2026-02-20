"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Menu",
    items: [
      { href: "/onboarding", label: "Onboarding" },
      { href: "/campanas", label: "Campañas" },
      { href: "/ai-ads", label: "Ai Ads" },
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
];

function isItemActive(pathname: string, href: string) {
  if (href === "/onboarding") {
    return pathname === "/dashboard" || pathname === "/onboarding";
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

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        router.replace("/signin");
        return;
      }

      setLoading(false);
    };

    void checkSession();
  }, [router]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f3f5f9]">
      <div className="flex min-h-screen">
        <aside className="w-[250px] shrink-0 border-r border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h1 className="text-2xl font-bold text-[#111827]">OMNI Scale</h1>
          </div>

          <div className="space-y-4 px-3 py-4">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title}>
                <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {section.title}
                </p>
                <nav className="mt-2 space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
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
        </aside>

        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </div>
  );
}
