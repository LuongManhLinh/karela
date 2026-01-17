from langchain_core.messages import HumanMessage, AIMessage

AC_GENERATOR_FAKE_HISTORY = [
    HumanMessage(
        content="""Here is the input for generating AC:
{
  "title": "Login",
  "description": "As a user, I want to login so I can access the system."
}"""
    ),
    AIMessage(
        content="""{
  "gherkin_ac": "Feature: User Login\n\nScenario: Successful Login\n  Given the user is on the login page\n  When the user enters valid credentials\n  Then the user should be redirected to the dashboard\n\nScenario: Invalid Password\n  Given the user is on the login page\n  When the user enters an invalid password\n  Then an error message should be displayed",
  "reasoning": "Generated basic positive and negative scenarios for login."
}"""
    ),
]

AC_REVIEWER_FAKE_HISTORY = [
    HumanMessage(
        content="""Please review this AC:
{
  "user_story_title": "Login",
  "user_story_description": "As a user...",
  "generated_ac": "Feature: Login\nScenario: Login\nGiven user is there\nThen user logs in"
}"""
    ),
    AIMessage(
        content="""{
  "review": {
    "status": "REWRITE",
    "feedback": "The Gherkin is too vague. 'Given user is there' is not a valid step. 'Then user logs in' describes an action, not a result. Missing 'When' step.",
    "reasoning": "Syntax and logical flow issues."
  }
}"""
    ),
]

AC_REWRITER_FAKE_HISTORY = [
    HumanMessage(
        content="""Please rewrite the AC based on this feedback:
{
  "title": "Login",
  "description": "...",
  "current_ac": "Feature: Login\nScenario: Login\nGiven user is there\nThen user logs in",
  "reviewer_feedback": "The Gherkin is too vague..."
}"""
    ),
    AIMessage(
        content="""{
  "gherkin_ac": "Feature: User Login\n\nScenario: Successful Login\n  Given the user is on the login page\n  When the user enters valid credentials\n  Then the user should be logged in successfully",
  "reasoning": "Fixed syntax and added missing 'When' step as requested."
}"""
    ),
]
