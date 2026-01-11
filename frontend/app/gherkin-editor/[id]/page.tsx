"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Paper, Typography, CircularProgress } from "@mui/material";
import GherkinEditorWrapper from "@/components/gherkin-editor/GherkinEditorWrapper";
import SuggestionPanel from "@/components/gherkin-editor/SuggestionPanel";
import { useACStore } from "@/store/useACStore";

export default function GherkinEditorInternalPage() {
  const params = useParams();
  const id = params?.id as string;
  const { acs, updateAC, fetchACs, loading, selectedACId, selectAC } =
    useACStore();

  const [currentAC, setCurrentAC] = useState<any>(null);

  useEffect(() => {
    if (id) {
      selectAC(id);
    }
  }, [id, selectAC]);

  useEffect(() => {
    if (acs.length > 0 && id) {
      const found = acs.find((a) => a.id === id);
      setCurrentAC(found || null);
    }
  }, [acs, id]);

  const handleSave = (val: string) => {
    // if (id) {
    //     updateAC(id, val);
    // }
  };

  if (loading && !currentAC) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!currentAC && !loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography>AC Not Found</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{ height: "100%", p: 2, display: "flex", flexDirection: "column" }}
    >
      <Typography variant="h6" gutterBottom>
        {currentAC?.content?.split("\n")[0] || "Untitled AC"}
      </Typography>
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <GherkinEditorWrapper
          initialValue={currentAC?.content || ""}
          onChange={handleSave}
        />
      </Box>
    </Box>
  );
}
