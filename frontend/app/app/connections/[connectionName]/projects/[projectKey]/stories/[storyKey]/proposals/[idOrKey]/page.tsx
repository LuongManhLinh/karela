"use client";

import { NotFound } from "@/components/NotFound";
import ProposalSessionItemPage from "@/components/proposals/PropsalItemPage";
import { useParams, useSearchParams } from "next/navigation";

const SLProposalSessionItemPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();

  const connectionName = params.connectionName as string;
  const projectKey = params.projectKey as string;
  const storyKey = params.storyKey as string;
  const idOrKey = params.idOrKey as string;
  const sessionSource = searchParams.get("sessionSource") as string;

  if (sessionSource === "ANALYSIS" || sessionSource === "CHAT") {
    return (
      <ProposalSessionItemPage
        connectionName={connectionName}
        projectKey={projectKey}
        storyKey={storyKey}
        sessionIdOrKey={idOrKey}
        sessionSource={sessionSource}
        level="story"
      />
    );
  }
  return <NotFound />;
};

export default SLProposalSessionItemPage;
