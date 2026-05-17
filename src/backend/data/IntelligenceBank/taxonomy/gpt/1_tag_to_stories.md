## API & Integration
### Stories:
{'IB4-93', 'IB4-215', 'IB4-388', 'IB4-82', 'IB4-326', 'IB4-383', 'IB4-396', 'IB4-53', 'IB4-281', 'IB4-299', 'IB4-52', 'IB4-51', 'IB4-129', 'IB4-323'}
### Description:
Public and internal APIs and integration points for retrieving, creating, updating and deleting platform resources (Smart Pages, Servers, Templates, Jobs, Records) and any external integration surface within V3 scope.

---

## Asset Intelligence
### Stories:
{'IB4-326', 'IB4-299', 'IB4-167', 'IB4-318', 'IB4-1', 'IB4-323'}
### Description:
AI-driven media capabilities that depend on Azure Cognitive Services: automated image/video/audio tagging, facial-recognition training and redaction, Ask AI (vector search / natural-language queries), and AI governance considerations (feature toggles, admin visibility).
[UPDATED] AI-driven media capabilities that depend on Azure Cognitive Services: automated image/video/audio tagging, facial-recognition training and redaction, Ask AI (vector search / natural-language queries), AI governance considerations (feature toggles, admin visibility), and capture of user feedback/ratings and telemetry for AI outputs to support quality improvement and reporting.

---

## Master Control Panel
### Stories:
{'IB4-109', 'IB4-389', 'IB4-2', 'IB4-75', 'IB4-463', 'IB4-497', 'IB4-3', 'IB4-163', 'IB4-326', 'IB4-172', 'IB4-245', 'IB4-164', 'IB4-476', 'IB4-318', 'IB4-74', 'IB4-1'}
### Description:
Admin and configuration surface for platform-wide controls: MCP feature toggles, processing limits, development flags, and settings that govern Asset Intelligence, Workflows, Smart Pages and other Epic-level features.

---

## Notifications
### Stories:
{'IB4-158', 'IB4-479'}
### Description:
User and admin-facing notification and communication concerns: email/digest scheduling, in‑app notifications, comment digests, notification preferences (per-user and per-site), triggers for comment/new activity alerts, and admin controls for notification behavior.

---

## Notifications & Communications
### Stories:
{'IB4-413', 'IB4-367'}
### Description:
Stories about transactional and system communications: email/SMS/push notification templates and flows, grouped/templated notification behavior (cross-folder or multi-reviewer scenarios), notification settings tied to publish/workflow events, and the admin controls for notification templates and delivery rules.

---

## Reporting & Analytics
### Stories:
{'IB4-499', 'IB4-141', 'IB4-211', 'IB4-248'}
### Description:
Reporting, dashboards and analytics: aggregated reports, job and stats dashboards, exportable metrics and specific handling such as multi-upload files represented per-row in stats outputs.

---

## Security & Compliance
### Stories:
{'IB4-148', 'IB4-395', 'IB4-387', 'IB4-388', 'IB4-382', 'IB4-326', 'IB4-318', 'IB4-83', 'IB4-143'}
### Description:
Cross-cutting security and compliance requirements and gates: penetration-test release gating, enterprise session management, PII handling and regulatory controls related to facial recognition and sensitive data (implementation specifics like guest upload virus-scan pipeline are covered in Uploads & Media Processing).
[UPDATED] Cross-cutting security and compliance requirements and gates: penetration-test release gating, enterprise session management, PII handling and regulatory controls related to facial recognition and sensitive data. Also covers access control and authorization concerns (RBAC, permission management, admin permission configuration, permission-loss scenarios), secure handling of uploads (virus scanning) and other governance that enforces who can view, download or perform actions on platform resources.

---

