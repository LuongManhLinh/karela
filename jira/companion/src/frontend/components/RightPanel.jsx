import React from "react";
import { Box, Stack } from "@forge/react";
import ReportPanel from "./ReportPanel";
import SuggestionsPanel from "./SuggestionsPanel";

const RightPanel = ({ markdown, suggestions, onToggle, onCompleteAll }) => {
  return (
    <Stack space="space.200">
      <ReportPanel report={markdown} />
      <SuggestionsPanel
        suggestions={suggestions}
        onToggle={onToggle}
        onCompleteAll={onCompleteAll}
      />
    </Stack>
  );
};

export default RightPanel;
