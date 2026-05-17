PAIRWISE_DEFECT_DEFINITIONS = """\
### Paired Story Defects (Evaluating Story A vs. Story B)

**1. DUPLICATION (Feature or Rule Overlap)**
* **Definition:** Both stories IMPLEMENT the exact same technical action on the same target system or resource. Developing both would result in building the exact same code twice.
* **Verification Question:** *If the development team completes Story A, would Story B's effort be completely wasted - i.e., there is nothing new to build?*
* **False Positive Check (SHARED DOMAIN IS NOT DUPLICATION):**
    - Just because two stories touch the same topic (e.g., "payments", "favorites", "driver status") does NOT mean they are duplicates. If they do different things within that topic, they are distinct.
    - Example: STORY-401 (Process Stripe payment) and STORY-601 (Save credit card to profile) are NOT duplicates. One processes a transaction, the other manages a stored entity.
    - Example: STORY-601 (Manage Profile with favorites) and STORY-803 (Save Home/Work to map) are NOT duplicates. A broad epic mentioning a concept does not duplicate a detailed story implementing it.
    - Stories at **different abstraction levels** are NOT duplicates. A high-level epic (e.g., "Driver Onboarding") is NOT duplicated by a focused story that implements a piece of it (e.g., "Driver Signup").
    - A story that **depends on** another story's output is NOT a duplicate.
    - Partial overlap in a sub-feature is NOT duplication unless the core deliverable is identical.


**2. CONFLICT (Logic or NFR Clash)**
* **Definition:** The stories introduce mutually exclusive logic, contradictory business rules, or opposing Non-Functional Requirements on the **exact same specific topic**, making them impossible to implement together without changing at least one.
* **Verification Question:** *Do Story A and Story B make directly contradictory claims about the SAME specific rule, behavior, or constraint - such that implementing both exactly as written is logically impossible?*
* **Examples of TRUE conflicts:**
    - Story A: "No cancellation fees before trip starts" vs. Story B: "Charge $5 fee after 2 minutes" → Both define cancellation fee policy with opposite rules.
    - Story A: "Allow text messaging" vs. Story B: "Forbid all text messaging" → Mutually exclusive on the same communication channel.
* **False Positive Check:** 
    - Stories in unrelated domains are just different features, rarely conflict, unless their NFRs directly contradict or they touch the same exact resource in incompatible ways. 
    - Sequential actions are NOT conflicts (e.g., Story A happens before Story B). 
    - Different rules for different User Roles are NOT conflicts (e.g., Admins can bypass a rule that Users cannot).
    - **A fundamentally flawed story does NOT "conflict" with every story that touches the same user flow.** If Story X has bad UX (e.g., forced ads on booking), it does NOT conflict with every other booking story. The problem is Story X itself (it's NOT_VALUABLE), not a pairwise conflict. Only flag a CONFLICT if both stories are individually reasonable but contradict each other on the same rule.
    - **Technical Implementation Guesses are NOT conflicts:** Do NOT invent backend race conditions, async timing issues, or API latency problems. If Story A says "update immediately" and Story B says "wait for success status", assume standard development practices (like event listeners or webhooks) will handle the order of operations flawlessly. Do not flag standard asynchronous event flows as Conflicts.
    - **Dependency is NOT conflict:** If Story B depends on Story A's output, that is a dependency (NOT_INDEPENDENT), not a conflict. The stories are complementary, not contradictory.
"""


SELF_DEFECT_DEFINITIONS = """\
### Single Story Defects (Evaluating a Story in Isolation)

**1. NOT_VALUABLE (Missing Business Outcome)**
* **Definition:** The story fails to provide clear, tangible value to the user or business. It describes a purely technical internal chore without explaining WHY it matters or WHAT measurable benefit it delivers.
* **Verification Questions:** Is this actually a user story / software requirement, or is it something else? Does this story fail to explain WHO it is for and exactly WHAT tangible benefit it delivers to the business or end-user? Does this story deliver clear, vertical value to the user or business? Does the user benefit from this, or is it just technical work? 
* **Key Signals:**
    - Not a user story: Lacks a clear user persona or beneficiary; does not describe a user goal or outcome; or random texts that are not even software requirements.
    - Pure technical chores with vague outcomes: "optimize database," "refactor legacy code," "run profiling" without specifying measurable improvement targets.
    - Stories that actively harm the user experience (e.g., forced intrusive ads, removing useful features) - these destroy value rather than create it.
* **False Positive Check:** Technical enablers ARE valuable ONLY IF they explicitly state a specific, measurable improvement target (e.g., "reduce query latency by 50%", "support 10K concurrent users"). Vague goals like "runs better", "follows best practices", or "is modern" are NOT measurable and do NOT make a story valuable.


**2. NOT_ESTIMABLE (High Ambiguity or Technical Risk)**
* **Definition:** The story lacks enough clarity, knowledge, or technical understanding for the team to estimate implementation effort with reasonable confidence.
* **Verification Question:** Would the team struggle to estimate this story because requirements, scope, or technical approach are unclear?
* **Key Signals:**
    - Ambiguous scope or undefined behavior.
    - Unknown technical feasibility.
    - Broad architectural uncertainty.
* **False Positive Check:** A story is estimable if the core action and constraints are clear, even if exact implementation details (like exact code syntax) are left to the developers. 
Do NOT flag a story as NOT_ESTIMABLE merely because:
    - implementation details are undecided,
    - there are minor ambiguities,
    - or the story is technically challenging.
A difficult story can still be estimable if the scope and expected outcome are sufficiently understood.


**3. NOT_SMALL (Epic Disguised as a Story)**
* **Definition:** The scope of the story is too broad to be completed within a single sprint (ideally taking 3-4 days or less). It implements multiple distinct user goals or encompasses a massive multi-step workflow.
* **Verification Question:** Could this story easily be split into two or more smaller, self-contained user stories that still deliver value independently?
* **Key Signals:**
    - Multiple unrelated user goals.
    - Multiple workflows bundled together.
    - Broad scope:
        - “Build full payment system”
        - “Implement complete admin dashboard”
    - Large cross-cutting architectural changes.
* **False Positive Check:** do NOT flag:
    - Vertical slices spanning frontend + backend + database for ONE feature.
    - Technically complex but narrowly scoped stories.
    - Stories that are large in effort but still focused and sprint-feasible.
“Small” does NOT mean “smallest possible task.” It means small enough to complete and validate within an iteration.
"""

