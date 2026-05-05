from langchain_core.messages import HumanMessage, AIMessage

SPLITTER_FAKE_HISTORY = [
    # Example 1: NOT_SMALL
    HumanMessage(content="""Here is the input data for generating proposals:

## USER STORIES
**[EC-200]** As a new user, I want to onboard to the application so that I can use the platform
Description: The onboarding experience must be seamless. The user will open the app and be presented with a signup screen where they can use email or Google. After they submit, we must send a verification email with a 6-digit code. Once verified, they must be redirected to a profile setup screen where they upload an avatar and fill out their bio. Finally, they must choose 3 categories of interest before they are allowed into the main dashboard. All of this must be implemented in the new React Native framework.

## DEFECTS
**[ID: EC-DEF-1]** Type: NOT_SMALL | Severity: HIGH
Stories: EC-200
Explanation: The scope of this story encompasses multiple distinct user workflows: authentication, email verification, profile creation, and preference selection. Building all these screens and backend APIs together cannot be completed in a single sprint.
Suggested Fix: Decompose the story into smaller, independent vertical slices for each logical step of the onboarding flow."""),
    AIMessage(content="""{
  "proposals": [
    {
      "target_defect_ids": ["EC-DEF-1"],
      "contents": [
        {
          "type": "CREATE",
          "summary": "As a new user, I want to sign up with email or social auth so I can create an account",
          "description": "This is the first step of the onboarding flow.\\n\\n**Acceptance Criteria:**\\nGiven I am on the signup page\\nWhen I enter a valid email and password\\nThen my account is created and I receive a verification email\\n\\nGiven I am on the signup page\\nWhen I click 'Sign up with Google'\\nThen I am authenticated via OAuth and my account is created",
          "explanation": "Vertical slice 1/3: covers account creation only."
        },
        {
          "type": "CREATE",
          "summary": "As a new user, I want to verify my email address so my account is activated",
          "description": "This is the second step of the onboarding flow.\\n\\n**Acceptance Criteria:**\\nGiven I received a verification email\\nWhen I enter the 6-digit code\\nThen my account status changes to 'verified'",
          "explanation": "Vertical slice 2/3: covers email verification only."
        },
        {
          "type": "CREATE",
          "summary": "As a verified user, I want to set up my profile so other users can recognize me",
          "description": "This is the third step of the onboarding flow.\\n\\n**Acceptance Criteria:**\\nGiven I am on the profile setup page\\nWhen I upload a valid image and fill my bio\\nThen my profile is saved and I am redirected to the dashboard",
          "explanation": "Vertical slice 3/3: covers profile setup only. Preference selection is deferred to a separate story."
        },
        {
          "type": "DELETE",
          "story_key": "EC-200",
          "explanation": "Original epic-sized story replaced by focused vertical slices."
        }
      ]
    }
  ]
}"""),
    # Example 2: NOT_INDEPENDENT
    HumanMessage(content="""Here is the input data for generating proposals:

## USER STORIES
**[EC-205]** As a shopper, I want to view my shopping cart so that I can see my total cost
Description: Build the frontend React view for the shopping cart page. It needs to display the list of items the user added, show the subtotal, calculate the estimated tax, and show the final total. Note: we cannot build the tax calculation logic or the item fetch logic on the frontend until the backend team finishes the Cart API and the new Tax Engine microservice.

---

**[EC-206]** As a backend engineer, I want to build the Cart API so the frontend can retrieve items
Description: Expose REST endpoints to get cart items from the database.

---

**[EC-207]** As a backend engineer, I want to build the Tax Engine so we can calculate local sales tax
Description: Create the tax calculation microservice using the new TaxJar integration.

## DEFECTS
**[ID: EC-DEF-2]** Type: NOT_INDEPENDENT | Severity: MEDIUM
Stories: EC-205
Explanation: The frontend story explicitly states it cannot be built until EC-206 and EC-207 are finished, creating a strict dependency bottleneck that prevents independent development during the sprint.
Suggested Fix: Restructure the frontend story to remove the bottleneck by developing against a mocked interface or API contract."""),
    AIMessage(content="""{
  "proposals": [
    {
      "target_defect_ids": ["EC-DEF-2"],
      "contents": [
        {
          "type": "UPDATE",
          "story_key": "EC-205",
          "summary": "As a shopper, I want to view my shopping cart so that I can see my total cost",
          "description": "Build the frontend React view for the shopping cart page.\\n\\n**Acceptance Criteria:**\\nGiven I am on the cart page\\nWhen the page loads\\nThen it displays the cart items (using a mocked static JSON response for the Cart API and Tax Engine API based on the agreed Swagger contract)\\n\\nGiven the UI is built\\nWhen the real API is ready in the future\\nThen we will integrate it in a separate story.",
          "explanation": "Removed the strict dependency bottleneck by specifying that the UI should be built and tested against mocked interfaces, allowing independent sprint delivery without waiting for EC-206 or EC-207."
        }
      ]
    }
  ]
}""")
]

