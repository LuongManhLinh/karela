"use client";

import ProposalLayout from "@/components/proposals/ProposalLayout";
import { useParams } from "next/navigation";
import { useMemo } from "react";

const PLProposalLayout: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const params = useParams();
  const { projectKey, idOrKey } = useMemo(
    () => ({
      projectKey: params.projectKey as string,
      idOrKey: (params.idOrKey as string) || undefined,
    }),
    [params],
  );
  return (
    <ProposalLayout
      children={children}
      level="project"
      projectKey={projectKey}
      idOrKey={idOrKey}
    />
  );
};

export default PLProposalLayout;