# ---------------------------------------------------------------------------
# Pipeline Proposal Defect Definitions
# ---------------------------------------------------------------------------

SPLITTER_DEFECTS = """**1. NOT_SMALL (Epic Disguised as a Story)**
* **Definition:** The scope of the story is too broad to be completed within a single sprint. It implements multiple distinct user goals or encompasses a massive multi-step workflow.
* **Resolution Strategy:** Decompose the story into smaller, independent vertical slices. Each slice must deliver end-to-end value.

**2. NOT_INDEPENDENT (Dependency Bottleneck)**
* **Definition:** The story is heavily coupled with other stories. It either blocks too many items, is blocked by too many items, or exists within a circular dependency.
* **Resolution Strategy:** Restructure the story or its dependencies to remove the bottleneck, often by splitting out the tightly coupled parts into a separate interface or API story.
"""

REFINER_DEFECTS = """**1. NOT_VALUABLE (Missing Business Outcome)**
* **Definition:** The story fails to provide clear, tangible value to the user or business. It describes a purely technical internal chore without explaining WHY it matters or WHAT measurable benefit it delivers.
* **Resolution Strategy:** Enrich the story with a clear "So that [benefit]" statement and measurable targets (e.g., "reduce query latency by 50%"). Do not change the core intent.

**2. NOT_ESTIMABLE (High Ambiguity or Technical Risk)**
* **Definition:** The story is too vague, lacks clear Acceptance Criteria, or involves an architecture impact so broad that the team cannot confidently estimate the effort required to implement it.
* **Resolution Strategy:** Clarify the constraints and add strict Gherkin format (Given/When/Then) acceptance criteria. Make it binary pass/fail.
"""

RESOLVER_DEFECTS = """**1. CONFLICT (Logic or NFR Clash)**
* **Definition:** The stories introduce mutually exclusive logic, contradictory business rules, or opposing Non-Functional Requirements on the exact same specific topic.
* **Resolution Strategy:** Identify the contradiction and UPDATE the story whose rule is less aligned with the overall project goals. Preserve the other. Never delete both.

**2. DUPLICATION (Feature or Rule Overlap)**
* **Definition:** Both stories implement the exact same technical action on the same target system or resource.
* **Resolution Strategy:** If both stories have unique value, UPDATE the stronger story to absorb the other's scope, then DELETE the weaker one. If one is strictly a subset, DELETE the subset.
"""

ALL_DEFECT_DEFINITIONS = f"""{PAIRWISE_DEFECT_DEFINITIONS}

**3. NOT_INDEPENDENT (Dependency Bottleneck)** * **Definition:** The story cannot reasonably be implemented, tested, or delivered on its own because it has a strong dependency on another story, component, or unfinished work. * **Verification Questions:** Can this story be developed and released on its own? It should not depend on another story being finished first. If I move this story to a different sprint, does it still make sense? * **Key Signals:** * Explicit dependency statements: "blocked by STORY-XXX", "relies on STORY-XXX", "depends on the output of STORY-XXX", or "only after STORY-XXX is finished." * The story delivers no independently releasable functionality. * **False Positive Check:** Standard vertical slices (Frontend relying on a Backend API built in the same sprint) are perfectly normal. Do NOT flag standard, manageable technical dependencies as NOT_INDEPENDENT. A story that merely touches the same domain as another story is NOT dependent on it. Independence is primarily about scheduling, testing, and value delivery.


{SELF_DEFECT_DEFINITIONS}
"""
