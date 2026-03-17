"use client";

import ProposalLayout from "@/components/proposals/ProposalLayout";
import { useParams } from "next/navigation";
import { useMemo } from "react";

const CLProposalLayout = () => {
  const params = useParams();
  const idOrKey = useMemo(() => params.idOrKey as string | undefined, [params]);
  return <ProposalLayout level="connection" idOrKey={idOrKey} />;
};

export default CLProposalLayout;
