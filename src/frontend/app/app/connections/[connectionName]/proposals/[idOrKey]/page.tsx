"use client";

import { NotFound } from "@/components/NotFound";
import ProposalSessionItemPage from "@/components/proposals/PropsalItemPage";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";

const CLProposalSessionItemPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();

  const { connectionName,  idOrKey } = useMemo(() => {
    return {
      connectionName: params.connectionName as string,
      idOrKey: params.idOrKey as string,
    };
  }, [params]);
  const sessionSource = searchParams.get("sessionSource") as string;

  if (sessionSource === "ANALYSIS" || sessionSource === "CHAT") {
    return (
      <ProposalSessionItemPage
        connectionName={connectionName}
        sessionIdOrKey={idOrKey}
        sessionSource={sessionSource}
        level="project"
      />
    );
  }
  return <NotFound />;
};

export default CLProposalSessionItemPage;
