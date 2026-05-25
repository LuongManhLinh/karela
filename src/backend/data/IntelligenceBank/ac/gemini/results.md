## Story Information

### Summary
As an IB team member, I want to be able to enable an Auto-Focal setting in MCP so that I can control all the settings from one place.

## Description
1. We need an MCP feature flag/setting called “Resources - Preset Auto-Focal” in the Development Use Only area. If this setting is enabled then any Auto-focal tickets as part of this project become enabled, if disabled then no Auto-focal settings should be available on the platform.
2. A setting called “Resources - Preset Auto-Focal” must be created in the Development Use only area of the MCP. 
3. The setting must be a toggle switch that can be enabled and disabled as needed. 
4. When enabled, any Auto-focal tickets as part of this project must become enabled. 
5. When disabled, no Auto-focal settings should be available on the platform. 

### AC by human
Scenario: Verify Focal point related MCP setting availability
    Given I am an admin or a participant who is in the platform setting tab on MCP
    When I check for 'Resources - Preset Auto-Focal'  
    Then I can see this setting under development only area
    When I try to enable/ disable the setting
    Then I can click and unclick

## AC 1
```
Feature: MCP - Resources - Preset Auto-Focal setting
  In order to control availability of Auto-focal features from one place
  As an IB team member
  I want a toggle setting called "Resources - Preset Auto-Focal" in the Development Use Only area of MCP that enables or disables Auto-focal functionality across the platform

  Background:
    Given a project exists in MCP

  Scenario: Setting exists in Development Use Only area and is a toggle
    Given I am signed in as an IB team member
    And I am on the MCP Development Use Only settings page for the project
    Then I should see a setting labeled "Resources - Preset Auto-Focal"
    And the setting should be presented as a toggle control that can be enabled or disabled

  Scenario: Enable toggle makes Auto-focal options available for ticket creation
    Given I am signed in as an IB team member
    And the "Resources - Preset Auto-Focal" toggle is currently disabled for the project
    When I enable the "Resources - Preset Auto-Focal" toggle
    And I navigate to create a new ticket for the project
    Then the ticket creation UI should display Auto-focal related options for selection

  Scenario: Disable toggle hides Auto-focal options from ticket creation
    Given I am signed in as an IB team member
    And the "Resources - Preset Auto-Focal" toggle is currently enabled for the project
    When I disable the "Resources - Preset Auto-Focal" toggle
    And I navigate to create a new ticket for the project
    Then the ticket creation UI should not display any Auto-focal related options

  Scenario: When disabled, existing Auto-focal controls are not available on existing tickets
    Given a ticket exists for the project with Auto-focal options visible or configured
    And I am signed in as an IB team member
    And the "Resources - Preset Auto-Focal" toggle is currently enabled
    When I disable the "Resources - Preset Auto-Focal" toggle
    And I open the existing ticket
    Then the ticket UI should not show Auto-focal configuration controls or options
    And any Auto-focal controls in the UI should be disabled or hidden from users

  Scenario: Toggle state persists across sessions and is applied to the platform
    Given I am signed in as an IB team member
    When I set the "Resources - Preset Auto-Focal" toggle to enabled for the project
    And I sign out and sign back in as the same IB team member
    Then the "Resources - Preset Auto-Focal" toggle should remain enabled
    And the platform should present Auto-focal options when creating tickets for the project

  Scenario: Non-IB users do not see or cannot change the setting
    Given I am signed in as a non-IB user (normal user)
    When I navigate to the MCP Development Use Only settings page for the project
    Then I should not see the "Resources - Preset Auto-Focal" setting
    And I should not be able to enable or disable Auto-focal functionality from MCP

  Scenario: Changes require page refresh to take effect on currently open ticket creation pages
    Given I and another user both have the ticket creation page open for the project
    And the "Resources - Preset Auto-Focal" toggle is currently disabled
    When I (as IB team member) enable the "Resources - Preset Auto-Focal" toggle
    And the other user refreshes the ticket creation page
    Then the other user's ticket creation UI should display Auto-focal related options

  Scenario: Invalid attempts to change toggle are prevented and return an error
    Given I am signed in as a non-IB user (normal user)
    When I attempt to call the API or UI action to enable the "Resources - Preset Auto-Focal" toggle for the project
    Then the system should reject the action with an authorization error
    And the toggle state should remain unchanged

  Scenario: Toggle label and placement are correct and only in Development Use Only area
    Given I am signed in as an IB team member
    When I navigate through MCP settings pages (Production, Staging, and Development Use Only)
    Then the setting labeled "Resources - Preset Auto-Focal" should only appear in the Development Use Only area
    And the label should exactly match "Resources - Preset Auto-Focal"

  Scenario: Rapid toggling does not leave system in inconsistent state
    Given I am signed in as an IB team member
    And a user is on the ticket creation page for the project
    When I toggle the "Resources - Preset Auto-Focal" setting on and off multiple times quickly
    Then each state change should be fully applied by the system (no partial or indeterminate states)
    And after each toggle change, the platform should reflect the current state for new ticket creation (after a refresh if required)

```

