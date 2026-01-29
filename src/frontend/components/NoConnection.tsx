import React from "react";
import { Box, Typography } from "@mui/material";
import { OpenInNew } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export const NoConnection: React.FC = () => {
  const router = useRouter();
  const t = useTranslations('NoConnection');

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Typography variant="h6" color="error" gutterBottom>
        {t('noConnections')}
      </Typography>
      <Box>
        <Typography
          variant="body1"
          sx={{ mb: 1, textDecoration: "underline", cursor: "pointer" }}
          onClick={() => router.push("/profile")}
        >
          {t('setupConnection')}
          <OpenInNew
            fontSize="small"
            sx={{ verticalAlign: "middle", ml: 0.5 }}
          />
        </Typography>
      </Box>
    </Box>
  );
};
