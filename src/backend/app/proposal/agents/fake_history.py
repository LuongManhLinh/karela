from langchain_core.messages import HumanMessage, AIMessage

# Few-shot examples shared by SIMPLE mode and as a generic baseline
DRAFTER_FAKE_HISTORY = [
    # Example 1: UPDATE (Fixing Ambiguity)
    HumanMessage(
        content="""Here is the input data for generating proposals:

## USER STORIES
**[US-100]** Login page
Description: User login.

## DEFECTS
**[Index 0]** Type: AMBIGUITY | Severity: HIGH | Confidence: HIGH
Stories: US-100
Explanation: Description 'User login' is too vague.
Suggested Fix: Add standard user story format and acceptance criteria."""
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

## USER STORIES
**[US-101]** User Dashboard
Description: Shows user stats.

## DEFECTS
**[Index 0]** Type: CONFLICT | Severity: MEDIUM | Confidence: HIGH
Stories: US-101
Explanation: This story implies viewing stats but the dependency 'Data Aggregation Service' is missing from the backlog.
Suggested Fix: Create a new story for the Data Aggregation Service API."""
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

# ---------------------------------------------------------------------------
# Specialized fake histories for COMPLEX mode
# ---------------------------------------------------------------------------

SPLITTER_FAKE_HISTORY = [
    HumanMessage(
        content="""Here is the input data for generating proposals:

## USER STORIES
**[US-200]** User Onboarding
Description: Build the complete user onboarding flow: signup with email/social, email verification, profile setup with avatar upload, preference selection, and tutorial walkthrough.

## DEFECTS
**[Index 0]** Type: NOT_SMALL | Severity: HIGH | Confidence: HIGH
Stories: US-200
Explanation: This story covers 5 distinct features: signup, verification, profile setup, preferences, and tutorial. Each is a sprint-sized effort.
Suggested Fix: Split into individual stories per feature."""
    ),
    AIMessage(
        content="""{
  "proposals": [
    {
      "target_defect_ids": ["US-200-DEF-1"],
      "contents": [
        {
          "type": "CREATE",
          "summary": "User Signup with Email and Social Auth",
          "description": "As a new user, I want to sign up using my email or social account so that I can create an account.\\n\\n**Acceptance Criteria:**\\nGiven I am on the signup page\\nWhen I enter a valid email and password\\nThen my account is created and I receive a verification email\\n\\nGiven I am on the signup page\\nWhen I click 'Sign up with Google'\\nThen I am authenticated via OAuth and my account is created",
          "explanation": "Vertical slice 1/3: covers signup only."
        },
        {
          "type": "CREATE",
          "summary": "Email Verification Flow",
          "description": "As a new user, I want to verify my email address so that my account is activated.\\n\\n**Acceptance Criteria:**\\nGiven I received a verification email\\nWhen I click the verification link\\nThen my account status changes to 'verified'",
          "explanation": "Vertical slice 2/3: covers email verification only."
        },
        {
          "type": "CREATE",
          "summary": "Profile Setup with Avatar Upload",
          "description": "As a verified user, I want to set up my profile with an avatar so that other users can recognize me.\\n\\n**Acceptance Criteria:**\\nGiven I am on the profile setup page\\nWhen I upload a valid image (JPG/PNG, max 5MB)\\nThen my avatar is saved and displayed on my profile",
          "explanation": "Vertical slice 3/3: covers profile setup only. Preference selection and tutorial are separate stories."
        },
        {
          "type": "DELETE",
          "story_key": "US-200",
          "explanation": "Original epic-sized story replaced by 3 focused vertical slices."
        }
      ]
    }
  ]
}"""
    ),
]

REFINER_FAKE_HISTORY = [
    HumanMessage(
        content="""Here is the input data for generating proposals:

## USER STORIES
**[US-300]** Optimize database
Description: Run profiling and optimize the database so it runs better.

## DEFECTS
**[Index 0]** Type: NOT_VALUABLE | Severity: HIGH | Confidence: HIGH
Stories: US-300
Explanation: The story says 'runs better' which is not a measurable benefit. No target user or business outcome.
Suggested Fix: Add specific performance targets and user impact."""
    ),
    AIMessage(
        content="""{
  "proposals": [
    {
      "target_defect_ids": ["US-300-DEF-1"],
      "contents": [
        {
          "type": "UPDATE",
          "story_key": "US-300",
          "summary": "Reduce Dashboard Query Latency by 50%",
          "description": "In order to improve the user experience for dashboard users experiencing slow load times,\\nAs a backend engineer,\\nI want to profile and optimize the top 5 slowest dashboard SQL queries\\nSo that p95 query latency drops from 800ms to under 400ms.\\n\\n**Acceptance Criteria:**\\nGiven the current p95 dashboard query latency is ~800ms\\nWhen the optimized queries are deployed to production\\nThen p95 latency is measured at or below 400ms for 24 hours\\n\\nGiven the query optimization is complete\\nWhen I run the existing integration test suite\\nThen all tests pass with no regressions",
          "explanation": "Added measurable performance target (50% latency reduction), specific scope (top 5 queries), and Gherkin acceptance criteria."
        }
      ]
    }
  ]
}"""
    ),
]

RESOLVER_FAKE_HISTORY = [
    HumanMessage(
        content="""Here is the input data for generating proposals:

## USER STORIES
**[US-400]** No cancellation fees before trip
Description: As a rider, I want to cancel my ride without any fees before the trip starts.

---
**[US-401]** Charge cancellation fee after 2 minutes
Description: As a business, I want to charge a $5 fee if the rider cancels more than 2 minutes after booking.

## DEFECTS
**[Index 0]** Type: CONFLICT | Severity: HIGH | Confidence: HIGH
Stories: US-400, US-401
Explanation: US-400 says no fees before trip starts. US-401 says charge $5 after 2 minutes. A rider who cancels 3 minutes after booking but before the trip starts triggers both rules with contradictory outcomes.
Suggested Fix: Align on a single cancellation policy.

## Inter-Story Context
These stories belong to the 'Ride Cancellation' feature area. Project documentation states: 'Cancellation fees apply only after driver assignment.'"""
    ),
    AIMessage(
        content="""{
  "proposals": [
    {
      "target_defect_ids": ["US-400-DEF-1"],
      "contents": [
        {
          "type": "UPDATE",
          "story_key": "US-400",
          "summary": "Free cancellation before driver assignment",
          "description": "As a rider, I want to cancel my ride without fees before a driver is assigned, so that I am not penalized for changing my mind early.\\n\\n**Acceptance Criteria:**\\nGiven I have booked a ride and no driver is assigned yet\\nWhen I cancel the ride\\nThen no cancellation fee is charged",
          "explanation": "Narrowed the free cancellation window to 'before driver assignment' per project docs, removing the conflict with US-401's post-assignment fee."
        }
      ]
    }
  ]
}"""
    ),
]
