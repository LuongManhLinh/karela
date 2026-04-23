PAIRWISE_DEFECT_DEFINITIONS = """
Paired Story Defects (Evaluating Story A vs. Story B)

**1. DUPLICATION (Feature or Rule Overlap)**
* **Definition:** Both stories implement the exact same action, or enforce the exact same Non-Functional Requirement (NFR), on the same target system or resource. Developing both would result in redundant effort.
* **Verification Question:** *If the development team completes Story A, does Story B become completely or mostly obsolete?*

**2. CONFLICT (Logic or NFR Clash)**
* **Definition:** The stories introduce mutually exclusive logic, contradictory business rules, or opposing Non-Functional Requirements on the same target. They cannot both be fully implemented as written without breaking the system or violating one of the requirements.
* **Verification Question:** *If Story A is implemented exactly as written, does it make it technically or logically impossible to fulfill the requirements of Story B?*
"""

SELF_DEFECT_DEFINITIONS = """
Single Story Defects (Evaluating a Story in Isolation)

**1. NOT_INDEPENDENT (Dependency Bottleneck)**
* **Definition:** The story is heavily coupled with other stories. It either blocks too many items, is blocked by too many items, or exists within a circular dependency. It cannot be safely picked up and developed in isolation during a Sprint.
* **Verification Question:** *Does this story require the completion of multiple external features first, or is its scope hopelessly entangled with other tickets?*

**2. NOT_VALUABLE (Orphan Technical Task)**
* **Definition:** The story lacks a clear business value (`VALUE`) or target user persona (`ROLE`). It reads like a purely internal technical chore (e.g., "update library", "refactor table") rather than a feature that delivers a tangible outcome to an end-user or stakeholder.
* **Verification Question:** *Does this story fail to explain WHO it is for and WHY it matters to the business?*

**3. NOT_ESTIMABLE (High Ambiguity or Technical Risk)**
* **Definition:** The story is too vague or touches an unusually high number of complex backend systems, databases, or strict constraints (NFRs). The development team would not be able to accurately estimate the effort (Story Points) without heavy prior technical investigation.
* **Verification Question:** *Does the story lack necessary technical clarity, or is the architecture impact so dangerously broad that estimating its effort is a wild guess?*

**4. NOT_SMALL (Epic Disguised as a Story)**
* **Definition:** The scope of the story is too broad to be completed within a standard Sprint. It implements multiple distinct actions, modifies numerous independent resources, or encompasses a multi-step workflow that should be split into smaller, independent stories.
* **Verification Question:** *Could this story easily be split into two or more smaller, self-contained user stories?*
"""
