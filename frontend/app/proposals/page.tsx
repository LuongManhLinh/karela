import type { Metadata } from "next";

import ProposalPageContent from "./layout";

export const metadata: Metadata = {
  title: "RatSnake Proposals",
  description: "Manage generated proposals",
};

export default function ProposalsPage() {
  return <ProposalPageContent />;
}
