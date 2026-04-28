PAIRWISE_DEFECT_DEFINITIONS = """Paired Story Defects (Evaluating Story A vs. Story B)

**1. DUPLICATION (Feature or Rule Overlap)**
* **Definition:** Both stories implement the exact same technical action on the same target system or resource. Developing both would result in building the exact same code twice.
* **Verification Question:** *If the development team completes Story A, would Story B's effort be completely wasted — i.e., there is nothing new to build?*
* **False Positive Check (SHARED DOMAIN IS NOT DUPLICATION):**
    - Just because two stories touch the same topic (e.g., "payments", "favorites", "driver status") does NOT mean they are duplicates. If they do different things within that topic, they are distinct.
    - Example: VBS-401 (Process Stripe payment) and VBS-601 (Save credit card to profile) are NOT duplicates. One processes a transaction, the other manages a stored entity.
    - Example: VBS-601 (Manage Profile with favorites) and VBS-803 (Save Home/Work to map) are NOT duplicates. A broad epic mentioning a concept does not duplicate a detailed story implementing it.
    - Stories at **different abstraction levels** are NOT duplicates. A high-level epic (e.g., "Driver Onboarding") is NOT duplicated by a focused story that implements a piece of it (e.g., "Driver Signup").
    - A story that **depends on** another story's output is NOT a duplicate.
    - Partial overlap in a sub-feature is NOT duplication unless the core deliverable is identical.


**2. CONFLICT (Logic or NFR Clash)**
* **Definition:** The stories introduce mutually exclusive logic, contradictory business rules, or opposing Non-Functional Requirements on the **exact same specific topic**.
* **Verification Question:** *Do Story A and Story B make directly contradictory claims about the SAME specific rule, behavior, or constraint — such that implementing both exactly as written is logically impossible?*
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


SELF_DEFECT_DEFINITIONS = """Single Story Defects (Evaluating a Story in Isolation)

**1. NOT_INDEPENDENT (Dependency Bottleneck)**
* **Definition:** The story's own text explicitly declares it is blocked by or strictly dependent on specific other stories, making it impossible to schedule or develop independently.
* **Verification Question:** *Does this story's description explicitly reference being "blocked by" or "relying on" another specific story by key, requiring that story to be completed first?*
* **Key Signal:** Look for phrases like "blocked by VBS-XXX", "relies on VBS-XXX", "depends on the output of VBS-XXX", or "only after VBS-XXX is finished."
* **False Positive Check:** Standard vertical slices (Frontend relying on a Backend API built in the same sprint) are perfectly normal. Do NOT flag standard, manageable technical dependencies as NOT_INDEPENDENT. A story that merely touches the same domain as another story is NOT dependent on it.

**2. NOT_VALUABLE (Missing Business Outcome)**
* **Definition:** The story fails to provide clear, tangible value to the user or business. It describes a purely technical internal chore without explaining WHY it matters or WHAT measurable benefit it delivers.
* **Verification Question:** *Does this story fail to explain WHO it is for and exactly WHAT tangible benefit it delivers to the business or end-user?*
* **Key Signals of NOT_VALUABLE:**
    - Pure technical chores with vague outcomes: "optimize database," "refactor legacy code," "run profiling" without specifying measurable improvement targets. A story that says "so that the system runs better" or "ensure it is modern and follows best practices" is NOT stating a measurable benefit — it IS NOT_VALUABLE.
    - Stories that actively harm the user experience (e.g., forced intrusive ads, removing useful features) — these destroy value rather than create it.
* **False Positive Check:** Technical enablers ARE valuable ONLY IF they explicitly state a specific, measurable improvement target (e.g., "reduce query latency by 50%", "support 10K concurrent users"). Vague goals like "runs better", "follows best practices", or "is modern" are NOT measurable and do NOT make a story valuable.


**3. NOT_ESTIMABLE (High Ambiguity or Technical Risk)**
* **Definition:** The story is too vague, lacks clear Acceptance Criteria, or involves an architecture impact so broad that the team cannot confidently estimate the effort required to implement it.
* **Verification Question:** *Does the story lack the necessary technical clarity, or are the success conditions so undefined that estimating the effort is just a wild guess?*
* **False Positive Check:** A story is estimable if the core action and constraints are clear, even if exact implementation details (like exact code syntax) are left to the developers. A story that overlaps with others or has a vague title but has clear description is NOT automatically NOT_ESTIMABLE — check the description for clarity.

**4. NOT_SMALL (Epic Disguised as a Story)**
* **Definition:** The scope of the story is too broad to be completed within a single sprint (3-4 days of work). It implements multiple distinct user goals or encompasses a massive multi-step workflow.
* **Verification Question:** *Could this story easily be split into two or more smaller, self-contained user stories that still deliver value independently?*
* **False Positive Check:** A "Vertical Slice" is NOT an Epic. A story that touches the UI, API, and Database for a *single feature* (e.g., "User Login") is perfectly SMALL. Only flag stories that combine multiple distinct features (e.g., "Build the Shopping Cart AND the Checkout Gateway").
"""



SELF_DEFECT_DEFINITIONS_V2 = """## SELF_DEFECT_DEFINITIONS (Single Story Defects)

**1. NOT_INDEPENDENT (Dependency Bottleneck)**
* **Definition:** The story is heavily coupled with other stories. It either blocks too many items, is blocked by too many items, or exists within a circular dependency. It cannot be safely picked up and developed in isolation during a Sprint.
* **Verification Question:** *Does this story require the completion of multiple external features first, or is its scope hopelessly entangled with other tickets?*

**2. NOT_NEGOTIABLE (Over-Specified / Rigid Contract)**
* **Definition:** The story is written as an inflexible technical specification or a "done deal" rather than an invitation to a conversation. It dictates specific implementation details (UI pixel values, exact database schema names) instead of focusing on the desired outcome, leaving no room for the Scrum team to suggest better solutions.
* **Verification Question:** *Does the story dictate "HOW" to build it (technical constraints) rather than "WHAT" is needed, effectively closing the door on collaboration?*

**3. NOT_VALUABLE (Orphan Technical Task)**
* **Definition:** The story lacks a clear business value or target user persona. It reads like a purely internal technical chore (e.g., "update library", "refactor table") rather than a feature that delivers a tangible outcome to an end-user or stakeholder.
* **Verification Question:** *Does this story fail to explain WHO it is for and WHY it matters to the business?*

**4. NOT_ESTIMABLE (High Ambiguity or Technical Risk)**
* **Definition:** The story is too vague or touches an unusually high number of complex systems or strict Non-Functional Requirements (NFRs). The development team would not be able to accurately estimate the effort without heavy prior technical investigation.
* **Verification Question:** *Does the story lack necessary technical clarity, or is the architecture impact so dangerously broad that estimating its effort is a wild guess?*

**5. NOT_SMALL (Epic Disguised as a Story)**
* **Definition:** The scope of the story is too broad to be completed within a standard Sprint. It implements multiple distinct actions, modifies numerous independent resources, or encompasses a multi-step workflow that should be split into smaller, independent stories.
* **Verification Question:** *Could this story easily be split into two or more smaller, self-contained user stories?*

**6. NOT_TESTABLE (Ambiguous Acceptance Criteria)**
* **Definition:** The story lacks clear, binary Acceptance Criteria (AC). It uses subjective language (e.g., "fast," "user-friendly," "better performance") that cannot be verified by a Quality Assurance (QA) engineer. Without measurable boundaries, the "Definition of Done" is impossible to reach.
* **Verification Question:** *Is there a clear, objective way to prove this story is finished, or is the success criteria based on subjective opinion?*"""
