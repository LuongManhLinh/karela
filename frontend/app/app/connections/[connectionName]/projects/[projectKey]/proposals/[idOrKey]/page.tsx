"use client";

import { NotFound } from "@/components/NotFound";
import ProposalSessionItemPage from "@/components/proposals/PropsalItemPage";
import { useParams, useSearchParams } from "next/navigation";

const PLProposalSessionItemPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();

  const connectionName = params.connectionName as string;
  const projectKey = params.projectKey as string;
  const idOrKey = params.idOrKey as string;
  const sessionSource = searchParams.get("sessionSource") as string;

  if (sessionSource === "ANALYSIS" || sessionSource === "CHAT") {
    return (
      <ProposalSessionItemPage
        connectionName={connectionName}
        projectKey={projectKey}
        sessionIdOrKey={idOrKey}
        sessionSource={sessionSource}
        level="project"
      />
    );
  }
  return <NotFound />;
};

export default PLProposalSessionItemPage;
