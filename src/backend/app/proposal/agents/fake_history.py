from langchain_core.messages import HumanMessage, AIMessage

DRAFTER_FAKE_HISTORY = [
    # Example 1: UPDATE (Fixing Ambiguity)
    HumanMessage(
        content="""Here is the input data for generating proposals:
{
  "user_stories": [
    {
      "key": "US-100",
      "title": "Login page",
      "description": "User login."
    }
  ],
  "defects": [
    {
      "id": "def-1",
      "type": "AMBIGUITY",
      "story_keys": ["US-100"],
      "severity": "HIGH",
      "explanation": "Description 'User login' is too vague.",
      "suggested_fix": "Add standard user story format and acceptance criteria."
    }
  ]
}"""
    ),
    AIMessage(
        content="""{
  "proposals": [
    {
      "target_defect_ids": ["def-1"],
      "contents": [
        {
          "type": "UPDATE",
          "story_key": "US-100",
          "summary": "User Login Page",
          "description": "As a registered user, I want to log in using my email and password so that I can access my dashboard.\\n\\n**Acceptance Criteria:**\\n- Input fields for Email and Password.\\n- 'Forgot Password' link present.\\n- Validate credentials against database.",
          "explanation": "Expanded the description to standard format and added 3 core acceptance criteria to resolve ambiguity."
        }
      ]
    }
  ]
}"""
    ),
    # Example 2: CREATE (Splitting/Missing Feature)
    HumanMessage(
        content="""Here is the input data for generating proposals:
{
  "user_stories": [
    {
      "key": "US-101",
      "title": "User Dashboard",
      "description": "Shows user stats."
    }
  ],
  "defects": [
    {
      "id": "def-2",
      "type": "CONFLICT",
      "story_keys": ["US-101"],
      "severity": "MEDIUM",
      "explanation": "This story implies viewing stats but the dependency 'Data Aggregation Service' is missing from the backlog.",
      "suggested_fix": "Create a new story for the Data Aggregation Service API."
    }
  ]
}"""
    ),
    AIMessage(
        content="""{
  "proposals": [
    {
      "target_defect_ids": ["def-2"],
      "contents": [
        {
          "type": "CREATE",
          "summary": "Enable Data Aggregation Service",
          "description": "As a system, I need an aggregation service to collect user stats.\\n\\n**Acceptance Criteria:**\\n- API Endpoint /stats/aggregate exists.\\n- Returns JSON with daily active usage.",
          "explanation": "Created dependency story to resolve the gap identified in US-101."
        },
        { 
          "type": "UPDATE",
          "story_key": "US-101",
          "explanation": "Added link to new dependency story US-NEW."
        }
      ]
    }
  ]
}"""
    ),
]

IMPACT_ANALYZER_FAKE_HISTORY = [
    # Example 1: REJECT (Bad Delete)
    HumanMessage(
        content="""Please review these proposals:
{
  "proposals": [
    {
      "target_defect_ids": ["def-1"],
      "contents": [
        {
          "type": "DELETE",
          "story_key": "US-100",
          "explanation": "Deleting because it's vague."
        }
      ]
    }
  ],
  "user_stories": [{"key": "US-100", "title": "Login"}],
  "defects": [{"id": "def-1", "type": "AMBIGUITY"}]
}"""
    ),
    AIMessage(
        content="""{
  "reviews": [
    {
      "proposal_index": 0,
      "status": "REJECT",
      "feedback": "Do not DELETE a story just because it is ambiguous. UPDATE it to clarify requirements.",
      "reasoning": "Deleting the login story leaves the system without an entry point, creating a critical regression."
    }
  ]
}"""
    ),
    # Example 2: APPROVE (Good Update)
    HumanMessage(
        content="""Please review these proposals:
{
  "proposals": [
    {
      "target_defect_ids": ["def-3"],
      "contents": [
        {
          "type": "UPDATE",
          "story_key": "US-105",
          "description": "As a user...\\n**AC:**\\n- Button color is blue.",
          "explanation": "Fixed typo in AC."
        }
      ]
    }
  ],
  "user_stories": [{"key": "US-105", "title": "Blue Button"}],
  "defects": [{"id": "def-3", "type": "AMBIGUITY"}]
}"""
    ),
    AIMessage(
        content="""{
  "reviews": [
    {
      "proposal_index": 0,
      "status": "APPROVE",
      "reasoning": "The update resolves the ambiguity without altering the core scope or introducing regressions."
    }
  ]
}"""
    ),
]

REWRITER_FAKE_HISTORY = [
    # Example 1: Successful Rewrite
    HumanMessage(
        content="""Please rewrite the proposals based on this feedback:
{
  "original_proposals": [
    {
      "target_defect_ids": ["def-1"],
      "contents": [
        {
          "type": "DELETE",
          "story_key": "US-100",
          "explanation": "Deleting."
        }
      ]
    }
  ],
  "feedback": [
    {
      "proposal_index": 0,
      "status": "REJECT",
      "feedback": "Do not DELETE. UPDATE instead.",
      "reasoning": "Critical regression."
    }
  ],
  "user_stories": [{"key": "US-100", "title": "Login"}],
  "defects": [{"id": "def-1", "type": "AMBIGUITY"}]
}"""
    ),
    AIMessage(
        content="""{
  "proposals": [
    {
      "target_defect_ids": ["def-1"],
      "contents": [
        {
          "type": "UPDATE",
          "story_key": "US-100",
          "summary": "User Login",
          "description": "As a user, I want to login...\\n\\n**Acceptance Criteria:**\\n- Valid credentials allow access.",
          "explanation": "Changed action from DELETE to UPDATE as requested. Now providing a clarified description."
        }
      ]
    }
  ]
}"""
    ),
]
