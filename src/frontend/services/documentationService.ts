import apiClient from "./api";
import type { BasicResponse } from "@/types";
import type {
  TextDocumentationDto,
  CreateTextDocumentationRequest,
  UpdateTextDocumentationRequest,
  FileDocumentationDto,
  UpdateFileDocumentationRequest,
} from "@/types/documentation";

export const documentationService = {
  // ── Bulk Documentation ──────────────────────────────────────

  bulkUploadDocs: async (
    projectKey: string,
    textDocs: { name: string; content: string; description?: string }[],
    fileDocs: { file: File; description?: string }[],
  ): Promise<
    BasicResponse<{
      text_docs: TextDocumentationDto[];
      file_docs: FileDocumentationDto[];
    }>
  > => {
    const formData = new FormData();

    formData.append("text_docs_json", JSON.stringify(textDocs));

    const fileDocsMeta: Record<string, string> = {};
    fileDocs.forEach(({ file, description }) => {
      formData.append("files", file);
      if (description && description.trim()) {
        fileDocsMeta[file.name] = description.trim();
      }
    });

    formData.append("file_docs_meta_json", JSON.stringify(fileDocsMeta));

    const response = await apiClient.post<
      BasicResponse<{
        text_docs: TextDocumentationDto[];
        file_docs: FileDocumentationDto[];
      }>
    >(`/documentation/projects/${projectKey}/bulk-docs`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // ── Text Documentation ──────────────────────────────────────

  listTextDocs: async (
    projectKey: string,
  ): Promise<BasicResponse<TextDocumentationDto[]>> => {
    const response = await apiClient.get<BasicResponse<TextDocumentationDto[]>>(
      `/documentation/projects/${projectKey}/text-docs`,
    );
    return response.data;
  },

  createTextDoc: async (
    projectKey: string,
    data: CreateTextDocumentationRequest,
  ): Promise<BasicResponse<TextDocumentationDto>> => {
    const response = await apiClient.post<BasicResponse<TextDocumentationDto>>(
      `/documentation/projects/${projectKey}/text-docs`,
      data,
    );
    return response.data;
  },

  updateTextDoc: async (
    docId: string,
    data: UpdateTextDocumentationRequest,
  ): Promise<BasicResponse<TextDocumentationDto>> => {
    const response = await apiClient.put<BasicResponse<TextDocumentationDto>>(
      `/documentation/text-docs/${docId}`,
      data,
    );
    return response.data;
  },

  deleteTextDoc: async (docId: string): Promise<BasicResponse> => {
    const response = await apiClient.delete<BasicResponse>(
      `/documentation/text-docs/${docId}`,
    );
    return response.data;
  },

  // ── File Documentation ──────────────────────────────────────

  listFileDocs: async (
    projectKey: string,
  ): Promise<BasicResponse<FileDocumentationDto[]>> => {
    const response = await apiClient.get<BasicResponse<FileDocumentationDto[]>>(
      `/documentation/projects/${projectKey}/file-docs`,
    );
    return response.data;
  },

  uploadFileDoc: async (
    projectKey: string,
    file: File,
    description?: string,
  ): Promise<BasicResponse<FileDocumentationDto>> => {
    const formData = new FormData();
    formData.append("file", file);
    if (description && description.trim()) {
      formData.append("description", description.trim());
    }
    const response = await apiClient.post<BasicResponse<FileDocumentationDto>>(
      `/documentation/projects/${projectKey}/file-docs`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  updateFileDoc: async (
    docId: string,
    data: UpdateFileDocumentationRequest,
  ): Promise<BasicResponse<FileDocumentationDto>> => {
    const response = await apiClient.put<BasicResponse<FileDocumentationDto>>(
      `/documentation/file-docs/${docId}`,
      data,
    );
    return response.data;
  },

  deleteFileDoc: async (docId: string): Promise<BasicResponse> => {
    const response = await apiClient.delete<BasicResponse>(
      `/documentation/file-docs/${docId}`,
    );
    return response.data;
  },

  downloadFileDoc: async (docId: string): Promise<Blob> => {
    const response = await apiClient.get(
      `/documentation/file-docs/${docId}/download`,
      { responseType: "blob" },
    );
    return response.data;
  },
};
