"use client";

import React from "react";
import { Box, Typography, Stack, CircularProgress } from "@mui/material";
import { useTranslations } from "next-intl";
import DefectCard from "@/components/analysis/DefectCard";
import type { DefectDto } from "@/types/analysis";

interface DefectsPanelContentProps {
  defects: DefectDto[];
  loading?: boolean;
  onMarkSolved?: (defectId: string, solved: boolean) => void;
}

export const DefectsPanelContent: React.FC<DefectsPanelContentProps> = ({
  defects,
  loading,
  onMarkSolved,
}) => {
  const t = useTranslations("workspace.WorkspacePage");

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (defects.length === 0) {
    return (
      <Typography color="text.secondary" textAlign="center">
        {t("noDefects")}
      </Typography>
    );
  }

  const handleMarkSolved = (defectId: string, solved: boolean) => {
    if (onMarkSolved) {
      onMarkSolved(defectId, solved);
    }
  };

  return (
    <Stack spacing={2}>
      {defects.map((defect) => (
        <DefectCard
          key={defect.id}
          defect={defect}
          onMarkSolved={handleMarkSolved}
        />
      ))}
    </Stack>
  );
};

export default DefectsPanelContent;
