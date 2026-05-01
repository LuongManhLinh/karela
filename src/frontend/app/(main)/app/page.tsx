"use client";

import AppLoading from "@/components/AppLoading";
import { useEffect } from "react";

const ConnectionIdPage = () => {
  useEffect(() => {
    window.location.href = "/app/dashboard";
  }, []);

  return <AppLoading />;
};

export default ConnectionIdPage;