## AC 2
```
Feature: MCP - "Resources - Preset Auto-Focal" setting
  In order to centrally control Auto-Focal behavior for a project
  As an IB team member
  I want a toggle in the MCP Development Use Only area that enables or disables Auto-Focal for the project

  Scenario: Setting is present in Development Use Only area and visible to IB team members
    Given an IB team member is logged into MCP and has access to project "Project Alpha"
    When the IB team member navigates to the Development Use Only area for "Project Alpha"
    Then the setting "Resources - Preset Auto-Focal" is present and displayed as a toggle
    And the toggle shows its current state (enabled or disabled)

  Scenario: Non-IB user cannot view or modify the setting
    Given a non-IB user (no IB role) is logged into MCP and has access to project "Project Alpha"
    When the non-IB user navigates to the Development Use Only area for "Project Alpha"
    Then the setting "Resources - Preset Auto-Focal" is not visible
    And the non-IB user cannot access or change the setting

  Scenario: Enabling the toggle makes Auto-focal tickets/features available for the project
    Given the setting "Resources - Preset Auto-Focal" exists for project "Project Alpha" and is currently disabled
    And an IB team member is on the Development Use Only area for "Project Alpha"
    When the IB team member toggles "Resources - Preset Auto-Focal" to enabled and saves
    Then the setting state for "Project Alpha" becomes enabled
    And users can create Auto-focal tickets for "Project Alpha"
    And existing tickets within "Project Alpha" that support Auto-focal show Auto-focal controls/options as available

  Scenario: Disabling the toggle removes Auto-focal options for the project
    Given the setting "Resources - Preset Auto-Focal" exists for project "Project Alpha" and is currently enabled
    And there are existing Auto-focal tickets or Auto-focal controls in "Project Alpha"
    When an IB team member toggles "Resources - Preset Auto-Focal" to disabled and saves
    Then the setting state for "Project Alpha" becomes disabled
    And users cannot create new Auto-focal tickets for "Project Alpha"
    And Auto-focal controls/options are no longer available or visible on existing tickets in "Project Alpha"

  Scenario: Toggle state persists across sessions and page reloads
    Given the setting "Resources - Preset Auto-Focal" for project "Project Alpha" is enabled
    When the IB team member logs out and logs back in (or reloads the MCP page)
    Then the setting still shows as enabled for "Project Alpha"

  Scenario: Setting scope is per-project (changing one project does not affect others)
    Given the setting for project "Project Alpha" is disabled
    And the setting for project "Project Beta" is disabled
    When an IB team member enables "Resources - Preset Auto-Focal" for "Project Alpha"
    Then "Project Alpha" shows the setting as enabled
    And "Project Beta" remains disabled and Auto-focal is not available for "Project Beta"

  Scenario: Concurrent changes - last saved change wins and UI reflects final state
    Given two IB team members have the Development Use Only page for "Project Alpha" open at the same time
    When IB member A enables the toggle and saves
    And IB member B disables the toggle and saves after A's save
    Then the final saved state for "Project Alpha" is disabled
    And both IB members see the final disabled state after the system refreshes the setting

  Scenario: Server error while toggling shows an error and reverts state
    Given the setting "Resources - Preset Auto-Focal" for project "Project Alpha" is disabled
    When an IB team member attempts to enable the toggle but the server returns an error
    Then an error message is displayed explaining the action failed
    And the toggle reverts to the previous (disabled) state

  Scenario: Changes are auditable (who changed and when)
    Given an IB team member enables or disables "Resources - Preset Auto-Focal" for "Project Alpha"
    When the change is saved successfully
    Then the change is recorded in the MCP audit log with the acting user, timestamp, project identifier, and new state

```

