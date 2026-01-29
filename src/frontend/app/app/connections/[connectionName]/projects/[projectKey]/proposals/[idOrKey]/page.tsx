"use client";

import { NotFound } from "@/components/NotFound";
import ProposalSessionItemPage from "@/components/proposals/PropsalItemPage";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";

const PLProposalSessionItemPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();

  const { connectionName, projectKey, idOrKey } = useMemo(() => {
    return {
      connectionName: params.connectionName as string,
      projectKey: params.projectKey as string,
      idOrKey: params.idOrKey as string,
    };
  }, [params]);
  const sessionSource = searchParams.get("sessionSource") as string;

  if (sessionSource === "ANALYSIS" || sessionSource === "CHAT") {
    return (
      <ProposalSessionItemPage
        connectionName={connectionName}
        projectFilterKey={projectKey}
        sessionIdOrKey={idOrKey}
        sessionSource={sessionSource}
        level="project"
      />
    );
  }
  return <NotFound />;
};

export default PLProposalSessionItemPage;
