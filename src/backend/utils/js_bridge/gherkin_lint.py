import json
import subprocess
from pathlib import Path
from typing import TypedDict


HERE = Path(__file__).parent.resolve()
LINT_BRIDGE = HERE / "gherkin_lint.mjs"


class LintError(TypedDict):
    message: str
    rule: str
    line: int


def lint_gherkin(content: str) -> list[LintError]:
    """Lint Gherkin content using gherkin-lint via Node.js bridge.

    Returns a list of lint errors. Empty list means the content is valid.
    """
    proc = subprocess.run(
        ["node", str(LINT_BRIDGE)],
        input=content.encode("utf-8"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=HERE,
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(
            f"Gherkin lint bridge error: {proc.stderr.decode('utf-8', 'replace')}"
        )
    output = proc.stdout.decode("utf-8").strip()
    if not output:
        return []
    return json.loads(output)
