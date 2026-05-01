"""Few-shot examples for taxonomy agents, formatted as fake conversation history."""

import json
from langchain_core.messages import HumanMessage, AIMessage

# =============================================================================
# Pass 1: Generate Taxonomy Updates (Seed)
# =============================================================================

_UPDATE_SEED_EXAMPLE_USER = """\
## Project Context
E-commerce platform for selling electronics. Supports credit card and PayPal payments.

## User Stories
**[EC-1]** As a customer, I want to pay with my credit card so I can complete my purchase.
Description: Support Visa, Mastercard, and AMEX.

---
**[EC-2]** As a customer, I want to search products by category so I can find items quickly.
Description: Full-text search with category filters.

---
**[EC-3]** As a customer, I want my payment data encrypted at rest so my financial info is safe.
Description: AES-256 encryption for stored card data. PCI-DSS compliance required.

---
**[EC-4]** As an admin, I want to view sales reports so I can track revenue.
Description: Daily/weekly/monthly aggregated sales dashboards.

---
**[EC-5]** As a customer, I want to receive email notifications when my order ships.
Description: Automated email with tracking link.


Analyze these stories and generate the initial Master Taxonomy buckets. Provide your chain-of-thought in `reasoning` first.
"""

_UPDATE_SEED_EXAMPLE_ASSISTANT = json.dumps(
    {
        "reasoning": "We have stories about payments, product search, security/encryption, admin reporting, and notifications. We can map these to 5 distinct buckets to cover the functional and non-functional requirements.",
        "new_buckets": [
            {
                "name": "Payment",
                "description": "Stories related to payment processing, billing, and financial transactions.",
            },
            {
                "name": "Product Catalog",
                "description": "Stories about product listing, search, categorization, and inventory display.",
            },
            {
                "name": "Security",
                "description": "Stories addressing authentication, authorization, encryption, and compliance.",
            },
            {
                "name": "Reporting",
                "description": "Stories related to analytics dashboards, reports, and business intelligence.",
            },
            {
                "name": "Notification",
                "description": "Stories about email, SMS, push notifications, and user communication.",
            },
        ],
        "bucket_updates": [],
    },
    indent=2,
)

UPDATE_TAXONOMY_SEED_FEW_SHOT = [
    HumanMessage(content=_UPDATE_SEED_EXAMPLE_USER),
    AIMessage(content=_UPDATE_SEED_EXAMPLE_ASSISTANT),
]

# =============================================================================
# Pass 1: Generate Taxonomy Updates (Extension)
# =============================================================================

_UPDATE_EXTENSION_EXAMPLE_USER = """\
## Project Context
E-commerce platform for selling electronics.

## Current Master Taxonomy
- **Payment**: Stories related to payment processing, billing, and financial transactions.
- **Product Catalog**: Stories about product listing, search, categorization, and inventory display.
- **Security**: Stories addressing authentication, authorization, encryption, and compliance.
- **Notification**: Stories about email, SMS, push notifications, and user communication.

## New User Stories
**[EC-10]** As a customer, I want to pay via Apple Pay so I have more payment options.
Description: Integrate Apple Pay SDK for in-app purchases.

---
**[EC-11]** As a customer, I want the site to load in under 2 seconds so I don't abandon my cart.
Description: Target 95th percentile page load time < 2s. CDN and lazy loading.

---
**[EC-12]** As a visually impaired user, I want screen reader support so I can use the site independently.
Description: WCAG 2.1 AA compliance for all customer-facing pages.


Evaluate if the existing taxonomy covers these stories. Propose new buckets or description updates only when necessary. Provide your chain-of-thought in `reasoning` first.
"""

_UPDATE_EXTENSION_EXAMPLE_ASSISTANT = json.dumps(
    {
        "reasoning": "EC-10 introduces Apple Pay, which fits into Payment but broadens its scope. EC-11 is about load times, needing a 'Performance' bucket. EC-12 is about screen readers, needing an 'Accessibility' bucket.",
        "new_buckets": [
            {
                "name": "Performance",
                "description": "Stories about system speed, scalability, load times, and infrastructure optimization.",
            },
            {
                "name": "Accessibility",
                "description": "Stories ensuring the product is usable by people with disabilities, including WCAG compliance.",
            },
        ],
        "bucket_updates": [
            {
                "name": "Payment",
                "updated_description": "Stories related to payment processing, billing, financial transactions, and payment method integrations (credit cards, digital wallets).",
                "reason": "EC-10 introduces digital wallet payments (Apple Pay), broadening the scope beyond traditional card processing.",
            }
        ],
    },
    indent=2,
)


UPDATE_TAXONOMY_EXTENSION_FEW_SHOT = [
    HumanMessage(content=_UPDATE_EXTENSION_EXAMPLE_USER),
    AIMessage(content=_UPDATE_EXTENSION_EXAMPLE_ASSISTANT),
]

