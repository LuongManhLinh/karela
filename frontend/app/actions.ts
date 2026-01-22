"use server";

import fs from "fs";
import path from "path";
import { LintError, lintGherkin } from "@/utils/gherkinLinter";

export async function lintGherkinAction(
  content: string,
): Promise<LintError[]> {
  return await lintGherkin(content);
}

export async function debugLintConfigAction(): Promise<{
  cwd: string;
  configExists: boolean;
  configContent: string | null;
}> {
  const cwd = process.cwd();
  const configPath = path.join(cwd, ".gherkin-lintrc");
  const configExists = fs.existsSync(configPath);
  let configContent: string | null = null;
  if (configExists) {
    configContent = fs.readFileSync(configPath, { encoding: "utf-8" });
  }
  return { cwd, configExists, configContent };
}
