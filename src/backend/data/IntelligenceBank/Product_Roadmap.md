**Purpose:** The Product Roadmap is a strategic communication tool that outlines the vision, direction, and progress of the product over time. Unlike a Sprint Backlog which deals in days and specific tickets, the Roadmap deals in months, quarters, and Epics. It aligns internal stakeholders (engineering, sales, marketing) and sets expectations for major feature rollouts without locking the team into rigid, waterfall-style deadlines.

# Product Roadmap: IntelligenceBank Platform (V3)

**Last Updated:** Q2 2026
**Horizon:** Next 3 Quarters (Q2 2026 – Q4 2026)

## Strategic Context

This roadmap outlines the delivery of the V3 IntelligenceBank Platform, focusing heavily on transitioning our DAM from a static repository into an "Intelligent Content Operations" hub. Our investments are grouped into three core tracks: **Smart Page Experiences, AI-Driven Asset Intelligence, and Enterprise Workflows.**

_Disclaimer: This roadmap represents our current strategic intent. Timelines and features are subject to change based on user feedback, technical discoveries, and market shifts._

---

## Q2 2026 (Now): Core Builder & Processing Pipeline

The immediate focus is laying the foundation for our new portal experience and ensuring our backend can handle heavy, automated asset processing at scale.

### Epic 1: Smart Page Builder (Foundation & MVP)

- **Drag-and-Drop Architecture:** Implement the core grid system allowing users to nest Widgets inside structural Blocks and Sections.
- **Responsive Engine:** Ensure all layouts automatically adapt to Desktop, Tablet, and Mobile breakpoints, including focal-point preservation for background imagery.
- **Core Widget Library:** Release the foundational V1 widgets: Text, Image, and Button.
- **Styling Controls:** Enable user control over Block width/ratios, padding, background colors, and basic opacity settings.

### Epic 2: High-Volume Asset Processing

- **Multi-Upload Handling:** Upgrade system capacity to support up to 1,000 files in a single multi-upload field, with optimized UI for displaying expanded file rows.
- **Automated Format Conversion:** Deploy backend workers to automatically convert uploaded `.lottie` and `.gif` files into optimized `.mp4` formats to ensure secure, cross-browser preview rendering.
- **Public Guest Security:** Implement mandatory, automated virus scanning for all files uploaded by unauthenticated "Guest" users via public links.

---

## Q3 2026 (Next): Advanced Workflows & Asset Intelligence

With the foundation stable, we will introduce heavy automation to reduce manual marketing tasks and clear approval bottlenecks.

### Epic 3: V3 Approval Engine (Bulk & Multi-Stage)

- **Bulk Review Interface:** Release a dedicated UI allowing Reviewers to process (approve/decline/markup) up to 300 requests simultaneously across different workflow templates.
- **Dynamic Staged Routing:** Enable multi-stage workflows where assets must sequentially pass through distinct departments (e.g., Marketing -> Legal -> Compliance).
- **Collaborator Management:** Allow Requesters and Admins to dynamically re-assign reviewers or add collaborators to in-flight pending requests without restarting the workflow.
- **Workflow Stats Reporting:** Deploy advanced audit reporting, including filtering by "Time to Complete (Hours)" and expanding multi-upload fields into separate tracking rows.

### Epic 4: AI Auto-Tagging & Search (Azure Migration)

- **Azure AI Integration:** Transition from legacy Imagga systems to Azure for highly accurate, automated Image, Video, and Audio tagging.
- **MCP Governance:** Introduce Master Control Panel (MCP) settings for Admins to toggle AI features and set Azure Processing Limits (by image count and video minutes) per billing cycle.
- **Ask AI (Alpha):** Launch the initial phase of our vector-based search, allowing users to query document contents using natural language directly from the search bar.

---

## Q4 2026 (Later): Complex UX & AI Scale

The final phase of the year focuses on expanding the Smart Page ecosystem and introducing advanced, privacy-aware AI features.

### Epic 5: Facial Recognition Suite

- **Facial Recognition Training Centre:** Deploy an administrative interface to train the AI on "Known" faces (brand ambassadors, executives).
- **Automated Privacy Controls:** Implement logic to automatically detect and flag or blur "Unknown" faces in uploaded crowd shots to ensure GDPR/privacy compliance.

### Epic 6: Smart Page Builder (V2 & Templates)

- **Advanced Widget Library:** Introduce complex UI widgets including Carousels, Spacers, and interactive Colour Palettes.
- **Master Template Ecosystem:** Allow Admins to save configured Smart Pages as "Templates," enabling users to generate new pages instantly from pre-approved, brand-compliant layouts.
- **Deep UI/UX Polish:** Implement advanced front-end state management, including hovering effects, selection borders, and complex undo/redo functionality for Widget/Block combinations.
