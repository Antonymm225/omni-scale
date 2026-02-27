"use client";

import Link from "next/link";
import { useEffect, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import ThemeToggle from "../components/theme-toggle";
import { localizePublicPath } from "../lib/locale";
import { useLocale } from "../providers/LocaleProvider";
import { useTheme } from "../providers/ThemeProvider";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

type SidebarProfile = {
  name: string;
  email: string;
  avatarUrl: string | null;
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: "",
    items: [
      { href: "/onboarding", label: "Onboarding", icon: <ChecklistIcon /> },
      { href: "/dashboard", label: "Dashboard", icon: <ChartIcon /> },
      { href: "/ai-ads", label: "Scale AI", icon: <SparkleIcon /> },
      { href: "/estrategias", label: "Estrategias", icon: <StrategyIcon /> },
    ],
  },
  {
    title: "Campañas",
    items: [
      { href: "/campanas/leads", label: "Leads", icon: <FunnelIcon /> },
      { href: "/campanas/ventas", label: "Ventas", icon: <CartIcon /> },
      { href: "/campanas/mensajes", label: "Mensajes", icon: <ChatBubbleIcon /> },
      { href: "/campanas/branding", label: "Branding", icon: <MegaphoneIcon /> },
    ],
  },
  {
    title: "Studio",
    items: [
      { href: "/studio/creativos", label: "Creativos", icon: <AdIcon /> },
      { href: "/studio/audiencias", label: "Audiencias", icon: <GroupIcon /> },
      { href: "/studio/multimedia", label: "Multimedia", icon: <VideoIcon /> },
    ],
  },
  {
    title: "Insights",
    items: [
      { href: "/insights/rendimiento", label: "Rendimiento", icon: <ChartIcon /> },
      { href: "/insights/top-ads", label: "Top Ads", icon: <MegaphoneIcon /> },
    ],
  },
  {
    title: "Assets",
    items: [
      { href: "/assets/facebook-conexion", label: "Facebook conexión", icon: <FacebookIcon /> },
      { href: "/assets/mi-negocio", label: "Mi negocio", icon: <BusinessIcon /> },
      { href: "/assets/integraciones", label: "Integraciones", icon: <PlugIcon /> },
    ],
  },
  {
    title: "Automatizacion",
    items: [
      { href: "/automatizacion/comentarios", label: "Comentarios", icon: <CommentsIcon /> },
      { href: "/automatizacion/reglas-basicas", label: "Reglas básicas", icon: <RuleIcon /> },
      { href: "/automatizacion/conversacional", label: "Conversacional", icon: <WhatsappIcon /> },
    ],
  },
];

const SECTION_TITLE_I18N: Record<string, { es: string; en: string }> = {
  Campañas: { es: "Campañas", en: "Campaigns" },
  Studio: { es: "Studio", en: "Studio" },
  Insights: { es: "Insights", en: "Insights" },
  Assets: { es: "Assets", en: "Assets" },
  Automatizacion: { es: "Automatización", en: "Automation" },
};

const ITEM_LABEL_I18N: Record<string, { es: string; en: string }> = {
  Onboarding: { es: "Onboarding", en: "Onboarding" },
  Dashboard: { es: "Dashboard", en: "Dashboard" },
  "Scale AI": { es: "Scale AI", en: "Scale AI" },
  Estrategias: { es: "Estrategias", en: "Strategies" },
  Leads: { es: "Leads", en: "Leads" },
  Ventas: { es: "Ventas", en: "Sales" },
  Mensajes: { es: "Mensajes", en: "Messages" },
  Branding: { es: "Branding", en: "Branding" },
  Creativos: { es: "Creativos", en: "Creatives" },
  Audiencias: { es: "Audiencias", en: "Audiences" },
  Multimedia: { es: "Multimedia", en: "Media" },
  Rendimiento: { es: "Rendimiento", en: "Performance" },
  "Top Ads": { es: "Top Ads", en: "Top Ads" },
  "Facebook conexión": { es: "Facebook conexión", en: "Facebook connection" },
  "Mi negocio": { es: "Mi negocio", en: "My business" },
  Integraciones: { es: "Integraciones", en: "Integrations" },
  Comentarios: { es: "Comentarios", en: "Comments" },
  "Reglas básicas": { es: "Reglas básicas", en: "Basic rules" },
  Conversacional: { es: "Conversacional", en: "Conversational" },
};

