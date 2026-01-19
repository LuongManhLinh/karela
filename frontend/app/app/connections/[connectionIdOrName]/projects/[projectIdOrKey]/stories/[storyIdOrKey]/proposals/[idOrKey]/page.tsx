import { NotFound } from "@/components/NotFound";
import ProposalSessionItemPage from "@/components/proposals/PropsalItemPage";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";

const PLProposalSessionItemPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const idOrKey = useMemo(() => {
    return params?.idOrKey as string;
  }, [params]);
  const sessionSource = useMemo(() => {
    return searchParams.get("sessionSource") as string;
  }, [searchParams]);

  if (sessionSource === "ANALYSIS" || sessionSource === "CHAT") {
    return (
      <ProposalSessionItemPage
        sessionIdOrKey={idOrKey}
        sessionSource={sessionSource}
        level="story"
      />
    );
  }
  return <NotFound />;
};

export default PLProposalSessionItemPage;
