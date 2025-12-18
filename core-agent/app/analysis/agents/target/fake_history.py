from langchain_core.messages import HumanMessage, AIMessage

CROSS_CHECK_FAKE_HISTORY = [
    # Example 1: Duplication and Conflict
    HumanMessage(
        content="""Here is the input data:
{
  "target_user_story": {
    "key": "US-NEW",
    "title": "Export Data to CSV",
    "description": "As a user, I want to export my transaction history to a CSV file.\\n\\n**Acceptance Criteria:**\\n- File should include Date, Merchant, Amount.\\n- Trigger download immediately."
  },
  "user_stories": [
    {
      "key": "US-EXISTING-1",
      "title": "General Data Export",
      "description": "As a user, I want to export my data to different formats (PDF, Excel).\\n\\n**Acceptance Criteria:**\\n- Select date range.\\n- Choose format."
    },
    {
      "key": "US-EXISTING-2",
      "title": "Security Audit",
      "description": "As a spec writer, I require all exports to be asynchronous and emailed.\\n\\n**Acceptance Criteria:**\\n- No direct downloads allowed."
    }
  ],
  "existing_defects": []
}"""
    ),
    AIMessage(
        content="""{
  "defects": [
    {
      "type": "DUPLICATION",
      "story_keys": ["US-NEW", "US-EXISTING-1"],
      "severity": "MEDIUM",
      "explanation": "US-NEW (CSV Export) is a specific instance of the generic functionality described in US-EXISTING-1 (Data Export). Separate implementation would lead to code duplication.",
      "confidence": 0.80,
      "suggested_fix": "Merge US-NEW into US-EXISTING-1 as a specific Acceptance Criterion: 'Support CSV format'."
    },
    {
      "type": "CONFLICT",
      "story_keys": ["US-NEW", "US-EXISTING-2"],
      "severity": "HIGH",
      "explanation": "US-NEW requires immediate download (direct), while US-EXISTING-2 explicitly forbids direct downloads for security reasons (must be emailed).",
      "confidence": 0.95,
      "suggested_fix": "Change US-NEW workflow to 'Request Export' and receive via email, aligning with US-EXISTING-2."
    }
  ]
}"""
    ),

    # Example 2: Complex Negative (Similar words, different scope - NO DEFECT)
    HumanMessage(
        content="""Here is the input data:
{
  "target_user_story": {
    "key": "US-TAX-2024",
    "title": "Calculate VAT for EU",
    "description": "As a system, I need to apply 20% VAT to all EU transactions."
  },
  "user_stories": [
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
    # Example 3: No Defects
    HumanMessage(
        content="""Here is the input data:
{
  "target_user_story": {
    "key": "US-NEW-2",
    "title": "Update Profile Picture",
    "description": "As a user, I want to upload a new avatar.\\n\\n**Acceptance Criteria:**\\n- Max size 5MB.\\n- JPG/PNG only."
  },
  "user_stories": [
    {
      "key": "US-OLD-1",
      "title": "Login",
      "description": "User login flow."
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
    # Example 1: Out of Scope
    HumanMessage(
        content="""Here is the input data:
{
  "target_user_story": {
    "key": "US-TARGET",
    "title": "Integrate Blockchain Payments",
    "description": "Allows users to pay via Ethereum.\\n\\n**Acceptance Criteria:**\\n- Connect Metamask.\\n- Calculate Gas."
  },
  "context_input": {
    "project_scope": "Traditional e-commerce platform using Stripe and PayPal only. No crypto support planned for this year.",
    "documentation": "Roadmap 2024"
  },
  "existing_defects": []
}"""
    ),
    AIMessage(
        content="""{
  "defects": [
    {
      "type": "OUT_OF_SCOPE",
      "story_keys": ["US-TARGET"],
      "severity": "HIGH",
      "explanation": "Crypto/Blockchain payments are explicitly excluded from the 2024 Roadmap (Stripe/PayPal only).",
      "confidence": 0.99,
      "suggested_fix": "Reject this story."
    }
  ]
}"""
    ),

    # Example 2: Complex Negative (Seemingly Out of Scope but valid extension)
    HumanMessage(
        content="""Here is the input data:
{
  "target_user_story": {
    "key": "US-MOBILE-WEB",
    "title": "Responsive Layout",
    "description": "Ensure the site works on mobile browsers."
  },
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
    # Example 3: Valid
    HumanMessage(
        content="""Here is the input data:
{
  "target_user_story": {
    "key": "US-TARGET-2",
    "title": "Add to Cart",
    "description": "As a user, I want to add items to my cart.\\n\\n**Acceptance Criteria:**\\n- Update cart count badge."
  },
  "context_input": {
    "project_scope": "Traditional E-commerce MVP.",
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
    # Example 3: Ambiguity
    HumanMessage(
        content="""Here is the input data:
{
  "target_user_story": {
    "key": "US-TARGET-3",
    "title": "Implement Search Functionality",
    "description": "As a user, I want to search products quickly.\\n\\n**Acceptance Criteria:**\\n- Search by name."
  },
  "context_input": {
    "project_scope": "E-commerce platform.",
    "documentation": "Spec Doc"
  },
  "existing_defects": []"""
    ),
    AIMessage(
        content="""{
  "defects": [
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
]

VALIDATOR_FAKE_HISTORY = [
    # Example 1: Clarification Needed
    HumanMessage(
        content="""Please validate these detected defects:
{
  "target_user_story": {"key": "US-T", "title": "API Rate Limit"},
  "defects": [
    {
      "type": "CONFLICT",
      "story_keys": ["US-T", "US-PROD"],
      "severity": "LOW",
      "explanation": "US-T says 100req/min, US-PROD says 50req/min.",
      "confidence": 0.60
    }
  ],
  "user_stories": [
      {"key": "US-PROD", "title": "Production Config"}
  ]
}"""
    ),
    AIMessage(
        content="""{
  "validations": [
    {
      "defect_index": 0,
      "status": "NEEDS_CLARIFICATION",
      "reasoning": "A discrepancy in rate limits is a functional contradiction, not a minor issue. If Development follows one, the other is broken.",
      "suggested_severity": "HIGH",
      "suggested_explanation": "Critical configuration conflict: US-T defines 100req/min while US-PROD limits to 50req/min. System behavior is undefined."
    }
  ]
}"""
    ),
]

FILTER_FAKE_HISTORY = [
    # Example: Simple Filter
    HumanMessage(
        content="""Please filter these defects to show only valuable ones:
{
  "defects": [
    {
      "id": "d1",
      "type": "OUT_OF_SCOPE",
      "severity": "HIGH",
      "confidence": 0.90,
      "explanation": "Major scope creep."
    },
    {
      "id": "d2",
      "type": "AMBIGUITY",
      "severity": "LOW",
      "confidence": 0.40,
      "explanation": "Missing a comma."
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
      "reasoning": "High severity Out-of-Scope must be flagged."
    },
    {
      "defect_index": 1,
      "should_include": false,
      "reasoning": "Low confidence and trivial grammar issue."
    }
  ]
}"""
    ),
]
