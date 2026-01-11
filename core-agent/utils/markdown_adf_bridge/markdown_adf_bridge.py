import json
import shutil
import subprocess
from pathlib import Path
from typing import Optional

from jira2markdown import convert as jira2md_convert

HERE = Path(__file__).parent.resolve()
BRIDGE = HERE / "md_adf_bridge.mjs"
NODE_MODULES = HERE / "node_modules"
PKG_JSON = HERE / "package.json"

# You can pin versions here if you like
NPM_PKGS = [
    "extended-markdown-adf-parser",
    "md-to-adf",
    "adf-to-md",
]


def _ensure_node_bridge_ready():
    if shutil.which("node") is None:
        raise RuntimeError(
            "Node.js is required on PATH to run the Markdown<->ADF bridge."
        )

    # Write a minimal package.json if missing
    if not PKG_JSON.exists():
        PKG_JSON.write_text(
            json.dumps({"type": "module", "name": "md-adf-bridge", "private": True}),
            encoding="utf-8",
        )

    # Install packages if missing
    missing = [p for p in NPM_PKGS if not (NODE_MODULES / p.split("@")[0]).exists()]
    if missing:
        # Use npm if available, otherwise try pnpm or yarn
        npm = shutil.which("npm") or shutil.which("pnpm") or shutil.which("yarn")
        if npm is None:
            raise RuntimeError(
                "npm/pnpm/yarn not found. Please install Node.js and npm."
            )
        cmd = [npm, "i"] + missing
        subprocess.run(cmd, cwd=HERE, check=True)

    # Ensure the bridge file exists (you saved it next to this .py file)
    if not BRIDGE.exists():
        raise RuntimeError(
            f"Bridge script not found at {BRIDGE}. Save md_adf_bridge.mjs next to this Python file."
        )


def _run_bridge(direction: str, payload: str) -> str:
    _ensure_node_bridge_ready()
    # Run: node md_adf_bridge.mjs <direction>, piping payload via stdin
    proc = subprocess.run(
        ["node", str(BRIDGE), direction],
        input=payload.encode("utf-8"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=HERE,
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(
            f"Bridge error ({direction}): {proc.stderr.decode('utf-8', 'replace')}"
        )
    return proc.stdout.decode("utf-8")


def md_to_adf(markdown: str) -> dict:
    """Convert Markdown string -> ADF dict."""
    out = _run_bridge("md2adf", markdown)
    return json.loads(out)


def adf_to_md(adf: dict) -> str:
    """Convert ADF dict -> Markdown string."""
    out = _run_bridge("adf2md", json.dumps(adf))
    return out


def jira_markup_to_md(jira_text: str, mention_mapping: Optional[dict] = None) -> str:
    """
    Convert Jira markup text -> Markdown string.

    Args:
        jira_text: Text containing Jira markup syntax
        mention_mapping: Optional dict mapping Jira internal account IDs to usernames
                        for converting user mentions like [~accountid:internal-id]

    Returns:
        Converted Markdown string

    Example:
        >>> jira_markup_to_md("Some *bold* and _italic_ text")
        'Some **bold** and _italic_ text'
        >>> jira_markup_to_md("[Link|https://example.com]")
        '[Link](https://example.com)'
    """
    if mention_mapping is None:
        mention_mapping = {}
    return jira2md_convert(jira_text, mention_mapping)
