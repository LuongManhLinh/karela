import { invoke, view } from "@forge/bridge";
import type { ProjectSettings } from "../types";

export async function getContext(): Promise<any> {
  try {
    return await view.getContext();
  } catch (e) {
    return {} as any;
  }
}

export async function invokeGetSettings(
  projectId: string
): Promise<ProjectSettings> {
  const res = (await invoke("getProjectSettings", { projectId })) as any;
  return res as ProjectSettings;
}

export async function invokeSetSettings(
  projectId: string,
  settings: ProjectSettings
): Promise<{ ok: boolean }> {
  const res = (await invoke("setProjectSettings", {
    projectId,
    settings,
  })) as any;
  return res as { ok: boolean };
}
