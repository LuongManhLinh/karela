"use client";

import ProposalSessionItemPage from "@/components/proposals/PropsalItemPage";
import { ProposalSource } from "@/types/proposal";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";

const PLProposalSessionItemPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();

  const { projectKey, idOrKey } = useMemo(() => {
    return {
      projectKey: params.projectKey as string,
      idOrKey: params.idOrKey as string,
    };
  }, [params]);
  const sessionSource = searchParams.get("source") as ProposalSource;

  return (
    <ProposalSessionItemPage
      projectFilterKey={projectKey}
      sessionKey={idOrKey}
      sessionSource={sessionSource}
    />
  );
};

export default PLProposalSessionItemPage;
