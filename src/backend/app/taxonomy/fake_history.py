"""Few-shot examples for taxonomy agents, formatted as fake conversation history."""

import json
from langchain_core.messages import HumanMessage, AIMessage


# =============================================================================
# Seed Agent: Few-Shot Example
# =============================================================================

_SEED_EXAMPLE_USER = """\
## Project Context
E-commerce platform for selling electronics. Supports credit card and PayPal payments.

## User Stories to Categorize
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

Analyze these stories and generate the initial Master Taxonomy. Categorize every \
story into appropriate buckets.
"""

_SEED_EXAMPLE_ASSISTANT = json.dumps(
    {
        "categorizations": [
            {"key": "EC-1", "tags": ["Payment", "User Experience"]},
            {"key": "EC-2", "tags": ["Product Catalog", "User Experience"]},
            {"key": "EC-3", "tags": ["Payment", "Security", "Data Privacy"]},
            {"key": "EC-4", "tags": ["Reporting", "Admin"]},
            {"key": "EC-5", "tags": ["Notification", "Order Management"]},
        ],
        "new_buckets": [
            {
                "name": "Payment",
                "description": "Stories related to payment processing, billing, and financial transactions.",
            },
            {
                "name": "User Experience",
                "description": "Stories focused on customer-facing interactions, usability, and navigation.",
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
                "name": "Data Privacy",
                "description": "Stories about protecting user data, GDPR/PCI compliance, and data handling policies.",
            },
            {
                "name": "Reporting",
                "description": "Stories related to analytics dashboards, reports, and business intelligence.",
            },
            {
                "name": "Admin",
                "description": "Stories for administrative functions, internal tools, and back-office operations.",
            },
            {
                "name": "Notification",
                "description": "Stories about email, SMS, push notifications, and user communication.",
            },
            {
                "name": "Order Management",
                "description": "Stories covering order lifecycle: placement, tracking, fulfillment, and returns.",
            },
        ],
        "bucket_updates": [],
    },
    indent=2,
)

SEED_FEW_SHOT = [
    HumanMessage(content=_SEED_EXAMPLE_USER),
    AIMessage(content=_SEED_EXAMPLE_ASSISTANT),
]


# =============================================================================
# Extension Agent: Few-Shot Example
# =============================================================================

_EXTENSION_EXAMPLE_USER = """\
## Project Context
E-commerce platform for selling electronics.

## Current Master Taxonomy
- **Payment**: Stories related to payment processing, billing, and financial transactions.
- **User Experience**: Stories focused on customer-facing interactions, usability, and navigation.
- **Security**: Stories addressing authentication, authorization, encryption, and compliance.
- **Notification**: Stories about email, SMS, push notifications, and user communication.

## New User Stories to Categorize
**[EC-10]** As a customer, I want to pay via Apple Pay so I have more payment options.
Description: Integrate Apple Pay SDK for in-app purchases.

---
**[EC-11]** As a customer, I want the site to load in under 2 seconds so I don't abandon my cart.
Description: Target 95th percentile page load time < 2s. CDN and lazy loading.

---
**[EC-12]** As a visually impaired user, I want screen reader support so I can use the site independently.
Description: WCAG 2.1 AA compliance for all customer-facing pages.

Categorize these stories using the existing taxonomy. Propose new buckets or \
description updates only when necessary.
"""

_EXTENSION_EXAMPLE_ASSISTANT = json.dumps(
    {
        "categorizations": [
            {"key": "EC-10", "tags": ["Payment", "User Experience"]},
            {"key": "EC-11", "tags": ["Performance", "User Experience"]},
            {"key": "EC-12", "tags": ["Accessibility", "User Experience"]},
        ],
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

EXTENSION_FEW_SHOT = [
    HumanMessage(content=_EXTENSION_EXAMPLE_USER),
    AIMessage(content=_EXTENSION_EXAMPLE_ASSISTANT),
]
