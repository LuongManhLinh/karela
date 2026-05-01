import React from "react";
import { Box, Typography, Button, Container } from "@mui/material";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export const ServiceUnavailable = () => {
  const t = useTranslations("errors.ServiceUnavailable");
  const router = useRouter();

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        textAlign="center"
        gap={3}
      >
        <ErrorOutlineIcon sx={{ fontSize: 80, color: 'text.secondary' }} />
        
        <Typography variant="h3" component="h1" fontWeight="bold" color="text.primary">
          {t("title")}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {t("message")}
        </Typography>

        <Box display="flex" gap={2} mt={2}>
          <Button 
            variant="contained" 
            size="large"
            onClick={() => router.push("/app")}
            sx={{ px: 4 }}
          >
            {t("returnHome")}
          </Button>
          <Button 
            variant="outlined" 
            size="large"
            onClick={() => window.location.reload()}
            sx={{ px: 4 }}
          >
            {t("reload")}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};
