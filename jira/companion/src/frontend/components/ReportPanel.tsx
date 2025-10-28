import React from "react";
import { Box, AdfRenderer, DocNode } from "@forge/react";

import { markdownToAdf } from "marklassian";

export default function ReportPanel({ report }: { report: string }) {
  const adfContent = markdownToAdf(report) as DocNode;

  return (
    <Box>
      <AdfRenderer document={adfContent} />
    </Box>
  );
}