function MenuIconWrap({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-current">
      {children}
    </span>
  );
}

function ChecklistIcon() {
  return (
    <MenuIconWrap>
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 3h6" />
        <path d="M6.5 8h6" />
        <path d="M6.5 13h6" />
        <path d="M2.5 3.5 3.6 4.6 5 2.9" />
        <path d="M2.5 8.5 3.6 9.6 5 7.9" />
        <path d="M2.5 13.5 3.6 14.6 5 12.9" />
      </svg>
    </MenuIconWrap>
  );
}

function ChartIcon() {
  return (
    <MenuIconWrap>
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 2.5v11h11" />
        <path d="m4.5 10 2.5-3 2 1.5 2.5-3.5" />
      </svg>
    </MenuIconWrap>
  );
}

function SparkleIcon() {
  return (
    <MenuIconWrap>
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2.2 9.2 5l2.8 1.2-2.8 1.2L8 10.2 6.8 7.4 4 6.2 6.8 5 8 2.2Z" />
        <path d="m12.5 10.5.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6.6-1.4Z" />
      </svg>
    </MenuIconWrap>
  );
}

function StrategyIcon() {
  return (
    <MenuIconWrap>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M22,11A4,4,0,0,0,20,7.52,3,3,0,0,0,20,7a3,3,0,0,0-3-3l-.18,0A3,3,0,0,0,12,2.78,3,3,0,0,0,7.18,4L7,4A3,3,0,0,0,4,7a3,3,0,0,0,0,.52,4,4,0,0,0-.55,6.59A4,4,0,0,0,7,20l.18,0A3,3,0,0,0,12,21.22,3,3,0,0,0,16.82,20L17,20a4,4,0,0,0,3.5-5.89A4,4,0,0,0,22,11ZM11,8.55a4.72,4.72,0,0,0-.68-.32,1,1,0,0,0-.64,1.9A2,2,0,0,1,11,12v1.55a4.72,4.72,0,0,0-.68-.32,1,1,0,0,0-.64,1.9A2,2,0,0,1,11,17v2a1,1,0,0,1-1,1,1,1,0,0,1-.91-.6,4.07,4.07,0,0,0,.48-.33,1,1,0,1,0-1.28-1.54A2,2,0,0,1,7,18a2,2,0,0,1-2-2,2,2,0,0,1,.32-1.06A3.82,3.82,0,0,0,6,15a1,1,0,0,0,0-2,1.84,1.84,0,0,1-.69-.13A2,2,0,0,1,5,9.25a3.1,3.1,0,0,0,.46.35,1,1,0,1,0,1-1.74.9.9,0,0,1-.34-.33A.92.92,0,0,1,6,7,1,1,0,0,1,7,6a.76.76,0,0,1,.21,0,3.85,3.85,0,0,0,.19.47,1,1,0,0,0,1.37.37A1,1,0,0,0,9.13,5.5,1.06,1.06,0,0,1,9,5a1,1,0,0,1,2,0Zm7.69,4.32A1.84,1.84,0,0,1,18,13a1,1,0,0,0,0,2,3.82,3.82,0,0,0,.68-.06A2,2,0,0,1,19,16a2,2,0,0,1-2,2,2,2,0,0,1-1.29-.47,1,1,0,0,0-1.28,1.54,4.07,4.07,0,0,0,.48.33A1,1,0,0,1,14,20a1,1,0,0,1-1-1V17a2,2,0,0,1,1.32-1.87,1,1,0,0,0-.64-1.9,4.72,4.72,0,0,0-.68.32V12a2,2,0,0,1,1.32-1.87,1,1,0,0,0-.64-1.9,4.72,4.72,0,0,0-.68.32V5a1,1,0,0,1,2,0,1.06,1.06,0,0,1-.13.5,1,1,0,0,0,.36,1.37A1,1,0,0,0,16.6,6.5,3.85,3.85,0,0,0,16.79,6,.76.76,0,0,1,17,6a1,1,0,0,1,1,1,1,1,0,0,1-.17.55.9.9,0,0,1-.33.31,1,1,0,0,0,1,1.74A2.66,2.66,0,0,0,19,9.25a2,2,0,0,1-.27,3.62Z" />
      </svg>
    </MenuIconWrap>
  );
}

function FunnelIcon() {
  return (
    <MenuIconWrap>
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 3h11l-4.3 4.7v4l-2.4 1.3V7.7L2.5 3Z" />
      </svg>
    </MenuIconWrap>
  );
}

