import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentationService } from "@/services/documentationService";
import type {
  CreateTextDocumentationRequest,
  UpdateTextDocumentationRequest,
  UpdateFileDocumentationRequest,
} from "@/types/documentation";

export const TEXT_DOC_KEYS = {
  all: ["textDocs"] as const,
  byProject: (projectKey: string) =>
    [...TEXT_DOC_KEYS.all, projectKey] as const,
};

export const FILE_DOC_KEYS = {
  all: ["fileDocs"] as const,
  byProject: (projectKey: string) =>
    [...FILE_DOC_KEYS.all, projectKey] as const,
};

// ── Text Documentation Hooks ─────────────────────────────────

export const useTextDocsQuery = (projectKey: string | undefined) => {
  return useQuery({
    queryKey: TEXT_DOC_KEYS.byProject(projectKey || ""),
    queryFn: () => documentationService.listTextDocs(projectKey!),
    enabled: !!projectKey,
    retry: false,
  });
};

export const useCreateTextDocMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectKey,
      data,
    }: {
      projectKey: string;
      data: CreateTextDocumentationRequest;
    }) => documentationService.createTextDoc(projectKey, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: TEXT_DOC_KEYS.byProject(variables.projectKey),
      });
    },
  });
};

export const useUpdateTextDocMutation = (projectKey: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      docId,
      data,
    }: {
      docId: string;
      data: UpdateTextDocumentationRequest;
    }) => documentationService.updateTextDoc(docId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TEXT_DOC_KEYS.byProject(projectKey),
      });
    },
  });
};

export const useDeleteTextDocMutation = (projectKey: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ docId }: { docId: string }) =>
      documentationService.deleteTextDoc(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TEXT_DOC_KEYS.byProject(projectKey),
      });
    },
  });
};

// ── File Documentation Hooks ─────────────────────────────────

export const useFileDocsQuery = (projectKey: string | undefined) => {
  return useQuery({
    queryKey: FILE_DOC_KEYS.byProject(projectKey || ""),
    queryFn: () => documentationService.listFileDocs(projectKey!),
    enabled: !!projectKey,
    retry: false,
  });
};

export const useUploadFileDocMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectKey,
      file,
      description,
    }: {
      projectKey: string;
      file: File;
      description?: string;
    }) => documentationService.uploadFileDoc(projectKey, file, description),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: FILE_DOC_KEYS.byProject(variables.projectKey),
      });
    },
  });
};

export const useUpdateFileDocMutation = (projectKey: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      docId,
      data,
    }: {
      docId: string;
      data: UpdateFileDocumentationRequest;
    }) => documentationService.updateFileDoc(docId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: FILE_DOC_KEYS.byProject(projectKey),
      });
    },
  });
};

export const useDeleteFileDocMutation = (projectKey: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ docId }: { docId: string }) =>
      documentationService.deleteFileDoc(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: FILE_DOC_KEYS.byProject(projectKey),
      });
    },
  });
};
