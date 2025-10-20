import React from "react";
import { Box, AdfRenderer } from "@forge/react";

import { markdownToAdf } from "marklassian";

export default function ReportPanel({ report }) {
  const adfContent = markdownToAdf(report ? report.content : "");

  return (
    <Box>
      <AdfRenderer document={adfContent} />
    </Box>
  );
}