## AC 3
```
Feature: Resources - Preset Auto-Focal setting (Development Use Only)

  In order to centrally control Auto-focal behavior for the project
  As an IB team member with access to MCP Development Use Only
  I want a "Resources - Preset Auto-Focal" toggle in the MCP Development Use Only area

  Scenario: Setting is present and visible to authorized user
    Given an authorized IB team member is signed in
    And the user is on the MCP Settings page
    When the user navigates to the "Development Use Only" section
    Then the user should see a toggle labeled "Resources - Preset Auto-Focal"
    And the toggle should include an accessible label and current state indicator

  Scenario: Default state for a fresh deployment is Disabled
    Given a fresh MCP deployment with no prior changes to feature flags
    When an authorized user navigates to Development Use Only
    Then the "Resources - Preset Auto-Focal" toggle should be set to Off (Disabled)

  Scenario: Enable toggle � Auto-focal options become available immediately
    Given the "Resources - Preset Auto-Focal" toggle is Off
    And a project exists that supports Auto-focal tickets
    When an authorized user enables the "Resources - Preset Auto-Focal" toggle
    Then the toggle should show On (Enabled)
    And the setting change should be saved successfully
    And Auto-focal options should be available in the platform UI for that project when creating a new ticket
    And Auto-focal options should be available when editing an existing ticket
    And any previously created Auto-focal tickets that were inactive due to the toggle being Off should now be shown as enabled/active in the UI

  Scenario: Disable toggle � Auto-focal options are removed from the platform
    Given the "Resources - Preset Auto-Focal" toggle is On
    And there are tickets that currently display Auto-focal options
    When an authorized user disables the "Resources - Preset Auto-Focal" toggle
    Then the toggle should show Off (Disabled)
    And the setting change should be saved successfully
    And no Auto-focal options or settings should be visible anywhere on the platform (ticket creation, ticket edit, ticket view) for that project
    And attempts to create or mark a ticket with Auto-focal should be prevented and present a clear message explaining Auto-focal is unavailable

  Scenario: Setting persists across sessions and page reloads
    Given the "Resources - Preset Auto-Focal" toggle is set to On
    When the authorized user logs out and logs back in
    Or the user refreshes the MCP Settings page
    Then the "Resources - Preset Auto-Focal" toggle should retain the On state
    And Auto-focal options should remain available in the platform accordingly

  Scenario: Unauthorized users cannot view or change the setting
    Given a user without permission to access Development Use Only is signed in
    When the user navigates to the MCP Settings page
    Then the user should not see the "Resources - Preset Auto-Focal" setting in the Development Use Only section
    And any direct API request to read or modify the "Resources - Preset Auto-Focal" setting by that user should be rejected with an authorization error

  Scenario: Save failure displays error and preserves previous effective state
    Given the "Resources - Preset Auto-Focal" toggle is Off
    And the MCP backend is experiencing a server save error
    When an authorized user attempts to enable the toggle
    Then the UI should display an error message indicating the setting could not be saved
    And the toggle should revert to Off (previous effective state)
    And Auto-focal options should remain unavailable

  Scenario: Concurrent updates resolve to the last successful save and are reflected consistently
    Given User A and User B are both authorized and viewing the "Resources - Preset Auto-Focal" toggle
    When User A enables the toggle and User B disables the toggle at approximately the same time
    And User B's save completes after User A's save
    Then the persisted setting should be Off (User B's last saved state)
    And after refresh both User A and User B should see the toggle in the Off state

  Scenario: Changing toggle updates downstream behavior for new and existing tickets consistently
    Given the "Resources - Preset Auto-Focal" toggle is Off
    And there are existing tickets with an Auto-focal attribute stored but currently inactive
    When an authorized user enables the toggle
    Then new tickets should be created with Auto-focal options available
    And existing tickets with stored Auto-focal attributes should surface those attributes as active in the UI


```

