"use client";

import { NotFound } from "@/components/NotFound";
import ProposalSessionItemPage from "@/components/proposals/PropsalItemPage";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";

const CLProposalSessionItemPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();

  const idOrKey = useMemo(() => {
    return params.idOrKey as string;
  }, [params]);
  const sessionSource = searchParams.get("sessionSource") as string;

  if (sessionSource === "ANALYSIS" || sessionSource === "CHAT") {
    return (
      <ProposalSessionItemPage
        sessionIdOrKey={idOrKey}
        sessionSource={sessionSource}
        level="project"
      />
    );
  }
  return <NotFound />;
};

export default CLProposalSessionItemPage;
