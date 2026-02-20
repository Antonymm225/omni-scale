"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function SetupPage() {
  const router = useRouter();

  useEffect(() => {
    const resolveOnboardingStep = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/signin");
        return;
      }

      const { data: onboarding, error: onboardingError } = await supabase
        .from("user_onboarding")
        .select("company_name,business_type,plan,assets_connected")
        .eq("user_id", user.id)
        .maybeSingle();

      if (onboardingError) {
        router.replace("/setup/business-type");
        return;
      }

      if (!onboarding) {
        router.replace("/setup/business-type");
        return;
      }

      if (!onboarding.company_name || !onboarding.business_type) {
        router.replace("/setup/business-type");
        return;
      }

      if (!onboarding.plan) {
        router.replace("/setup/choose-plan");
        return;
      }

      if (!onboarding.assets_connected) {
        router.replace("/setup/connect-assets");
        return;
      }

      router.replace("/dashboard");
    };

    resolveOnboardingStep();
  }, [router]);

  return null;
}
