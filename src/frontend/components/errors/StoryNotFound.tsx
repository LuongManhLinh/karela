import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export const StoryNotFound = () => {
  const t = useTranslations("errors.StoryNotFound");
  const router = useRouter();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100%"
      gap={2}
    >
      <Typography variant="h5" color="error">
        {t("title")}
      </Typography>
      <Typography variant="body1">{t("message")}</Typography>
      <Button variant="contained" onClick={() => router.back()}>
        {t("goBack")}
      </Button>
    </Box>
  );
};
