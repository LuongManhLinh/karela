export interface DocumentationSettings {
  product_vision?: string;
  product_scope?: string;
  sprint_goals?: string;
  glossary?: string;
  constraints?: string;
  additional_docs?: { [key: string]: string };
}

export interface LLMSettings {
  guidelines?: string;
  additional_contexts?: { [key: string]: string };
}

export interface ProjectSettings {
  documentation: DocumentationSettings;
  llm_context: LLMSettings;
}
