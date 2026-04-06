"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/utils/jwtUtils";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export default function Home() {
  const router = useRouter();
  const { resetAll } = useWorkspaceStore();

  useEffect(() => {
    const token = getToken();
    if (token) {
      router.push("/app");
    } else {
      resetAll();
      router.push("/login");
    }
  }, [router]);

  return null;
}