function CartIcon() {
  return (
    <MenuIconWrap>
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="13" r="1.1" />
        <circle cx="11.5" cy="13" r="1.1" />
        <path d="M1.8 2.8h1.7l1.2 6.2h7l1.1-4.5H4.7" />
      </svg>
    </MenuIconWrap>
  );
}

function ChatBubbleIcon() {
  return (
    <MenuIconWrap>
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.3 3.2h9.4v6.6H6.9l-3.6 2V3.2Z" />
      </svg>
    </MenuIconWrap>
  );
}

function MegaphoneIcon() {
  return (
    <MenuIconWrap>
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.2 8h2.5l6-3v6l-6-3H2.2Z" />
        <path d="m5 10.5 1 2.3" />
      </svg>
    </MenuIconWrap>
  );
}

function AdIcon() {
  return (
    <MenuIconWrap>
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.2" y="3" width="11.6" height="10" rx="1.6" />
        <path d="M5 6.2h3.1" />
        <path d="M5 8.8h6" />
      </svg>
    </MenuIconWrap>
  );
}

function GroupIcon() {
  return (
    <MenuIconWrap>
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="2" />
        <circle cx="11.2" cy="6.8" r="1.6" />
        <path d="M2.8 12.5c.4-1.7 1.8-2.7 3.2-2.7s2.8 1 3.2 2.7" />
        <path d="M9.4 12.5c.3-1.2 1.2-1.9 2.2-1.9.9 0 1.8.7 2.1 1.9" />
      </svg>
    </MenuIconWrap>
  );
}

function VideoIcon() {
  return (
    <MenuIconWrap>
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.2" y="4" width="8.6" height="8" rx="1.5" />
        <path d="m10.8 7 3-1.6v5.2l-3-1.6" />
      </svg>
    </MenuIconWrap>
  );
}

function FacebookIcon() {
  return (
    <MenuIconWrap>
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
        <path d="M9.5 5.3V4.2c0-.6.4-.9 1-.9h1.1V1.1h-1.9c-1.9 0-3 1.1-3 3v1.2H5v2.3h1.7v7.3h2.8V7.6h2l.3-2.3H9.5Z" />
      </svg>
    </MenuIconWrap>
  );
}

function PlugIcon() {
  return (
    <MenuIconWrap>
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5.2 2.2v3.1M8 2.2v3.1" />
        <path d="M3.8 5.3h5.6v1.2a2.8 2.8 0 0 1-2.8 2.8v3.5" />
        <path d="M5.4 12.8h2.4" />
      </svg>
    </MenuIconWrap>
  );
}

function BusinessIcon() {
  return (
    <MenuIconWrap>
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 13.5h11" />
        <path d="M3.5 13.5V6.2h9v7.3" />
        <path d="M5.5 6.2V3.5h5v2.7" />
        <path d="M6.2 8.5h1.2M8.6 8.5h1.2M6.2 10.6h1.2M8.6 10.6h1.2" />
      </svg>
    </MenuIconWrap>
  );
}

function CommentsIcon() {
  return (
    <MenuIconWrap>
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.2 3.1h7.4v5.4H5.1l-2.9 1.7V3.1Z" />
        <path d="M13.8 5.7H8.6v5.1h3.1l2.1 1.2V5.7Z" />
      </svg>
    </MenuIconWrap>
  );
}

function RuleIcon() {
  return (
    <MenuIconWrap>
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.4 12.4h11.2" />
        <path d="M3.2 10.4 10.8 2.8l2.4 2.4-7.6 7.6H3.2Z" />
      </svg>
    </MenuIconWrap>
  );
}

