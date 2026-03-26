"use client";

import { NotFound } from "@/components/NotFound";
import ProposalSessionItemPage from "@/components/proposals/PropsalItemPage";
import { ProposalSource } from "@/types/proposal";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";

const CLProposalSessionItemPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();

  const idOrKey = useMemo(() => {
    return params.idOrKey as string;
  }, [params]);
  const sessionSource = searchParams.get("source") as ProposalSource;

  return (
    <ProposalSessionItemPage
      sessionKey={idOrKey}
      sessionSource={sessionSource}
    />
  );

};

export default CLProposalSessionItemPage;
