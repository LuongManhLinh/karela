from app.connection.ac.services import ACService

example_gherkin = """Feature: User Login
  Scenario: Successful login with valid credentials
    Given the user is on the login page
    Whe the user enters valid username and password
"""

service = ACService(db=None)
response = service.lint_ac(example_gherkin)
print(response)
