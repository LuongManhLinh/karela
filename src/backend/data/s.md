# This must be the title

## ID: 1

### User Story:

As a user, I want to enable image tagging from the Asset Intelligence section in the MCP settings

### Requirements:

1. A new MCP setting is to be created under the Asset Intelligence section for Image Tagging (Azure). We may try any tie some of the existing Imagga settings later but for now we’ll keep seperate.
2. Under Enable Video / Audio Tagging: there needs to be a new setting called Enable Image Tagging
3. All Image Tagging Capabilities and categories will be dependant on this setting
4. If this setting is enabled, then the platform should ignore any Imagga functionality and use Azure only
5. Underneath the setting Azure Video Processing Limit (per billing cycle): there needs to be a new setting called Azure Image Processing Limit (Images) (per billing cycle):
6. While we’re here, change Azure Video Processing Limit (per billing cycle): to Azure Video Processing Limit (minutes) (per billing cycle):
7. Any Azure functionality and tickets worked on in this project should be tied to the Enable Image Tagging setting

### Manual Scenario:

- Scenario: Verify the MCP setting
- Given I am an admin
- When I go to MCP setting
- Then I can see a new MCP setting called "Enable Image Tagging:" is available under Asset Intelligence section -> Enable video / Audio Tagging
- And I can see a new setting under asset intelligence as "Azure Image Processing Limit (Images) (per billing cycle):"
- And I can see Azure Video Processing Limit (per billing cycle): is changed to Azure Video Processing Limit (minutes) (per billing cycle):

## ID: 2

### User Story:

As an IB team member, I want to be able to enable an Auto-Focal setting in MCP so that I can control all the settings from one place.

### Requirements:

1. We need an MCP feature flag/setting called “Resources - Preset Auto-Focal” in the Development Use Only area. If this setting is enabled then any Auto-focal tickets as part of this project become enabled, if disabled then no Auto-focal settings should be available on the platform.
2. A setting called “Resources - Preset Auto-Focal” must be created in the Development Use only area of the MCP. 
3. The setting must be a toggle switch that can be enabled and disabled as needed. 
4. When enabled, any Auto-focal tickets as part of this project must become enabled. 
5. When disabled, no Auto-focal settings should be available on the platform. 

### Manual Scenario:

- Scenario: Verify Focal point related MCP setting availability
- Given I am an admin or a participant who is in the platform setting tab on MCP
- When I check for “Resources - Preset Auto-Focal”
- Then I can see this setting under development only area
- When I try to enable/ disable the setting
- Then I can click and unclick

# This is the second one

haha

### what

haha what

#### eeee

## haha