function WhatsappIcon() {
  return (
    <MenuIconWrap>
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2.2a5.8 5.8 0 0 0-5 8.8l-.8 2.8 2.9-.8A5.8 5.8 0 1 0 8 2.2Z" />
        <path d="M10.4 9.3c-.2.5-1 .9-1.5.9-.4 0-1-.1-2-.8-1.1-.8-1.8-2-1.8-2.3 0-.4.3-.8.5-1 .2-.2.4-.2.5-.2h.4c.1 0 .3 0 .4.3l.5 1.1c.1.2 0 .3-.1.4l-.3.4c-.1.1-.2.2-.1.3 0 .1.4.7.9 1.1.7.6 1.2.8 1.4.9.2 0 .3 0 .4-.1l.5-.6c.1-.1.3-.2.4-.1l1 .5c.2.1.3.2.3.3 0 .1 0 .5-.2.9Z" />
      </svg>
    </MenuIconWrap>
  );
}

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
  const { locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [showMenuScrollbar, setShowMenuScrollbar] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<SidebarProfile>({
    name: locale === "en" ? "User" : "Usuario",
    email: "",
    avatarUrl: null,
  });

  const handleMenuMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const nearRightEdge = rect.right - event.clientX <= 24;
    if (nearRightEdge !== showMenuScrollbar) {
      setShowMenuScrollbar(nearRightEdge);
    }
  };

  useEffect(() => {
    const detectBrowserTimezone = () => {
      try {
        const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return resolved && resolved.trim() ? resolved.trim() : "America/Lima";
      } catch {
        return "America/Lima";
      }
    };

    const ensureUserPreferences = async (user: {
      id: string;
      email?: string | null;
      user_metadata?: { full_name?: string; name?: string };
    }) => {
      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) return;

      const existingTimezone = (profileRow?.timezone_name as string | null) || "";
      const existingLocale = (profileRow?.language_code as string | null) || "";
      const existingTheme = (profileRow?.theme_mode as string | null) || "";

      if (existingLocale === "es" || existingLocale === "en") {
        setLocale(existingLocale);
      }
      if (existingTheme === "dark" || existingTheme === "light") {
        setTheme(existingTheme);
      }

      const hasTimezone = Boolean(existingTimezone.trim());
      const hasLocale = existingLocale === "es" || existingLocale === "en";
      const hasTheme = existingTheme === "dark" || existingTheme === "light";
      if (hasTimezone && hasLocale && hasTheme) return;

      const fullName =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email?.split("@")[0] ||
        locale === "en" ? "User" : "Usuario";

      const timezoneName = detectBrowserTimezone();
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email || null,
          name: fullName,
          timezone_name: hasTimezone ? existingTimezone : timezoneName,
          language_code: locale,
          theme_mode: theme,
        },
        { onConflict: "id" }
      );
    };

    const mapUserProfile = (user: {
      email?: string | null;
      user_metadata?: { full_name?: string; name?: string; avatar_url?: string };
    }): SidebarProfile => {
      const fullName =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email?.split("@")[0] ||
        "Usuario";
      return {
        name: fullName,
        email: user.email || "",
        avatarUrl: user.user_metadata?.avatar_url || null,
      };
    };

    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        router.replace(localizePublicPath(locale, "/signin"));
        return;
      }

      const user = data.session.user;
      setUserId(user.id);
      setProfile(mapUserProfile(user));
      await ensureUserPreferences({
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata as { full_name?: string; name?: string },
      });

      setLoading(false);
    };

    void checkSession();

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) return;
      setUserId(session.user.id);
      setProfile(mapUserProfile(session.user));
    });

    return () => {
      authSubscription.subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    void supabase
      .from("profiles")
      .update({ theme_mode: theme, language_code: locale })
      .eq("id", userId);
  }, [userId, theme, locale]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        {locale === "en" ? "Loading..." : "Cargando..."}
      </div>
    );
  }

  const initials = profile.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return (
    <div className="min-h-screen bg-[#f3f5f9]">
      <div className="min-h-screen">
        <aside className="fixed left-0 top-0 z-30 flex h-screen w-[250px] shrink-0 flex-col border-r border-slate-200 bg-white">
          <div className="shrink-0 border-b border-slate-200 px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-2xl font-bold text-[#111827]">OMNI Scale</h1>
              <ThemeToggle />
            </div>
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
                      {SECTION_TITLE_I18N[section.title]?.[locale] || section.title}
                    </p>
                  ) : null}
                  <nav className="mt-1.5 space-y-0.5">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                          isItemActive(pathname, item.href)
                            ? "bg-violet-100 text-violet-700"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {item.icon}
                        <span>{ITEM_LABEL_I18N[item.label]?.[locale] || item.label}</span>
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
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={locale === "en" ? "Profile picture" : "Foto de perfil"}
                  className="h-9 w-9 shrink-0 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1D293D] text-xs font-semibold text-white">
                  {initials || "U"}
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{profile.name}</span>
                <span className="block truncate text-xs text-slate-500">{profile.email}</span>
              </span>
            </Link>
          </div>
        </aside>

        <section className="ml-[250px] min-w-0">{children}</section>
      </div>
    </div>
  );
}
