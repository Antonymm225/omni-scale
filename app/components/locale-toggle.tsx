"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { localizePublicPath, type AppLocale } from "../lib/locale";
import { useLocale } from "../providers/LocaleProvider";

type LocaleOption = {
  value: AppLocale;
  label: string;
  short: string;
  Flag: () => ReactNode;
};

const OPTIONS: LocaleOption[] = [
  { value: "es", label: "Espanol", short: "ES", Flag: SpainFlag },
  { value: "en", label: "English", short: "US", Flag: UsaFlag },
];

export default function LocaleToggle() {
  const { locale, setLocale } = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const current = OPTIONS.find((option) => option.value === locale) || OPTIONS[1];

  const handleSelect = (nextLocale: AppLocale) => {
    if (nextLocale === locale) {
      setOpen(false);
      return;
    }
    setLocale(nextLocale);
    setOpen(false);
    if (typeof window !== "undefined") {
      const rawPath = pathname || "/";
      const pathWithoutLocale = rawPath.replace(/^\/(en|es)(?=\/|$)/i, "") || "/";
      const target = localizePublicPath(nextLocale, pathWithoutLocale);
      window.location.assign(`${target}${window.location.search || ""}`);
    }
  };

  return (
    <div ref={rootRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-lg bg-transparent px-1.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <current.Flag />
        <span>{current.short}</span>
        <ChevronDown />
      </button>

      {open ? (
        <div
          className="absolute right-0 z-40 mt-2 min-w-[150px] rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg"
          role="menu"
        >
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition ${
                option.value === locale
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
              role="menuitem"
            >
              <option.Flag />
              <span className="flex-1">{option.label}</span>
              <span className="text-[10px] text-slate-500">{option.short}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ChevronDown() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m5 8 5 5 5-5" />
    </svg>
  );
}

function SpainFlag() {
  return (
    <svg viewBox="0 0 18 12" className="h-3.5 w-5 rounded-sm border border-slate-300" aria-hidden="true">
      <rect width="18" height="12" fill="#C60B1E" />
      <rect y="3" width="18" height="6" fill="#FFC400" />
    </svg>
  );
}

function UsaFlag() {
  return (
    <svg viewBox="0 0 18 12" className="h-3.5 w-5 rounded-sm border border-slate-300" aria-hidden="true">
      <rect width="18" height="12" fill="#B22234" />
      <g fill="#FFFFFF">
        <rect y="1" width="18" height="1" />
        <rect y="3" width="18" height="1" />
        <rect y="5" width="18" height="1" />
        <rect y="7" width="18" height="1" />
        <rect y="9" width="18" height="1" />
        <rect y="11" width="18" height="1" />
      </g>
      <rect width="7.5" height="6.5" fill="#3C3B6E" />
    </svg>
  );
}

