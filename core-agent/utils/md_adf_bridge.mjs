#!/usr/bin/env node
// Usage:
//   node md_adf_bridge.mjs md2adf   < markdown.md   > adf.json
//   node md_adf_bridge.mjs adf2md   < adf.json      > markdown.md

import { stdin, stdout, stderr } from "node:process";
import { Parser } from "extended-markdown-adf-parser";

const direction = process.argv[2];
if (!direction || !["md2adf", "adf2md"].includes(direction)) {
  stderr.write("Usage: node md_adf_bridge.mjs <md2adf|adf2md>\n");
  process.exit(2);
}

const parser = new Parser(); // ← required

let buf = "";
stdin.setEncoding("utf8");
stdin.on("data", (c) => (buf += c));

stdin.on("end", async () => {
  try {
    if (direction === "md2adf") {
      // Markdown (string) -> ADF (object)
      const adf = parser.markdownToAdf(buf);
      stdout.write(JSON.stringify(adf, null, 2));
    } else {
      // ADF (JSON) -> Markdown (string)
      const adf = JSON.parse(buf);
      const md = parser.adfToMarkdown(adf);
      stdout.write(md);
    }
  } catch (err) {
    stderr.write(
      "\n*** Conversion Error ***\n" +
        (err && err.stack ? err.stack : String(err)) +
        "\n"
    );
    process.exit(1);
  }
});
