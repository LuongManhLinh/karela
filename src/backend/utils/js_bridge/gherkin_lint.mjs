#!/usr/bin/env node
// Usage: echo "Feature: ..." | node gherkin_lint.mjs
// Outputs: JSON array of {message, rule, line} objects (empty array = no errors)

import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { execSync } from "node:child_process";
import { stdin, stdout, stderr } from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

let buf = "";
stdin.setEncoding("utf8");
stdin.on("data", (c) => (buf += c));

stdin.on("end", () => {
  const tempFile = join(
    tmpdir(),
    `lint-${Date.now()}-${Math.random().toString(36).slice(2)}.feature`
  );

  try {
    writeFileSync(tempFile, buf, "utf8");

    const bin = join(__dirname, "node_modules", ".bin", "gherkin-lint");
    const config = join(__dirname, ".gherkin-lintrc");
    const cmd = `"${bin}" -c "${config}" -f json "${tempFile}"`;

    let output = "";
    try {
      output = execSync(cmd, { encoding: "utf8", cwd: __dirname, stdio: ["pipe", "pipe", "pipe"] });
    } catch (e) {
      // gherkin-lint exits non-zero when lint errors exist
      output = e.stdout || e.stderr || "";
    }

    if (!output || output.trim().length === 0) {
      stdout.write("[]");
      return;
    }

    // Parse and flatten errors
    const results = JSON.parse(output);
    const errors = results.flatMap((r) =>
      r.errors.map((err) => {
        if (
          err.rule === "unexpected-error" &&
          err.message.includes(
            "expected: #EOF, #Language, #TagLine, #FeatureLine, #Comment, #Empty"
          )
        ) {
          err.message = "Missing Feature keyword";
        }
        return { message: err.message, rule: err.rule, line: err.line };
      })
    );
    stdout.write(JSON.stringify(errors));
  } catch (e) {
    stderr.write(
      "\n*** Lint Error ***\n" +
        (e && e.stack ? e.stack : String(e)) +
        "\n"
    );
    process.exit(1);
  } finally {
    try {
      unlinkSync(tempFile);
    } catch {}
  }
});
