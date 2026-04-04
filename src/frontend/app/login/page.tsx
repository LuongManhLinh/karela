"use client";

import {
  Container,
  Paper,
  Button,
  Typography,
  Box,
  useTheme,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useNotificationContext } from "@/providers/NotificationProvider";
import { useTranslations } from "next-intl";
import { jiraService } from "@/services/jiraService";
import { JiraIconColored as JiraIcon } from "@/components/icons/JiraIcon";

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const { notify } = useNotificationContext();

  // useEffect(() => {
  //   // Check if already logged in
  //   const token = getToken();
  //   if (token) {
  //     router.push("/app/connections");
  //   }
  // }, [router]);

  const handleLogin = () => {
    notify(t("redirectingToJira"), { severity: "info" });
    jiraService.startOAuth();
  };

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
      <Box
        sx={{
          position: "absolute",
          top: 32,
          left: 32,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          component="img"
          src="logo.svg"
          alt="Logo"
          sx={{ height: 40, mr: 1 }}
        />
        <Typography variant="h5" fontWeight="bold">
          {" "}
          Karela
        </Typography>
      </Box>
      <Container component="main" maxWidth="xs">
        <Paper
          elevation={4}
          sx={{
            p: 4,
            width: "100%",
            borderRadius: 2,
          }}
        >
          <Typography
            component="h1"
            variant="h4"
            align="center"
            gutterBottom
            sx={{ fontWeight: 700, mb: 3 }}
          >
            {t("signIn")}
          </Typography>
          <Button
            fullWidth
            size="large"
            startIcon={<JiraIcon />}
            onClick={handleLogin}
            sx={{
              bgcolor: "primaryContainer",
            }}
          >
            {t("signInWithJira")}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
