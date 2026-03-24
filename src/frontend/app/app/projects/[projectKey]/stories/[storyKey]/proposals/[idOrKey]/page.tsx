"use client";

import { NotFound } from "@/components/NotFound";
import ProposalSessionItemPage from "@/components/proposals/PropsalItemPage";
import { ProposalSource } from "@/types/proposal";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";

const SLProposalSessionItemPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();

  const { projectKey, storyKey, idOrKey } = useMemo(() => {
    return {
      projectKey: params.projectKey as string,
      storyKey: params.storyKey as string,
      idOrKey: params.idOrKey as string,
    };
  }, [params]);
  const sessionSource = searchParams.get("source") as ProposalSource;

  return (
    <ProposalSessionItemPage
      projectFilterKey={projectKey}
      storyFilterKey={storyKey}
      sessionKey={idOrKey}
      sessionSource={sessionSource}
    />
  );
};

export default SLProposalSessionItemPage;
