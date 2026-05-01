"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/utils/jwtUtils";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import AppLoading from "@/components/AppLoading";
import { ServiceUnavailable } from "@/components/errors/ServiceUnavailable";

export default function Home() {
  const router = useRouter();
  const { resetAll } = useWorkspaceStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const token = getToken();
    
    if (token) {
      router.push("/app");
    } else {
      resetAll();
      router.push("/login");
    }

    const timer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [router, resetAll]);

  if (loading) {
    return <AppLoading />;
  }

  return <ServiceUnavailable />;
}
