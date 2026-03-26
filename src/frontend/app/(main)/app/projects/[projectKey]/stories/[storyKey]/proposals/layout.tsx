"use client";

import ProposalLayout from "@/components/proposals/ProposalLayout";
import { useParams } from "next/navigation";
import { useMemo } from "react";

const SLProposalLayout: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const params = useParams();
  const { projectKey, storyKey, idOrKey } = useMemo(
    () => ({
      projectKey: params.projectKey as string,
      storyKey: params.storyKey as string,
      idOrKey: (params.idOrKey as string) || undefined,
    }),
    [params],
  );
  return (
    <ProposalLayout
      children={children}
      level="story"
      projectKey={projectKey}
      storyKey={storyKey}
      idOrKey={idOrKey}
    />
  );
};

export default SLProposalLayout;
