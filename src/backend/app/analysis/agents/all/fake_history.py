from langchain_core.messages import HumanMessage, AIMessage

CROSS_CHECK_FAKE_HISTORY = [
    # Example 1: Clear Conflict and Duplication
    HumanMessage(
        content="""Here is the input data:
{
  "user_stories": [
    {
      "key": "US-101",
      "title": "User Registration",
      "description": "As a new user, I want to register using my email and password so that I can access the system.\\n\\n**Acceptance Criteria:**\\n- User must verify email before logging in.\\n- Password must be at least 8 chars."
    },
    {
      "key": "US-102",
      "title": "Google Login",
      "description": "As a user, I want to login using my Google account.\\n\\n**Acceptance Criteria:**\\n- System automatically creating an account if verifying the email from Google."
    },
    {
      "key": "US-103",
      "title": "Admin User Creation",
      "description": "As an admin, I want to create users manually.\\n\\n**Acceptance Criteria:**\\n- Admin enters email and temp password.\\n- Users created by admin effectively bypass verification."
    }
  ],
  "existing_defects": []
}"""
    ),
    AIMessage(
        content="""{
  "defects": [
    {
      "type": "CONFLICT",
      "story_keys": ["US-101", "US-103"],
      "severity": "MEDIUM",
      "explanation": "US-101 enforces strict email verification for access, while US-103 allows admins to bypass this for manually created users. This creates a security inconsistency regarding the 'verified' status of accounts.",
      "confidence": 0.85,
      "suggested_fix": "Add criteria to US-103 ensuring admin-created users must change password and verify email upon first login."
    },
    {
      "type": "DUPLICATION",
      "story_keys": ["US-101", "US-102"],
      "severity": "LOW",
      "explanation": "Both stories handle User Account Creation (one via Form, one via OAuth). While distinct mechanisms, they share the underlying 'Account Provisioning' logic which shouldn't be implemented twice.",
      "confidence": 0.60,
      "suggested_fix": "Ensure both stories reference a shared 'Account Service' for the backend logic."
    }
  ]
}"""
    ),

    # Example 2: Complex Negative (Similar words, different scope - NO DEFECT)
    HumanMessage(
        content="""Here is the input data:
{
  "user_stories": [
    {
      "key": "US-TAX-2024",
      "title": "Calculate VAT for EU",
      "description": "As a system, I need to apply 20% VAT to all EU transactions."
    },
    {
      "key": "US-TAX-2023",
      "title": "Calculate Sales Tax US",
      "description": "As a system, I need to apply state tax for US transactions."
    }
  ],
  "existing_defects": []
}"""
    ),
    AIMessage(
        content="""{
  "defects": []
}"""
    ),
    # Example 3: No Defects (Clean Backlog)
    HumanMessage(
        content="""Here is the input data:
{
  "user_stories": [
    {
      "key": "US-201",
      "title": "Process Payment via Stripe",
      "description": "As a customer, I want to pay using Credit Card via Stripe.\\n\\n**Acceptance Criteria:**\\n- Support Visa/Mastercard.\\n- Handle failed transactions."
    },
    {
      "key": "US-202",
      "title": "View Order History",
      "description": "As a customer, I want to see my past orders.\\n\\n**Acceptance Criteria:**\\n- List orders by date desc.\\n- Show status of each order."
    }
  ],
  "existing_defects": []
}"""
    ),
    AIMessage(
        content="""{
  "defects": []
}"""
    ),
]

