import fsPromises from "fs/promises";
import os from "os";
import path from "path";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

export interface LintError {
  message: string;
  rule: string;
  line: number;
}

export interface LintResult {
  filePath: string;
  errors: LintError[];
}

export const lintGherkin = async (content: string): Promise<LintError[]> => {
  // 1. Generate a unique temp file path
  const tempDir = os.tmpdir();
  const fileName = `lint-${Date.now()}-${Math.random().toString(36).substring(7)}.feature`;
  const tempFilePath = path.join(tempDir, fileName);

  try {
    // 2. Write the content to the temp file
    await fsPromises.writeFile(tempFilePath, content, "utf8");

    // 3. Determine paths
    const projectRoot = process.cwd();
    // Assuming node_modules is at the project root where the server is running
    const gherkinLintBin = path.join(projectRoot, "node_modules", ".bin", "gherkin-lint");
    const configPath = path.join(projectRoot, ".gherkin-lintrc");

    // 4. Run the linter via CLI
    // -c specifies the config file
    // -f json specifies json output
    const command = `"${gherkinLintBin}" -c "${configPath}" -f json "${tempFilePath}"`;

    console.log("[lintGherkin] Executing:", command);

    const { stdout, stderr } = await execPromise(command).catch((e) => {
      // gherkin-lint exits with non-zero code if there are lint errors.
      // We catch this and return the stdout/stderr as the result if available.
      if (e.stdout || e.stderr) {
         return { stdout: e.stdout, stderr: e.stderr };
      }
      throw e;
    });
    
    // 5. Parse results
    // stdout should contain the JSON array of results, but sometimes it goes to stderr on error?
    let jsonOutput = stdout;
    if ((!jsonOutput || jsonOutput.trim().length === 0) && stderr && stderr.trim().startsWith("[")) {
        jsonOutput = stderr;
    }
    
    if (!jsonOutput || jsonOutput.trim().length === 0) {
        return [];
    }

    try {
        const results: LintResult[] = JSON.parse(jsonOutput as string);
        const errors = results.flatMap((result) =>
            result.errors.map((error) => {
                if (
                    error.rule === "unexpected-error" &&
                    error.message.includes("expected: #EOF, #Language, #TagLine, #FeatureLine, #Comment, #Empty")
                ) {
                    error.message = "Missing Feature keyword";
                }
                return error;
            })
        );
        return errors;
    } catch (parseError) {
        throw parseError;
    }

  } catch (error: any) {
    console.error("Error running gherkin-lint:", error);
    // If it's a legitimate execution error (not just lint errors), rethrow or return empty
    // Check if it was just the exit code
    if (error.code && error.stdout) {
        // This path might be redundant with the catch block above but serves as safety
         try {
            return JSON.parse(error.stdout);
        } catch {
             throw error;
        }
    }
    throw error;
  } finally {
    // 6. Cleanup: Always delete the temp file
    try {
      await fsPromises.unlink(tempFilePath);
    } catch (cleanupError) {
      console.warn("Failed to delete temp file:", cleanupError);
    }
  }
};
