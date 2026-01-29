"use client";

import ProposalLayout from "@/components/proposals/ProposalLayout";
import { useParams } from "next/navigation";
import { useMemo } from "react";

const CLProposalLayout = () => {
  const params = useParams();
  const { connectionName, idOrKey } = useMemo(
    () => ({
      connectionName: params.connectionName as string,
      idOrKey: (params.idOrKey as string) || undefined,
    }),
    [params],
  );
  return (
    <ProposalLayout
      level="connection"
      connectionName={connectionName}
      idOrKey={idOrKey}
    />
  );
};

export default CLProposalLayout;