SINGLE_CHECK_FAKE_HISTORY = [
    # Example 1: Out of Scope and Ambiguity
    HumanMessage(
        content="""Here is the input data:
{
  "user_stories": [
    {
      "key": "US-301",
      "title": "Dark Mode Support",
      "description": "As a user, I want a dark mode theme.\\n\\n**Acceptance Criteria:**\\n- Toggle switch in settings."
    },
    {
      "key": "US-TARGET-3",
      "title": "Implement Search Functionality",
      "description": "As a user, I want to search products quickly.\\n\\n**Acceptance Criteria:**\\n- Search by name."
    }
  ],
  "context_input": {
    "project_scope": "E-commerce platform.",
    "documentation": "Spec Doc"
  },
  "existing_defects": []
}"""
    ),
    AIMessage(
        content="""{
  "defects": [
    {
      "type": "OUT_OF_SCOPE",
      "story_keys": ["US-301"],
      "severity": "HIGH",
      "explanation": "The project scope explicitly excludes cosmetic features like 'Dark Mode' (Personalization) for the MVP phase.",
      "confidence": 0.95,
      "suggested_fix": "Remove from MVP or move to 'Nice-to-have' backlog."
    },
    {
      "type": "AMBIGUITY",
      "story_keys": ["US-TARGET-3"],
      "severity": "MEDIUM",
      "explanation": "The 'quickly' requirement is vague and lacks measurable criteria. The acceptance criteria 'Search by name' is vague. It does not specify if partial matches, case sensitivity, or sorting are required.",
      "confidence": 0.9,
      "suggested_fix": "Clarify the meaning of 'quickly' and specify detailed acceptance criteria for the search functionality."
    }
  ]
}"""
    ),

    # Example 2: Complex Negative (Seemingly Out of Scope but valid extension)
    HumanMessage(
        content="""Here is the input data:
{
  "user_stories": [
    {
      "key": "US-MOBILE-WEB",
      "title": "Responsive Layout",
      "description": "Ensure the site works on mobile browsers."
    }
  ],
  "context_input": {
    "project_scope": "Web Application only. Native Mobile Apps are out of scope.",
    "documentation": "Scope Doc"
  },
  "existing_defects": []
}"""
    ),
    AIMessage(
        content="""{
  "defects": []
}"""
    ),
    # Example 3: Valid Story
    HumanMessage(
        content="""Here is the input data:
{
  "user_stories": [
    {
      "key": "US-303",
      "title": "Export General Ledger",
      "description": "As an accountant, I want to export the general ledger to CSV for auditing.\\n\\n**Acceptance Criteria:**\\n- Format must correspond to SAP import spec.\\n- Include all transactions for selected fiscal year."
    }
  ],
  "context_input": {
    "project_scope": "Internal financial dashboard (MVP). Focus on data accuracy.",
    "documentation": "Scope Doc v1"
  },
  "existing_defects": []
}"""
    ),
    AIMessage(
        content="""{
  "defects": []
}"""
    ),
]

VALIDATOR_FAKE_HISTORY = [
    # Example 1: Mixed Validation Results
    HumanMessage(
        content="""Please validate these detected defects:
{
  "defects": [
    {
      "type": "CONFLICT",
      "story_keys": ["US-101", "US-102"],
      "severity": "HIGH",
      "explanation": "One uses Email, one uses Google. They conflict.",
      "confidence": 0.90
    },
    {
      "type": "AMBIGUITY",
      "story_keys": ["US-103"],
      "severity": "MEDIUM",
      "explanation": "No acceptance criteria defined for 'View Logs'.",
      "confidence": 0.85
    }
  ],
  "user_stories": [
    {"key": "US-101", "title": "Login Email"},
    {"key": "US-102", "title": "Login Google"},
    {"key": "US-103", "title": "View Logs", "description": "As admin, I want to view logs."}
  ]
}"""
    ),
    AIMessage(
        content="""{
  "validations": [
    {
      "defect_index": 0,
      "status": "INVALID",
      "reasoning": "Supporting multiple authentication methods (Email & Google) is standard behavior, not a conflict. The explanation fails to identify mutually exclusive requirements.",
      "suggested_severity": null,
      "suggested_explanation": null
    },
    {
      "defect_index": 1,
      "status": "VALID",
      "reasoning": "The story US-103 indeed lacks acceptance criteria, making the scope of 'logs' (Error vs Access vs Audit) ambiguous.",
      "suggested_severity": null,
      "suggested_explanation": null
    }
  ]
}"""
    ),
]

FILTER_FAKE_HISTORY = [
    # Example 1: Filtering based on Matrix
    HumanMessage(
        content="""Please filter these defects to show only valuable ones:
{
  "defects": [
    {
      "id": "def-1",
      "type": "CONFLICT",
      "severity": "HIGH",
      "confidence": 0.95,
      "explanation": "Database schema violation."
    },
    {
      "id": "def-2",
      "type": "AMBIGUITY",
      "severity": "LOW",
      "confidence": 0.30,
      "explanation": "Wording preference."
    },
    {
      "id": "def-3",
      "type": "DUPLICATION",
      "severity": "MEDIUM",
      "confidence": 0.75,
      "explanation": "Duplicate checkout logic."
    }
  ]
}"""
    ),
    AIMessage(
        content="""{
  "filter_decisions": [
    {
      "defect_index": 0,
      "should_include": true,
      "reasoning": "HIGH severity + High confidence = Critical fix."
    },
    {
      "defect_index": 1,
      "should_include": false,
      "reasoning": "Low confidence (0.30) and trivial Low severity makes this noise."
    },
    {
      "defect_index": 2,
      "should_include": true,
      "reasoning": "Medium severity with good confidence (0.75) is worth fixing to prevent technical debt."
    }
  ]
}"""
    ),
]
