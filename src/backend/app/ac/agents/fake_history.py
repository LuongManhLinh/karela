from langchain_core.messages import HumanMessage, AIMessage

AC_GENERATOR_FAKE_HISTORY = [
    HumanMessage(
        content="""Here is the input for generating AC:
## **Story Summary:**
User Registration

## **Story Description:**
As a new visitor, I want to register an account with my email and password, So that I can access personalized features of the platform.

## **Project Description:**
An e-commerce platform for selling digital products. Users must verify their email before accessing purchase features."""
    ),
    AIMessage(
        content="""{
  "gherkin_ac": "Feature: User Registration\\n\\nBackground:\\n  Given the user is on the registration page\\n\\nScenario: Successful registration with valid credentials\\n  When the user enters a valid email and a password that meets requirements\\n  And the user submits the registration form\\n  Then the user should receive a verification email\\n  And the user account should be created with status \\"pending verification\\"\\n\\nScenario: Registration with an already registered email\\n  When the user enters an email that is already registered\\n  And the user submits the registration form\\n  Then an error message \\"Email is already in use\\" should be displayed\\n  And no new account should be created\\n\\nScenario Outline: Registration with invalid password\\n  When the user enters a valid email and password \\"<password>\\"\\n  And the user submits the registration form\\n  Then an error message \\"<error_message>\\" should be displayed\\n\\n  Examples:\\n    | password | error_message |\\n    | short | Password must be at least 8 characters |\\n    | nouppercasenodigit | Password must contain uppercase and digit |",
  "reasoning": "Covered the happy path, duplicate email edge case, and used Scenario Outline for password validation boundaries. Background consolidates the shared precondition. Aligned with project context requiring email verification."
}"""
    ),
]

AC_REVIEWER_FAKE_HISTORY = [
    HumanMessage(
        content="""Please review this AC:
## **Story Summary:**
User Registration

## **Story Description:**
As a new visitor, I want to register an account with my email and password, So that I can access personalized features of the platform.

## **Generated Acceptance Criteria:**
Feature: Registration
Scenario: Register
Given user is on the page
Then user is registered

## **Project Description:**
An e-commerce platform for selling digital products. Users must verify their email before accessing purchase features."""
    ),
    AIMessage(
        content="""{
  "review": {
    "status": "REWRITE",
    "feedback": "1. Missing 'When' step — the scenario skips the user action entirely. 2. 'Given user is on the page' is too vague — specify which page. 3. 'Then user is registered' describes a side-effect, not an observable outcome. 4. No negative or boundary scenarios. 5. Does not reflect the project requirement for email verification.",
    "reasoning": "The AC has syntax issues (missing When step, violates Given-When-Then order), vague language, and completely ignores the email verification requirement from the project description."
  }
}"""
    ),
]

AC_REWRITER_FAKE_HISTORY = [
    HumanMessage(
        content="""Please rewrite the AC based on this feedback:
## **Story Summary:**
User Registration

## **Story Description:**
As a new visitor, I want to register an account with my email and password, So that I can access personalized features of the platform.

## **Current Generated Acceptance Criteria:**
Feature: Registration
Scenario: Register
Given user is on the page
Then user is registered

## **Lint Errors (MUST FIX):**
- Line 3: keywords-in-logical-order - Expected "When" but got "Then"
- Line 2: use-and - Use "And" instead of repeating "Given"/"When"/"Then"

## **Reviewer Feedback:**
1. Missing 'When' step. 2. 'Given user is on the page' is too vague. 3. No negative scenarios. 4. Missing email verification from project context.

## **Project Description:**
An e-commerce platform for selling digital products. Users must verify their email before accessing purchase features."""
    ),
    AIMessage(
        content="""{
  "gherkin_ac": "Feature: User Registration\\n\\nBackground:\\n  Given the user is on the registration page\\n\\nScenario: Successful registration with valid credentials\\n  When the user enters a valid email and a password that meets requirements\\n  And the user submits the registration form\\n  Then the user should receive a verification email\\n  And the user account should be created with status \\"pending verification\\"\\n\\nScenario: Registration with an already registered email\\n  When the user enters an email that is already registered\\n  And the user submits the registration form\\n  Then an error message \\"Email is already in use\\" should be displayed",
  "reasoning": "Fixed lint errors: added missing 'When' step to restore Given-When-Then order. Addressed reviewer feedback: made step descriptions specific, added negative scenario for duplicate email, incorporated email verification requirement from project context."
}"""
    ),
]
