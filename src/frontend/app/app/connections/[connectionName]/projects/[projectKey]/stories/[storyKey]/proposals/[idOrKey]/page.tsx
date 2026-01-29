"use client";

import { NotFound } from "@/components/NotFound";
import ProposalSessionItemPage from "@/components/proposals/PropsalItemPage";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";

const SLProposalSessionItemPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();

  const { connectionName, projectKey, storyKey, idOrKey } = useMemo(() => {
    return {
      connectionName: params.connectionName as string,
      projectKey: params.projectKey as string,
      storyKey: params.storyKey as string,
      idOrKey: params.idOrKey as string,
    };
  }, [params]);
  const sessionSource = searchParams.get("sessionSource") as string;

  if (sessionSource === "ANALYSIS" || sessionSource === "CHAT") {
    return (
      <ProposalSessionItemPage
        connectionName={connectionName}
        projectFilterKey={projectKey}
        storyFilterKey={storyKey}
        sessionIdOrKey={idOrKey}
        sessionSource={sessionSource}
        level="story"
      />
    );
  }
  return <NotFound />;
};

export default SLProposalSessionItemPage;
