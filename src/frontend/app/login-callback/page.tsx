"use client";

import { useNotificationContext } from "@/providers/NotificationProvider";
import { saveToken } from "@/utils/jwtUtils";
import { Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const LoginCallback = () => {
  const router = useRouter();
  const t = useTranslations("auth.loginCallback");
  const { notify } = useNotificationContext();
  const param = useSearchParams();

  useEffect(() => {
    const token = param?.get("token");
    if (!token) {
      notify(t("missingToken"), { severity: "error" });
      const timer = setTimeout(() => {
        router.push("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
    notify(t("loginSuccessful"), { severity: "success" });
    saveToken(token);
    const timer = setTimeout(() => {
      router.push("/profile");
    }, 1000);

    return () => clearTimeout(timer);
  }, [notify, router]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        p: 2,
        gap: 2,
      }}
    >
      <Typography variant="h4">{t("redirectingToConnections")}</Typography>
    </Box>
  );
};

export default LoginCallback;
