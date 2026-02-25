"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { localizePublicPath, type AppLocale } from "../../lib/locale";
import { useLocale } from "../../providers/LocaleProvider";

type ProfileState = {
  name: string;
  email: string;
  avatarUrl: string | null;
  timezoneName: string;
  languageCode: AppLocale;
};

const TIMEZONE_OPTIONS = [
  "America/Lima",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Toronto",
  "America/Miami",
  "America/Bogota",
  "America/Guayaquil",
  "America/Panama",
  "America/El_Salvador",
  "America/Guatemala",
  "America/Costa_Rica",
  "America/Managua",
  "America/Havana",
  "America/Mexico_City",
  "America/Santiago",
  "America/Buenos_Aires",
  "America/La_Paz",
  "America/Asuncion",
  "America/Caracas",
  "America/Montevideo",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Berlin",
  "UTC",
];

export default function Page() {
  const { locale, setLocale } = useLocale();
  const isEn = locale === "en";
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [resettingData, setResettingData] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [resetConfirm, setResetConfirm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteAccountBox, setShowDeleteAccountBox] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileState>({
    name: "Usuario",
    email: "",
    avatarUrl: null,
    timezoneName: "America/Lima",
    languageCode: locale,
  });
  const [savingTimezone, setSavingTimezone] = useState(false);
  const [savingLanguage, setSavingLanguage] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const fullName =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email?.split("@")[0] ||
        isEn ? "User" : "Usuario";

      const { data: profileRow } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      const languageCode =
        (profileRow?.language_code as string | null) === "es" ||
        (profileRow?.language_code as string | null) === "en"
          ? (profileRow?.language_code as AppLocale)
          : locale;

      setLocale(languageCode);

      setProfile({
        name: fullName,
        email: user.email || "",
        avatarUrl: (user.user_metadata?.avatar_url as string | undefined) || null,
        timezoneName: (profileRow?.timezone_name as string | null) || "America/Lima",
        languageCode,
      });
    };

    void loadProfile();
  }, [locale, setLocale]);

  useEffect(() => {
    if (!showDeleteAccountBox) {
      setDeleteCountdown(0);
      return;
    }

    setDeleteCountdown(5);
    const timer = window.setInterval(() => {
      setDeleteCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [showDeleteAccountBox]);

  const initials = profile.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace(localizePublicPath(profile.languageCode || locale, "/signin"));
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setNotice(null);
    setError(null);

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError(isEn ? "Unsupported format. Use JPG, PNG, or WEBP." : "Formato no permitido. Usa JPG, PNG o WEBP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(isEn ? "Image must be 5MB or smaller." : "La imagen no debe superar 5MB.");
      return;
    }

    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(isEn ? "Could not validate session." : "No se pudo validar la sesion.");
      }

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${user.id}/avatar.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = `${publicData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      setProfile((prev) => ({ ...prev, avatarUrl: publicUrl }));
      setNotice(isEn ? "Profile photo updated." : "Foto de perfil actualizada.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : isEn ? "Could not upload photo." : "No se pudo subir la foto.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleTimezoneSave = async () => {
    setError(null);
    setNotice(null);
    setSavingTimezone(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error(isEn ? "Could not validate session." : "No se pudo validar la sesion.");

      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email || null,
          name: profile.name || null,
          timezone_name: profile.timezoneName,
        },
        { onConflict: "id" }
      );
      if (upsertError) throw new Error(upsertError.message);

      setNotice(
        isEn
          ? "Timezone saved. Reporting will use this setting."
          : "Zona horaria guardada. El reporting usará esta configuración."
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : isEn ? "Could not save timezone." : "No se pudo guardar la zona horaria.");
    } finally {
      setSavingTimezone(false);
    }
  };

  const handleLanguageSave = async () => {
    setError(null);
    setNotice(null);
    setSavingLanguage(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error(isEn ? "Could not validate session." : "No se pudo validar la sesion.");

      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email || null,
          name: profile.name || null,
          language_code: profile.languageCode,
        },
        { onConflict: "id" }
      );
      if (upsertError) throw new Error(upsertError.message);

      setLocale(profile.languageCode);
      setNotice(isEn ? "Language saved. Reloading..." : "Idioma guardado. Recargando...");
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : isEn ? "Could not save language." : "No se pudo guardar el idioma.");
    } finally {
      setSavingLanguage(false);
    }
  };

  const handleResetData = async () => {
    setError(null);
    setNotice(null);

    if (resetConfirm.trim().toUpperCase() !== "BORRAR") {
      setError(isEn ? 'Type "BORRAR" to confirm full reset.' : 'Escribe "BORRAR" para confirmar el borrado total.');
      return;
    }

    const confirmed = window.confirm(
      isEn
        ? "This action will delete all your data and reset your workspace. Continue?"
        : "Esta accion borrara toda tu data y reiniciara tu workspace. ¿Deseas continuar?"
    );
    if (!confirmed) {
      return;
    }

    setResettingData(true);
    try {
      const response = await fetch("/api/account/reset-data", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ confirm: resetConfirm }),
      });

      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || (isEn ? "Could not reset data." : "No se pudo borrar la data."));
      }

      setNotice(isEn ? "Data reset completed. Redirecting to setup..." : "Se borraron tus datos. Redirigiendo a setup...");
      setTimeout(() => {
        router.replace("/setup/business-type");
      }, 700);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : isEn ? "Could not reset data." : "No se pudo borrar la data.");
    } finally {
      setResettingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    setError(null);
    setNotice(null);

    if (deleteConfirm.trim().toUpperCase() !== "ELIMINAR") {
      setError(
        isEn
          ? 'Type "ELIMINAR" to confirm account deletion.'
          : 'Escribe "ELIMINAR" para confirmar la eliminación de la cuenta.'
      );
      return;
    }

    const confirmed = window.confirm(
      isEn
        ? "Your account will be deleted immediately with all access and data. This cannot be undone. Continue?"
        : "Tu cuenta se eliminara de inmediato y no quedara data ni acceso. Esta accion no se puede deshacer. ¿Continuar?"
    );
    if (!confirmed) {
      return;
    }

    setDeletingAccount(true);
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ confirm: deleteConfirm }),
      });

      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || (isEn ? "Could not delete account." : "No se pudo eliminar la cuenta."));
      }

      await supabase.auth.signOut();
      router.replace("/signup");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : isEn ? "Could not delete account." : "No se pudo eliminar la cuenta.");
      setDeletingAccount(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f3f5f9] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-3xl font-semibold text-[#111827] sm:text-4xl">{isEn ? "My account" : "Mi cuenta"}</h1>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}
        {notice ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>
        ) : null}

        <div className="mt-8 flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="flex items-center gap-4">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={isEn ? "Profile photo" : "Foto de perfil"}
                className="h-14 w-14 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1D293D] text-sm font-semibold text-white">
                {initials || "U"}
              </div>
            )}

            <div>
              <p className="text-base font-semibold text-[#111827]">{profile.name}</p>
              <p className="mt-0.5 text-sm text-slate-600">{profile.email || "-"}</p>
              <label className="mt-2 inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                {uploading ? (isEn ? "Uploading..." : "Subiendo...") : (isEn ? "Upload photo" : "Subir foto")}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            {isEn ? "Sign out" : "Cerrar sesión"}
          </button>
        </div>
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => setShowDeleteAccountBox((prev) => !prev)}
            className="text-xs text-slate-500 underline decoration-transparent underline-offset-2 transition hover:text-red-600 hover:decoration-red-300"
          >
            {isEn ? "Delete account" : "Eliminar cuenta"}
          </button>
        </div>

        {showDeleteAccountBox ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-700">{isEn ? "Delete account permanently" : "Eliminar cuenta permanentemente"}</p>
            <p className="mt-1 text-xs text-red-700">
              {isEn
                ? "Deletion is immediate. Your account, access, credentials, and data will be removed."
                : "El borrado es inmediato. Se eliminará tu cuenta y no quedará data, accesos ni credenciales."}
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                value={deleteConfirm}
                onChange={(event) => setDeleteConfirm(event.target.value)}
                placeholder={isEn ? 'Type "ELIMINAR"' : 'Escribe "ELIMINAR"'}
                className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-red-700 outline-none ring-red-300 focus:ring-2 sm:max-w-xs"
              />
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deletingAccount || deleteCountdown > 0}
                className="inline-flex items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingAccount
                  ? (isEn ? "Deleting..." : "Eliminando...")
                  : deleteCountdown > 0
                    ? `${isEn ? "Wait" : "Espera"} ${deleteCountdown}s`
                    : (isEn ? "Delete account now" : "Eliminar cuenta ahora")}
              </button>
            </div>
            {deleteCountdown > 0 ? (
              <p className="mt-2 text-xs text-red-700">
                {isEn
                  ? `Security delay active. You can confirm in ${deleteCountdown}s.`
                  : `Medida de seguridad activa. Podrás confirmar en ${deleteCountdown}s.`}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <p className="text-sm font-semibold text-[#111827]">{isEn ? "Billing and plan" : "Facturación y plan"}</p>
          <p className="mt-1 text-xs text-slate-500">
            {isEn
              ? "Review charges, change your plan, and manage membership."
              : "Revisa cobros, cambia de plan y gestiona tu membresía."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/mi-cuenta/facturacion")}
            className="mt-3 inline-flex items-center justify-center rounded-lg bg-[#1D293D] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            {isEn ? "Go to billing" : "Ir a facturación"}
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <p className="text-sm font-semibold text-[#111827]">{isEn ? "App language" : "Idioma de la aplicación"}</p>
          <p className="mt-1 text-xs text-slate-500">
            {isEn
              ? "This will be your default language when signing in."
              : "Este idioma será tu predeterminado al iniciar sesión."}
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={profile.languageCode}
              onChange={(event) =>
                setProfile((prev) => ({
                  ...prev,
                  languageCode: event.target.value === "es" ? "es" : "en",
                }))
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#1D293D] outline-none ring-[#1D293D] focus:ring-2 sm:max-w-sm"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
            <button
              type="button"
              onClick={handleLanguageSave}
              disabled={savingLanguage}
              className="inline-flex items-center justify-center rounded-lg bg-[#1D293D] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingLanguage ? (isEn ? "Saving..." : "Guardando...") : (isEn ? "Save language" : "Guardar idioma")}
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <p className="text-sm font-semibold text-[#111827]">{isEn ? "Reporting timezone" : "Zona horaria para reporting"}</p>
          <p className="mt-1 text-xs text-slate-500">
            {isEn
              ? "Defines how Today/Yesterday and daily metric close are calculated."
              : "Define cómo se calcula Hoy/Ayer y el cierre diario de métricas."}
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={profile.timezoneName}
              onChange={(event) =>
                setProfile((prev) => ({ ...prev, timezoneName: event.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#1D293D] outline-none ring-[#1D293D] focus:ring-2 sm:max-w-sm"
            >
              {TIMEZONE_OPTIONS.map((timezone) => (
                <option key={timezone} value={timezone}>
                  {timezone}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleTimezoneSave}
              disabled={savingTimezone}
              className="inline-flex items-center justify-center rounded-lg bg-[#1D293D] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingTimezone ? (isEn ? "Saving..." : "Guardando...") : (isEn ? "Save timezone" : "Guardar zona horaria")}
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 sm:p-5">
          <p className="text-sm font-semibold text-red-700">{isEn ? "Danger zone" : "Zona de peligro"}</p>
          <p className="mt-1 text-xs text-red-600">
            {isEn
              ? "Delete all OMNI Scale data (assets, metrics, onboarding, integrations) and restart from scratch as a new account."
              : "Borra toda tu data de OMNI Scale (assets, métricas, onboarding e integraciones) y reinicia desde cero como cuenta recién creada."}
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              value={resetConfirm}
              onChange={(event) => setResetConfirm(event.target.value)}
              placeholder={isEn ? 'Type "BORRAR"' : 'Escribe "BORRAR"'}
              className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-red-700 outline-none ring-red-300 focus:ring-2 sm:max-w-xs"
            />
            <button
              type="button"
              onClick={handleResetData}
              disabled={resettingData}
              className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resettingData ? (isEn ? "Deleting..." : "Borrando...") : (isEn ? "Delete all data" : "Borrar data completa")}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
