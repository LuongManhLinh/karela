# AI Code Manipulation Mechanisms

## 1. Search & Replace Block (The "Context" Approach)

**Best for:** Chat-based refactoring, fixing bugs, or rewriting functions where line numbers might shift.

**How it works:**
The AI does not look for "Line 42." It looks for a unique block of text (the "anchor") and replaces it. This is the most robust method because it works even if you add code elsewhere in the file while the AI is thinking.

### Structure

```text
<<<<<<< SEARCH
[Exact copy of the code to find in your file]
=======
[The new code to write in its place]
>>>>>>> REPLACE

```

### Examples

**A. Create (Insert)**
*User:* "Add a logger initialization after the imports."
*AI Response:* Finds the import block and replaces it with the imports + the new code.

```python
<<<<<<< SEARCH
import json
from fastapi import WebSocket
=======
import json
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)
>>>>>>> REPLACE

```

**B. Update (Modify)**
*User:* "Change the loop to start from 1 instead of 0."
*AI Response:* Finds the specific loop line(s) and swaps them.

```python
<<<<<<< SEARCH
    for i in range(len(items)):
        process(items[i])
=======
    for i in range(1, len(items)):
        process(items[i])
>>>>>>> REPLACE

```

**C. Delete (Remove)**
*User:* "Remove the print statement."
*AI Response:* Finds the code and replaces it with nothing.

```python
<<<<<<< SEARCH
    print("Debugging connection...")
=======
>>>>>>> REPLACE

```

---

## 2. Fill-In-The-Middle / FIM (The "Ghost Text" Approach)

**Best for:** Real-time autocomplete as you type.

**How it works:**
The editor sends the AI the code *before* your cursor (Prefix) and *after* your cursor (Suffix). The AI is trained to predict the "Middle."

### Structure

* **Prompt:** `<PRE> [Code Before] <SUF> [Code After] <MID>`
* **AI Response:** `[The missing text only]`

### Examples

**A. Multi-line Append**
*User Action:* Typing a variable name inside a function.
*Prompt sent:* `<PRE>...def handle():\n    data = <SUF>\n    return data`
*AI Response:*

```python
 await websocket.receive_text()
    if not data:
        return None

```

*Result:* The editor inserts this text at the cursor position.

**B. Mid-word Replacement (Range Edit)**
*User Action:* Cursor is in `client_name` -> `client_`|`name`.
*Prompt sent:* `<PRE>print(client_<SUF>name)</SUF>`
*AI Response:*

```text
id

```

*Editor Logic:* The editor sees the AI suggested `id`, but the file has `name`. It deletes `name` and inserts `id` to create `client_id`.

---

## 3. Unified Diff (The "Patch" Approach)

**Best for:** Applying changes across many files quickly; used by tools that act like a "git patch."

**How it works:**
The AI generates a standard Git-style diff. This is very token-efficient (it doesn't repeat the whole function like Mechanism #1), but it is strict. If your file changes by even one space before the patch is applied, it might fail.

### Structure

Standard Unix/Git Diff format.

### Example: Update & Delete

*User:* "Rename `init_data` to `payload` and remove the token check."

*AI Response:*

```diff
--- server.py
+++ server.py
@@ -10,4 +10,2 @@
-    init_data = json.loads(init_message)
-    token = init_data.get("token")
+    payload = json.loads(init_message)
+    token = payload.get("token")

```

---

## 4. Line-Range Function Calling (The "Agent" Approach)

**Best for:** Autonomous agents (like Devin or OpenInterpreter) that have full control over the file system and read the file immediately before editing.

**How it works:**
The AI uses a "tool" or "function" provided by the system. It specifies exact start and end line numbers.

### Structure

JSON-based tool call.

### Example: Update

*User:* "Change the error code on line 15."

*AI Response (JSON):*

```json
{
  "function": "edit_file",
  "parameters": {
    "file": "main.py",
    "start_line": 15,
    "end_line": 15,
    "content": "        await websocket.close(code=4000, reason=\"Invalid\")"
  }
}

```

### Summary of Differences

| Mechanism | Best Use Case | Pros | Cons |
| --- | --- | --- | --- |
| **Search & Replace** | **Chat / Refactoring** | Robust; doesn't break if lines shift. | Verbose; requires repeating code context. |
| **FIM (Ghost Text)** | **Autocomplete** | extremely fast; feels magical. | Limited context; can't easily "refactor" distant code. |
| **Unified Diff** | **Bulk Edits** | Low token usage (cheaper). | Brittle; fails if file formatting changes slightly. |
| **Line-Range** | **Agents** | Precise programmatic control. | Fails completely if line numbers are outdated. |