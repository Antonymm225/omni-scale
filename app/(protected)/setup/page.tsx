"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/setup/business-type");
  }, [router]);

  return null;
}