REFINER_FAKE_HISTORY = [
    # Example 1: NOT_VALUABLE
    HumanMessage(content="""Here is the input data for generating proposals:

## USER STORIES
**[EC-300]** As a developer, I want to migrate the legacy User table so that the database is cleaner
Description: We need to move the legacy `tbl_Users` in the MySQL database over to the new PostgreSQL database. The schema should be updated to use UUIDs instead of auto-incrementing integers for the primary key. This will make the database much cleaner and follow our new engineering standards.

## DEFECTS
**[ID: EC-DEF-1]** Type: NOT_VALUABLE | Severity: HIGH
Stories: EC-300
Explanation: The story describes a purely internal technical chore ("cleaner database", "new standards") without explaining the tangible benefit to the business or end-user. It lacks a clear business outcome.
Suggested Fix: Identify the measurable business outcome or user benefit this technical task enables."""),
    AIMessage(content="""{
  "proposals": [
    {
      "target_defect_ids": ["EC-DEF-1"],
      "contents": [
        {
          "type": "UPDATE",
          "story_key": "EC-300",
          "summary": "As a backend engineer, I want to migrate the User table so that we can enable Single Sign-On (SSO)",
          "description": "In order to enable the new Single Sign-On (SSO) integration for enterprise customers, we need to migrate the legacy User database table to the new PostgreSQL schema using UUIDs.\\n\\n**Acceptance Criteria:**\\nGiven the migration script is run\\nWhen I check the database\\nThen all existing user records are accurately moved to the new schema without data loss\\n\\nGiven the migration is complete\\nWhen the SSO service attempts to read user data\\nThen the data format is fully compatible with the SSO requirements",
          "explanation": "Enriched the technical task with a clear, valuable business outcome (enabling enterprise SSO) rather than just stating 'cleaner database'."
        }
      ]
    }
  ]
}"""),
    # Example 2: NOT_ESTIMABLE
    HumanMessage(content="""Here is the input data for generating proposals:

## USER STORIES
**[EC-310]** As a customer, I want the search bar to find things more accurately so I don't get frustrated
Description: Right now when users search for a product, they often don't find what they are looking for unless they type the exact name. We need to improve the search algorithm so it finds things much more accurately and gives better suggestions.

## DEFECTS
**[ID: EC-DEF-2]** Type: NOT_ESTIMABLE | Severity: HIGH
Stories: EC-310
Explanation: The requirement 'more accurately' is highly ambiguous. There are no clear, measurable boundaries or strict Acceptance Criteria for the team to estimate against.
Suggested Fix: Clarify the constraints and add strict Gherkin format acceptance criteria."""),
    AIMessage(content="""{
  "proposals": [
    {
      "target_defect_ids": ["EC-DEF-2"],
      "contents": [
        {
          "type": "UPDATE",
          "story_key": "EC-310",
          "summary": "As a customer, I want the search bar to query product tags and SKUs so I can find items faster",
          "description": "We need to improve the search algorithm to include Product Tags and SKU numbers, not just the Product Title.\\n\\n**Acceptance Criteria:**\\nGiven I am on the home page\\nWhen I type an exact SKU number into the search bar\\nThen the exact matching product is returned as the first result\\n\\nGiven I am searching\\nWhen I type a known product tag (e.g., 'summer-wear')\\nThen all products with that tag are included in the results",
          "explanation": "Clarified the ambiguous 'more accurately' requirement by specifying exact technical matching rules (Tags and SKUs) and providing clear, testable boundaries."
        }
      ]
    }
  ]
}""")
]

