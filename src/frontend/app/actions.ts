"use server";

import fs from "fs";
import path from "path";
import { LintError, lintGherkin } from "@/utils/gherkinLinter";

export async function lintGherkinAction(content: string): Promise<LintError[]> {
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

export async function getThemesAction(): Promise<
  Array<{ name: string; primary: string }>
> {
  const themesPath = path.join(process.cwd(), "public", "themes");
  const files = await fs.promises.readdir(themesPath);

  const themeFiles = files.filter((file) => file.endsWith(".json"));

  const themes = await Promise.all(
    themeFiles.map(async (file) => {
      const filePath = path.join(themesPath, file);
      const content = await fs.promises.readFile(filePath, {
        encoding: "utf-8",
      });
      const data = JSON.parse(content) as {
        coreColors?: { primary?: string };
      };

      return {
        name: file,
        primary: data.coreColors?.primary || "#000000",
      };
    }),
  );

  return themes.sort((a, b) => a.name.localeCompare(b.name));
}
