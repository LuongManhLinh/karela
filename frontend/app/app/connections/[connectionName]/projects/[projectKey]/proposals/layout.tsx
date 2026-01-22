import ProposalLayout from "@/components/proposals/ProposalLayout";
import { useParams } from "next/navigation";
import { useMemo } from "react";

const PLProposalLayout = () => {
  const params = useParams();
  const { connectionName, projectKey, idOrKey } = useMemo(
    () => ({
      connectionName: params.connectionName as string,
      projectKey: params.projectKey as string,
      idOrKey: (params.idOrKey as string) || undefined,
    }),
    [params],
  );
  return (
    <ProposalLayout
      level="project"
      connectionName={connectionName}
      projectKey={projectKey}
      idOrKey={idOrKey}
    />
  );
};

export default PLProposalLayout;