RESOLVER_FAKE_HISTORY = [
    # Example 1: CONFLICT
    HumanMessage(
        content="""Here is the input data for generating proposals:

## USER STORIES
**[EC-400]** As a rider, I want to cancel my ride without fees so I can change my mind early
Description: Sometimes users make mistakes when booking. If they cancel the ride before the trip actually starts, they should not be charged any fees at all.

---

**[EC-401]** As a business, I want to charge a cancellation fee so we compensate drivers
Description: If a rider cancels a booking more than 2 minutes after they made the request, we must charge a $5 cancellation fee to their account to compensate the driver for their time.

## DEFECTS
**[ID: EC-DEF-1]** Type: CONFLICT | Severity: HIGH
Stories: EC-400, EC-401
Explanation: EC-400 says no fees before trip starts. EC-401 says charge $5 after 2 minutes. A rider who cancels 3 minutes after booking but before the trip starts triggers both rules with contradictory outcomes.
Suggested Fix: Align on a single cancellation policy.

## Inter-Story Context
These stories belong to the 'Ride Cancellation' feature area. Project documentation states: 'Cancellation fees apply only after driver assignment.'"""
    ),
    AIMessage(content="""{
  "proposals": [
    {
      "target_defect_ids": ["EC-DEF-1"],
      "contents": [
        {
          "type": "UPDATE",
          "story_key": "EC-400",
          "summary": "As a rider, I want to cancel my ride without fees before a driver is assigned",
          "description": "Sometimes users make mistakes when booking. If they cancel the ride before a driver is assigned, they should not be charged any fees at all.\\n\\n**Acceptance Criteria:**\\nGiven I have booked a ride and no driver is assigned yet\\nWhen I cancel the ride\\nThen no cancellation fee is charged",
          "explanation": "Narrowed the free cancellation window to 'before driver assignment' per project docs, removing the conflict with EC-401's post-assignment fee."
        }
      ]
    }
  ]
}"""),
    # Example 2: DUPLICATION
    HumanMessage(
        content="""Here is the input data for generating proposals:

## USER STORIES
**[EC-405]** As a developer, I want to connect the Stripe API so that we can process transactions
Description: We need to integrate the Stripe payment gateway backend. Set up the API keys and create the endpoint to tokenize credit cards and process charges securely.

---

**[EC-406]** As a customer, I want to pay with my credit card so that my order is processed
Description: On the checkout page, add a credit card form. When the user submits it, send the payment securely through Stripe so the order can be completed.

## DEFECTS
**[ID: EC-DEF-2]** Type: DUPLICATION | Severity: HIGH
Stories: EC-405, EC-406
Explanation: Both stories describe building the exact same Stripe integration. EC-406 is written from a user perspective while EC-405 is technical, but the underlying work is identical.
Suggested Fix: Merge into a single cohesive story."""
    ),
    AIMessage(content="""{
  "proposals": [
    {
      "target_defect_ids": ["EC-DEF-2"],
      "contents": [
        {
          "type": "UPDATE",
          "story_key": "EC-406",
          "summary": "As a customer, I want to pay with my credit card via Stripe so my order is processed",
          "description": "On the checkout page, add a credit card form. When the user submits it, send the payment securely through the Stripe API.\\n\\n**Acceptance Criteria:**\\nGiven I am on the checkout page\\nWhen I enter valid credit card details and submit\\nThen the payment is processed via Stripe and I see an order success page\\n\\nGiven I am checking out\\nWhen the Stripe API returns an error\\nThen a friendly error message is displayed to me",
          "explanation": "Enriched the user-facing story with technical API details from the duplicate story."
        },
        {
          "type": "DELETE",
          "story_key": "EC-405",
          "explanation": "Deleted duplicate technical story; scope has been fully absorbed by EC-406."
        }
      ]
    }
  ]
}""")
]

