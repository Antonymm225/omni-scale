"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

type ProfileState = {
  name: string;
  email: string;
};

export default function Page() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileState>({
    name: "Usuario",
    email: "",
  });

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

      setProfile({
        name: fullName,
        email: user.email || "",
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

  return (
    <main className="min-h-screen bg-[#f3f5f9] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-3xl font-semibold text-[#111827] sm:text-4xl">Mi cuenta</h1>

        <div className="mt-8 flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1D293D] text-sm font-semibold text-white">
              {initials || "U"}
            </div>

            <div>
              <p className="text-base font-semibold text-[#111827]">{profile.name}</p>
              <p className="mt-0.5 text-sm text-slate-600">{profile.email || "-"}</p>
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
      </div>
    </main>
  );
}