## Smart Pages
### Stories:
{'IB4-215', 'IB4-107', 'IB4-211', 'IB4-145', 'IB4-189', 'IB4-415', 'IB4-164', 'IB4-281', 'IB4-208', 'IB4-117', 'IB4-233', 'IB4-436', 'IB4-108', 'IB4-186', 'IB4-191', 'IB4-387', 'IB4-308', 'IB4-429', 'IB4-396', 'IB4-383', 'IB4-256', 'IB4-53', 'IB4-87', 'IB4-192', 'IB4-115', 'IB4-225', 'IB4-213', 'IB4-143', 'IB4-105', 'IB4-109', 'IB4-389', 'IB4-388', 'IB4-337', 'IB4-111', 'IB4-116', 'IB4-52', 'IB4-51', 'IB4-305', 'IB4-465', 'IB4-347', 'IB4-394', 'IB4-248', 'IB4-9', 'IB4-395', 'IB4-286', 'IB4-273', 'IB4-44', 'IB4-163', 'IB4-385', 'IB4-190'}
### Description:
Smart Page / Page Builder features and CRUD APIs: pages, sections, blocks, widgets, categories, ordering, navigation, thumbnails, preview/share behavior and Smart Page API endpoints.
[UPDATED] Smart Page / Page Builder features and CRUD APIs: pages, sections, blocks, widgets, categories, ordering, navigation, thumbnails, preview/share behavior and Smart Page API endpoints. Includes selection and integration with the Resources/Asset module (resource lookup button, selecting/uploading resources into Page Builder), widget-level preview/linkage (e.g., video resource preview), and behaviors for resource-driven page content.

---

## Templates & Jobs
### Stories:
{'IB4-413', 'IB4-82', 'IB4-245', 'IB4-337', 'IB4-94', 'IB4-80', 'IB4-83'}
### Description:
Template management and template-driven job lifecycle: master templates, job creation/configuration from templates, job listing behavior, template permission restrictions and template-scoped collaborator rules.

---

## UI/UX Interactions
### Stories:
{'IB4-78', 'IB4-148', 'IB4-450', 'IB4-107', 'IB4-445', 'IB4-145', 'IB4-15', 'IB4-189', 'IB4-415', 'IB4-208', 'IB4-117', 'IB4-233', 'IB4-436', 'IB4-392', 'IB4-108', 'IB4-323', 'IB4-41', 'IB4-93', 'IB4-224', 'IB4-186', 'IB4-170', 'IB4-191', 'IB4-308', 'IB4-429', 'IB4-326', 'IB4-383', 'IB4-366', 'IB4-27', 'IB4-256', 'IB4-115', 'IB4-80', 'IB4-279', 'IB4-455', 'IB4-192', 'IB4-225', 'IB4-87', 'IB4-129', 'IB4-143', 'IB4-299', 'IB4-147', 'IB4-105', 'IB4-240', 'IB4-389', 'IB4-337', 'IB4-111', 'IB4-420', 'IB4-172', 'IB4-116', 'IB4-448', 'IB4-305', 'IB4-447', 'IB4-347', 'IB4-394', 'IB4-382', 'IB4-21', 'IB4-9', 'IB4-20', 'IB4-286', 'IB4-120', 'IB4-273', 'IB4-48', 'IB4-163', 'IB4-385', 'IB4-44', 'IB4-190'}
### Description:
Client-side behaviors and interaction polish: error snackbars, undo/redo, resizing/positioning, selection/deselection and bulk-apply UX, menu items, preview/share UX, left/right nav behaviors and responsive handling.

---

## Uploads & Media Processing
### Stories:
{'IB4-9', 'IB4-387', 'IB4-388', 'IB4-3', 'IB4-366', 'IB4-499', 'IB4-281', 'IB4-465', 'IB4-382'}
### Description:
File upload and media processing pipelines: multi-upload UX and scale behavior, Guest Upload public pipeline, mandatory virus scanning for guest uploads, background transcode/preview generation (including GIF/Lottie → MP4), and upload UI variations for public and authenticated users.

---

## Workflows & Approvals
### Stories:
{'IB4-20', 'IB4-450', 'IB4-147', 'IB4-240', 'IB4-120', 'IB4-75', 'IB4-497', 'IB4-44', 'IB4-367', 'IB4-15', 'IB4-420', 'IB4-455', 'IB4-279', 'IB4-448', 'IB4-447', 'IB4-392', 'IB4-224', 'IB4-41'}
### Description:
Approval engine and workflow functionality: multi-stage approvals, approval lists, V3 approval types, bulk actions, collaborator assignment, record-level approval status and related UI/list behaviors.

---

