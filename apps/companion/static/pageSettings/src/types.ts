export type ExtraDoc = { id: string; title: string; content: string };

export type ProjectSettings = {
  enableLLM: boolean;
  coverageThreshold: number;
  productVision?: string;
  productScope?: string;
  sprintGoals?: string;
  glossary?: string;
  constraints?: string;
  llmGuidelines?: string;
  extraDocs?: ExtraDoc[];
};
