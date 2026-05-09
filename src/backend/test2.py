from utils.markdown_adf_bridge import md_to_adf, adf_to_md
import json

gherkin = """
```gherkin
Feature: Rate Driver after Trip Completion
  As a Passenger, I want to rate my driver from 1 to 5 stars so that the community knows about the service quality.

  Scenario: Successfully submit a 4-star rating
    Given a trip has just ended
    When I select 4 stars and click 'Submit'
    Then the driver's average rating is updated
    And I see a confirmation message

  Scenario: Successfully submit a 1-star rating
    Given a trip has just ended
    When I select 1 star and click 'Submit'
    Then the driver's average rating is updated
    And I see a confirmation message

  Scenario: Successfully submit a 5-star rating
    Given a trip has just ended
    When I select 5 stars and click 'Submit'
    Then the driver's average rating is updated
    And I see a confirmation message

  Scenario: Attempt to submit rating without selecting stars
    Given a trip has just ended
    When I click 'Submit' without selecting any stars
    Then an error message is displayed indicating that a rating is required
    And the driver's average rating is not updated

  Scenario: Attempt to submit rating after trip has not ended
    Given a trip is still ongoing
    When I attempt to access the rating screen
    Then the rating option should be disabled or unavailable
```"""

adf = md_to_adf(gherkin)
print(json.dumps(adf, indent=2))

print("\n---\n")
markdown = adf_to_md(adf)
print(markdown)
