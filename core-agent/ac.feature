Feature: asf

Scenaro: Successful Login
    Given the user is on the login page
    When the user enters valid credentials
    Then the user should be redirected to the dashboard
Scenario: Invalid Password
    Given the user is on the login page
    When the user enters an invalid password
    Then an error message should be displayed
    And the user should be logged in successfully
