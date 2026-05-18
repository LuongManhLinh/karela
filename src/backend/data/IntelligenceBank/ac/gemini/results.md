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
Feature: Auto-Focal Setting in MCP
  As an IB team member
  I want to be able to enable an Auto-Focal setting in MCP
  So that I can control all the settings from one place.

  Scenario: Verify the presence and type of the Auto-Focal setting
    Given I am an IB team member logged into the MCP
    When I navigate to the 'Development Use Only' area
    Then I should see a setting named 'Resources - Preset Auto-Focal'
    And the 'Resources - Preset Auto-Focal' setting should be a toggle switch

  Scenario: Enabling the Auto-Focal setting makes related features available
    Given I am an IB team member logged into the MCP
    And I am in the 'Development Use Only' area
    And the 'Resources - Preset Auto-Focal' setting is currently disabled
    When I enable the 'Resources - Preset Auto-Focal' toggle switch
    Then Auto-focal tickets associated with this project should become enabled
    And Auto-focal settings should be available on the platform

  Scenario: Disabling the Auto-Focal setting makes related features unavailable
    Given I am an IB team member logged into the MCP
    And I am in the 'Development Use Only' area
    And the 'Resources - Preset Auto-Focal' setting is currently enabled
    When I disable the 'Resources - Preset Auto-Focal' toggle switch
    Then Auto-focal tickets associated with this project should become disabled
    And Auto-focal settings should not be available on the platform
```

## AC 2
```
Feature: Manage Auto-Focal Setting in MCP

  Scenario: Verify 'Resources - Preset Auto-Focal' setting exists and is a toggle
    Given an IB team member is logged into MCP
    When they navigate to the 'Development Use Only' section
    Then they should see a setting labeled 'Resources - Preset Auto-Focal'
    And this setting should be a toggle switch

  Scenario: Enabling 'Resources - Preset Auto-Focal' makes Auto-Focal features available for the current project
    Given an IB team member is logged into MCP
    And the 'Resources - Preset Auto-Focal' setting is currently disabled in the 'Development Use Only' section
    And there are Auto-Focal related features or settings configured for the current project
    When the IB team member enables the 'Resources - Preset Auto-Focal' toggle switch
    Then Auto-Focal features and settings should become available on the platform for the current project

  Scenario: Disabling 'Resources - Preset Auto-Focal' makes Auto-Focal features unavailable for the current project
    Given an IB team member is logged into MCP
    And the 'Resources - Preset Auto-Focal' setting is currently enabled in the 'Development Use Only' section
    And Auto-Focal features and settings are currently available on the platform for the current project
    When the IB team member disables the 'Resources - Preset Auto-Focal' toggle switch
    Then Auto-Focal features and settings should no longer be available on the platform for the current project

  Scenario: Auto-Focal features remain unavailable when setting is disabled and no features exist
    Given an IB team member is logged into MCP
    And the 'Resources - Preset Auto-Focal' setting is currently disabled in the 'Development Use Only' section
    And there are no Auto-Focal related features or settings configured for the current project
    When the IB team member attempts to access Auto-Focal features
    Then Auto-Focal features and settings should remain unavailable on the platform for the current project
```

