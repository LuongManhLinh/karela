"use client";

import ProposalLayout from "@/components/proposals/ProposalLayout";
import { useParams } from "next/navigation";
import { useMemo } from "react";

const CLProposalLayout: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const params = useParams();
  const idOrKey = useMemo(() => params.idOrKey as string | undefined, [params]);
  return (
    <ProposalLayout children={children} level="connection" idOrKey={idOrKey} />
  );
};

export default CLProposalLayout;
