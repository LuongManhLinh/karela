export interface TextDocumentationDto {
  id: string;
  connection_id: string;
  project_key: string;
  name: string;
  description?: string;
  content?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTextDocumentationRequest {
  name: string;
  content: string;
  description?: string;
}

export interface UpdateTextDocumentationRequest {
  description?: string;
  content?: string;
}

export interface FileDocumentationDto {
  id: string;
  connection_id: string;
  project_key: string;
  name: string;
  url: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateFileDocumentationRequest {
  description?: string;
}