# =============================================================================
# Pass 2: Categorize Stories
# =============================================================================

_CATEGORIZE_EXAMPLE_USER = """\
## Final Master Taxonomy
- **Payment**: Stories related to payment processing, billing, financial transactions, and payment method integrations.
- **Product Catalog**: Stories about product listing, search, categorization, and inventory display.
- **Security**: Stories addressing authentication, authorization, encryption, and compliance.
- **Performance**: Stories about system speed, scalability, load times, and infrastructure optimization.
- **Accessibility**: Stories ensuring the product is usable by people with disabilities, including WCAG compliance.

## User Stories to Categorize
**[EC-10]** As a customer, I want to pay via Apple Pay so I have more payment options.
Description: Integrate Apple Pay SDK for in-app purchases.

---
**[EC-11]** As a customer, I want the site to load in under 2 seconds so I don't abandon my cart.
Description: Target 95th percentile page load time < 2s. CDN and lazy loading.

---
**[EC-12]** As a visually impaired user, I want screen reader support so I can use the site independently.
Description: WCAG 2.1 AA compliance for all customer-facing pages.


Categorize these stories using ONLY the exact bucket names from the Master Taxonomy. Provide your chain-of-thought in `reasoning` first.
"""

_CATEGORIZE_EXAMPLE_ASSISTANT = json.dumps(
    {
        "reasoning": "EC-10 is about payment integration (Apple Pay), so it maps to Payment. EC-11 is about load times, mapping to Performance. EC-12 is about screen reader support, mapping to Accessibility.",
        "categorizations": [
            {"key": "EC-10", "tags": ["Payment"]},
            {"key": "EC-11", "tags": ["Performance"]},
            {"key": "EC-12", "tags": ["Accessibility"]},
        ],
    },
    indent=2,
)

CATEGORIZE_FEW_SHOT = [
    HumanMessage(content=_CATEGORIZE_EXAMPLE_USER),
    AIMessage(content=_CATEGORIZE_EXAMPLE_ASSISTANT),
]

# =============================================================================
# Validation: Review Taxonomy Updates
# =============================================================================

_VALIDATE_EXAMPLE_USER = """\
## Current Master Taxonomy
- **Payment**: Stories related to payment processing, billing, and financial transactions.
- **Product Catalog**: Stories about product listing, search, categorization, and inventory display.
- **Security**: Stories addressing authentication, authorization, encryption, and compliance.
- **Notification**: Stories about email, SMS, push notifications, and user communication.
- **Reporting**: Stories related to analytics dashboards, reports, and business intelligence.

## Proposed Updates by Batch
### Batch 0
```json
{
  "new_buckets": [
    {"name": "Performance", "description": "Stories about system speed, scalability, and load times."}
  ],
  "bucket_updates": []
}
```

### Batch 1
```json
{
  "new_buckets": [
    {"name": "Speed Optimization", "description": "Stories about making the site faster."},
    {"name": "Caching", "description": "Stories about caching strategies."},
    {"name": "CDN", "description": "Stories about content delivery networks."}
  ],
  "bucket_updates": [
    {"name": "Payment", "updated_description": "Payment stuff.", "reason": "Simplification."}
  ]
}
```

## Stories Context (for reference)
(stories omitted for brevity)

Review each batch's proposed taxonomy changes.
"""

_VALIDATE_EXAMPLE_ASSISTANT = json.dumps(
    {
        "reasoning": "Batch 0 proposes a single well-scoped 'Performance' bucket which is appropriate. Batch 1 is problematic: it creates 3 overly-granular buckets (Speed Optimization, Caching, CDN) that all belong under Performance, and its Payment description update weakens the original.",
        "decisions": [
            {
                "batch_index": 0,
                "status": "VALID",
                "reasoning": "A single 'Performance' bucket is well-scoped and non-redundant.",
                "adjusted_new_buckets": [],
                "adjusted_bucket_updates": [],
            },
            {
                "batch_index": 1,
                "status": "ADJUSTED",
                "reasoning": "Speed Optimization, Caching, and CDN are all sub-concerns of Performance. Consolidating into an update to Performance's description. Removing the Payment description downgrade.",
                "adjusted_new_buckets": [],
                "adjusted_bucket_updates": [
                    {
                        "name": "Performance",
                        "updated_description": "Stories about system speed, scalability, load times, caching strategies, and CDN optimization.",
                        "reason": "Merged Speed Optimization, Caching, and CDN into Performance.",
                    }
                ],
            },
        ],
    },
    indent=2,
)

VALIDATE_TAXONOMY_FEW_SHOT = [
    HumanMessage(content=_VALIDATE_EXAMPLE_USER),
    AIMessage(content=_VALIDATE_EXAMPLE_ASSISTANT),
]
