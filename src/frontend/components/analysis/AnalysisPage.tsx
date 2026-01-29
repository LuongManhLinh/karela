import { Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";

export default function AnalysisPage() {
  const t = useTranslations("analysis.AnalysisPage");
  return (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Typography color="text.secondary" variant="h5">
          {t("selectAnalysis")}
        </Typography>
      </Box>
    </Box>
  );
}
