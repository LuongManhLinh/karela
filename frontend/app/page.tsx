"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/utils/jwtUtils";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (token) {
      router.push("/analysis");
    } else {
      router.push("/login");
    }
  }, [router]);

  return null;
}
