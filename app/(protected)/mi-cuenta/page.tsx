"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

type ProfileState = {
  name: string;
  email: string;
  avatarUrl: string | null;
  timezoneName: string;
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
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileState>({
    name: "Usuario",
    email: "",
    avatarUrl: null,
    timezoneName: "America/Lima",
  });
  const [savingTimezone, setSavingTimezone] = useState(false);

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
        "Usuario";

      const { data: profileRow } = await supabase
        .from("profiles")
        .select("timezone_name")
        .eq("id", user.id)
        .maybeSingle();

      setProfile({
        name: fullName,
        email: user.email || "",
        avatarUrl: (user.user_metadata?.avatar_url as string | undefined) || null,
        timezoneName: (profileRow?.timezone_name as string | null) || "America/Lima",
      });
    };

    void loadProfile();
  }, []);

  const initials = profile.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/signin");
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setNotice(null);
    setError(null);

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Formato no permitido. Usa JPG, PNG o WEBP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no debe superar 5MB.");
      return;
    }

    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No se pudo validar la sesion.");
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
      setNotice("Foto de perfil actualizada.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo subir la foto.");
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

      if (!user) throw new Error("No se pudo validar la sesion.");

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

      setNotice("Zona horaria guardada. El reporting usará esta configuración.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la zona horaria.");
    } finally {
      setSavingTimezone(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f3f5f9] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-3xl font-semibold text-[#111827] sm:text-4xl">Mi cuenta</h1>

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
                alt="Foto de perfil"
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
                {uploading ? "Subiendo..." : "Subir foto"}
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
            Cerrar sesión
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <p className="text-sm font-semibold text-[#111827]">Facturación y plan</p>
          <p className="mt-1 text-xs text-slate-500">
            Revisa cobros, cambia de plan y gestiona tu membresía.
          </p>
          <button
            type="button"
            onClick={() => router.push("/mi-cuenta/facturacion")}
            className="mt-3 inline-flex items-center justify-center rounded-lg bg-[#1D293D] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Ir a facturación
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <p className="text-sm font-semibold text-[#111827]">Zona horaria para reporting</p>
          <p className="mt-1 text-xs text-slate-500">
            Define cómo se calcula Hoy/Ayer y el cierre diario de métricas.
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
              {savingTimezone ? "Guardando..." : "Guardar zona horaria"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
