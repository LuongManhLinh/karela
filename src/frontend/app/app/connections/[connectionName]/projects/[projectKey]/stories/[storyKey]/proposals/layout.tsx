"use client";

import ProposalLayout from "@/components/proposals/ProposalLayout";
import { useParams } from "next/navigation";
import { useMemo } from "react";

const SLProposalLayout = () => {
  const params = useParams();
  const { connectionName, projectKey, storyKey, idOrKey } = useMemo(
    () => ({
      connectionName: params.connectionName as string,
      projectKey: params.projectKey as string,
      storyKey: params.storyKey as string,
      idOrKey: (params.idOrKey as string) || undefined,
    }),
    [params],
  );
  return (
    <ProposalLayout
      level="story"
      connectionName={connectionName}
      projectKey={projectKey}
      storyKey={storyKey}
      idOrKey={idOrKey}
    />
  );
};

export default SLProposalLayout;
