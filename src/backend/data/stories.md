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

## ID: 3

### User Story:

As an IB team member, I want to be able to enable a GIF/Lottie setting in MCP so that I can control all the settings from one place

### Requirements:

1. We need an MCP feature flag/setting called “Resources - GIF/Lottie Preview Support” in the Development Use Only area. If this setting is enabled then any tickets as part of this project become enabled, if disabled then no GIF/Lottie preview features should be available on the platform.
2. Lottie general file support can be independent if needed
3. A setting called “Resources - GIF/Lottie Preview Support” should be created in the Development Use only area of the MCP. 
4. The setting must be a toggle switch that can be enabled and disabled as needed. 
5. When enabled, any GIF/Lottie Preview tickets as part of this project must become enabled. 
6. When disabled, no GIF/Lottie Preview settings should be available on the platform.

### Manual Scenario:

- Scenario: Verify GIF/Lottie Preview Support related MCP setting availability
- Given I am an admin or a participant who is in the platform setting tab on MCP
- When I check for GIF/Lottie Preview Support
- Then I can see this setting under development only area
- When I try to enable/ disable the setting
- Then I can click and unclick

## ID: 4

### User Story:

As a user, I want to be able to upload a GIF and have it automatically converted into a MP4 file so that I can view it in the previewer.

### Requirements:

1. GIFs uploaded to the platform should be converted to MP4s so that they can be viewed in the previewer.
2. We need to convert uploaded GIFs to MP4s, which can then be viewed in the previewer.
3. When a user uploads a GIF, the GIF should be converted into an MP4 using the library recommended
4. The conversion should be done with the highest quality available, to ensure that the resulting MP4s have the same quality as the original GIFs.
5. The MP4 needs to be stored along side the original GIF as we may use the MP4 in other places like Approvals

### Manual Scenario:

- Scenario: Verify the preview of the uploaded GIF file
- Given I am an Admin
- When I upload GIF file
- And I preview the GIF file
- Then I able to see it as a MP4
- And I can see the same quality is there for MP4 like the original file

## ID: 5

### User Story:

As a user, I want to be able to upload a Lottie File and have it automatically converted into a MP4 file so that I can view it in the previewer.

### Requirements:

1. Lottie Files uploaded to the platform should be converted to MP4s so that they can be viewed in the previewer.
2. We need to convert uploaded Lottie to MP4s, which can then be viewed in the previewer.
3. When a user uploads a Lottie File, the Lottie should be converted into an MP4 using the library recommended: https://intelligencebank.atlassian.net/browse/IB-36794
4. The conversion should be done with the highest quality available, to ensure that the resulting MP4s have the same quality as the original Lottie Files.
5. The MP4 needs to be stored along side the original Lottie as we will use the MP4 in other places like Approvals

### Manual Scenario:

- Scenario: Verify the preview of the uploaded Lottie file
- Given I am an admin
- When I upload Lottie file
- And I preview the Lottie file
- Then I am able to see it as a MP4
- And I can see the same quality is there for MP4 like the original file

## ID: 6

### User Story:

As a user, I want to be select a Preset that has auto-focal enabled, on multiple images from the Bulk Download Screen, so that the cropping can occur on the focal point of the image.

### Requirements:

1. When a user downloads images with presets applied through bulk download, some Presets may have Auto-focal enabled. If a Preset is selected that has Auto-focal enabled, the system should automatically detect the focal point of each image and crop accordingly with the crop being centered on the focal point.
2. If a user is in the Bulk Download screen and has selected a Global Preset (from the transformation page) that has Auto-focal enabled, then when downloading the images:
3. The download should proceed as normal
4. The system should detect the focal point of each image as per this eng ticket: https://intelligencebank.atlassian.net/browse/IB-36982
5. The crop area should be centered on the focal point.
6. If the crop area overhangs the dimensions of the image then it needs to be centered as close as possible to the focal point but also needs to be kept
7. The processed image (with any crop centered on the focal point) should download in the Zip like normal with any other resources selected for Bulk Download

### Manual Scenario:

- Scenario: Verify auto focal option availability on Bulk Download
- Given I am an admin
- When I navigate to the resource page
- And I select a couple of images
- And I select Download from bulk action dropdown
- And select a preset where focal point is available
- And download the files
- Then I can see the download is working fine in as normal way
- And The system should detect the focal point of each image
- And The crop area should be centred on the focal point.
- When the crop area overhangs the dimensions of the image
- Then it needs to be centered as close as possible to the focal point but also needs to be kept
- And The processed image (with any crop centred on the focal point) should download in the Zip like normal with any other resources selected for Bulk Download

## ID: 7

### User Story:

As a user, I want to be able to preview the GIF or Lottie File converted MP4 on the Info Preview screen so that I can preview what the animation is like before I download it

### Requirements:

1. The Info Preview Screen should include a converted MP4 from either the GIF or Lottie file. This MP4 should auto-play, have the video controls hidden and be on a loop.
2. When a user is on the Info Preview page and the file type is a GIF or Lottie, then:
3. The Previewer should be displaying the converted GIF or Lottie file MP4
4. All other components and actions on the Info Preview screen should remain the same as if it was a GIF or Lottie file.
5. Download should download the GIF or Lottie file
6. File type metadata fields and the like should show GIF/Lottie
7. Version file type should be GIF/Lottie

### Manual Scenario:

- Scenario: Verify the preview page of the uploaded GIF and Lottie file
- Given I am an admin
- When I upload Lottie and GIF file
- And I preview the Lottie file
- Then Previewer should display the converted GIF or Lottie file MP4
- And Download should download the GIF or Lottie file with the same extension
- And The file type of metadata fields should be GIF/Lottie
- And The Version file type should be GIF/Lottie
- And The video controls should not appear
- And The slider should not appear
- And The video should loop continuously
- And The video should autoplay
- And The left and right keyboard arrows should not interact with the video

## ID: 8

### User Story:

As a user, I want GIF/Lottie file to have the first frame as the Thumbnail Preview (PNG)

### Requirements:

1. GIF and Lottie files should have a static image as their thumbnail.
2. GIF and Lottie files should have a static png image as their thumbnail icon. This appears in the following locations
   Resource List View
   Resource Mosaic View
   Versions
   Alias
   Similar
   Dashboard List
   Approvals List
   Collections

### Manual Scenario:

- Scenario: Verify the Thumbnail view of GIF and Lottie file
- Given I am an admin
- When I upload Lottie and the GIF file
- And I check the thumbnail of the file on the following pages
-     Resource List View
-     Resource Mosaic View
-     Versions
-     Alias
-     Similar
-     Dashboard List
-     Approvals List
-     Collections
- Then I can see that the Thumbnail is static

## ID: 9

### User Story:

As a user, I want to be able to preview the GIF or Lottie File converted MP4 on the Share screen so that I can preview what the animation is like before share it

### Requirements:

1. Users should see the preview of the GIF or Lottie File converted MP4 on the Share screen. This should help users to preview the animation before deciding to share it.
2. As a user on the share/embed screen:
3. The preview should show the GIF or Lottie File converted MP4.
4. The controls should be hidden
5. The MP4 should autoplay

### Manual Scenario:

- Scenario: Verify the GIF and Lottie file preview on the share screen
- Given I am an admin
- When I upload Lottie and GIF file
- And I click on share
- Then The file should have converted to MP4
- And The controls should be hidden
- And The MP4 should autoplay

## ID: 10

### User Story:

As a user, I want to be able to preview the GIF or Lottie File converted MP4 on the Edit screen so that I can preview what the animation like before I Edit or upload a new version

### Requirements:

1. Users should see the preview of the GIF or Lottie File converted MP4 on the Edit/New Version screen. This should help users to preview the animation while editing
2. As a user on the Edit/New Version screen
3. The preview should show the GIF or Lottie File converted MP4.
4. Edit uses PDFTron
5. The controls should be hidden
6. The MP4 should autoplay

### Manual Scenario:

- Scenario: Verify the GIF and Lottie file preview on the Review Request screen screen
- Given I am an admin
- When I upload Lottie and GIF file
- And navigate to the workflow page
- And I click on Review Request
- Then The file should have been converted to MP4
- And The controls should be hidden
- And The MP4 should autoplay

## ID: 11

### User Story:

As a user, I want to be able to preview the GIF or Lottie File converted MP4 on the Review Request screen in Approvals so that I can preview what the animation is when approving

### Requirements:

1. Users should see the preview of the GIF or Lottie File converted MP4 on the Review Request Tab of the Approvals Screen. This should help users to preview the animation while approving
2. As a user on the Review Request Tab
3. The preview should show the GIF or Lottie File converted MP4.
4. Approvals uses PDFTron
5. The controls should be hidden
6. The MP4 should autoplay

### Manual Scenario:

- Scenario: Verify the GIF and Lottie file preview on the edit screen
- Given I am an admin
- When I upload Lottie and GIF file
- And I click on edit/new version
- Then The file should have converted to MP4
- And The controls should be hidden
- And The MP4 should autoplay

## ID: 12

### User Story:

As a user, I want to be able to preview the GIF or Lottie File converted MP4 on the Versions/Revisions Screen so that I can preview what the animation is before adding a version/revision

### Requirements:

1. Users should see the preview of the GIF or Lottie File converted MP4 on the Version OR Revision Tab of the Approvals Screen. This should help users to preview the animation while approving
2. As a user on the Version or Revision Tab
3. The preview should show the GIF or Lottie File converted MP4.
4. Approvals uses PDFTron
5. The controls should be hidden
6. The MP4 should autoplay

### Manual Scenario:

- Scenario: Verify the GIF and Lottie file preview on the Markup Screen in Approvals
- Given I am an admin
- When I upload Lottie and the GIF file
- And navigate to the Markup Screen in Approvals
- Then The file should have converted to MP4
- And The controls should be hidden
- And The MP4 should autoplay

## ID: 13

### User Story:

As a user, I want to be able to see the GIF or Lottie File converted MP4 on the Markup Screen in Approvals so that I can markup the animation to get feedback and new revisions worked on

### Requirements:

1. Users should see the preview of the GIF or Lottie File converted MP4 on the MArkup Tab of the Approvals Screen. This should help users to preview the animation while markup/approving
2. As a user on the Markup Request Tab
3. The preview should show the GIF or Lottie File converted MP4
4. Approvals uses PDFTron
5. It should use the converted original video
6. All functionality here should be the same as if it was a MP4 file
7. The controls from PDFtron should be visible
8. Users should be able to markup as if it was an Mp4

### Manual Scenario:

- Scenario: Verify the GIF and Lottie file preview on Version/Revision screen
- Given I am an admin
- When I upload Lottie and GIF file
- And navigate to the Version/Revision screen
- Then The file should have been converted to MP4
- And The controls should be hidden
- And The MP4 should autoplay

## ID: 14

### User Story:

As a Database Manager, I want to Allow End users to overide default and change names

### Requirements:

1. In Configure Auto-Created Records, an option appears called “Allow User updates to Titles upon creation”
2. When it is enalbed, then click on Confirm, then click on Save & Close, click back on the Lookup Grid, Click on Configure Button, we should see it is enabled
3. When it is enable, the Confirm button is enabled even some/all fields are blank
4. If enabled, then end user component will always appear
5. If disabled, then end user component will not appear

### Manual Scenario:

- Scenario: Configure overlay - Allow User updates to Titles upon creation enabled
-       Given I have the Configure overlay open
-       And I have 'Allow User updates to Titles upon creation' enabled
-       When I have a text field empty
-       Then the 'Confirm' button will still be enabled

## ID: 15

### User Story:

As a user, when no custom configs are enabled, and no workflow on parent, I see no pop-up and child records are created

### Requirements:

1. When Allow User updates to Titles upon creation checkbox is disabled in the form builder config, then end user cannot update title names at time of creation and so they see no overlay with that option
2. Instead, the flow for the user in this scenario is the same as if the new feature is not enabled (ie, record is Saved)
3. Info Snackbar in this scenario appears to confirm child record creation is in progress:
4. Text TBC, draft: Linked Records are being created. Click here to open linked database.
5. Snackbar to appear after record creation snackbar in terms of stacking/ordering
6. Future state may be another snackbar to confirm when all child records have been created
7. When no workflow request is requested for parent, then Child records are therefore processed/created immediately after parent is saved

### Manual Scenario:

- Scenario: Save non-workflow record with 'Allow User updates to Titles upon creation' disabled
-       Given I have filled out a record with no validation errors
-       And the database has no workflow attached to it
-       And it contains a lookup grid with 'Allow User updates to Titles upon creation' disabled
-       When I click Save/Submit
-       Then there will be no popup overlay
-       And the record will be saved and closed
-       And the child records will be created

## ID: 16

### User Story:

As a user, when parent record undergoes publish approval process, child records are only created when parent is approved

### Requirements:

1. When parent record is sent for approval, and is approved, then the child records are created
2. No snackbar is needed in this scenario, (as that would show to last reviewer user who approves, and who may not need to know child records are created.
3. This occurs on request status becoming ‘Approved ' - ie: not when a single Reviewer 'Approves’ in the scenarios where more than 1 approval is required, and also not when the first stage of a multi-staged request is approved.
4. This can occur, theoretically, months after the record was submitted. ie, if submitted in March 2023 but not approved until June 2023, then child records will be created in June
5. This can also occur when Auto-Complete is enabled on the parent database workflow, in which the ‘delay’ time will be be very minimal when it successfully gets auto-completed (assumed this will occur almost immediately after submit)
6. If record publish is conditionally auto-completed, then:
7. If single stage workflow then child records will be auto-created upon successful auto-complete of parent record
8. If first stage of a staged workflow then delay creation of child records will be enacted, since this only completed the first stage of the request
9. Creator of the child records is the creator of the parent record, not the approver of the publish workflow request.

### Manual Scenario:

- Scenario: Child record creation for approved publish approval records
-       Given I have a database with a workflow
-       And it has a lookup grid with auto create child records enabled
-       When I click submit the workflow request
-       Then the workflow request will be created
-       And the child record will not be created
-       When I approve the workflow request
-       Then the child records will be created
-       Scenario                             | Result
-       Single approved                      | Child record created
-       Stage 1 approved                     | Child record not created
-       Stage 2 approved (final stage)       | Child record created
-       Single conditionally auto-completed  | Child record created
-       Stage 1 conditionally auto-completed | Child record not created

## ID: 17

### User Story:

As a user, I want to see snackbars when submitting/ saving parent record to let me know children will be created

### Requirements:

1. When auto-create child records is enabled, then for both scenarios where end user sees no config and when they do, we display the below variants to current snackbars:
2. profiler.profiler.recordSubmittedPublished - {record} submitted for approval
   Variant when Child records are delayed created:
   {record} submitted for approval. Linked {record(s)} will be created in the {database name} when this {record} is approved.
   {record} = dynamic name from parent database (current behaviour)
   {record(s)} = dynamic single name from child database with (s) on the end to denote could be single or multiple
   {database name} = name of child database
3. profiler.profiler.recordSubmitted - {record} submitted
   Variant when Child records are to be created right away (no delay):
   {record} submitted. Linked {record(s)} are being created in the {database name}.
4. profiler.profiler.recordSubmittedPublishedWithAutoFolder - {record} submitted for approval. Auto-created Folders will be created once approved
   Variant when Child records are to be created on delay, along with ACFs
   {record} submitted for approval. Auto-created Folders and linked {record(s)} will be created once approved
   {record(s)} = dynamic single name from child database with (s) on the end to denote could be single or multiple
5. profiler.profiler.recordSubmittedWithAutoFolder - {record} submitted and Auto-Created Folders are being created. Folders may take a few minutes to appear
   Variant when Child records are to be created right away, along with ACFs:
   {record} submitted. Linked {record(s)} and Auto-Created Folders are being created. Folders may take a few minutes to appear
   {record(s)} = dynamic single name from child database with (s) on the end to denote could be single or multiple

### Manual Scenario:

- Scenario: Snackbar on save/submit parent record
-       Given I have a database with a lookup grid that has auto create child records enabled
-       When I save/submit the record
-       Then the following snackbar message will appear based on the scenario
-
-       Workflow Request | Auto Create Folder | Message
-       No               | No                 | '{record} submitted. Linked {record(s)} are being created in the {database name}.'
-       Yes              | No                 | '{record} submitted for approval. Linked {record(s)} will be created in the {database name} when this {record} is approved.'
-       No               | Yes                | '{record} submitted. Linked {record(s)} and Auto-Created Folders are being created. Folders may take a few minutes to appear'
-       Yes              | Yes                | '{record} submitted for approval. Auto-created Folders and linked {record(s)} will be created once approved'

## ID: 18

### User Story:

As a Database Manager, I want to allow end users to Add More child records ('Add More')

### Requirements:

1. In the Configure Auto-Created Records overlay in the form builder, a setting called Allow User to Add More {Recordcustomnameplural} is to be added
   Checkbox value
   Disabled by default
2. To appear under the Allow User updates to Titles upon creation setting
3. Current field name above but note this setting name will be updated.
   {Recordcustomnameplural} = dynamic plural custom name of Child Database records
4. Help tooltip to say:
   “If selected, users will be able to add more {Record} Titles (Names) to be created alongside those configured here. Up to 30 {Records} can be created.”
   {record} = dynamic singular custom name of Child Database record
   {records} = dynamic plural custom name of Child Database record

### Manual Scenario:

- Scenario: 'Allow User to Add More' setting
-       Given I am in the Configure Auto-Created Records overlay
-       Then a new setting named 'Allow User to Add More {Recordcustomnameplural}' will appear under the Allow User updates to Titles upon creation setting
-       And it will be disabled by default
-       And it will have a help tip with the text "If selected, users will be able to add more {Record} Titles (Names) to be created alongside those configured here. Up to 30 {Records} can be created."

## ID: 19

### User Story:

As a Database Manager, I want to allow end users to Add More child records ('Add More') - Handle maximum child records

### Requirements:

1. Configure Auto-Created Records overlay in the form builder, a setting called Allow User to Add More {Recordcustomnameplural} was added
2. While 30 is maximum total number of child records, we will keep this field ‘Allow User to Add More {Recordcustomnameplural}’ enabled / clickable even if 30 exist in config, since end users can potentially remove non-mandatory ones (which would then let them add more)
3. If however 30 exist in config and ALL 30 are disabled for ‘Allow User to skip…’ then we de-select + disable this field. This is because in this scenario end user cannot add more.
4. Disabled state hover updates to:
   The max 30 {{Records}} has been added here. Remove any of the above to allow users to add more.
   {{Records}} here = child custom record plural name

### Manual Scenario:

- Scenario: 'Allow User to Add More' setting with 30 records
-       Given I am in the Configure Auto-Created Records overlay
-       When I add 30 records
-       And 1 of those records has 'Allow User to skip…’ enabled
-       Then I can enable 'Allow User to Add More'
-       When I disable 'Allow User to skip…’ on the last record
-       Then 'Allow User to Add More' is disabled
-       And if I hover over the setting I see the text 'The max 30 {{Records}} has been added here. Remove any of the above to allow users to add more.'

## ID: 20

### User Story:

As a user, if child database has been edited and title field is no longer a valid text field, then users do not see a end user config pop-up overlay and no child records are created

### Requirements:

1. Assuming original Auto Create setting is successfully saved in the parent - if then a Database Manager user updates the child Form Builder and changes the title field to a non-text field, then the below will occur for end users:
   A) In scenarios where end user config should display, we will no longer display due to ‘broken’ config.
   This means that no child records are created, no snackbar error messaging is needed (current behaviour)
   B) In scenarios where end user config does not currently display (no end user customisation is enabled) :
   No child records are created, no snackbar error messaging is needed (current behaviour)

### Manual Scenario:

- Scenario: Change title field to invalid title after config
-       Given Auto Create Child Records is set up correctly
-       When I Save/Submit a record
-       Then the end user overlay appears
-       When I change the title field in the child record to a non-text field
-       And I Save/Submit a record in the parent database
-       Then the end user overlay does not appear
-       When I submit the record
-       Then no snackbar appears with the text that child records are being created
-       And no child records are created

## ID: 21

### User Story:

As a user, I can deselect items to not apply bulk changes to

### Requirements:

1. Resources that are de-selected will not have any changes applied when Bulk ‘Apply to Selected’ is selected (that have not been previously correctly applied in previous Bulk 'Apply to Selected’ action, ie:
2. If new data is entered in bulk Main Details, Tags, Filters, Custom Upload Fields, and/or Workflows and then 'Apply to Selected’ is selected, then only selected resources will get the eligible updates (de-selected resources will not)

### Manual Scenario:

- Scenario: Deselecting Items No Changes Applied
-     Given user is on bulk edit page
-     And user made new changes in bulk for Main Details,Tags, Filters, Custom Upload Fields
-     And user selects multiple resources to apply bulk changes
-     And then user decides to deselect some resources from the selection
-     When user clicks on the 'Apply to Selected' button
-     Then only selected resources should get eligible updates
-     And deselected resources should not have any changes applied
-     And the global data updates should be applied only to the selected files
-     And user see 'Apply to Selected' button count should be updated according to the selected files

## ID: 22

### User Story:

As a user, I want to see exclusion message / handling for non-supported file types should I select any to Bulk Edit, on Bulk edit screen

### Requirements:

1. Snackbar needs updating to new global component as part of this ticket
   import { useGlobalSnackbar } from 'hooks/useGlobalSnackbar';
   use stacking snack bar
2. Snackbar text also needs updating in this scenario:
   CURRENT: “X {{ResourcesPlural}} are not available as you do not have permission to Edit them” ← is not correct when we exclude non-supported file types like URLs
   UPDATED TEXT: “X {{ResourceSingle}}/s are not supported for Bulk Edit.”
   {{ResourceSingle}} is dynamic name for single Resource as per Admin > Module config
   X = number of excluded resources
3. Non-supported file types include:
   W2P
   URL
   Remote File
   Alias
   Checked Out resource (that current user cannot edit)

### Manual Scenario:

- Scenario: Verify Exclusion Message for Non-Supported Resources
-     Given user is on the resource file page
-     And user Select Multiple Resources supported and non-supported to Edit
-     When the User Click On Select Bulk Action popup
-     Then the bulk edit operation should be prevented on non-supported resources
-     And user can see snack bar with message:X (ResourceName/s) are not supported for bulk edit
-     And X represent number of excluded resources

## ID: 23

### User Story:

As a user, I want to see an Exit without saving warning when I try to leave the Bulk Edit Page/Process

### Requirements:

1. If a user opens Bulk Edit, and then clicks Exit/Cancel, we will assume a change has been made somewhere in the process - data added on bulk page, or single view edit made - and so we will always show an abandon pop-up similar to Bulk Upload > Exit/Cancel
2. Pop-up Title: ‘Exit without saving {{ResourcesPlural}}’
3. Pop-up Text: If you click the Exit button, none of the {{ResourcesPlural}} currently on your Bulk Edit screen will be updated. To Save your Edits, Cancel this popup and click Save Changes.’
4. Pop-up buttons:
   Cancel - Returns user to the Bulk Edit page
   Exit - Exits user and returns them to the folder

### Manual Scenario:

- Scenario: Exit Without Saving Warning in Bulk Edit
-     Given user is on bulk edit page
-     When user clicks on the Exit/Cancel button
-     Then pop should appear with the title "Exit without saving {{ResourcesPlural}}"
-     And pop should display the message:
-       | If you click the Exit button, none of the {{ResourcesPlural}} currently on your Bulk Edit
-       | screen will be updated. To Save your Edits, Cancel this popup and click Save Changes
-     And pop should have two buttons: Cancel and Exit
-     When user clicks on cancel
-     Then user returns to bulk edit page
-     When user clicks on the exit
-     Then user returned to the folder

## ID: 24

### User Story:

As a user, I want to Filter within my selected Resources on my Bulk Edit page (Left Panel Resource selection updates)

### Requirements:

We consolidate the above into new options, with handling still accounted for on the single views
ie: instead of ‘Virus Detected’ and ‘Duplicate’ and ‘Field Errors’ we just have a generic ‘Errors’ filter for Bulk Edit, different from Bulk Upload. This means we will only have below options:
Processing Completed
Upload Processing
Errors

### Manual Scenario:

- Scenario: Verifying Filter Option
-       Given user is on bulk edit page with selected resources
-       When user clicks on the filter dropdown
-       Then user can see the dropdown option: "Processing Completed", "Upload Processing", "Errors"
-       When user clicks on error option
-       Then the list of selected resources should be filtered to display only those with errors
-       And displaying X of Y label should update to show the number of resources displayed after filtering

## ID: 25

### User Story:

As a user, in Single edit from Bulk view, I want to see a Duplicate warning when relevant

### Requirements:

Scenario 1:
On Bulk Edit > Single View page, when a file/version is added that already exists on the platform, a pop-up/dialog box displays and the page below will be generally otherwise be in disabled mode (user cant click buttons under pop-up below the menu, and page below pop-up has a partially grey transparency - matches Bulk Upload behaviour)
Underneath this pop-up the loading bar is red with error icon displaying
The Pop-up design is to generally follow existing Bulk Upload > Single view:
Header: Duplicate File
Body text: This File has previously been uploaded in the locations listed below. You can Continue creating a new entry of the same file or Skip uploading the item. No additional storage is used if you Continue. To link the {{ResourceSingle}} to an existing file, Skip the upload and create an Alias instead.
‘Folder(s)’: Lists folders where the duplicate exists. Folder name is a link that opens in a new tab
If current user does not have permission to see the folder, then instead of that folder name the user sees “N/A - you do not have access to this folder”
(Negative scenario check): ‘Apply Selection to all Uploads’ - checkbox → this field/option is excluded here (does exist for Bulk Upload scenario)
Buttons: Skip (no hover tooltip)
If skip is selected, then pop-up closes and the Resource name and preview is reverted to previous file/version on the open single page
Continue (no hover tooltip) - If continue is selected, then pop-up is closed, and the red loading line turns green like a normal successful upload

Scenario 2:
On Bulk Edit > Single View page, if user was able to return to list view before the duplicate warning displayed, then behaviour follows bulk upload list view:
Error icon displays: (below is from bulk upload for reference)
Hover tooltip text: 'This file cannot be uploaded as errors have been detected with the file. Click the Error or Edit icon to resolve these issue(s)
Save button is still enabled when at least one other selected resource in the list has no errors. The actual save processing bypasses the error resource (ie, that resource in the list temporarily ‘greys out’ (is disabled) during save but remains in the list after other resources are potentially saved. Refer to Bulk edit for reference for this handling.)
Bulk Apply still works while resource is in error
When user clicks either icon, then the pop-up displays on the open single page in line with previous scenario

Scenario 3:
If Scenario 2 occurs for multiple resources in the same list, (when user is able to return to list view before seeing pop-up on single pages) they will see multiple relevant Resources with the error icon in the list as per Scenario 2

### Manual Scenario:

- Scenario: Duplicate Warning
-     Given user is on bulk edit single view page
-     When new file/version is added that already exists on the platform
-     Then pop up dialog box should appear
-     And page below the pop up should generally be disabled
-     And underneath the popup, red loading bar with an error icon should be displayed
-     And pop up design should match bulk upload single view
-     And pop up should have 'skip' and 'continue' buttons
-     When user click on 'skip'
-     Then pop up should close
-     And resource name and the preview should be reverted to previous file/version on the single page
-     When user click on 'continue'
-     Then pop up should close
-     And red loading line should turn green, indicating a successful upload

## ID: 26

### User Story:

As a user, in the folder filter, I can see all folders that relate to the selected Resources in the filter

### Requirements:

1. To provide users with a clear and relevant view of folders, the Cross-Folder Support feature shall display all folders that relate to the selected resources in the folder filter.
2. The folder filter shall dynamically populate with all folders that are relevant to the selected resources in List View
3. Users shall be able to select specific folders from the filter to narrow down the list of displayed resources.

### Manual Scenario:

- Scenario: Verify Folder Selection
-     Given user is on bulk edit page with multiple resources from different folder
-     And filter dropdown display next to search at the top left hand panel
-     And default value is all
-     When user click into dropdown
-     And select multiple folder from dropdown
-     Then user can see selected folders in dropdown
-     And user can see resources coming from selected folder in left panel

## ID: 27

### User Story:

As a user, I want to see existing Status column containing all current data

### Requirements:

Status column displays by default to the right of the Request Details column, and left of Workflow Name/Type column

Column name: ‘Status’

Status chips:

This is the current Status of the Workflow Request.

Value displays in a Color chip.

Color of chips to be updated as part of this ticket - refer to designs. It is known that this will create FUTURE work later to update chips in other locations when we get closer to launch

Options:

Pending

Approved

Declined

Reviewed

Cancelled

As per current behaviour, Deletion of source items can cause auto-cancellations as well as manual cancels. There’s other scenarios also such as the Requester editing an item that is in pending approval (Resource/record/response) and re-saving a pending record as draft, and if a requester submits a download approval request for am item they already have a request for the same item on. (In some of these scenarios, the original request may be changed to Cancelled even if completed.) We will just follow all existing cancel logic for now.

### Manual Scenario:

- Scenario: Status column - Colors
-
-       Given I am on the new V3+ workflow page
-       And I have a workflow request in 'Approved'
-       Then the status chip will be Green
-
-       Given I am on the new V3+ workflow page
-       And I have a workflow request in 'Pending'
-       Then the status chip will be Yellow
-
-       Given I am on the new V3+ workflow page
-       And I have a workflow request in 'Declined'
-       Then the status chip will be Red
-
-       Given I am on the new V3+ workflow page
-       And I have a workflow request in 'Cancelled'
-       Then the status chip will be Red
-
-       Given I am on the new V3+ workflow page
-       And I have a workflow request in 'Reviewed'
-       Then the status chip will be Green

## ID: 28

### User Story:

As a User, I want to see and create a new page type: Simple Page (from pop-up)

### Requirements:

1. Be able to select / click on the creation pop-up and see the new page type: “Simple Page“ after the Simple Page Builder MCP setting is enabled
2. Details should be accurately in line with Design

### Manual Scenario:

- Scenario: Viewing "Simple Page" Option in the Creation Pop-up After MCP Setting is Enabled
- Given the Simple Page Builder MCP setting is enabled
- When the user opens the creation pop-up
- Then the user should be able to see "Simple Page" as a new page type option
- And the details should be accurately displayed in line with the design

## ID: 29

### User Story:

As a user, once approved/declined, I would like to see the updated request status in the Grouped Approval Review Page

### Requirements:

1. Once user responds, the following info may update against individual request(s) on the page

- Request Status
- X more
- Waiting On
  2.Needed until (as per Request List, this changes to ‘Approved until’ once approved and updated value if changed by responders)

### Manual Scenario:

- Scenario: Request details update after user responds
- Given I am viewing a request list page
- And there is a request with the following initial details:
-     | Request Status | Pending     |
-     | X more        | 2           |
-     | Waiting On    | John Smith  |
-     | Needed until  | 2025-03-01  |
- When the user "John Smith" approves the request with a new end date "2025-03-15"
- Then the request details should update to show:
-     | Request Status | Approved           |
-     | X more        | 1                  |
-     | Waiting On    | Jane Doe           |
-     | Approved until| 2025-03-15         |

## ID: 30

### User Story:

As a user, once any requests have been updated, I would like to see group approval list with updated waiting on + status for the completed group approval.

### Requirements:

1. If request has been updated be reviewer, the Grouped request into in the Grouped List will update accordingly:
2. Includes Waiting On reviewer info, to remove reviewer if they have responded to all individual requests
3. Includes overall grouped status change to Completed, if reviewer’s response actions completed all requests within the group

### Manual Scenario:

- Scenario: Grouped request updates when reviewer completes all assigned requests
- Given I am viewing the Grouped List page
- And there is a grouped request "Travel Approvals - Q1" with:
-     | Overall Status | In Progress       |
-     | Waiting On     | Sarah Jones, John Smith |
- And the grouped request contains 2 individual requests assigned to "Sarah Jones":
-     | Request ID | Status   | Reviewer    |
-     | REQ-001   | Pending  | Sarah Jones |
- When "Sarah Jones" approves request "REQ-001"
- And "Sarah Jones" approves request "REQ-002"
- Then the grouped request "Travel Approvals - Q1" should update to show:
-     | Overall Status | Completed     |
-     | Waiting On    | John Smith    |
- And "Sarah Jones" should no longer appear in the Waiting On list
- And the individual requests should show:
-     | Request ID | Status   | Reviewer    |
-     | REQ-001   | Approved | Sarah Jones |

## ID: 31

### User Story:

As a user, I want on close of Single view redirect to Grouped Approval Review page (don't clear out single page response values)

### Requirements:

1. When a user has entered any response info on a single response page and then returns to the List view, those details (comment/response/approved until values) are retained as long as the overall Grouped Review Page is open (As soon as user closes the overall overlay we no longer store this info)
2. This means, if user re-opens that single view, their response details remain

### Manual Scenario:

- Scenario: Retaining single view response details on close
- Given I have opened a single response page within a Grouped Approval Review
- And I have entered response information on the single response page
- When I close the single response page and return to the Grouped Approval Review list view
- Then the response details I entered on the single response page should be retained
- And if I reopen the same single response page, the previously entered details should still be present

## ID: 32

### User Story:

As a user, I want to be able to click Submit Selected & Continue (Bulk)

### Requirements:

1.Submit & continue button submits the selected requests 2. Page remains open, requests remain on left page 3. When submit is clicked, disable handling for actions/buttons kicks in
4.vBlue Info Snackbar shows on submit: 5. Content: “Submitting Response(s)”  
6. Green Snackbar handling on successful submit of 1+ items 7. Content: “{{X}} Responses submitted” 8. {{X}} = number of successful responses, excluding any that failed validation

### Manual Scenario:

- Scenario: Submit multiple responses while staying on the page
- Given I am on the Grouped Review page
- And I have selected 3 requests:
-     | Request ID | Status   |
-     | REQ-001   | Pending  |
-     | REQ-002   | Pending  |
- And I have entered valid responses for "REQ-001" and "REQ-002"
- And I have entered an invalid response for "REQ-003"
-
- When I click the "Submit & Continue" button
- Then the "Submit & Continue" button should be disabled
- And the "Apply to Selected" button should be disabled
- And a blue info snackbar should appear with message "Submitting Response(s)"
-
- When the submission process completes
- Then a green snackbar should appear with message "2 Responses submitted"
- And the submission buttons should be re-enabled
- And the requests should remain visible in the left panel
- And requests "REQ-001" and "REQ-002" should show status "Approved"
- And request "REQ-003" should show validation errors
- And I should remain on the Grouped Review page

## ID: 33

### User Story:

As a User, I want to Rename due to a typo via input field on Training Centre

### Requirements:

1. Be able to see "Rename" action icon
2. Be able to see tooltips while hovering on the 'Rename' icon
3. Tooltips: “This action will allow you to rename the name associated with this face. The change will apply to this image as well as all other images with the same name.“
4. Be able to click on "Rename" and input to update the name for recognised face
5. Be able to see the confirmation popup and click on 'Confirm' to proceed the updating the new name and save to the same person
6. Be able to, then, see the “Update“ button and eventually to click on and confirm the final remaining step, where the new name will be saved to the same person

### Manual Scenario:

- Scenario: Rename a recognized face with confirmation steps
- Given I am viewing a photo with recognized faces
- And there is a face tagged as "John Smith"
- Then I should see a "Rename" icon next to "John Smith"
- When I hover over the "Rename" icon
- Then I should see a tooltip with text:
-     This action will allow you to rename the name associated with this face.
-     The change will apply to this image as well as all other images with the same name.
- When I click on the "Rename" icon
- Then I should see an input field with the current name "John Smith"
- When I enter "James Smith" in the input field
- And I click "Confirm"
- Then I should see a confirmation popup with the changes
- When I click the "Update" button
- Then the face should be renamed to "James Smith"
- And the change should be saved across all images with this person

## ID: 34

### User Story:

As a User, I want to Change the tagged face to another Person (existing) via drop-down menu on Training Centre

### Requirements:

1. Be able to see the training centre
2. Be able to proceed to update to another existing Person from the drop-down menu after detaching the Face, and then simultaneously saved

### Manual Scenario:

- Scenario: Detach face and reassign to another person from dropdown
- Given I am in the training centre
- And I can see a face assigned to "John Smith"
- And "Sarah Johnson" exists as another person in the system
-
- When I detach the face from "John Smith"
- Then I should see the face is no longer assigned to "John Smith"
-
- When I click the person selection dropdown
- Then I should see a list of existing people
- And "Sarah Johnson" should be visible in the dropdown
-
- When I select "Sarah Johnson" from the dropdown
- Then the face should be automatically assigned to "Sarah Johnson"
- And the changes should be saved immediately
- And the face should now appear under "Sarah Johnson" in the training centre

## ID: 35

### User Story:

As a User, I want to Delete the name from resources across platform on Training Centre

### Requirements:

Be able to complete "Delete profile" action

### Manual Scenario:

- Scenario: Successfully delete a person's profile
- Given I am in the training centre
- And I am viewing a profile for "John Smith"
- And "John Smith" has multiple faces assigned
-
- When I click the "Delete profile" action
- Then I should see a confirmation dialog with:
-     | Message | Are you sure you want to delete this profile? |
-     | Warning | This action cannot be undone                  |
-
- When I confirm the deletion
- Then I should see a success message "Profile successfully deleted"
- And "John Smith" should no longer appear in the training centre
- And all faces previously assigned to "John Smith" should be unassigned
- And I should be returned to the training centre main view

## ID: 36

### User Story:

As a user, I want to review my document against compliance rules before submitting it to the system so that I can address issues early in the process.

### Requirements:

1. Capture and extract content from the active Word document
2. Send document content and filter values to Review API
3. Implement "Fix Issue" functionality that navigates to the relevant section in Word

### Manual Scenario:

- Scenario: User reviews document against compliance rules before submission
- Given the user has an active Word document open
- When the user initiates a compliance review
- Then the system should capture and extract the content from the active Word document
- And send the extracted content along with any selected filter values to the Review API
- And display the compliance issues returned by the API
-
- When the user clicks "Fix Issue" on a listed compliance issue
- Then the system should navigate to the corresponding section in the Word document

## ID: 37

### User Story:

As a user, I want to view detailed risk results from my document review and take actions on each risk (dismiss or add as comment) so that I can address compliance issues efficiently within my document.

### Requirements:

1. Display risks in a format matching the current Red Marker Add-ins
2. Implement risk action buttons: Dismiss button (X), Insert Comment button that adds the risk as a native Office comment
3. When "Insert Comment" is clicked:

- Create a native Microsoft Office comment at the exact location of the risk
- Format comment text to include risk details and suggested remediation

### Manual Scenario:

- Scenario: User views detailed risk results and takes actions within the document
- Given the user has completed a document compliance review
- When the risk results are displayed
- Then each risk should be shown in a format consistent with the current Red Marker Add-ins
- And each risk should include a "Dismiss" button and an "Insert Comment" button
-
- When the user clicks the "Insert Comment" button on a risk
- Then a native Microsoft Office comment should be created at the exact location of the risk in the document
- And the comment should include the risk details and suggested remediation text
-
- When the user clicks the "Dismiss" button on a risk
- Then the risk should be removed from the list and not appear in the review summary

## ID: 38

### User Story:

As a user, I want to submit my reviewed document with all review comments for to IB so that it can review in platform or send for approval.

### Requirements:

1. On click to Send to IB - Validates that all filters required are selected
2. When submitting, it shows progress during submission
3. Provides clear confirmation
4. Offers clear error messages and recovery options on failure

### Manual Scenario:

- Scenario: User submits reviewed document with comments to IB
- Given the user has completed the compliance review and all required filters are selected
- When the user clicks the "Send to IB" button
- Then the system should validate that all required filters are present
- And display a submission progress indicator
-
- When the submission completes successfully
- Then the user should see a clear confirmation message indicating the document was sent to IB
-
- When the submission fails
- Then the user should see a clear error message
- And the system should provide options to retry or cancel the submission

## ID: 39

### User Story:

As an IB Admin, I want to designate a specific database as the default for the Add-in Risk Review so that users have a consistent starting point when using the Add-in as well as having a “Quick” drop off method.

### Requirements:

1. Add a new setting labeled "Make this [DatabaseSingular] the default for Risk Reviews in Add-ins"
   in the Database Settings section, above the “Custom Item Names” field.

### Manual Scenario:

- Scenario: IB Admin sets a database as the default for Add-in Risk Review
- Given the IB Admin is on the Database Settings page
- When the admin checks the option "Make this [DatabaseSingular] the default for Risk Reviews in Add-ins"
- And saves the settings
- Then the selected database should be designated as the default for Add-in Risk Reviews
- And users launching the Add-in should automatically have this database preselected for Risk Review

## ID: 40

### User Story:

As a Product user, I want to be able to turn the Record Publish Approval feature on / off during development (MCP)

### Requirements:

Rename the existing MCP setting name from Databases - Record Publish Approval Rewrite POC (devevelopment use only to Approvals - Record Publish Approval Rewrite (development use only)

### Manual Scenario:

- Scenario: Product user toggles Record Publish Approval feature during development
- Given the user is a Product user with access to MCP settings
- When the user navigates to the MCP development settings section
- And the user sees the setting labeled "Approvals - Record Publish Approval Rewrite (development use only)"
- Then the user should be able to enable or disable the Record Publish Approval feature
- And the system should respect the setting by turning the feature on or off accordingly

## ID: 41

### User Story:

As a User, I want to be able to view my Record's Request status in the same section that's available for other V3 Approval types

### Requirements:

1. Within the new Record Publish Approval review page, there should be a “Request Status” section which includes the same information as appears for other request types.
2. This should include (though is not limited to):

- Request Status
- Approval(s) Still Required
- Waiting on

### Manual Scenario:

- Scenario: User views Request Status for Record Publish Approval in the V3 Approval Review Page
- Given a user has submitted a Record for Publish Approval
- And the Record appears in the V3 Approval Review page
- When the user navigates to the Record's review detail page
- Then the page should display a “Request Status” section
- And the section should include:
-     | Field                   |
-     | Request Status         |
-     | Approval(s) Still Required |
-     | Waiting on             |
- And the information should be consistent with other V3 Approval types

## ID: 42

### User Story:

As a User, I want to hide Comments on records & respective tabs for now when in the Approvals module

### Requirements:

1. Comment functionality shouldn't be accessible for records when in approvals
2. Remove all tabs in the review request / request details page, ie Markup, Revisions, Response (as no tab will exist here yet).

### Manual Scenario:

- Scenario: Hide Comments and tabs on Records in Approvals module
- Given the user is viewing a Record in the Approvals module
- When the user opens the Review Request or Request Details page
- Then the Comment functionality should not be visible or accessible
- And the following tabs should not be displayed:
-     | Tab Name   |
-     | Markup     |
-     | Revisions  |
-     | Response   |

## ID: 43

### User Story:

As a User, I want to hide the record footer & hide actions in the header within the record view

### Requirements:

1. This is to avoid unnecessary confusion for the user and requires us to:

- Hide the record footer entirely
- Show Record Header but only display the Database Name, Record name and sequence ID
- Hide all other actions, etc in top right currently
- Hide the close button in the record view header
- Hide left / right navigation arrows that appear on the record page (note these are controlled by an MCP setting)

### Manual Scenario:

- Scenario: Hide record footer and header actions in Record View within Approvals module
- Given the user is viewing a Record in the Approvals module
- When the record view is loaded
- Then the record footer should not be displayed
- And the record header should show only:
-     | Field          |
-     | Database Name  |
-     | Record Name    |
-     | Sequence ID    |
- And all header actions in the top right should be hidden
- And the close button in the record view header should be hidden
- And the left and right navigation arrows should be hidden (as per MCP setting)

## ID: 44

### User Story:

As a User, I want to be able to view all Pages and specific Stages on the record view

### Requirements:

1. Single Records: Ability to view and navigate to any Page or section in a Single Database > Record request
2. Staged Records:

- When in pending, restrict the views to the following:
- Stage 1 in Pending: View Stage 1 by default and all future stage names appear in nav but are diabled

### Manual Scenario:

- Scenario: View Pages and Stages in Record View for Single and Staged Records
- Given the user is viewing a Record in the Approvals module
- When the Record is from a Single Database
- Then the user should be able to view and navigate to any Page or section in the Record
- When the Record is a Staged Record and the request is in Stage 1 Pending
- Then Stage 1 should be viewable by default
- And all future Stage names should be visible in the navigation
- But they should be disabled and not navigable
-

## ID: 45

### User Story:

As a User, I want to Detach the recognised name from the Resource on Training Centre

### Requirements:

1. Be able to see "Detach name" action icon for recognised faces from training centre 1
2. Be able to see tooltips while hovering on the icon
3. Tooltips: ”This action will revert the face to an "Unknown" status for this image only. You can add a new name later if needed.”
4. Be able to click on "Detach name" and see a confirmation popup as per design## Be able to see the confirmation popup as per design, and click on 'Confirm' to proceed to Detach action# Be able to see the recognised face changed to Unknown status as per design after proceeding the confirmation of "Detach name"
5. Be able to input the Unknown name field
6. Also see the applicable ticket on updating Unknown names
7. Be able to automatically see the updates based on the changes made from training centre without a “Save“ button

### Manual Scenario:

- Scenario: Detach name from recognized face and update to Unknown status
- Given I am in the training centre
- And I can see a face recognized as "John Smith"
-
- When I hover over the "Detach name" icon
- Then I should see a tooltip with text:
- """
- This action will revert the face to an "Unknown" status for this image only.
- You can add a new name later if needed.
- """
-
- When I click the "Detach name" icon
- Then I should see a confirmation popup
-
- When I click "Confirm" in the popup
- Then the face should change to "Unknown" status
- And I should see an editable name field
- And changes should be automatically saved
- And the face should update in real-time without requiring a save button

## ID: 46

### User Story:

As a User, I want to see Button Widget's background colour config designs in line with entire Side Panel

### Requirements:

1. Be able to see the Button Widget’s settings on Button background & text colours
2. Be able to see the consistent selected, default and hovered state effects

### Manual Scenario:

- Scenario: View and verify button visual states
- Given I am configuring a Button Widget
- And I am on the button style settings
-
- Then I should see color configuration options:
- | Setting | Options |
- | Background Color | Color picker with presets |
- | Text Color | Color picker with presets |
-
- When I preview the button
- Then I should see the button states:
- | State | Visual Effect |
- | Default | Base colors |
- | Hover | Slight color lightening |
- | Selected | Highlighted border |
-
- When I change the background color
- And I change the text color
- Then the button preview should update automatically
- And all states should maintain consistent effects

## ID: 47

### User Story:

As a User, I want to see Block "ratio" simply changed to "width"

### Requirements:

1. Be able to see the current Block’s “Ratio“ configurations on Side Panel changed to “Width“ as the title
2. Be able to see the description label “BLOCK RATIO“ in between the “Width“ title and the slider

### Manual Scenario:

- Scenario: View and adjust block width ratio settings
- Given I am viewing the Side Panel
- And I have a block selected
-
- Then I should see the width configuration section with:
- | Element | Display |
- | Title | "Width" |
- | Description | "BLOCK RATIO" |
- | Control | Ratio adjustment slider |
-
- When I view the width configuration layout
- Then I should see elements ordered as:
- 1.  "Width" title at the top
- 2.  "BLOCK RATIO" description below title
- 3.  Ratio slider control at the bottom

## ID: 48

### User Story:

As a user, I want to remove double saving messages

### Requirements:

1. We have two messages appearing for the “Image will be tagged after saving.” message
2. I assume one is the existing and the other is the reusable component.
3. Can we remove the one that is below the field (red one)

### Manual Scenario:

- Scenario: Show consistent image tagging message
- Given I am on a page with image tagging functionality
- And I have selected an image to tag
-
- Then I should see only one "Image will be tagged after saving" message
- And it should use the reusable message component
- And the red message below the field should not be displayed
-
- When I save the image
- Then only the reusable message component should be updated
- And no redundant messages should appear

## ID: 49

### User Story:

As a User, I want to differentiate page saving between creating a new and editing an existing Simple Page

### Requirements:

1. Be able to differentiate two scenarios while saving a Simple Page in Simple Page Builder
2. Be able to save the Simple Page then refresh to go to its Editing Page URL in editing mode, when first-time creating a new Simple page (page with create URL, via Create process)
3. Be able to save the Simple Page with the latest contents, when editing an existing Simple Page (page with update URL, via Edit action process or from the process above) and then stay on the Page in editing mode, meanwhile, cannot continue to save
4. Be able to continue to save the Simple Page with latest contents if there are new editing actions on this Simple Page

### Manual Scenario:

- Scenario: Save new Simple Page and redirect to editing URL
- Given I am creating a new Simple Page
- And I am on the create URL path
- When I save the Simple Page
- Then I should be redirected to the editing URL
- And the page should be in editing mode
- And I should see my saved content

## ID: 50

### User Story:

As a user, I want all options to be included in V3 importer

### Requirements:

We need to integrate Asset Intelligence settings into the backend V3 importer, including Image Tagging, Video Tagging as well as Closed Captions, and do the groundwork for future Facial Recognition. This enhancement will ensure that imported assets have the option to include Asset Intelligence features when importing.

### Manual Scenario:

- Scenario: Configure Asset Intelligence settings during import
- Given I am configuring a V3 import
- And I have assets ready for import
-
- When I access the import settings
- Then I should see Asset Intelligence options:
-     | Feature            | Status    |
-     | Image Tagging     | Available |
-     | Video Tagging     | Available |
-     | Closed Captions   | Available |
-     | Facial Recognition| Prepared  |
-
- When I enable "Image Tagging" and "Video Tagging"
- And I start the import process
- Then the system should:
-     | Action                     | Status                |
-     | Process image tags         | For imported images   |
-     | Process video tags         | For imported videos   |
-     | Generate closed captions   | For video content     |
-     | Prepare facial recognition | Infrastructure ready  |
-
- When the import completes
- Then imported assets should have:
-     | Feature            | Result                    |
-     | Image Tags         | Generated if enabled      |
-     | Video Tags         | Generated if enabled      |
-     | Closed Captions    | Generated if enabled      |
-     | Facial Recognition | Ready for future use      |

## ID: 51

### User Story:

As a User, I want to Get a list of Smart Pages via API

### Requirements:

1. Be able to get a list of Smart Pages via API call

### Manual Scenario:

- Scenario: Retrieve Smart Pages via API Call
- Given I have valid API credentials
- When I make a GET request to the /smart-pages endpoint
- Then I should receive a response with status code 200
- And the response body should contain a list of Smart Pages
- And each Smart Page should include its id, name, URL, and status

## ID: 52

### User Story:

As a User, I want to Get a Smart page, including details: Page, Sections, Blocks, and Widgets via API

### Requirements:

1. Be able to get a smart page and its details via a API call

### Manual Scenario:

- Scenario: Retrieve a Smart Page and Its Details via API Call
- Given I have valid API credentials
- And a Smart Page with id = 123 exists in the system
- When I make a GET request to the /smart-pages/123 endpoint
- Then I should receive a response with status code 200
- And the response body should contain the Smart Page details, including id, name, URL, status, and content

## ID: 53

### User Story:

As a User, I want to Delete a Smart Page via API

### Requirements:

1. Be able to delete a Smart page via a API call
2. The call is documented in the API doc

### Manual Scenario:

- Scenario: Delete a Smart Page via API Call
- Given I have valid API credentials
- And a Smart Page with id = 123 exists in the system
- When I make a DELETE request to the /smart-pages/123 endpoint
- Then I should receive a response with status code 200
- And the response body should confirm that the Smart Page has been deleted
- And a request to /smart-pages/123 should return a 404 Not Found response
- And the DELETE API call should be documented in the API documentation

## ID: 54

### User Story:

As a User, I want to report Resource Download (Original) action in Usage Reporting for Custom Page Module

### Requirements:

1. Be able to track the Smart Page usage reporting for resource download action (Original size type of Resource, aka “Best“ quality)

### Manual Scenario:

- Scenario: Tracking Smart Page Resource Download Actions
- Given the user has access to the reporting module
- When a user downloads a resource in its original size ("Best" quality) from a Smart Page
- Then the system should log the resource download action in the report
-
- And the report should include details such as:
-
- The Smart Page where the download occurred
- The specific resource name
- The action type as "Resource Download (Original)"
- The timestamp of the download

## ID: 55

### User Story:

As a User, I want to report on Resource downloaded (Original) separately than added in Smart Page for Resource Module (Usage)

### Requirements:

1. Be able to track Resource Usage Reporting- Resource download action that happens in Smart Pages for previously uploaded Resource (Original size type of Resource, aka “Best“ quality) via Resource Lookup

### Manual Scenario:

- Scenario: Tracking Resource Download Actions in Smart Pages via Resource Lookup
- Given the user has access to the reporting module
- And a resource has been previously uploaded
- When the user downloads the resource in its original size ("Best" quality) via Resource Lookup in a Smart Page
- Then the system should log the resource download action in the Resource Usage Report
-
- And the report should include:
-
- The Smart Page where the download occurred
- The specific resource name retrieved via Resource Lookup
- The action type as "Resource Download (Original)"
- The timestamp of the download

## ID: 56

### User Story:

As a User, I want to access Reply action for New Comments in Daily Digest Email

### Requirements:

1. Be able to see and click on "Reply" as per design
2. Be able to re-direct to the Reply page in new tab
3. Be able to have applicable comment highlighted ready to reply to & text-box will be active as well

### Manual Scenario:

- Scenario: Replying to a Comment
- Given the user is viewing a comment section
- When the user clicks on the "Reply" button as per the design
- Then the system should open the Reply page in a new tab
-
- And the applicable comment should be highlighted
- And the reply text box should be active and ready for input

## ID: 57

### User Story:

As a User, I want to see Block "ratio" simply changed to "width"

### Requirements:

1. Be able to see the current Block’s “Ratio“ configurations on Side Panel _changed to “Width“ as the title_ as per design
2. Be able to see the description label “BLOCK RATIO“ in between the “Width“ title and the slider as per design

### Manual Scenario:

- Scenario: Displaying Updated "Width" Configuration in the Side Panel
- Given the user has selected a block in the Simple Page Builder
- When the user views the Side Panel
- Then the block’s “Ratio” configuration title should be updated to “Width” as per the design
-
- And a description label “BLOCK RATIO” should be displayed between the “Width” title and the slider, following the design specifications

## ID: 58

### User Story:

As a User, I want to see Button Widget's background colour config designs in line with entire Side Panel

### Requirements:

1. Be able to see the Button Widget’s settings on Button background & text colours as per design
2. Be able to see the consistent selected, default and hovered state effects

### Manual Scenario:

- Scenario: Viewing Button Widget’s Background & Text Color Settings
- Given the user is in the Simple Page Builder and has selected a Button Widget
- When the user views the Button Widget’s settings
- Then the user should see options for Button background & text colors as per the design
-
- And the selected, default, and hovered state effects should be displayed consistently according to the design specifications
-

## ID: 59

### User Story:

As a User, I want to have Block's height auto-adjusted based on the Widget within

### Requirements:

1. Be able to have Block’s height adjusted automatically based on the height of Widget within Height increases if the Widget’t height is larger, Height decreases if the Widget’s height is smaller

### Manual Scenario:

- Scenario: Automatically Adjusting Block Height Based on Widget Height
- Given the user has added a Widget inside a Block in the Simple Page Builder
- When the Widget’s height increases beyond the current Block height
- Then the Block’s height should automatically increase to fit the Widget
-
- And when the Widget’s height decreases
- Then the Block’s height should automatically decrease accordingly

## ID: 60

### User Story:

As a User, I want to have Section's height auto-adjusted based on the Section within

### Requirements:

1. Be able to have Section’s height adjusted automatically based on the height of Block within Height increases if the Block’s height is larger, Height decreases if the Block’s height is smaller

### Manual Scenario:

- Scenario: Automatically Adjusting Section Height Based on Block Height
- Given the user has added a Block inside a Section in the Simple Page Builder
- When the Block’s height increases beyond the current Section height
- Then the Section’s height should automatically increase to fit the Block
-
- And when the Block’s height decreases
- Then the Section’s height should automatically decrease accordingly
-

## ID: 61

### User Story:

As a User, I want to switch the focus between Section, Block, and Widget

### Requirements:

1. Be able to switch the relations from Parent to Child or Child to Parent for Section, Block, and Widget as per design

### Manual Scenario:

- Scenario: Switching Relations Between Parent and Child for Section, Block, and Widget
- Given the user is in the Simple Page Builder
- And a Section, Block, or Widget is selected
- When the user chooses to switch the relation from Parent to Child or Child to Parent as per the design
- Then the system should update the hierarchy accordingly
- And reflect the new relationship in the structure and settings as per the design
-

## ID: 62

### User Story:

As a User, I want to edit a Section

### Requirements:

1. Be able to set background colour or image via URL
2. Be able to set direction: horizontal / vertical
   3.Be able to set padding for Left, Right, Top, Bottom (64 px for each by default) Range: 0 px - 512 px

### Manual Scenario:

- Scenario: Configuring Section Background, Direction, and Padding
- Given the user is in Simple Page Builder and has selected a Section
- When the user opens the Side Panel
- Then they should be able to set a background by either:
-
- Selecting a background color
- Entering an image URL
- And the user should be able to set the Section’s direction to horizontal or vertical
-
- And the user should be able to adjust padding for Left, Right, Top, and Bottom
-
- Default padding should be 64px
- Adjustable within the range of 0px to 512px

## ID: 63

### User Story:

As a User, I want to see different effects on Sections/Blocks so I can know different states of them

### Requirements:

1. Be able to see hovering border effect as per design
2. Be able to see selecting border effect as per design
3. Be able to see default state effect as per design

### Manual Scenario:

- Scenario: Display Border Effects for Different States
- Given the user is in Simple Page Builder
- When they hover over an element (e.g., Section, Block, or Widget)
- Then a hovering border effect should appear as per design
-
- When the user clicks to select an element
- Then a selecting border effect should be displayed as per design
-
- When no interaction is happening
- Then the element should display its default state effect as per design
-
-
-
-
-
-
-

## ID: 64

### User Story:

As a User, I want to edit Font in Text Widget

### Requirements:

1. Be able to edit Rich Text Editor for Text Widget Fonts
2. Be able to have the same Fonts as in current custom page Rich Text Editor
3. Additionally, be able to have custom fonts added from Admin (if available)

### Manual Scenario:

- Scenario: Edit Fonts in Rich Text Editor for Text Widget
- Given the user has added a Text Widget to a Block
- When they open the Rich Text Editor and click on the font dropdown menu
- Then they should see the same font options as in the current custom page Rich Text Editor
- And if custom fonts have been added from Admin, they should also be available in the dropdown
- And when the user selects a font, the text within the Text Widget should update accordingly

## ID: 65

### User Story:

As a User, I want to use the Simple Page tag on CP List page

### Requirements:

1. Be able to see the new label: _Simple Pages_ on the top of the CP list table if there are any saved Simple Page type pages
2. Be able to filter the list results to only Simple Page type pages when the user clicks on the Simple Pages tag
3. Details should be accurately in line with Design

### Manual Scenario:

- Scenario: Viewing and Filtering Simple Pages in the CP List Table
- Given the user is on the CP list table
- And there is at least one saved Simple Page
- Then the user should see a new label: "Simple Pages" at the top of the list
-
- When the user clicks on the "Simple Pages" tag
- Then the list should be filtered to display only Simple Page type entries
- And the displayed details should match the design specifications

## ID: 66

### User Story:

As a User, I want to save the created Simple Page for CP module

### Requirements:

1. Be able to click on publish / save and save the Simple Page to CP module database
2. The successfully saved Simple Page could be listed later when open / refresh the CP module
3. Details should be in line with Design

### Manual Scenario:

- Scenario: Saving and Listing a Simple Page in the CP Module
- Given the user has created or edited a Simple Page in the CP module
- When the user clicks on the Publish or Save button
- Then the Simple Page should be successfully saved to the CP module database
-
- When the user opens or refreshes the CP module later
- Then the saved Simple Page should be listed in the CP module
- And all details should match the design specifications

## ID: 67

### User Story:

As a User, I want to use the simple page builder after creating a new Simple Page (go to page builder)

### Requirements:

1. Be able to click on create from the pop up after selecting the new page type: Simple Page and get directed to the simple page builder
2. Be able to open and load the simple page builder on the same tab
3. Be able to still view IB global navigation top-bar

### Manual Scenario:

- Scenario: Creating and Opening a New Simple Page in the Builder
- Given the user is on the New Page Creation popup
- When the user selects "Simple Page" as the new page type
- And clicks on the "Create" button
- Then the user should be redirected to the Simple Page Builder in the same tab
-
- And the Simple Page Builder should load properly
- And the user should still be able to see the IB global navigation top-bar

## ID: 68

### User Story:

As a User, I want to re-arrange the order of fields so Expiry Date is below Purpose (+Package) fields

### Requirements:

1. Adjustment to current implementation of order of fields on Site page:
2. Move ‘Expiry Date’ field to be below _Package_ field in both Add, Edit, and View Site pages

### Manual Scenario:

- Scenario: Expiry Date field should be positioned below the Package field on the Site page
- Given a user is on the Add, Edit, or View Site page
- When the page loads
- Then the ‘Expiry Date’ field should be displayed directly below the Package field
- And all other fields should retain their correct order
-

## ID: 69

### User Story:

As a User, I want to update UI & logic around selecting Jobs in Info Preview panel for preview + closing them to return to Resource preview

### Requirements:

1. Implement changes to selecting and closing Jobs Previews, as per provided designs

2. We will retain the existing behavior, where the selected Job needs to be re-clicked to switch the Preview back to the Template instead of the Job. Additionally, we will add another option for the user to close the Job preview.

### Manual Scenario:

- Scenario: Users can close Job Previews and switch back to the Template
- Given a user has selected a Job and is viewing its Preview
- When the user re-clicks the selected Job
- Then the Preview should switch back to the Template
-
- When the user chooses the new close option for the Job Preview
- Then the Job Preview should close
- And the Template view should be restored

## ID: 70

### User Story:

As a User, I want UI Button / Action on Template Resource in Info Preview to Create Job, which opens in Editor

### Requirements:

1. A new action is added only to img.ly+IB created Templates (Master or Standard) for users who have permission to Create Jobs (all users that have access to that folder) on the Info Preview page
2. Action opens Template in as a Job, as it does currently from other ‘Create Job’ locations

### Manual Scenario:

- Scenario: Users with Create Jobs permission can open img.ly+IB Templates as a Job
- Given a user is on the Info Preview page of an img.ly+IB created Template (Master or Standard)
- And the user has permission to Create Jobs (i.e., access to that folder)
- When the user selects the new action
- Then the Template should open as a Job
- And it should function the same way as other ‘Create Job’ locations

## ID: 71

### User Story:

As a user who can reassign, I can select multiple reviewers

### Requirements:

1. Prerequisite is enabled has been opened
2. The users that can be selected will depend on logic implemented in other tickets, but here we will handle that multiple users can be selected from the dropdown and +appear in the field once selected, as per designs

### Manual Scenario:

- Scenario: Users can select multiple users from the dropdown when Prerequisite is enabled
- Given the Prerequisite option is enabled and opened
- When the user selects multiple users from the dropdown
- Then the selected users should appear in the field as per the designs
- And the dropdown should allow multiple selections based on the implemented logic from other tickets

## ID: 72

### User Story:

As a user I want to see the list of people I can reassign to

### Requirements:

1. Prerequisite is enabled has been opened
2. The users that can be selected will depend on logic implemented in other tickets, but here we will handle all users displaying in the dropdown as a starting point for this UI development + testing

### Manual Scenario:

- Scenario: All users display in the dropdown when Prerequisite is enabled
- Given the Prerequisite option is enabled and opened
- When the user interacts with the dropdown
- Then all users should be displayed in the dropdown as a starting point for UI development and testing
- And the selection logic will be refined based on other ticket implementations

## ID: 73

### User Story:

As a user, I want to be able to open a reassign V3 Modal (Core new UI)

### Requirements:

1. Prerequisite is enabled
2. Using existing re-assign actions and following existing permission logic of who can re-assign and when, then when a user clicks on re-assign a new V3+ UI modal displays +as per designs+
3. This ticket is to handle only the core UI for this new modal, noting we have other tickets in the UI Epic to address specific scenario/logic handling within the UI

### Manual Scenario:

- Scenario: Display new V3+ UI modal when re-assigning with Prerequisite enabled
- Given the Prerequisite option is enabled
- And the user has the necessary permissions to re-assign based on existing logic
- When the user clicks on the re-assign action
- Then a new V3+ UI modal should be displayed as per the designs
- And the core UI structure should be implemented, with further logic handled in other tickets

## ID: 74

### User Story:

As a User, I want MCP Setting for Kanban Sort Options Updates

### Requirements:

1. Add new below setting under _Development Use Only_ section Databases - Kanban Sort Options, Location wise, this can be added to bottom of dev section under _Databases - Single User Record Edit Restriction_

### Manual Scenario:

- Scenario: New Setting for Kanban Sort Options Appears in Development Use Only Section
- Given a user is viewing the settings page
- When they navigate to the Development Use Only section
- Then a new setting "Databases - Kanban Sort Options" should be displayed
- And it should be located at the bottom of the section under "Databases - Single User Record Edit Restriction"
-

## ID: 75

### User Story:

As a User, I want MCP Setting for Approvals List Bulk Actions Updates

### Requirements:

1. Add new below setting under _Development Use Only_ section _Approvals - Request List (V3) -_ _Bulk Action Updates_ , Location wise, ideally it appears above _Approvals - Request List (V3) - Column Enhancements (development use only)_ setting to keep things tidy, but can live with it being added to the bottom of the list of that adds any complexity point

### Manual Scenario:

- Scenario: New Setting for Bulk Action Updates Appears in Development Use Only Section
- Given a user is viewing the settings page
- When they navigate to the Development Use Only section
- Then a new setting "Approvals - Request List (V3) - Bulk Action Updates" should be displayed
- And it should ideally appear above the "Approvals - Request List (V3) - Column Enhancements (development use only)" setting
- But if that positioning adds complexity, it can be added to the bottom of the list instead
-

## ID: 76

### User Story:

As a User, I want new File Format 'Templates' displays for scene files that are Img.ly/IB creations (ie, we do not display as scene files) - [V3 Locations]

### Requirements:

1.When a resource has been created via [IB+Img.ly|http://IB+Img.ly], it’s File Format should be ‘Templates’ 2. This File Format type should be surfaced in all relevant platform locations (instead of ‘scene’ file for this resource type), such as: Info Preview , In Database Resource Lookup (selection and in the field in the record), Review Request > Item Details

### Manual Scenario:

- Scenario: Displaying Correct File Format for Resources Created via IB+Img.ly
- Given a resource is created via IB+Img.ly
- Then its File Format should be set to "Templates" instead of "Scene"
- And this File Format should be displayed in all relevant platform locations, including:
-
- Info Preview
- Database Resource Lookup (both in selection and in the field in the record)
- Review Request > Item Details

## ID: 77

### User Story:

As a User, I want to Restricted Actions for Template Resources [Database Locations]

### Requirements:

1. When a Resource is a created Template or a Master Template, the below Resource Actions +do not display+ for any user: _Download_ , Block from Single and Bulk Download, _Alias_ ,Block from Single and Bulk Create Alias
   2.For A/C, below Resource actions +are+ still supported: _Edit_, _Email Internal Share Link_, _Move_, _Check in / Out_, _Usage_, _Related_, _Feedback_ (when enabled)

### Manual Scenario:

- Scenario: Restricting and Allowing Specific Resource Actions for img.ly Templates and Master Templates
- Given a resource is created as an img.ly Template or a Master Template
- When a user views the available Resource Actions
- Then the following actions do not display:
-
- Download
- Block from Single and Bulk Download
- Alias
- Block from Single and Bulk Create Alias
- And the following actions are still supported for A/C:
-
- Edit
- Email Internal Share Link
- Move
- Check in / Out
- Usage
- Related
- Feedback (when enabled)

## ID: 78

### User Story:

As a User, when I create, update and delete a Server and the action has failed, show a snackbar message to show the error

### Requirements:

1. After creating a Server and it fails, the page remains open and a snackbar appears with the error message
2. After editing a Server and it fails, the page remains open and a snackbar appears with the error message
3. After deleting a Server and it fails, the dialog remains open(?) and a snackbar appears with the error message

### Manual Scenario:

- Scenario: Handling Server Creation, Editing, and Deletion Failures
- Given a user creates, edits, or deletes a Server
- When the operation fails
- Then the page or dialog remains open
- And a snackbar appears with the error message

## ID: 79

### User Story:

As a User, I want MCP Setting for Single User Record Editor Restriction

### Requirements:

1. New development setting added to “_Development Use Only”_ section of MCP:
2. Setting name: _Databases - Single User Record Edit Restriction_
3. Location: Can be added to bottom of the list

### Manual Scenario:

- Scenario: Adding a New Development Setting for Single User Record Edit Restriction
- Given the user has access to the MCP (Master Control Panel)
- When the user navigates to the "Development Use Only" section
- Then a new setting named "Databases - Single User Record Edit Restriction" is available
- And it is located at the bottom of the list

## ID: 80

### User Story:

As a user who has selected Master Template option, if I can see none, I am directed to Create a blank one instead

### Requirements:

1. If either no Mater templates exist, then the ‘No Master Templates available’ message displays and user can select to Create a Blank Template instead, as per designs

### Manual Scenario:

- Scenario: Displaying 'No Master Templates Available' Message
- Given the user opens the Master Template overlay
- And there are no Master Templates available
- Then the message "No Master Templates available" is displayed
- And the user is given the option to Create a Blank Template as per designs
-
-
-
-
-
-
-

## ID: 81

### User Story:

As a user who selected a Master Template, this loads into the Editor

### Requirements:

1. Selected Master Template loads in the Template editor
2. Name to be handled here

### Manual Scenario:

- Scenario: Loading Selected Master Template in Template Editor
- Given the user selects a Master Template from the Master Template overlay
- When the selection is confirmed
- Then the selected Master Template loads in the Template Editor
- And the Template Name is displayed and handled appropriately in the editor
-
-
-
-
-
-
-

## ID: 82

### User Story:

As a User, On save, a new Job should appear in job list/tab for that Template Resource (B.E. handling)

### Requirements:

1. On successful Save, a Job will be saved against the Template from which it was created from

### Manual Scenario:

- Scenario: Job Successfully Saved Against Its Template
- Given a user has created a Job from a Template
- When they successfully save the Job
- Then the Job is saved and associated with the Template from which it was created

## ID: 83

### User Story:

As a user creating a job, I can only edit / configure elements allowed by Template creator

### Requirements:

1. As Job Creators open the Editor in Adopter Mode they will only be able to interact with layers and elements depending on what was configured by the Template Creator
2. Restrictions apply for all users, even Admins and Template Creator

### Manual Scenario:

- Scenario: Job Creators Can Only Interact with Allowed Layers and Elements in Adopter Mode
- Given a Job Creator opens the Editor in Adopter Mode
- When they attempt to interact with layers and elements
- Then they can only modify elements based on the restrictions set by the Template Creator
- And restricted elements remain non-editable for all users, including Admins and the Template Creator
-
-
-
-
-
-
-

## ID: 84

### User Story:

As a User, I want Confirmation dialog on Template Resource deletion that will warn that generated jobs will also be deleted as well

### Requirements:

1. When user clicks to delete Template Resource, a variant of the below pop-up displays calling out that Jobs will be deleted along with the Template

### Manual Scenario:

- Scenario: Deleting a Template Resource with Associated Jobs
- Given a user has selected a Template Resource that has associated Jobs
- When they click Delete
- Then a confirmation pop-up appears
- And the pop-up explicitly states that all associated Jobs will be deleted along with the Template
- And the user must confirm or cancel the deletion action

## ID: 85

### User Story:

As a User, I want Close or cancel handling

### Requirements:

1. If close or cancel is selected from Edit Template page, user is returned to the location they selected the Edit action from

### Manual Scenario:

- Scenario: Returning to Previous Location After Cancelling Edit Template
- Given a user is on the Edit Template page
- When they click Close or Cancel
- Then they are returned to the location where they originally selected the Edit action from

## ID: 86

### User Story:

As a user, I can search for a Template in the DAM when it has been saved as a Resource (Solr)

### Requirements:

1. Testing to confirm that, once saved as a Resource, the saved Template Scene file can be searched the same as other ‘normal’ Resources.

### Manual Scenario:

- Scenario: Searching for a Saved Template Scene File as a Normal Resource
- Given a Template Scene file has been saved as a Resource
- When the user performs a search in the Resources panel
- Then the saved Template Scene file appears in the search results
- And it is searchable like any other normal Resource

## ID: 87

### User Story:

As a User, I want to remove stickers option from left menu

### Requirements:

1. Hide Stickers option from left menu

### Manual Scenario:

- Scenario: Hiding the Stickers Option from the Left Menu
- Given the user is in the Img.ly editor
- When the editor loads
- Then the Stickers option is not visible in the left menu

## ID: 88

### User Story:

As a user who has selected a supported file to import as template, if it is successfully processed it opens in the Editor (Create + open import)

### Requirements:

1. When user has selected a supported file for import as template, after it has been successfully processed and loaded, it will open in the Editor

### Manual Scenario:

- Scenario: Opening the Imported Template in the Editor
- Given the user has selected a supported file for import as a template
- When the file is successfully processed and loaded
- Then the template automatically opens in the Editor

## ID: 89

### User Story:

As a User, I want Master Templates overlay, Fetch and return Master Templates via API

### Requirements:

1. When user is on the _Master Template_ selection overlay, relevant results will display for user to select from
2. This will be done via API
3. Permissions will also factor into what can be seen by a user - that will be handled here

### Manual Scenario:

- Scenario: Displaying Relevant Master Templates Based on API and Permissions
- Given the user is on the Master Template selection overlay
- When the overlay loads
- Then relevant master template results are retrieved via an API call
- And only templates the user has permission to view are displayed
- And the user can select from the available templates

## ID: 90

### User Story:

As a user who selected to Create Blank Template, a blank slate opens with a Default blank size

### Requirements:

1. When user choose to create a new blank Template, when the _Create Template_ page opens (aka, the Template editor) user sees the blank template opened to a default size
2. Default size is 1080 x 1080

### Manual Scenario:

- Scenario: Creating a New Blank Template Opens with Default Size
- Given the user is on the Create Template page
- When the user selects the option to create a new blank template
- Then the Template Editor opens
- And a blank template is displayed
- And the default size of the template is 1080 x 1080

## ID: 91

### User Story:

As a User, I want to Update Workflow Template Configure Groups/Divisions to be a modal not full overlay

### Requirements:

1.To update following designs, no changes to logic unless noted in design requirements in figma

### Manual Scenario:

- Scenario: Updating UI Based on New Designs Without Changing Logic
- Given the system is displaying the current UI
- When the updated designs are implemented
- Then the UI updates to match the new design specifications from Figma
- And no changes are made to the existing logic unless explicitly noted in the design requirements
-
-
-
-
-
-
-

## ID: 92

### User Story:

As a user I can open the new 'Add collaborators' dialog from approval list [placeholder text accessibility update]

### Requirements:

1. Add aria-describedby label to add into the placeholder text for inputs
   2.“Type or select a collaborator” placeholder

### Manual Scenario:

- Scenario: Adding ARIA Descriptions to Input Placeholder Text
- Given a user is on a form with an input field for adding collaborators
- When the input field is displayed
- Then the placeholder text is "Type or select a collaborator"
- And an aria-describedby label is added to associate the placeholder text with screen readers
- So that accessibility standards are met for users with assistive technologies

## ID: 93

### User Story:

As a user, I can expand the Server form by closing the menu and using the expand button

### Requirements:

1. Form expands using expand button
2. Form expands when menu is closed
3. Footer also expands with the form

### Manual Scenario:

- Scenario: Expanding the form and footer
- Given I am viewing a form
- When I click the expand button
- Then the form should expand
- And the footer should also expand
-
- When I close the menu
- Then the form should expand if it is not already expanded
- And the footer should also expand

## ID: 94

### User Story:

As a user, who I can select as collaborator updates based on if 'all' is allowed in Template settings

### Requirements:

1. If ‘All users’ is selected in ‘_Collaborators permissions_’ in Workflow Template settings page
   then
2. All Active platform users can be selected as a Collaborator can be anyone on the platform
   3.This means the bypass permissions will be extended to any selected user,_ +\_even if they lack permission to the source item module, etc_+

### Manual Scenario:

- Scenario: All Active Platform Users Can Be Selected as Collaborators and Granted Bypass Permissions
- Given ‘All users’ is selected in Collaborators permissions in the Workflow Template settings page
- And I am an active platform user
- When I am added as a collaborator to a supported request
- Then I should be granted bypass permissions to the source item associated with the request
- And I should be able to access the request even if I previously lacked permission to the source item module

## ID: 95

### User Story:

As a user, who I can select as collaborator updates based on new Template Group setting

### Requirements:

1. If Collaborators have been configured to restrict based on Group(s) (_45075_), then the users who can be selected as a Collaborator will update to extend to users in those Group(s) for pending requests tied to this Template
2. If a Workflow Access member UserA is only in GroupX, and in this ticket only GroupY is configured, the end result will be that UserA can still be added as a collaborator as well as uses in GroupY.
3. Also note if both Groups AND Divisions have been enabled, then this is an ‘or’ rule, ie, users can belong to either selected Groups or Divisions, not necessarily both

### Manual Scenario:

- Scenario: Collaborator Selection is Restricted to Configured Groups but Follows ‘OR’ Rule with Divisions
- Given the Workflow Template has been configured to restrict collaborators based on specific Groups
- And I am a user who belongs to one of the configured Groups
- When I am added as a collaborator to a pending request tied to this Template
- Then I should be granted bypass permissions to the source item associated with the request
- And If both Groups and Divisions have been enabled, the selection should follow an ‘OR’ rule
- And Users from either the selected Groups or Divisions should be eligible as collaborators, not necessarily both

## ID: 96

### User Story:

As a collaborator, I can be added to a Thread

### Requirements:

1. When Comment threads are enabled for the workflow (records file / resource publish / resource feedback), then collaborators can be added to new and existing threads by other thread participants/collaborators/admins/
2. When successfully added, added collaborator user can toggle between threads, edit thread, etc, the same as participants can

### Manual Scenario:

- Scenario: Collaborator Can Be Added to New and Existing Comment Threads
- Given comment threads are enabled for the workflow (record file, resource publish, or resource feedback)
- And a collaborator is part of the request
- When a thread participant, collaborator, or admin adds the collaborator to a new or existing thread
- Then the collaborator is successfully added to the thread
- And they can toggle between threads
- And they can edit the thread
- And they have the same comment interaction options as other participants in the request

## ID: 97

### User Story:

As a Collaborators, I can be tagged with @ mentions

### Requirements:

1. Successfully added Collaborators (that are not already participants) to the pending request / current pending stage should be able to be @ mentioned in markup comments the same as participants + admins currently can

### Manual Scenario:

- Scenario: Collaborators Can Be @ Mentioned in Markup Comments
- Given a user has been successfully added as a collaborator to a pending request or current pending stage
- And the user is not already a participant
- When another participant, collaborator, or admin creates a markup comment
- And attempts to @ mention the collaborator
- Then the collaborator appears in the @ mention dropdown
- And the collaborator is successfully tagged in the comment
- And they receive the same notifications as participants and admins when mentioned

## ID: 98

### User Story:

As a user, I cannot click Submit on single level unless I am on Response tab

### Requirements:

1. For requests that support Markup Comments & Versions/Revisions, when user accesses single view from the bulk review list, and clicks on Markup or Versions/Revisions tabs, then the _Submit & Next_ button is disabled on these tabs
2. Disabled tooltip: ‘Submit a _Response_ to proceed’
3. When user clicks on Response tab, the button becomes enabled again
4. Disabled tooltip is different when user is on Response tab and validation fails: ‘Response is missing mandatory information. Update to Submit.’ (Currently we still show active tooltip here).

### Manual Scenario:

- Scenario: Submit & Next button is disabled unless the user is on the Response tab
-     Given the user accesses a single view from the bulk review list
-     And the request supports Markup Comments & Versions/Revisions
-     When the user navigates to the Markup or Versions/Revisions tab
-     Then the "Submit & Next" button should be disabled
-     And the tooltip should display "Submit a Response to proceed"
-     When the user navigates to the Response tab
-     Then the "Submit & Next" button should be enabled
-     When the user is on the Response tab but mandatory information is missing
-     Then the "Submit & Next" button should remain disabled
-     And the tooltip should display "Response is missing mandatory information. Update to Submit.
-

## ID: 99

### User Story:

As a User, I want to Publish Resource Grouped Requests handled in Group Review Page

### Requirements:

1. _Overall_ page design and behaviour matches Grouped Download handling with some minor exceptions
2. _Bulk Download_ will not yet display here
3. Response fields may differ than Grouped Download on Bulk and Single level, such as:
4. _Hide Decline_ may be enabled for Record File Approvals (not applicable for Grouped Download)
5. _Approve with Comments_ may be enabled for Record File Approvals (not applicable for Grouped Download)
6. Requests may be _staged_ (not applicable for Grouped Download)
7. Logic here to follow Bulk Review for now - ie, requests may be progressed to different stages from one another in the Grouped Request

### Manual Scenario:

- Scenario: User reviews and processes grouped requests in the Group Review Page
-     Given the user is on the Group Review Page
-     When grouped requests are displayed
-     Then the overall page design and behavior should match Grouped Download handling
-     But Bulk Download should not be displayed
-     When reviewing a Record File Approval request
-     Then "Hide Decline" may be enabled
-     And "Approve with Comments" may be enabled
-     When processing grouped requests
-     Then requests may be staged
-     And requests may progress to different stages independently, following Bulk Review logic

## ID: 100

### User Story:

As a User, I want Grouped Record Files - Grouped Completion Email to Requester

### Requirements:

1. Following , when _Enable Grouped Requests_ setting is enabled + _Requester > Grouped Request has been completed_ Grouped notification settings is enabled (in Select scenario or as part of ‘All’), then on Grouped Record File request being made, then:
2. Individual emails are no longer sent for these requests as they are individually completed (in line with Grouped Download)
3. This will likely be updated later in this project to offer users more customisable options around what emails they want to receive for Grouped requests (ie, may want grouped request emails but single completed emails)
4. When all items within a grouped request are completed:
5. A single grouped request is instead sent to Requester notifying them of completion of request

### Manual Scenario:

- Scenario: Requester receives a single grouped completion email when all grouped record files are completed
-     Given the "Enable Grouped Requests" setting is enabled
-     And the "Requester > Grouped Request has been completed" notification setting is enabled
-     When a grouped record file request is made
-     Then individual completion emails should not be sent for each request
-     When all items within the grouped request are completed
-     Then a single grouped completion email should be sent to the requester

## ID: 101

### User Story:

As a User, I want Grouped Resource Publish - Grouped Completion Email to Requester

### Requirements:

1. Following , when _Enable Grouped Requests_ setting is enabled + _Requester > Grouped Request has been completed_ Grouped notification settings is enabled (in Select scenario or as part of ‘All’), then on Group Resource Publish request being made, then:
2. Individual emails are no longer sent for these requests as they are individually completed (in line with Grouped Download)
   3.This will likely be updated later in this project to offer users more customisable options around what emails they want to receive for Grouped requests (ie, may want grouped request emails but single completed emails)
3. When all items within a grouped request are completed:
4. A single grouped request is instead sent to Requester notifying them of completion of request

### Manual Scenario:

- Scenario: Requester receives a single grouped completion email when all grouped resource publish requests are completed
-     Given the "Enable Grouped Requests" setting is enabled
-     And the "Requester > Grouped Request has been completed" notification setting is enabled
-     When a grouped resource publish request is made
-     Then individual completion emails should not be sent for each request
-
-     When all items within the grouped request are completed
-     Then a single grouped completion email should be sent to the requester

## ID: 102

### User Story:

As a User, I want to set Primary Font Size in Admin and reflect to page title font size in Page Nav (both left & right side)

### Requirements:

1.  Be able to set Admin > Template > Primary Font Size and it applies to page title font size in Page Nav
2.  This should be applied whenever I’m viewing the Page Nav, including within the builder (on the right) and when viewing the Page (on the left)
3.  Primary Font Size value range: 12 - 16
4.  Whatever the primary font size of the platform is, this should be reflected in the Page nav.
5.  If the size changes that should also be reflected in the page nav

### Manual Scenario:

- Scenario: User sets Primary Font Size in Admin and sees it reflected in Page Nav
-     Given the user is in Admin > Template settings
-     When the user sets the "Primary Font Size" to a value between 12 and 16
-     Then the page title font size in the Page Nav should update accordingly
-     When the user views the Page Nav in the builder (right side)
-     Then the updated font size should be applied
-     When the user views the Page Nav on the Page (left side)
-     Then the updated font size should be applied
-     When the user changes the Primary Font Size in Admin
-     Then the updated font size should immediately reflect in the Page Nav

## ID: 103

### User Story:

As a User, I want to go back to Resource Lookup overlay after clicking to go to Resource Preview in Page Builder

### Requirements:

1. When User clicks on the close icon in the Info Preview overlay, instead of closing both Info and Resource pages, take _the user back to the Resources view they were on, ie the specific folder or search / filtered view._
2. This reflects the behaviour in the Resources module itself when the Info overlay is closed

### Manual Scenario:

- Scenario: User returns to the Resource Lookup overlay after closing the Info Preview
-     Given the user is in the Resource Lookup overlay within the Page Builder
-     When the user clicks on a resource to open the Info Preview overlay
-     And then clicks the close icon in the Info Preview overlay
-     Then the user should return to the Resource Lookup overlay
-     And the previous folder, search, or filtered view should be retained
-     When the user repeats this behavior in the Resources module
-     Then the experience should match the behavior in the Page Builder

## ID: 104

### User Story:

As a User, I want to select and upload more file formats via Resource Lookup in Page Builder

### Requirements:

1. Be able to select and upload those file formats based on the feasible quality automatically as default (skipping the quality selection popup)
2. load these file formats with Good* quality *automatically* (*skip\* the quality popup) after adding from Resource lookup since Best quality are not displaying for: PSD, tif, tiff, eps, ai, {{jp2}}, {{cr2}}, {{indd}}, {{pbm}}, {{xbm}}, {{ppm,}}
3. Load these file formats with _Best_ quality _automatically_ (_skip_ the quality popup) after adding from Resource lookup since Good quality are not displaying for: gif

### Manual Scenario:

- Scenario: User selects and uploads supported file formats with automatic quality selection
-     Given the user is in the Resource Lookup within the Page Builder
-     When the user selects a file format from the supported list
-     Then the file should be uploaded automatically without displaying the quality selection popup
-     When the file format is PSD, TIF, TIFF, EPS, AI, JP2, CR2, INDD, PBM, XBM, or PPM
-     Then it should be loaded with "Good" quality automatically
-     When the file format is GIF
-     Then it should be loaded with "Best" quality automatically

## ID: 105

### User Story:

As a User, I should not see the Page Category dropdown when viewing Pages if none of them are assigned to Category

### Requirements:

1. Be able to see only Pages from the Left Panel when viewing a Page, if all the pages the user has access to view are all not associated with any Page Category

### Manual Scenario:

- Scenario: User does not see the Page Category dropdown if no pages have a category
-     Given the user is viewing Pages in the Left Panel
-     And none of the pages the user has access to are assigned to a Page Category
-     When the user navigates to the Pages view
-     Then the Page Category dropdown should not be displayed
-     And only the list of Pages should be visible in the Left Panel

## ID: 106

### User Story:

As a User, I want to switch Page Categories when viewing a Page if there are multiple Page Categories

### Requirements:

1. Be able to see multiple Page Categories in the dropdown to switch from Nav, if there are more than one Page Categories exist and the user has permission to view those pages are under the Page Categories
2. Be able to select and to switch to another Page Category (incl. 'All Pages') via the drop-down menu as per design, then load Pages under from Nav

### Manual Scenario:

- Scenario: User can switch Page Categories via the dropdown
-     Given the user is viewing a Page
-     And multiple Page Categories exist
-     And the user has permission to view pages under these categories
-     When the user opens the Page Category dropdown in the navigation
-     Then the available Page Categories, including "All Pages," should be displayed
-     When the user selects a different Page Category from the dropdown
-     Then the Pages under the selected category should be loaded in the navigation panel

## ID: 107

### User Story:

As a User, I want to see Page Category being selected by default when viewing a Page as it's been assign to one

### Requirements:

1. By default the Page Category Name itself is displayed as per
2. Be able to see the pages under are loaded to the left side from Nav when viewing a Page

### Manual Scenario:

- Scenario: User sees the assigned Page Category selected by default
-     Given the user is viewing a Page that is assigned to a Page Category
-     When the page loads
-     Then the assigned Page Category should be selected by default in the dropdown
-     And the pages under that category should be loaded in the left navigation panel

## ID: 108

### User Story:

As a User, I want to customise the order of pages under All Pages and the order of pages under each Page Category

### Requirements:

1. Be able to customise the order of pages under All Pages and the order of pages under each Page Category

### Manual Scenario:

- Scenario: User customizes the order of pages under All Pages and Page Categories
-     Given the user is viewing the list of pages in "All Pages" or a specific Page Category
-     When the user selects the option to customize the order of pages
-     Then the user should be able to drag and drop pages to rearrange their order
-     And the changes should apply to the order of pages under both "All Pages" and the specific Page Category
-     When the user saves the new order
-     Then the pages should be displayed in the newly customized order both in "All Pages" and within the assigned Page Category

## ID: 109

### User Story:

As an Internal User, I want to have MCP(development use only) settings to enable/disable features per Epic for Drag & Drop Page MVP

### Requirements:

1. Add a MCP setting “Drag & Drop Pages: Widgets combining Block“ under Development Use only for Epic
2. Add a MCP setting “Drag & Drop Pages: Image Resizing“ under Development Use only
3. Add a MCP setting “Drag & Drop Pages: Page Templates“ under Development Use only
4. Add a MCP setting “Drag & Drop Pages - Page Category (development use only)“ under Development Use only section under Platform Settings

### Manual Scenario:

- Scenario: Internal User configures MCP settings for Drag & Drop Page features
-     Given the user is in the Development Use section of MCP settings
-     When the user views the Platform Settings
-     Then the following MCP settings should be available under "Development Use only" for the Drag & Drop Page MVP:
-       | Setting Name                                       | Description                                  |
-       | "Drag & Drop Pages: Widgets combining Block"       | Enables/Disables widgets combining block feature |
-       | "Drag & Drop Pages: Image Resizing"                 | Enables/Disables image resizing feature         |
-       | "Drag & Drop Pages: Page Templates"                 | Enables/Disables page templates feature         |
-       | "Drag & Drop Pages - Page Category"                 | Enables/Disables page category feature          |
-
-     When the user enables or disables any of the above settings
-     Then the relevant features should be activated or deactivated based on the settings chosen
-

## ID: 110

### User Story:

As a User, I want to be informed why the Page cannot be saved in Page Builder if it's beyond the set Page limit in MCP

### Requirements:

1. When the user is in Page Builder already and the set D&D page limit in MCP has been reached:
2. Be able to see a warning snack bar with message “Page limit of {&number set as page limit in MCP} reached.“ _in Page Builder after clicking on:_
3. Standalone Page creation button
4. at the bottom of Nav Panel
5. Page create button via kebab icon from Nav Panel
6. Sub-page creation button via kebab icon from Nav Panel

### Manual Scenario:

- Scenario: User sees a warning when attempting to create a page beyond the set limit
-     Given the user is in the Page Builder
-     And the set Drag & Drop (D&D) page limit in MCP has been reached
-     When the user attempts to create a new page using any of the following actions:
-       | Action                                        |
-       | Standalone Page creation button              |
-       | Page create button at the bottom of the Nav Panel |
-       | Page create button via kebab icon from Nav Panel |
-       | Sub-page creation button via kebab icon from Nav Panel |
-     Then a warning snack bar should be displayed with the message:
-       "Page limit of {number set as page limit in MCP} reached."
-     And the page creation process should be blocked

## ID: 111

### User Story:

As a User, I want to have previous 'Block' background colour setting embedded in Text Widget toolbar after combining these two

### Requirements:

1. Be able to have have previous 'Block' background colour setting embedded in Text Widget toolbar as per
2. Be able to click on the background colour setting in text widget toolbar and open the colour swatch popover then set the colour for Text Widget background

### Manual Scenario:

- Scenario: User sets background color for the Text Widget
-     Given the user is editing a Text Widget in the Page Builder
-     And the previous 'Block' background color setting is embedded in the Text Widget toolbar
-     When the user clicks on the background color setting in the toolbar
-     Then a color swatch popover should open
-     When the user selects a color from the swatch
-     Then the selected color should be applied as the background color for the Text Widget
-     And the applied background color should persist until changed

## ID: 112

### User Story:

As a User, I want to configure both Block and Video Widget properties

### Requirements:

1. Be able to see and configure the new widget settings from Nav (combining previously defined Block and Widget's settings) for each widgets:

### Manual Scenario:

- Scenario: User configures settings for Block and Video Widgets
-     Given the user is in the Page Builder
-     When the user selects a Block Widget or a Video Widget
-     Then the widget settings panel should open in the navigation panel
-     And the settings should include previously defined Block and Video Widget properties
-     When the user modifies any settings in the panel
-     Then the changes should be applied to the selected widget in real time
-     And the settings should persist when the page is saved

## ID: 113

### User Story:

As a User, I want to configure both Block and Image Widget properties

### Requirements:

1. Be able to see and configure the new widget settings from Nav (combining previously defined Block and Widget's settings) for each widgets:

### Manual Scenario:

- Scenario: User configures settings for Block and Image Widgets
-     Given the user is in the Page Builder
-     When the user selects a Block Widget or an Image Widget
-     Then the widget settings panel should open in the navigation panel
-     And the settings should include previously defined Block and Image Widget properties
-     When the user modifies any settings in the panel
-     Then the changes should be applied to the selected widget in real time
-     And the settings should persist when the page is saved
-

## ID: 114

### User Story:

As a User, I want to configure both Block and Text Widget properties

### Requirements:

1. Be able to see and configure the new widget settings from Nav (combining previously defined Block and Widget's settings) for each widgets:

### Manual Scenario:

- Scenario: User configures settings for Block and Text Widgets
-     Given the user is in the Page Builder
-     When the user selects a Block Widget or a Text Widget
-     Then the widget settings panel should open in the navigation panel
-     And the settings should include previously defined Block and Text Widget properties
-     When the user modifies any settings in the panel
-     Then the changes should be applied to the selected widget in real time
-     And the settings should persist when the page is saved

## ID: 115

### User Story:

As a User, I want to configure both Block and Button Widget properties

### Requirements:

1. Be able to see and configure the new widget settings from Nav (combining previously defined Block and Widget's settings) for each widgets:

### Manual Scenario:

- Scenario: User configures settings for Block and Button Widgets
-     Given the user is in the Page Builder
-     When the user selects a Block Widget or a Button Widget
-     Then the widget settings panel should open in the navigation panel
-     And the settings should include previously defined Block and Button Widget properties
-     When the user modifies any settings in the panel
-     Then the changes should be applied to the selected widget in real time
-     And the settings should persist when the page is saved

## ID: 116

### User Story:

As a User, I want to resize Image Widget by Width slider from Nav

### Requirements:

1. Be able to set the ratio of the Image to change the ‘Block'’s width for the combination of Image Widget from Nav Panel as per design (existing behaviour)
2. Be able to still see Image remain the same percentage of it’s “Block“ _horizontally_
3. Be able to still resize the Widget by dragging the dot line

### Manual Scenario:

- Scenario: User resizes Image Widget using the Width slider
-     Given the user is in the Page Builder
-     And an Image Widget is placed within a Block
-     When the user adjusts the Width slider from the Nav Panel
-     Then the Block’s width should change based on the selected ratio
-     And the Image should maintain the same percentage of its Block horizontally
-     When the user resizes the Widget by dragging the dotted line
-     Then the Image Widget should resize accordingly
-     And the new size should persist when the page is saved

## ID: 117

### User Story:

As a User, I want to reposition Image Widget by dragging image itself when create/editing a Page

### Requirements:

1. Be able to see dotted line of the Image and bounding box for the entire Widget with a default 8px paddings as per design, after dragging an Image Widget into a Section
2. Be able to always see the Image Widget’s outer bounding box border line as per design, whenever the Image has been re-sized
3. Be able to re-position and see the Image in the same percentage of ‘Block’ after resizing to smaller, and the percentage will obtain if the 'Block' width changes by

### Manual Scenario:

- Scenario: User repositions Image Widget by dragging it within a Page
-     Given the user is in the Page Builder
-     And an Image Widget is placed within a Section
-     When the user drags the Image Widget to a new position within the Block
-     Then a dotted line should appear to indicate the Image’s placement
-     And the Image Widget’s outer bounding box should be visible with 8px padding
-     When the user resizes the Image Widget
-     Then the outer bounding box should remain visible
-     And the Image should maintain the same percentage within its Block
-     When the Block width is changed
-     Then the Image should retain its percentage-based positioning within the Block
-     And the new position should persist when the page is saved

## ID: 118

### User Story:

As a user, I can only see a list of who can be selected as a Collaborator based on Beta scope - BE logic

### Requirements:

1. For Beta, when the relevant template is enabled for Collaborators, anyone who can access the Request currently in their workflow list can be added as a Collaborator: _Workflow Admins_ , _Main Admins_

### Manual Scenario:

- Scenario: Add Collaborator when Template is Enabled for Collaborators
- Given the relevant template is enabled for Collaborators
- And a request is in the workflow list of a user
- And the user is a Workflow Admin or Main Admin
- When the user attempts to add a Collaborator to the request
- Then the user should be able to successfully add the Collaborator

## ID: 119

### User Story:

As a user, I can open the new 'Add collaborators' dialog from approval list [Design core]

### Requirements:

1. When the Collaborator action is selected in the V3 Approvals List for relevant requests + by supported users, a new “Collaborators” modal displays Header: Name: Collaborators

### Manual Scenario:

- Scenario: Display Collaborators Modal in V3 Approvals List
- Given the user is a supported user
- And the request is relevant for Collaborators
- When the user selects the Collaborator action in the V3 Approvals List
- Then a new “Collaborators” modal should be displayed
- And the modal should have a header with the name “Collaborators”
-
-
-
-
-
-
-
-

## ID: 120

### User Story:

As a user, I want to see an action to assign collaborators in action column in V3 Approval List

### Requirements:

1. When setting is enabled for the Workflow Template, a _NEW_ action will display in Approvals List for pending requests tied to that item, for any users who can see that request, and who are one of the below: Requester, Reviewer(s) from any stage
2. Other added collaborators who are not one of the above (who are collaborator on the current stage, for staged requests)

### Manual Scenario:

- Scenario: Display New Action in Approvals List for Eligible Users
- Given the setting is enabled for the Workflow Template
- And there is a pending request tied to that item
- And the user can see the request
- And the user is either the Requester or a Reviewer from any stage
- Or the user is an added Collaborator on the current stage for staged requests
- When the user accesses the Approvals List
- Then a NEW action should be displayed for that request

## ID: 121

### User Story:

As a User, When a setting is enabled, Setting applies to all pending items tied to that Template

### Requirements:

1. When a new Template setting is enabled, the Collaborators action will appear for all Pending requests tied to that Template F.E Action to be added in another ticket

### Manual Scenario:

- Scenario: Display Collaborators Action for Pending Requests When Template Setting is Enabled
- Given a new Template setting is enabled
- And there are pending requests tied to that Template
- When a user views the Approvals List or relevant request interface
- Then the Collaborators action should appear for all pending requests tied to that Template

## ID: 122

### User Story:

As a user, if template setting is disabled (or template is archived), Collaborators can only be removed, not added, for pending items

### Requirements:

1. When ‘_Allow Collaborators_’ is enabled, and then disabled, then any new requests after that point tied to that template will not have the Collaborators action in the Workflow request List

### Manual Scenario:

- Scenario: Collaborators Action is Removed for New Requests After ‘Allow Collaborators’ is Disabled
- Given the ‘Allow Collaborators’ setting is enabled for a template
- And the setting is then disabled
- When a new request is created that is tied to that template
- Then the Collaborators action should not appear in the Workflow Request List for that request

## ID: 123

### User Story:

As a config user, I want to see/enable a new Setting in Admin > Template for Workflows for Collaborators in Approvals [Record File]

### Requirements:

1. Once MCP setting is enabled , new setting displays for Resource Publish Workflow Templates
2. This applies for existing and new templates

### Manual Scenario:

- Scenario: Display New Setting for Resource Publish Workflow Templates When MCP is Enabled
- Given the MCP setting is enabled
- When a user views the settings for Resource Publish Workflow Templates
- Then a new setting should be displayed
- And this setting should be available for both existing and new templates

## ID: 124

### User Story:

As a config user, I want to see/enable a new Setting in Admin > Template for Workflows for Collaborators in Approvals [Resource Publish]

### Requirements:

1. Once MCP setting is enabled, new setting displays for Resource Publish Workflow Templates
2. This applies for existing and new templates

### Manual Scenario:

- Scenario: Display New Setting for Resource Publish Workflow Templates When MCP is Enabled
- Given the MCP setting is enabled
- When a user views the settings for Resource Publish Workflow Templates
- Then a new setting should be displayed
- And the new setting should be available for both existing and new templates

## ID: 125

### User Story:

As a config user, I want to see/enable a new Setting in Admin > Template for Workflows for Collaborators in Approvals [Resource Feedback]

### Requirements:

1. Once MCP setting is enabled, new setting displays for Resource Feedback Workflow Templates
2. This applies for existing and new templates

### Manual Scenario:

- Scenario: Display New Setting for Resource Feedback Workflow Templates When MCP is Enabled
- Given the MCP setting is enabled
- When a user views the settings for Resource Feedback Workflow Templates
- Then a new setting should be displayed
- And the new setting should be available for both existing and new templates

## ID: 126

### User Story:

As a User, I want to add MCP Feature Flag for Collaborators in Approvals project

### Requirements:

1. Add a new MCP setting in development section:
2. Setting name: _Collaborator in approvals (BETA)_
3. Can be listed at bottom of development section
4. All project work to be tied to this setting

### Manual Scenario:

- Scenario: Add and Display MCP Setting for ‘Collaborator in Approvals (BETA)’
- Given the user navigates to the development section in settings
- When the MCP setting Collaborator in Approvals (BETA) is added
- Then the setting should be listed at the bottom of the development section
- And all project work related to Collaborators in Approvals should be tied to this setting

## ID: 127

### User Story:

As a User, I want a new workflowRequest PATCH call to update the collaborators

### Requirements:

1. We will implement a PATCH call for workflowRequest. Only collaborator field will be supported to update. If other fields are provided in the call they will be ignored.

### Manual Scenario:

- Scenario: Update Collaborator Field Using PATCH Call for Workflow Request
- Given a PATCH call is made to update a workflow request
- And the request includes the collaborator field
- When the request is processed
- Then the collaborator field should be updated successfully
- And any other fields provided in the call should be ignored

## ID: 128

### User Story:

As a user, I can sort Server list columns

### Requirements:

1. We need to use the FE cache, and ensure that search state, including sorting, are maintained in relevant UX flows. e.g. I do a search, click Edit on an Object, then Save > my previous search state and/or sorting option should be preserved, with any change in the list due to my Edit also being reflected. Those are meant to be universal patterns, though we had to do refactoring to close a lot of gaps in resources as per

### Manual Scenario:

- Scenario: Preserve Search State and Sorting After Editing an Object
- Given the user performs a search in the application
- And the user applies sorting to the search results
- And the user clicks "Edit" on an object from the search results
- And the user makes changes and clicks "Save"
- When the system returns to the search results page
- Then the previous search state should be preserved
- And the applied sorting option should remain unchanged
- And any updates due to the edit should be reflected in the list

## ID: 129

### User Story:

As a user, I can search for a Server in the Servers List

### Requirements:

1. Search bar in Servers Landing page
2. Search functionality
3. Will show the search results in the table

### Manual Scenario:

- Scenario: Search Functionality in Servers Landing Page
- Given the user is on the Servers Landing page
- When the user enters a search query in the search bar
- And submits the search
- Then the system should filter the servers list based on the search query
- And the matching search results should be displayed in the table

## ID: 130

### User Story:

As a User, I want empty stages shouldn't be hidden

### Requirements:

1.Currently we hide pages and stages that don’t display any fields/sections.
2.This ticket is to not hide a stage when it’s empty, but we will continue doing it for Pages.

### Manual Scenario:

- Scenario: Display Empty Stages but Continue Hiding Empty Pages
- Given a workflow contains multiple stages and pages
- And some stages do not have any fields or sections
- And some pages do not have any fields or sections
- When the user views the workflow
- Then empty stages should still be displayed
- But empty pages should continue to be hidden

## ID: 131

### User Story:

As a User, I can add and submit a server

### Requirements:

1. Main Details Page
2. Address (String (100 limit))
3. Description (String (500 limit))

### Manual Scenario:

- Scenario: Validate Address and Description Fields on Main Details Page
- Given the user is on the Main Details Page
- When the user enters an address in the Address field
- Then the Address field should accept up to 100 characters
- And if the user exceeds 100 characters, an error message should be displayed
- When the user enters a description in the Description field
- Then the Description field should accept up to 500 characters
- And if the user exceeds 500 characters, an error message should be displayed

## ID: 132

### User Story:

As a User, I can click Add from Servers Page and I am taken to Servers Create page

### Requirements:

1. Add Button from the Servers Landing Page
2. Add button will always show for now, permissions will be tackled in a separate ticket)

### Manual Scenario:

- Scenario: Display Add Button on Servers Landing Page
- Given the user is on the Servers Landing Page
- When the page loads
- Then the "Add" button should always be visible
- And the visibility of the "Add" button should not be affected by user permissions (as permissions will be handled in a separate ticket)
-
-
-
-
-
-
-

## ID: 133

### User Story:

As a User, I want to add Side Navigation menu back for non-staged databases so its clearer how to get to the next page

### Requirements:

1. In refreshed UI for create record, when a record is non-staged and public, the left side menu will be displayed
2. When create record is staged and public, we will continue to hide the menu for now

### Manual Scenario:

- Scenario: Display or Hide Left Side Menu Based on Record Type in Refreshed UI
- Given the user is in the refreshed UI for creating a record
- When the record is non-staged and public
- Then the left-side menu should be displayed
- When the record is staged and public
- Then the left-side menu should remain hidden

## ID: 134

### User Story:

As a User, I want to make the verification code in the email bigger & bolder to stand out more

### Requirements:

1. Update to new designs

### Manual Scenario:

- Scenario: Apply New Designs to the System
- Given the system has existing UI designs
- When the new designs are implemented
- Then the UI should be updated to reflect the new design changes
- And all relevant pages and components should follow the updated design guidelines

## ID: 135

### User Story:

As a User, I want to add "Maximum number of files" to the empty Multi Upload Field so users are aware of limits before uploading

### Requirements:

1. Update text in empty multi upload field in create/update to reflect the max file limit as set in the new multi upload form field ‘_Maximum File Limit_’

### Manual Scenario:

- Scenario: Display Maximum File Limit in Empty Multi-Upload Field
- Given the user is on the create or update page
- And there is an empty multi-upload field
- When the maximum file limit is set in the new multi-upload form field ‘Maximum File Limit’
- Then the placeholder text in the empty multi-upload field should reflect the maximum file limit value

## ID: 136

### User Story:

As a User, I want to open current location for single / same folder Move

### Requirements:

1. When a user moves single resource we load the current location as opened in the V3 folder tree branch
2. If current user lacks permission to items earlier in that tree, then the top level view (current state) will open instead
3. When a user bulk moves resources from the same folder, we load the current location as opened in the V3 folder tree branch

### Manual Scenario:

- Scenario: Loading the Correct Folder Location in V3 Folder Tree When Moving Resources
- Given the user is moving a resource
- When the user moves a single resource
- Then the current location should be loaded as opened in the V3 folder tree branch
- And if the user lacks permission to items earlier in that tree, the top-level view should open instead
- When the user performs a bulk move of resources from the same folder
- Then the current location should be loaded as opened in the V3 folder tree branch

## ID: 137

### User Story:

As a User, I want to change background color for public record auth pages

### Requirements:

1.Change the background colour to be #F7F7F7 (Grey 100) to match the success message background colour for both email auth screens (enter email + enter code)
2.The white background makes the modal disappear and not be as prominent:

### Manual Scenario:

- Scenario: Update Background Color for Email Authentication Screens
- Given the user is on an email authentication screen (Enter Email or Enter Code)
- When the screen loads
- Then the background color should be #F7F7F7 (Grey 100)
- And the background should match the success message background color
- And the modal should appear more prominent against the updated background

## ID: 138

### User Story:

As a User, I want to support generate & keep session for the other four settings

### Requirements:

1. Be able to start the session for the user once there's a new action on the Markup Page, including:
   Updates to Comment Status
   Edited Comments
   Deleted Comments

### Manual Scenario:

- Scenario: Start User Session on New Action in Markup Page
- Given the user is on the Markup Page
- When the user performs any of the following actions:
- Updates the comment status
- Edits a comment
- Deletes a comment
- Then the user session should start (or remain active)

## ID: 139

### User Story:

As a User, I want Guest Upload (MVP) Record File Multi Upload Limit Update to 1000

### Requirements:

1. New max limit for Multi Upload Field is 1000
2. For newly added fields, +50 will still be the pre-set default+
3. Clients can however manually enter their custom max between 1-1000

### Manual Scenario:

- Scenario: Enforce Maximum File Limit Rules for Multi-Upload Field
- Given the user is configuring a Multi-Upload Field
- When a new Multi-Upload Field is added
- Then the default maximum file limit should be pre-set to 50
- When the user manually enters a custom max file limit
- Then the system should allow values between 1 and 1000
- And if the user enters a value outside this range, an error message should be displayed
-
-
-
-
-
-
-

## ID: 140

### User Story:

As a User, I want to change "Show All" to "Show More" logic

### Requirements:

1. Name of ‘Show All’ to change in all scenarios to ‘Show More’ when over 50 files exist
2. Limit to the Max number of items that can be displayed in ‘Show More’ to be 50 (regardless of how many more files may be allowed/exist)
3. Others above 50 can be seen within the scroll within the expanded multi upload field

### Manual Scenario:

- Scenario: Update ‘Show All’ to ‘Show More’ and Limit Displayed Items in Multi-Upload Field
- Given the user has uploaded more than 50 files in the Multi-Upload Field
- When the file list exceeds 50 files
- Then the ‘Show All’ button should be renamed to ‘Show More’
- And clicking ‘Show More’ should display only 50 additional files
- And any remaining files beyond this limit should be accessible via scrolling within the expanded Multi-Upload Field

## ID: 141

### User Story:

As a User, I want Surface Question/Answer/Rating back end data in weekly report / script

### Requirements:

1. Update the weekly closed*captions_activation_report* to include
2. Name update: weekly_asset_intelligence_report
   Remove the Dev Server report ones e.g. dcfprod, rtsprod, dev018, dev015, dpctest, dcftest, dev016, dev003, dev027, dev026, rtstest, macsprod

### Manual Scenario:

- Scenario: Update Weekly Report Name and Remove Dev Server Reports
- Given the system generates the weekly_closed_captions_activation_report
- When the report is updated
- Then the report name should be changed to weekly_asset_intelligence_report
- And any entries related to the following Dev Server reports should be removed:
- dcfprod
- rtsprod
- dev018
- dev015
- dpctest
- dcftest
- dev016
- dev003
- dev027
- dev026
- rtstest
- macsprod

## ID: 142

### User Story:

As a User, I want to add Public User email address into Creator field for relevant alerts

### Requirements:

1. In any Database alert where Created By field displays, and record was created by a public user, append the public user’s email address after ‘Public Access’ user name
2. This needs to account for longer email addresses

### Manual Scenario:

- Scenario: Append Public User’s Email to ‘Public Access’ in Database Alerts
- Given a database alert displays the Created By field
- And the record was created by a public user
- When the alert is shown
- Then the Created By field should display ‘Public Access - [public user’s email]’
- And the display should properly accommodate longer email addresses without truncation or formatting issues

## ID: 143

### User Story:

As a User, I want to hide Left Menu (to hide Future Stage details) for Public Users in updated UI in Create Record

### Requirements:

1. When _Databases - Briefs UI Uplift Phase 1_ is enabled in MCP then for Public Users only in Create for Staged Databases, we hide the left menu altogether

### Manual Scenario:

- Scenario: Hide Left Menu for Public Users in Create for Staged Databases When ‘Databases - Briefs UI Uplift Phase 1’ is Enabled
- Given the ‘Databases - Briefs UI Uplift Phase 1’ setting is enabled in MCP
- And a public user is creating a record in a staged database
- When the user accesses the create interface
- Then the left menu should be hidden altogether

## ID: 144

### User Story:

As a user, I want to set a Custom limit to number of files allowed within a Multiple Upload Field - Updated handling for existing files that exceed new limit

### Requirements:

1.For existing records, if the new max is set to less than previously, there may be records that contain multi uploads fields that have more than the allowed max
2.This will only be re-validated on edit of record if user tries to add more files

### Manual Scenario:

- Scenario: Revalidate Multi-Upload Field Only When Adding More Files
- Given an existing record contains a multi-upload field with more files than the newly set maximum limit
- When the max file limit is reduced in the system settings
- Then the existing record should not be automatically revalidated
- But if the user edits the record and tries to add more files
- Then the system should revalidate the file limit
- And prevent the user from adding new files if the total would exceed the new maximum limit

## ID: 145

### User Story:

As a user, I want to be able to be able to go the next record and previous record while in the record page

### Requirements:

1. If the record is first in the list the previous button should not show
2. If the record is last in the list the next button should not show
3. Show next/previous only on hover

### Manual Scenario:

- Scenario: Display Next/Previous Buttons Based on Record Position and Hover State
- Given the user is viewing a list of records
- When the user selects the first record in the list
- Then the Previous button should not be displayed
- And the Next button should be displayed only on hover
- When the user selects the last record in the list
- Then the Next button should not be displayed
- And the Previous button should be displayed only on hover
- When the user selects any middle record in the list
- Then both Previous and Next buttons should be displayed only on hover

## ID: 146

### User Story:

As a User, I want MCP Setting for V3 Move

### Requirements:

1. New setting to be added under _Development Use Only_ section in MCP > Platform Settings
2. _Resources - Move Resource (V3)_
3. Development tickets for this project to be tied to this setting
4. Disabled by default for all platforms

### Manual Scenario:

- Scenario: Add New Setting for ‘Resources - Move Resource (V3)’ Under Development Use Only
- Given the user navigates to MCP > Platform Settings
- When a new setting is added under the ‘Development Use Only’ section
- Then the setting should be named ‘Resources - Move Resource (V3)’
- And all development tickets for this project should be tied to this setting
- And the setting should be disabled by default for all platforms

## ID: 147

### User Story:

As a user, I want to be able to see the workflow history of a record if there is one

### Requirements:

1. Workflow history button in the footer of the side navigation Panel when record has workflow history
2. Clicking the button will show workflow history
3. Show Workflow history table on click on button

### Manual Scenario:

- Scenario: Display Workflow History from Side Navigation Panel
- Given a record has workflow history
- When the user views the side navigation panel
- Then a Workflow History button should be displayed in the footer
- When the user clicks the Workflow History button
- Then the workflow history table should be displayed

## ID: 148

### User Story:

As a User, I want new Auth Screens + Success Page - Add in Menu / Login Bar

### Requirements:

1.The tiger team consensus is to show a logo, but not the log-in or nav menu. So this would be like the CPSL links

### Manual Scenario:

- Scenario: Display Logo Without Login or Navigation Menu
- Given the user accesses the specified page
- When the page loads
- Then the logo should be displayed
- And the login option should not be shown
- And the navigation menu should not be displayed

## ID: 149

### User Story:

As a User, I want to end my Session automatically when I leave the page by default

### Requirements:

1. Be able to end the session automatically by default for the user when close the markup overlay

### Manual Scenario:

- Scenario: Automatically End Session When Markup Overlay is Closed
- Given the user has an active session in the markup overlay
- When the user closes the markup overlay
- Then the system should automatically end the user session by default
-
-
-
-
-
-
-

## ID: 150

### User Story:

As a User, For "Ask AI Beta" project I want Beta icon

### Requirements:

1. Add ‘Beta’ icon to Ask AI opened side panel after the panel name+help tooltip to alert the user this feature is in 'beta'

### Manual Scenario:

- Scenario: Display ‘Beta’ Icon in Ask AI Side Panel
- Given the user opens the Ask AI side panel
- When the panel is displayed
- Then a ‘Beta’ icon should appear after the panel name and help tooltip
- And the icon should clearly indicate that the feature is in beta
-
-
-
-
-
-
-

## ID: 151

### User Story:

As a User, we expect to see updated email template for Session Based Digest Email once Session is completed

### Requirements:

1. Be able to see the updated summary as per design
2. Be able to see add session start & end time as per design

### Manual Scenario:

- Scenario: Display Updated Summary with Session Start & End Time
- Given the user views the summary section
- When the summary is displayed
- Then the summary should reflect the updated design
- And the session start time should be visible as per design
- And the session end time should be visible as per design
-
-
-
-
-
-
-

## ID: 152

### User Story:

As a User, I want to click a button on the Markup screen to manually end my Session

### Requirements:

1. Be able to click on a button from Markup screen to end the session
2. Fixed location: Under Markup Comment Panel > Heading
   Designs
3. After clicking, be able to see the button & message gone/disappeared

### Manual Scenario:

- Scenario: End Session via Button in Markup Screen
- Given the user is on the Markup screen
- And the End Session button is located under Markup Comment Panel > Heading
- When the user clicks the End Session button
- Then the session should be ended
- And the End Session button and message should disappear from the screen

## ID: 153

### User Story:

As a User, I want to end my Session automatically when I leave the page by default

### Requirements:

1. Be able to end the session automatically by default for the user when close the markup overlay

### Manual Scenario:

- Scenario: Automatically End Session When Markup Overlay is Closed
- Given the user has an active session in the markup overlay
- When the user closes the markup overlay
- Then the system should automatically end the user session by default

## ID: 154

### User Story:

As a User, I want Markup Page begins the session once the first activity on Mentions, New Comments, or New Replies gets sent to backend

### Requirements:

1. Be able to start the session for the user once there's a new action on the Markup Page including:
   Mentions
   New Comments
   New Replies

### Manual Scenario:

- Scenario: Automatically Start Session When a New Action Occurs on the Markup Page
- Given the user is on the Markup Page
- And the session is not yet active
- When the user performs any of the following actions:
- Mentions another user
- Adds a new comment
- Adds a new reply
- Then the system should automatically start the session for the user

## ID: 155

### User Story:

As a User, I want Markup Page begins the session once the first activity on Updates to Comment Status, Edited Comments, Deleted Comments, or New Revisions gets sent to backend

### Requirements:

1. Be able to start the session for the user once there's a new action on the Markup Page, including:
   Updates to Comment Status
   Edited Comments
   Deleted Comments

### Manual Scenario:

- Scenario: Automatically Start Session When a New Action Occurs on the Markup Page
- Given the user is on the Markup Page
- And the session is not yet active
- When the user performs any of the following actions:
- Updates the comment status
- Edits an existing comment
- Deletes a comment
- Then the system should automatically start the session for the user
-
-
-
-
-
-
-

## ID: 156

### User Story:

As a User, I want to set up Session Based Digest Email in My Account Alerts (Markup) for Comment Status Updates, Edited Comments, Deleted Comments, and New Revisions

### Requirements:

1. Be able to see and choose ‘Session’ via _My Account_ > _Alerts (Markup)_ in the _Digest Frequency_ drop-down menu for:
2. Updates to Comment status
3. Edited Comments

### Manual Scenario:

- Scenario: Select ‘Session’ Option in Digest Frequency Drop-Down for Markup Alerts
- Given the user navigates to My Account > Alerts (Markup)
- When the user opens the Digest Frequency drop-down menu
- Then the ‘Session’ option should be available for selection
- And the user should be able to choose ‘Session’ for the following alert types:
- Updates to Comment Status
- Edited Comments
-
-
-
-
-
-

## ID: 157

### User Story:

As a User, I want to set up Session Based Digest Email in Admin Alerts (Markup) for Comment Status Updates, Edited Comments, Deleted Comments, and New Revisions

### Requirements:

1. Be able to see and choose ‘Session’ via _Admin_ > _Alerts (Markup)_ in the _Digest Frequency_ drop-down menu for:
2. Updates to Comment status
3. Edited Comments

### Manual Scenario:

- Scenario: Select ‘Session’ Option in Digest Frequency Drop-Down for Markup Alerts in Admin Panel
- Given the admin navigates to Admin > Alerts (Markup)
- When the admin opens the Digest Frequency drop-down menu
- Then the ‘Session’ option should be available for selection
- And the admin should be able to choose ‘Session’ for the following alert types:
- Updates to Comment Status
- Edited Comments

## ID: 158

### User Story:

As a User, I want to set up Session Based Digest Email in My Account Alerts (Markup) for Mention & New Comment & New Reply

### Requirements:

1. Be able to select ‘Session' together with ‘Hourly’, ‘Daily’, and 'Weekly’ at the same time
2. The new "Session" option will follow the existing behaviours for _My Account_ > _Alerts (Markup)_ > _Currently set to_:

### Manual Scenario:

- Scenario: Allow Selecting ‘Session’ Alongside Other Digest Frequency Options
- Given the user navigates to My Account > Alerts (Markup)
- When the user opens the Digest Frequency drop-down menu
- Then the user should be able to select ‘Session’ along with ‘Hourly’, ‘Daily’, and ‘Weekly’ at the same time
- And the ‘Session’ option should follow the existing behaviors for Currently set to in Alerts (Markup)

## ID: 159

### User Story:

As a User, I want to set up Session Based Digest Email in Admin Alerts (Markup) for Mention & New Comment & New Reply

### Requirements:

1. Be able to see and choose ‘Session’ via _Admin_ > _Alerts (Markup)_ in the _Digest Frequency_ drop-down menu for:
2. Mention
3. New Comment

### Manual Scenario:

- Scenario: Select ‘Session’ Option in Digest Frequency Drop-Down for Mentions and New Comments in Admin Panel
- Given the admin navigates to Admin > Alerts (Markup)
- When the admin opens the Digest Frequency drop-down menu
- Then the ‘Session’ option should be available for selection
- And the admin should be able to choose ‘Session’ for the following alert types:
- Mentions
- New Comments

## ID: 160

### User Story:

As a User, I want to have an Admin setting to enable that the Session can be manually ended

### Requirements:

1. Be able to configure the setting: 'Session Based Digest” for the manual end trigger of Session Based Digest of Markup Comments

### Manual Scenario:

- Scenario: Configure ‘Session Based Digest’ for Manual End Trigger of Markup Comments
- Given the admin navigates to Admin > Alerts (Markup) Settings
- When the admin enables or configures the ‘Session Based Digest’ setting
- Then the system should allow the admin to set a manual end trigger for Session Based Digest of Markup Comments
- And once the session is manually ended, the digest should be sent based on the configured setting
-
-
-
-
-
-
-

## ID: 161

### User Story:

As a User, I want to have an MCP setting for Session Based Digest under development-use only

### Requirements:

1. Be able to have an MCP setting: "Session Based Digest of Markup Comments" under Development-use Only
2. Be able to enable / disable the MCP setting above

### Manual Scenario:

- Scenario: Configure ‘Session Based Digest of Markup Comments’ MCP Setting
- Given the admin navigates to MCP > Platform Settings > Development-use Only
- When the admin sees the ‘Session Based Digest of Markup Comments’ setting
- Then the admin should be able to enable or disable the setting
- And enabling the setting should activate session-based digests for Markup Comments
- And disabling the setting should deactivate the feature

## ID: 162

### User Story:

As a user, I want to see footer actions like cancel, save as draft, next and submit (Staged Database)

### Requirements:

1. When MCP is ON
   2.Footer for staged database

### Manual Scenario:

- Scenario: Display Footer for Staged Database When MCP is ON
- Given the MCP setting is enabled
- And the user is viewing a staged database
- When the user navigates to the bottom of the page
- Then the footer should be displayed for the staged database

## ID: 163

### User Story:

As a User, I want to set Primary Font Size in Admin and reflect to page title font size in Page Nav (both left & right side)

### Requirements:

1. Be able to set Admin > Template > Primary Font Size and it applies to page title font size in Page Nav
2. This should be applied whenever I’m viewing the Page Nav, including within the builder (on the right) and when viewing the Page (on the left)

### Manual Scenario:

- Scenario: Apply Primary Font Size to Page Title in Page Nav
- Given the admin navigates to Admin > Template > Primary Font Size
- When the admin sets a new Primary Font Size
- Then the selected font size should be applied to the page title font size in the Page Navigation
- And this font size should be reflected both in the builder (on the right) and when viewing the Page (on the left)
-
-
-
-
-
-
-

## ID: 164

### User Story:

As an internal User, I want to set Drag & Drop Page limit via Custom Page limit in MCP

### Requirements:

1. Remove Drag & Drop limit from the Restrictions tab in MCP

### Manual Scenario:

- Scenario: Remove Drag & Drop Limit from the Restrictions Tab in MCP
- Given the admin navigates to MCP > Restrictions Tab
- When the admin attempts to use the Drag & Drop functionality
- Then there should be no limit imposed on Drag & Drop actions
- And the admin should be able to drag and drop items without restriction

## ID: 165

### User Story:

As a User, I want Permission updates/options: allow all platform users to Ask AI from documents they can Preview (or above)

### Requirements:

1. We add a MCP sub-setting under parent “_Enable vector search - text (V3) (development use only):_”
2. Sub-setting name: _Main Admin only (Beta)_

### Manual Scenario:

- Scenario: Add ‘Main Admin only (Beta)’ Sub-Setting Under ‘Enable Vector Search - Text (V3)’
- Given the admin navigates to MCP > Platform Settings > Development-use Only
- And the ‘Enable Vector Search - Text (V3)’ setting is present
- When a new sub-setting ‘Main Admin only (Beta)’ is added under this parent setting
- Then the sub-setting should be displayed with the label
- And the admin should be able to enable or disable this sub-setting

## ID: 166

### User Story:

As a User, Ignore documents that are in Pending / Declined / Cancelled

### Requirements:

1. On +initial upload+, if resource is sent for publish approval in Pending we either: do not vectorize this at this stage, until/unless it is Approved, we vectorize on upload but drop support to Ask AI until/unless it is Approved

### Manual Scenario:

- Scenario: Handling Vectorization and Ask AI Support for Pending Resources
- Given a resource is initially uploaded and sent for publish approval (Pending status)
- When the system processes the upload
- Then the system should either:
- Not vectorize the resource at this stage until/unless it is Approved
- Vectorize on upload but disable Ask AI support until/unless the resource is Approved
- And once the resource is Approved, vectorization and Ask AI support should be fully enabled

## ID: 167

### User Story:

As a User, I want to allow users to rate the answer with thumbs up / thumbs down

### Requirements:

1. When an answer is fully formed (not partially loaded) we display the thumbs up & thumbs down icons underneath the answer
2. Thumbs up hover text: ‘Click if you found this response helpful.’
3. Thumbs down hover text: ‘Click if you found this response unhelpful.’

### Manual Scenario:

- Scenario: Display Thumbs Up & Thumbs Down Icons for Fully Loaded Answers
- Given an AI-generated answer is displayed to the user
- When the answer is fully formed (not partially loaded)
- Then the system should display the thumbs up & thumbs down icons underneath the answer
- And when the user hovers over the thumbs up icon, the tooltip should say:
- ‘Click if you found this response helpful.’
- And when the user hovers over the thumbs down icon, the tooltip should say:
- ‘Click if you found this response unhelpful.’

## ID: 168

### User Story:

Guest Upload MVP: Add local workflow info banners to note these wont apply for public users

### Requirements:

1.Add info banner to the below locations for existing Databases only after Public permission has been enabled to this database (so user will only see on Edit Database Settings)

### Manual Scenario:

- Scenario: Display Info Banner for Existing Databases When Public Permission is Enabled
- Given an existing database
- And the Public permission has been enabled for this database
- When the user navigates to Edit Database Settings
- Then an info banner should be displayed in the specified locations
- And the banner should only appear after Public permission is enabled

## ID: 169

### User Story:

PB - (Misc UX) As a User, I want to go back to Resource Lookup overlay after clicking to go to Resource Preview in Page Builder

### Requirements:

1. When User clicks on the close icon in the Info Preview overlay, instead of closing both Info and Resource pages, take _the user back to the Resources view they were on, ie the specific folder or search / filtered view._
2. This reflects the behaviour in the Resources module itself when the Info overlay is closed

### Manual Scenario:

- Scenario: Closing Info Preview Overlay Returns User to Previous Resources View
- Given the user is viewing the Info Preview overlay in the Resources module
- And they accessed it from a specific folder, search result, or filtered view
- When the user clicks on the close (X) icon in the Info Preview overlay
- Then only the Info Preview overlay should close
- And the user should be returned to the exact Resources view they were previously on
- And this behavior should match the existing Resources module behavior when closing the Info overlay

## ID: 170

### User Story:

As a user, I want to be able to see integrated fields

### Requirements:

1.When MCP is ON, display integrated fields according to design
2.Inside a normal section (View, Edit, Update)
3.Inside a duplicable section (View, Edit, Update)

### Manual Scenario:

- Scenario: Display Integrated Fields When MCP is ON
- Given the MCP setting is ON
- When a user accesses a record in View, Edit, or Update mode
- Then the system should display integrated fields according to the design
- And these fields should appear:
- Inside a normal section in View, Edit, and Update modes
- Inside a duplicable section in View, Edit, and Update modes

## ID: 171

### User Story:

MCP Front End - As a User when I click Server from the main menu it will open the server page

### Requirements:

1. Server landing page layout
2. Title (intl)
   3.Put in AdvanceTable for the Server list

### Manual Scenario:

- Scenario: Display Server Landing Page Layout with Title and Advanced Table
- Given the user navigates to the Server Landing Page
- When the page loads
- Then the page layout should follow the specified design
- And the title should be displayed using internationalization (intl) support
- And the server list should be placed inside an Advanced Table

## ID: 172

### User Story:

MCP Front End - As a user, I can delete a server

### Requirements:

1.When delete icon is clicked from Servers table a confirmation message is displayed 2. When Deleted item in the table is removed

### Manual Scenario:

- Scenario: Deleting a Server from the Servers Table
- Given the user is on the Servers table
- When the user clicks on the delete icon for a server entry
- Then a confirmation message should be displayed asking for deletion confirmation
- When the user confirms the deletion
- Then the server entry should be removed from the table
-
-
-
-
-
-
-

## ID: 173

### User Story:

MCP Front End - As a user, I can update server details

### Requirements:

1. Clicking on Edit icon from Servers table opens up Servers form in update mode
   2..Warning Message when updates are done and Cancel/Close button is clicked

### Manual Scenario:

- Scenario: Editing a Server Entry and Handling Unsaved Changes
- Given the user is on the Servers table
- When the user clicks on the Edit icon for a server entry
- Then the Server form should open in update mode
- When the user makes updates to the form and clicks on the Cancel or Close button
- Then a warning message should be displayed, prompting the user to confirm if they want to discard unsaved changes

## ID: 174

### User Story:

MCP Front End - As a User, I can View details of a server

### Requirements:

1. Clicking view icon from Servers table opens View mode for Servers form
2. Servers form in view mode

### Manual Scenario:

- Scenario: Viewing a Server Entry from the Servers Table
- Given the user is on the Servers table
- When the user clicks on the View icon for a server entry
- Then the Server form should open in View mode
- And the form fields should be non-editable

## ID: 175

### User Story:

Guest Upload MVP - Email verification: New Email Template + Send Email

### Requirements:

1. When public user enters/submits a valid email address in the new initial screen in then:
2. In Back end we generate code and sent the below email to the Public User’s entered email address

### Manual Scenario:

- Scenario: Public User Submits a Valid Email Address
- Given a public user is on the new initial screen
- When the user enters and submits a valid email address
- Then the backend should generate a verification code
- And an email containing the verification code should be sent to the public user's entered email address
-
-
-
-
-
-
-

## ID: 176

### User Story:

Guest Upload MVP - Email verification: New Auth Screens (core)

### Requirements:

1.After they pass the public concurrent queue check, user will see a modal for them to request an access code by leaving their email 2. Modal will be on top of a full screen white page coverage (everything under the menu) similar to the success screen, ie, a user cannot see any of the create record details until they pass email verification check

### Manual Scenario:

- Scenario: Public User Requests Access Code After Passing Queue Check
- Given a public user has passed the public concurrent queue check
- When the user reaches the next step
- Then a modal should appear prompting the user to request an access code by entering their email
- And the modal should be displayed on top of a full-screen white page coverage (hiding all create record details except the menu)
- And the user cannot proceed to view or interact with the create record details until they pass the email verification check
-
-
-
-
-
-
-

## ID: 177

### User Story:

CMD - As a User, I want to see Markup Comments removed from Dashboard automatically for removed / archived Assets

### Requirements:

1. Markup comments should be _hidden_ (as ‘removed’) in Dashboard Widget automatically if the associated assets have been deleted

### Manual Scenario:

- Scenario: Hide Markup Comments in Dashboard Widget When Associated Assets Are Deleted
- Given a markup comment exists in the Dashboard Widget
- And the associated asset for the markup comment exists
- When the associated asset is deleted
- Then the markup comment should be automatically hidden in the Dashboard Widget
- And it should be treated as ‘removed’
-
-
-
-
-
-
-

## ID: 178

### User Story:

Guest Upload MVP: Add Email address into Public Usage Create Action

### Requirements:

1.In Usage, when a record has been created by a public user we update the User details to append user’s email address, ie: 2. “Public Access (email@address.com)”

### Manual Scenario:

- Scenario: Append Public User’s Email Address in Usage Details
- Given a record has been created by a public user
- When the Usage details are displayed
- Then the User details should be updated to append the public user’s email address
- And it should be displayed in the format:
- ➡ "Public Access (email@address.com)"
-
-
-
-
-
-
-

## ID: 179

### User Story:

As a user, I want to see clearly identify that a section is part of a duplicable section

### Requirements:

1.Indent duplicable sections

### Manual Scenario:

- Scenario: Indent Duplicable Sections
- Given a form with duplicable sections
- When a new duplicable section is added
- Then the section should be indented properly to visually differentiate it from the main sections
-
-
-
-
-
-
-

## ID: 180

### User Story:

As a user, I want to be able to jump to fields with errors if form is invalid

### Requirements:

1. User can see number of errors per page/stage in the footer
2. Arrow up and down buttons that can be clicked to go through the errors
3. Highlight field

### Manual Scenario:

- Scenario: Navigate Through Errors in Footer
- Given a user is on a multi-page/stage form
- And there are validation errors on one or more pages/stages
- When the user views the footer
- Then the footer should display the number of errors per page/stage
- And the user should see arrow up and down buttons to navigate through the errors
- When the user clicks the arrow buttons
- Then the form should highlight the respective error field

## ID: 181

### User Story:

As a user, I want to freely navigate between stages (Staged)

### Requirements:

1. Reuse navigation from
2. Show stages
3. Show status of Stages

### Manual Scenario:

- Scenario: Display Navigation with Stages and Their Status
- Given a user is on a multi-stage workflow form
- When the user views the navigation panel
- Then the navigation should display all stages of the workflow
- And each stage should show its current status (e.g., Completed, In Progress, Pending)
- And the user should be able to navigate between stages using the existing navigation system

## ID: 182

### User Story:

As a user, I want to freely navigate between sections and pages (Single)

### Requirements:

1. Create Menu Panel component in ib-ui
2. Update Accordion component in ib-ui to cater for different variations
3. User must be able to open or close the left navigation panel

### Manual Scenario:

- Scenario: User Can Open and Close the Left Navigation Panel
- Given the user is on a page with the left navigation panel
- When the user clicks on the toggle button for the navigation panel
- Then the panel should expand if it was previously closed
- And the panel should collapse if it was previously open
- And the updated Accordion component should support different variations for menu items

## ID: 183

### User Story:

PB - As a User, I want to have previous 'Block' background colour setting embedded in Text Widget toolbar after combining these two

### Requirements:

1. Be able to have have previous 'Block' background colour setting embedded in Text Widget toolbar as per
2. Be able to click on the background colour setting in text widget toolbar and open the colour swatch popover then set the colour for Text Widget background

### Manual Scenario:

- Scenario: User sets background color for the Text Widget
-     Given the user is in the Page Builder
-     And a Text Widget is placed within a Block
-     And the previous 'Block' background color setting is embedded in the Text Widget toolbar
-     When the user clicks on the background color setting in the toolbar
-     Then a color swatch popover should open
-     When the user selects a color from the swatch
-     Then the selected color should be applied as the background color for the Text Widget
-     And the applied background color should persist when the page is saved

## ID: 184

### User Story:

PB - As a User, I want to configure both Block and Video Widget properties

### Requirements:

1. Be able to see and configure the new widget settings from Nav (combining previously defined Block and Widget's settings) for each widgets:

### Manual Scenario:

- Scenario: User configures settings for Block and Video Widgets
-     Given the user is in the Page Builder
-     And a Block Widget or a Video Widget is placed within a Section
-     When the user selects the Block Widget or Video Widget
-     Then the widget settings panel should open in the navigation panel
-     And the settings should include previously defined Block and Video Widget properties
-     When the user modifies any settings in the panel
-     Then the changes should be applied to the selected widget in real time
-     And the settings should persist when the page is saved
-

## ID: 185

### User Story:

PB - As a User, I want to configure both Block and Image Widget properties

### Requirements:

1. Be able to see and configure the new widget settings from Nav (combining previously defined Block and Widget's settings) for each widgets:

### Manual Scenario:

- Scenario: User configures settings for Block and Image Widgets
-     Given the user is in the Page Builder
-     And a Block Widget or an Image Widget is placed within a Section
-     When the user selects the Block Widget or Image Widget
-     Then the widget settings panel should open in the navigation panel
-     And the settings should include previously defined Block and Image Widget properties
-     When the user modifies any settings in the panel
-     Then the changes should be applied to the selected widget in real time
-     And the settings should persist when the page is saved

## ID: 186

### User Story:

PB - As a User, I want to configure both Block and Text Widget properties

### Requirements:

1. Be able to see and configure the new widget settings from Nav (combining previously defined Block and Widget's settings) for each widgets:

### Manual Scenario:

- Scenario: User configures settings for Block and Text Widgets
-     Given the user is in the Page Builder
-     And a Block Widget or a Text Widget is placed within a Section
-     When the user selects the Block Widget or Text Widget
-     Then the widget settings panel should open in the navigation panel
-     And the settings should include previously defined Block and Text Widget properties
-     When the user modifies any settings in the panel
-     Then the changes should be applied to the selected widget in real time
-     And the settings should persist when the page is saved

## ID: 187

### User Story:

PB - As a User, I want to configure both Block and Button Widget properties

### Requirements:

1. Be able to see and configure the new widget settings from Nav (combining previously defined Block and Widget's settings) for each widgets:

### Manual Scenario:

- Scenario: User configures settings for Block and Button Widgets
-     Given the user is in the Page Builder
-     And a Block Widget or a Button Widget is placed within a Section
-     When the user selects the Block Widget or Button Widget
-     Then the widget settings panel should open in the navigation panel
-     And the settings should include previously defined Block and Button Widget properties
-     When the user modifies any settings in the panel
-     Then the changes should be applied to the selected widget in real time
-     And the settings should persist when the page is saved
-

## ID: 188

### User Story:

4-1. As a User, I want to resize Image Widget by Width slider from Nav

### Requirements:

1. Be able to set the ratio of the Image to change the ‘Block'’s width for the combination of Image Widget from Nav Panel as per design (existing behaviour)
2. Be able to still see Image remain the same percentage of it’s “Block“ _horizontally_
3. Be able to still resize the Widget by dragging the dot line

### Manual Scenario:

- Scenario: User resizes Image Widget using the Width slider
-     Given the user is in the Page Builder
-     And an Image Widget is placed within a Block
-     When the user adjusts the Width slider from the Nav Panel
-     Then the Block’s width should change based on the selected ratio for the Image Widget
-     And the Image Widget should remain the same percentage of its Block horizontally
-     When the user resizes the Widget by dragging the dotted line
-     Then the Image Widget should resize accordingly
-     And the new size should persist when the page is saved

## ID: 189

### User Story:

3-2. As a User, I want to reposition Image Widget by dragging image itself when create/editing a Page

### Requirements:

1. Be able to see dotted line of the Image and bounding box for the entire Widget with a default 8px paddings as per design, after dragging an Image Widget into a Section
2. Be able to always see the Image Widget’s outer bounding box border line as per design, whenever the Image has been re-sized
3. Be able to re-position and see the Image in the same percentage of ‘Block’ after resizing to smaller, and the percentage will obtain if the 'Block' width changes by

### Manual Scenario:

- Scenario: User repositions Image Widget by dragging it within a Page
-     Given the user is in the Page Builder
-     And an Image Widget is placed within a Section
-     When the user drags the Image Widget to a new position within the Block
-     Then a dotted line should appear around the Image to indicate its new position
-     And the Image Widget’s outer bounding box should be visible with a default 8px padding as per design
-     When the user resizes the Image Widget
-     Then the outer bounding box should remain visible
-     And the Image should maintain the same percentage within the Block horizontally
-     When the Block width changes
-     Then the Image should retain its percentage-based positioning relative to the Block
-     And the new position should persist when the page is saved

## ID: 190

### User Story:

4-2. As a User, I want the position and size that I set of the image to still work in different responsive modes

### Requirements:

1. Be able to see the same percentage _horizontally_ of Image with the Block in mobile, tablet, and desktop modes, after
2. resizing the Image by dragging the dots
3. repositioning the Image by dragging the Image itself

### Manual Scenario:

- Scenario: User maintains Image Widget's position and size in mobile, tablet, and desktop modes
-     Given the user is in the Page Builder
-     And an Image Widget is placed within a Block
-     When the user resizes the Image Widget by dragging the resize dots
-     Then the Image should maintain the same percentage horizontally relative to the Block in all screen modes (mobile, tablet, desktop)
-     When the user repositions the Image by dragging the Image itself
-     Then the Image's position should remain consistent across mobile, tablet, and desktop modes
-     When the user switches between mobile, tablet, and desktop modes
-     Then the Image Widget should display at the same size and position relative to the Block as set in the original mode
-     And the changes should persist when the page is saved
-

## ID: 191

### User Story:

2-3. As a User, I want to Undo & Redo resizing & repositioning

### Requirements:

1. Be able to still click on Undo & Redo from top bar to go back & forward the actions on: Resizing the Image by dragging the dots
2. undo & redo get triggered only after user finishes their dropping by un-clicking the dot - so won't undo every pixel along the way of dragging experience.
3. the undo & redo also only works for successful cases as unsuccessful cases have been handled by experience provided

### Manual Scenario:

- Scenario: User can Undo and Redo resizing and repositioning actions
-     Given the user is in the Page Builder
-     And an Image Widget is placed within a Block
-     When the user resizes the Image Widget by dragging the resize dots
-     And the user finishes resizing by releasing the mouse click
-     Then the user should be able to click on the "Undo" button in the top bar to undo the resizing action
-     And the user should be able to click on the "Redo" button in the top bar to redo the resizing action
-     When the user repositions the Image Widget by dragging it to a new position
-     And the user finishes repositioning by releasing the mouse click
-     Then the user should be able to click on the "Undo" button to undo the repositioning action
-     And the user should be able to click on the "Redo" button to redo the repositioning action
-     When the user performs an unsuccessful resizing or repositioning action
-     Then the "Undo" and "Redo" buttons should not be triggered for these actions, as they are handled by other user experience behaviors
-     And the user should only be able to undo and redo the successful resizing and repositioning actions, based on the ticket descriptions for successful cases
-

## ID: 192

### User Story:

PB - As a User, I want to see Drag & Drop Page thumbnails as preview in Custom Page v2 index page

### Requirements:

1. Be able to preview pages as thumbnails for Drag & Drop Pages in v2 index page for both List and thumb layout views

### Manual Scenario:

- Scenario: User can see page thumbnails as previews for Drag & Drop Pages
-     Given the user is on the Custom Page v2 index page
-     When the user switches to List layout view
-     Then the Drag & Drop Pages should be displayed as thumbnails in the list view
-     When the user switches to the Thumb layout view
-     Then the Drag & Drop Pages should be displayed as thumbnails in the thumb view
-     And the thumbnails should correctly represent a preview of each Drag & Drop Page
-     And the thumbnails should be displayed for all Drag & Drop Pages available to the user

## ID: 193

### User Story:

PB - (Misc) As a User, I want to set auto-play as default or not for Video Widgets when viewing a Smart Page

### Requirements:

1. Be able to set added Video Widget auto-playing on Viewing via the button as per design
2. By default, the auto-play button is unchecked, meaning Videos won’t be auto-played on viewing by default

### Manual Scenario:

- Scenario: User can set auto-play for Video Widgets on Smart Page
-     Given the user is viewing a Smart Page with a Video Widget
-     When the user views the Video Widget settings
-     Then the auto-play option button should be unchecked by default
-     When the user checks the auto-play button
-     Then the Video Widget should auto-play when viewed
-     When the user unchecks the auto-play button
-     Then the Video Widget should not auto-play when viewed
-     And the video should follow the auto-play setting whenever the Smart Page is viewed

## ID: 194

### User Story:

BP - (Misc) As a User, I want to Replace resources via Resource Lookup from Nav Panel

### Requirements:

1. Be able to still see and click on the button “Replace“ to select another Resource via Resource Lookup from Nav Panel in Page Builder, after selecting a Resource successfully, as per design
2. Lookup feature:Page background
3. should ONLY update tooltips: “Select an image from your Resourcecustomsingular area“ for this _Replace_ button (previous tooltips on Select button remain the same) to the areas:Page background
   4.should ONLY update tooltips: “Select a video from your Resourcecustomsingular area“ for this _Replace_ button (previous tooltips on Select button remain the same) to the areas: Video Widget

### Manual Scenario:

- Scenario: User can replace resources in Page Builder using Resource Lookup
-     Given the user is in Page Builder and viewing a Page
-     When the user clicks the "Replace" button for a resource in the Nav Panel
-     Then the user should be able to select another resource via Resource Lookup
-     And the tooltip for the "Replace" button should update to "Select an image from your Resource custom singular area" when replacing a page background
-     And the tooltip for the "Replace" button should update to "Select a video from your Resource custom singular area" when replacing a video widget
-     And the tooltip for the "Select" button remains the same as before
-     And the resource is updated with the newly selected resource after confirming via the Resource Lookup
-     And the "Replace" button should behave as per design after selecting a new resource

## ID: 195

### User Story:

PB - As an Internal User, I want to have MCP(development use only) settings to enable/disable features per Epic for Drag & Drop Page MVP

### Requirements:

1. Add a MCP setting “Smart Page: Widgets combining Block“ under Development Use only for Epic:
   2.Add a MCP setting “Smart Page: Image Resizing“ under Development Use only
2. Add a MCP setting “Smart Pages - Page Templates (development use only)“ under Development Use only
   4.Add a MCP setting “Smart Page: Page Grouping“ under Development Use only

### Manual Scenario:

- Scenario: Internal user can configure MCP settings for Smart Page features
-     Given the internal user has access to the MCP settings under "Development Use only" for the Epic
-     When the user views the MCP settings page
-     Then the following settings should be available:
-       | Setting Name                            | Description                                        |
-       | "Smart Page: Widgets combining Block"    | Enables or disables the combining of widgets with blocks on smart pages |
-       | "Smart Page: Image Resizing"             | Enables or disables image resizing functionality on smart pages |
-       | "Smart Pages - Page Templates"           | Enables or disables the use of page templates in smart pages |
-       | "Smart Page: Page Grouping"              | Enables or disables page grouping functionality on smart pages |
-
-     When the user toggles any of these settings,
-     Then the corresponding feature for Smart Pages should be enabled or disabled as per the setting's state
-     And the changes should only apply in the development environment for testing and validation purposes
-

## ID: 196

### User Story:

PB - As a User, I want to see a Smart Page template popup after click on V2 create

### Requirements:

1. Be able to go to V3 Page Builder and see a Page Template popup, after clicking on Smart Page from V2 Page creation popup, as per design
2. Be able to see the popup: Popup Subject
   3.the default background page in Page Builder behind the template popup is an empty default page with three empty Sections
3. Current “template“ and “thumbnails” design are dummy/mock ones, once the real templates are final we will import them with the task:

### Manual Scenario:

- Scenario: User sees Smart Page template popup after clicking on V2 create
-     Given the user is on the V2 Page creation popup
-     When the user clicks on "Smart Page" option in the V2 Page creation popup
-     Then the user should be redirected to V3 Page Builder with the Smart Page template popup appearing as per design
-
-     And the popup should display the following elements:
-       | Element          | Description                                               |
-       |------------------|-----------------------------------------------------------|
-       | Popup Subject    | Displays the subject or title of the popup, as per design |
-
-     And the background page in the Page Builder behind the template popup should be an empty default page
-       And the empty default page should have three empty Sections
-     And the current “template” and “thumbnails” displayed should be dummy/mock ones
-     But once the real templates are final, they will be imported and displayed as per the task
-     When the user interacts with the popup and selects a template,
-     Then the selected template should be applied in the V3 Page Builder as expected

## ID: 197

### User Story:

PB - As a User, I want to create an empty Smart Page from the template popup

### Requirements:

1. Be able to see and click on the button : “Start with a blank template” as per design
   2.Be able to see selected effect as per design first_template (under “Colours“) will be selected, see:
2. A Blank / empty Smart Page will be created and loaded Page Builder (with three empty Sections)

### Manual Scenario:

- Scenario: User creates an empty Smart Page from the template popup
-     Given the user is in the Smart Page template popup
-     When the user clicks on the "Start with a blank template" button
-     Then the button should be clickable and should follow the design specifications
-     And the "Colours" section in the template popup should have the "first_template" effect selected as per design
-     And the user should see the selected effect highlighted
-     When the user clicks the "Start with a blank template" button,
-     Then a blank/empty Smart Page should be created and loaded into the Page Builder
-     And the Page Builder should display three empty Sections in the new Smart Page

## ID: 198

### User Story:

PB - As a User, I want to select a Template from Template popup

### Requirements:

1. Be able to see templates from the popup and to click on one template (incl. the blank template) as per design with _hover_ and _selected_ effects & experience

### Manual Scenario:

- Scenario: User selects a template from the template popup
-     Given the user is in the Smart Page template popup
-     When the user hovers over a template
-     Then the hover effect should be applied to the template as per design
-     When the user clicks on a template (including the blank template)
-     Then the template should be selected with the selected effect applied as per design
-     And the selected template should be applied to the Page Builder
-     And the user should be taken to Page Builder with the selected template loaded

## ID: 199

### User Story:

PB - As a User, I want to see previews of Page templates as in thumbnails

### Requirements:

1. Be able to see thumbnails of pre-defined Page Templates from the popup as per design
2. Current “template“ and “thumbnails” design are dummy/mock ones, once the real templates are final we will import them with the task:

### Manual Scenario:

- cenario: User sees previews of Page Templates as thumbnails
-     Given the user is in the Smart Page template popup
-     When the user opens the template popup
-     Then the user should see thumbnails of pre-defined Page Templates as per design
-     And each template should display a thumbnail preview of the Page Template
-     And the current template and thumbnail design are mock templates
-     When the real templates are finalized
-     Then the real templates and thumbnails should be displayed in the popup as part of the import process

## ID: 200

### User Story:

PB - As a User, I want to edit and save a Smart Page with template after it's loaded

### Requirements:

1. Be able to continue editing and saving the Smart Page with loaded page template
   2.Current “template“ and “thumbnails” design are dummy/mock ones, once the real templates are final we will import them with the task:

### Manual Scenario:

- Scenario: User edits and saves a Smart Page with a loaded template
-     Given the user has selected and loaded a page template in Smart Page Builder
-     When the user starts editing the Smart Page
-     Then the user should be able to continue editing the page with the loaded template
-     And the user should be able to save the changes to the Smart Page
-     And the current template and thumbnail designs are mock templates
-     When the real templates are finalized
-     Then the real templates should be imported and displayed in the Smart Page Builder as part of the import process

## ID: 201

### User Story:

PB - As a User, I want to apply/load a selected Smart Page template in Page Builder

### Requirements:

1. Be able to click on one of the Templates and proceed to Page Builder as per design
   2.Current “template“ and “thumbnails” design are dummy/mock ones, hence the selected “Templates“ _will be loaded as an empty Smart Page_
2. Once the real templates are final we will import them with the task:, and the real templates will be loaded accurately

### Manual Scenario:

- Scenario: User selects and loads a Smart Page template in Page Builder
-     Given the user is in the Smart Page template selection popup
-     When the user clicks on one of the available templates
-     Then the user should be redirected to Page Builder with the selected template loaded as an empty Smart Page
-     And the current templates and thumbnails are mock templates
-     When the real templates are finalized
-     Then the real templates should be imported and displayed in the Smart Page Builder accurately

## ID: 202

### User Story:

BP - (Misc) As a User, I want to see the Page Tree remain the same while switching Pages from Nav Panel

### Requirements:

1. Be able to see Page Tree remain the same while switching pages from Nav Panel during Viewing or Editing
2. If the parent page is expanded with sub-pages displayed under it, the Tree view should remain the same while switching to any other pages

### Manual Scenario:

- Scenario: User switches between pages and Page Tree remains unchanged
-     Given the user is viewing or editing a page with the Page Tree open
-     And the parent page is expanded with sub-pages displayed under it
-     When the user switches to another page from the Nav Panel
-     Then the Page Tree should remain the same and not collapse or change
-     And if the parent page is expanded with sub-pages, it should still be expanded when switching pages

## ID: 203

### User Story:

PB - (Misc) As a User, I want to further have an option to hide / unhide the download button for Images / Video

### Requirements:

1. Be able to hide / un-hide download button for Image / Video Widgets added into Page via the hide/unhide button as per design
2. By default, Download button is unhidden

### Manual Scenario:

- Scenario: User hides and unhides the download button for Image/Video Widgets
-     Given an Image or Video Widget is added to the page
-     And the download button is visible by default
-     When the user clicks the hide button for the download button
-     Then the download button should be hidden for that Image or Video Widget
-     When the user clicks the unhide button for the download button
-     Then the download button should become visible again for that Image or Video Widget

## ID: 204

### User Story:

PB - As a User, I want to add Widgets directly to a Section

### Requirements:

1. Be able to drag Widgets from Nav to Section directly in Page Builder on Create/Edit mode Widgets: all existing ones, and a new Widget: "Spacer" see in corresponding
2. For default config settings on Nav for each Widgets combined with 'Block', see in corresponding
3. Be able to drag max. 6 Widgets to one Section
4. Be able to see _only_ Section under Core elements from Nav to drag in without “Block“ option any more

### Manual Scenario:

- Scenario: User adds Widgets directly to a Section in Page Builder
-     Given the user is in Create/Edit mode in Page Builder
-     And the user has access to Widgets in the Nav panel
-     When the user drags a Widget from the Nav panel to a Section
-     Then the Widget should be added directly to the Section
-     And the Widget should be added with default configuration settings, as per design
-     And the user can add up to 6 Widgets to one Section
-     And the Section should be the only available option to drag Widgets into under Core elements
-     And the user should not see the “Block” option when dragging Widgets to the Section
-

## ID: 205

### User Story:

PB - As a User, I want to add a new Widget "Spacer"

### Requirements:

1. Be able to see and drag a new type of Widget "Spacer" as per design in a Section from Nav
2. Be able to see and configure settings for Spacer in order: Colour (by default, #FFFFFF) Padding (by default, 0pt for all directions) Ratio (by default, it follows the existing behaviour: 12 for an empty Section)
3. Be able to further drag a Section in this Widget (just to cater to previous behaviour of dragging a Section to a Block)

### Manual Scenario:

- Scenario: User adds and configures a Spacer Widget in a Section
-     Given the user is in Create/Edit mode in Page Builder
-     And the user can see the "Spacer" Widget in the Nav panel
-     When the user drags the "Spacer" Widget from the Nav panel to a Section
-     Then the Spacer Widget should be added to the Section
-     And the Spacer Widget should have default settings:
-       | Property | Default Value  |
-       | Colour   | #FFFFFF        |
-       | Padding  | 0pt (all sides) |
-       | Ratio    | 12 (for empty Section) |
-     When the user opens the Spacer Widget settings
-     Then the user should be able to modify the Colour, Padding, and Ratio properties
-     When the user drags a Section into the Spacer Widget
-     Then the Section should be successfully nested inside the Spacer Widget

## ID: 206

### User Story:

PB - As a User, I want to delete a Widget with the underlying Block

### Requirements:

1. Be able to delete a Widget with the same experience of deleting the old Widget

### Manual Scenario:

- Scenario: User deletes a Widget along with its underlying Block
-     Given the user is in Create/Edit mode in Page Builder
-     And the user has added a Widget with an underlying Block to a Section
-     When the user selects the Widget
-     And the user clicks the delete button
-     Then the Widget and its underlying Block should be removed from the Section
-     And the deletion experience should be the same as deleting the old Widget

## ID: 207

### User Story:

PB - As a User, I want to have Text Box Widget toolbar as a whole for the combo of Block & Widget

### Requirements:

1. Be able to select Text Box Widget and Block as a whole, and the bounding box will be highlighted as the same experience as old Block's bounding box
2. Be able to see previously defined text box toolbar with Up arrow only with the Block bounding box experience

### Manual Scenario:

- Scenario: User selects Text Box Widget and sees the combined toolbar experience
-     Given the user is in Create/Edit mode in Page Builder
-     And the user has added a Text Box Widget inside a Block
-     When the user selects the Text Box Widget
-     Then the entire bounding box of the Text Box Widget and Block should be highlighted
-     And the toolbar should appear with the previously defined text box options
-     And the toolbar should include only the Up arrow as per the Block bounding box experience

## ID: 208

### User Story:

PB - As a User, I want to only select & see the combo of Widget and Block (bounding box experience) in Page Builder

### Requirements:

1. Be able to select Widget and Block as a whole, and the bounding box will be highlighted as the same experience as old Block's bounding box
2. Be able to only navigate Up back to the Section

### Manual Scenario:

- Scenario: User selects a Widget and Block as a whole in Page Builder
-     Given the user is in Create/Edit mode in Page Builder
-     And the user has added a Widget inside a Block
-     When the user selects the Widget
-     Then the entire bounding box of the Widget and Block should be highlighted
-     And the selection experience should match the previous Block bounding box behavior
-     And the user should only be able to navigate up to the Section

## ID: 209

### User Story:

PB - As a User, I want to undo & redo actions for the combo of Widget & Block

### Requirements:

1. Be able to Undo & Redo actions of the Widget & Block as whole
2. Adding Widgets with Blocks to Page (dragging in)
3. Removing/deleting Widgets with Blocks from Page
4. Moving Widgets with Blocks by dragging

### Manual Scenario:

- Scenario: User performs Undo & Redo actions for Widget and Block as a whole
-     Given the user is in Create/Edit mode in Page Builder
-     And the user has added a Widget inside a Block
-     When the user drags a Widget with a Block into the Page
-     And the user clicks "Undo"
-     Then the Widget and Block should be removed from the Page
-     When the user clicks "Redo"
-     Then the Widget and Block should reappear in the Page at the same position
-     When the user moves the Widget and Block by dragging
-     And the user clicks "Undo"
-     Then the Widget and Block should return to their previous position
-     When the user deletes a Widget and Block from the Page
-     And the user clicks "Undo"
-     Then the Widget and Block should be restored in their previous state
-     When the user clicks "Redo"
-     Then the Widget and Block should be deleted again

## ID: 210

### User Story:

PB - As a User, I want to see a new landing page

### Requirements:

1. Be able to see just empty Sections with no "Blocks"

### Manual Scenario:

- Scenario: User views a new landing page with empty Sections
-     Given the user is in Page Builder
-     When the user creates a new landing page
-     Then the page should display empty Sections
-     And there should be no Blocks inside the Sections

## ID: 211

### User Story:

PB - As a User, I want to report Resource Download (Preview) action in Usage Reporting for Custom Page Module

### Requirements:

1. Be able to track the Smart Page usage reporting and User’s usage reporting for resource download action (Preview type of Resource, aka “Good“ quality)
2. Module appears if it applies to User’s usage report, whilst in Custom Page usage report the Module will not be displayed
   3.“Custom Page“ is dynamic to the setting configured in Admin: {Custom Custom Page Module singular}
3. Action: Resource Download (Preview)

### Manual Scenario:

- Scenario: Log resource download (Preview) action in Smart Page usage reporting
-     Given the user is in the Smart Page module
-     When the user downloads a resource in Preview quality
-     Then the action should be recorded in the Smart Page usage report
-     And the module name should be displayed dynamically based on the admin settings

## ID: 212

### User Story:

PB - As a User, I want to report on Resource downloaded (Preview) separately than added in Smart Page for Resource Module (Usage)

### Requirements:

1. Be able to track Resource usage reporting and User’s usage reporting - Resource download action that happens in Smart Pages for previously uploaded Resource (Preview type of Resource, aka “Good“ quality) via Resource Lookup

### Manual Scenario:

- Scenario: Track Resource download (Preview) separately in Smart Page usage reporting
-     Given the user is in the Smart Page module
-     And the user performs a Resource lookup in the Smart Page
-     When the user downloads a resource in Preview quality
-     Then the Resource download action should be tracked separately in the usage report
-     And the action should be recorded for the previously uploaded Resource (Preview type)
-     And the action should be reported under the Resource Module (Usage) for Smart Pages

## ID: 213

### User Story:

Rename "Simple" Page to "Smart" Page

### Requirements:

1. Be able to see the keyword updated to “Smart“ Page, instead of “Simple“ Page (front-end) in the Brand Page MVP project scope, see detailed locations to rename the keyword as below: Location to rename

### Manual Scenario:

- Scenario: Rename "Simple" Page to "Smart" Page in the Brand Page MVP
-     Given the user is in the Brand Page MVP project
-     When the user views the front-end pages
-     Then the keyword "Simple Page" should be updated to "Smart Page"
-     And the updated keyword should appear in all the locations specified in the project scope

## ID: 214

### User Story:

PB - (FE components) As a User, I want to move a sub page to become a standalone Simple Page (Parent)

### Requirements:

1.Be able to move a sub-Page to become a standalone Page that doesn’t contain any sub-Page, via drag-and-drop from Navigation Panel on editing mode in Page Builder 2. Be able to see the updated order / hierarchy of Page list from Navigation Panel 3. By default, the page list is in order of Last Updated as the same as V2 index list. Once the Navigation Panel gets re-ordered successfully by a User, the new order of Nav Panel will be updated and remain the latest order on editing and viewing till it gets updated again No snackbar, no undo

### Manual Scenario:

- Scenario: Move a sub-page to become a standalone Page in Page Builder
-     Given the user is in Page Builder in editing mode
-     And the user has a sub-page in the Navigation Panel
-     When the user drags and drops the sub-page from the Navigation Panel
-     Then the sub-page should become a standalone page without any sub-pages
-     And the order and hierarchy of the page list in the Navigation Panel should be updated accordingly
-     And the page list should be ordered by "Last Updated" by default, as per the V2 index list
-     And the new order should be retained in the Navigation Panel during editing and viewing, until the order is updated again
-     And no snackbar or undo action should be displayed for this change

## ID: 215

### User Story:

PB - As a User, I want to re-order pages within the same parent/root via Nav - FE integration

### Requirements:

1. Be able to re-order Pages via drag-and-drop from Nav Panel during editing
2. Sub-pages will be moved all together with Page if it contains any
3. After drag-and-drop of Pages, Sub-pages will be _collapsed_ under Page from Nav Panel
4. Be able to re-order sub-Pages via drag-and-drop within the _same_ parent Page from Nav Panel during editing
5. Be able to re-order root-Pages via drag-and-drop from Nav Panel during editing This ticket does NOT include drag-and-drop across Parent

### Manual Scenario:

- Scenario: Re-order pages and sub-pages within the same parent via drag-and-drop in Navigation Panel
-     Given the user is in Page Builder in editing mode
-     And the user has multiple pages and sub-pages in the Navigation Panel
-     When the user drags and drops a page within the same parent/root in the Navigation Panel
-     Then the page should be re-ordered within the Navigation Panel
-     And if the page contains sub-pages, the sub-pages will be moved together with the page
-     And after drag-and-drop, sub-pages will be collapsed under the parent page in the Navigation Panel
-     And the user should be able to re-order sub-pages within the same parent page by drag-and-drop
-     And the user should be able to re-order root pages by drag-and-drop within the Navigation Panel
-     And the drag-and-drop should not include re-ordering across different parent pages

## ID: 216

### User Story:

PB - As a User, I want to be able to download the resources added to the page, if I have permission to do so - Video widget

### Requirements:

1. Be able to _ONLY_ see the download button as per design to download the added resources on Editing, Previewing & Viewing of Simple Page _by hovering on Widgets_:
2. Video resource from Video Widget
3. Be able to see tooltips “Download“ by hovering on the download button as per design
4. background images won’t be downloadable with native download button experience
5. Resources added via URL won't be directly downloadable but opened in a new tab can downloaded from there Reason: we cannot differentiate internal CDN or external CDN link urls, and the CDN link has its own behaviour in terms of opening it

### Manual Scenario:

- Scenario: User can download video resource added to the page if they have permission
-     Given the user is on a Simple Page in editing, previewing, or viewing mode
-     And the user has permission to download resources
-     And the user is hovering over the Video Widget
-     When the user hovers on the Video Widget
-     Then the download button should appear as per design to download the video resource
-     And the tooltip "Download" should be visible when hovering on the download button
-     And the background images should not be downloadable via the native download button
-     And resources added via URL should not be directly downloadable
-     But will open in a new tab for downloading, if the URL is external or from a CDN link

## ID: 217

### User Story:

PB - As a User, I want to move a sub page to become a standalone Smart Page (Parent)

### Requirements:

1. Be able to move a sub-Page to become a standalone Page that doesn’t contain any sub-Page, via drag-and-drop from Navigation Panel on editing mode in Page Builder
2. Be able to see the updated order / hierarchy of Page list from Navigation Panel
3. By default, the page list is in order of Last Updated as the same as V2 index list. Once the Navigation Panel gets re-ordered successfully by a User, the new order of Nav Panel will be updated and remain the latest order on editing and viewing till it gets updated again no snackbar, no undo

### Manual Scenario:

- Scenario: User moves a sub-page to become a standalone Smart Page
-     Given the user is in editing mode in Page Builder
-     And the user has a sub-page in the Navigation Panel
-     When the user drags the sub-page to the root level in the Navigation Panel
-     Then the sub-page should become a standalone Smart Page without any sub-pages
-     And the page list in the Navigation Panel should reflect the updated hierarchy
-     And the page list should be ordered by "Last Updated" by default
-     And the new order of pages should persist in both editing and viewing modes
-     And no snackbar notification should appear during the move
-     And no undo action will be available after the move

## ID: 218

### User Story:

PB - As a User, I want the status of Resource added via Resource Lookup to be linked with Resource module - resource permission lost scenario

### Requirements:

1. Be able to only see page contents (Resources uploaded previously from resource lookup) against my own permission of the resources (it’s a permission check on the resources from resource module perspective, NOT page permissions)
2. Be able to see placeholders icon in the middle (image/video widget icon) and permission lost icon as per design if the user has no permission on specific resources whilst editing/previewing/viewing the page
3. Be able to see tooltips by hovering on the permission lost icon as per design

### Manual Scenario:

- Scenario: User views page with resources they do not have permission to access
-     Given the user is editing, previewing, or viewing a page with resources added via Resource Lookup
-     And the user does not have permission for some of the resources
-     When the user views a page with those resources
-     Then the user should see a placeholder icon (image/video widget icon) for the resources they do not have permission to access
-     And the user should see a permission lost icon for the resources without permission
-     And the permission lost icon should display a tooltip when hovered over
-     And the resources they do not have permission for should not be visible in the page contents

## ID: 219

### User Story:

PB - As an internal User, I want to set Page limits via MCP settings

### Requirements:

1. Be able to set Page limits on MCP control panel for client sites
2. Page limits are set with a number: 2, by default for a new client created on MCP), which restrict client’s site with a total amount of Drag & Drop Pages could be created by users
3. Location: Platform Restriction area, after Custom Page Limit

### Manual Scenario:

- Scenario: Internal User sets page limits for a client site via MCP control panel
-     Given the internal user is on the MCP control panel
-     And the user is in the Platform Restriction area after the Custom Page Limit section
-     When the internal user sets the page limit for a new client site to a number, for example, 2
-     Then the page limit for the new client site should be restricted to the specified number of Drag & Drop Pages (2 in this case)
-     And the page limit setting should apply to the client's site immediately after creation
-     And users should be unable to create more than the set number of Drag & Drop Pages on the client site

## ID: 220

### User Story:

PB - As a User, I want to see sub-pages in Custom Page v2 index list (with a subtitle for parent)

### Requirements:

1. Be able to see a new row of information: "Parent: {parent page name}" after clicking on "+" button from the v2 index list for _sub-pages_
2. By default, Parent page info along with Added & Last Updated are collapsed and invisible under Page Title
3. Parent Page Name design is the same with Added and Last Updated
4. Be able to click on {parent simple page name} and go to view the parent page

### Manual Scenario:

- Scenario: User sees sub-pages with parent page information in the v2 index list
-     Given the user is on the Custom Page v2 index list
-     When the user clicks on the "+" button for a sub-page
-     Then a new row should be displayed with the subtitle "Parent: {parent page name}" below the sub-page entry
-     And the Parent page info along with Added and Last Updated timestamps should be collapsed and hidden by default under the Page Title
-     And the Parent Page Name should have the same design style as Added and Last Updated
-     When the user clicks on the Parent page name
-     Then the user should be navigated to view the parent page

## ID: 221

### User Story:

PB - As a User, I want to configure permissions of sub-pages in Admin -> Group

### Requirements:

1. Be able to see and configure sub-pages under their parent pages in line with design of resource folder/sub-folders in Admin - Group - Permission
2. Be able to trigger propagation in line with the same logic of resource folder/sub-folders in Admin - Group - Permission

### Manual Scenario:

- Scenario: User configures permissions for sub-pages under their parent pages
-     Given the user is in the Admin -> Group -> Permission section
-     When the user views the list of pages
-     Then the user should be able to see and configure sub-pages listed under their respective parent pages in the same manner as resource folders/sub-folders
-     When the user configures the permissions for a parent page
-     And triggers propagation for permissions
-     Then the permissions should propagate to all sub-pages under that parent page, following the same logic as resource folder/sub-folder permission propagation

## ID: 222

### User Story:

[Bulk Review] Same Template: Needed until - cross date value handling

### Requirements:

1. For Resource Download Requests, as long as requests are tied to the same Template, they can be selected together for Bulk Review regardless of what Needed until/Approved until value setting is, or value is (including no value)

### Manual Scenario:

- Scenario: Select multiple Resource Download Requests for Bulk Review, regardless of Needed until/Approved until values
-     Given the user is in the Bulk Review section for Resource Download Requests
-     When the user selects multiple Resource Download Requests tied to the same Template
-     Then the user should be able to select them together for Bulk Review
-     And the selection should be valid regardless of the Needed until/Approved until value setting, including cases where there is no value

## ID: 223

### User Story:

Review Request' in footer should be plural - change to 'Review Request(s)'

### Requirements:

1. In Bulk Action Footer update ‘Review Request’ to ‘Review Request(s)’

### Manual Scenario:

- Scenario: Change 'Review Request' to 'Review Request(s)' in the footer
-     Given the user is in the Bulk Action section
-     When the footer displays the text 'Review Request'
-     Then the text should be updated to 'Review Request(s)'

## ID: 224

### User Story:

[Bulk SBT] Staged requests: values carry over for staged requests in individual response (should be wiped after stage response is submitted)

### Requirements:

1. When staged requests are present in the Bulk List, and user responds in Bulk - but request remains pending due to further stages being present - then the response fields for that request(s) are cleared (ie, do not retain previous response ‘Apply’ values).
2. User then therefore needs to add response anew, either in single or bulk, for this next stage

### Manual Scenario:

- Scenario: Ensure response fields are cleared after stage response is submitted
-     Given the user has staged requests in the Bulk List
-     When the user responds to the requests in Bulk
-     And the request remains pending due to further stages being present
-     Then the response fields for that request should be cleared and not retain previous response 'Apply' values
-     And the user needs to add a new response for the next stage, either in single or bulk mode

## ID: 225

### User Story:

PB - (DND replace) As a User, I want to create a sub-page for an exisiting Smart Page via Nav

### Requirements:

1. Be able to click on setting button of a simple page from Nav as per design
2. Be able to see the sub-page popup as per design
3. Be able to input the sub page's title and save (change "Done" to "Save")
4. Same validation as Page title input with same design / components
5. Be able to see the field placeholder “Add page name“ before inputing a value as per design
6. Be able to see the the created sub-page name displayed under the parent Page Order: by default, last updated descending aka. most recently updated to least

### Manual Scenario:

- Scenario: Create a sub-page from the navigation panel for an existing Smart Page
-     Given the user is on the Nav panel
-     When the user clicks on the setting button of a Smart Page
-     Then the sub-page popup should appear as per design
-     When the user inputs a sub-page title and clicks "Save"
-     Then the input field should be validated in the same way as the Page title input
-     And the placeholder text "Add page name" should appear before inputting a value
-     And the sub-page should be created under the parent page, with the name displayed in the order of Last Updated descending

## ID: 226

### User Story:

[X-Template] Bulk Approvals - Select logic: Advanced cross template/type select (excluding record requests) - Full support/logic

### Requirements:

1. This ticket expands the support for what other requests can be selected from the Approval List when one item is selected, so that:
   2.If multiple Templates have _Enable Bulk Reviewing_ enabled
2. If the new Admin setting added here is also enabled

### Manual Scenario:

- Scenario: Selecting multiple requests across templates/types for bulk approval
-     Given the user has enabled "Enable Bulk Reviewing" for multiple templates
-     And the new Admin setting for advanced cross template selection is enabled
-     When the user selects one item from the Approval List
-     Then the user should be able to select requests from multiple templates/types, excluding record requests
-     And the selection logic should fully support and handle cross template/type selection as per the new Admin setting

## ID: 227

### User Story:

[RESTRICTIONS] Cross param handling of 'Complete Stage/Complete Request' (merge setting in bulk, apply to relevant in bulk action)

### Requirements:

1. When we can detect that the requests selected for Bulk Review feature a mix of items where some have _Complete Stage_ and some have *Complete Reques*t fields for relevant Admin users (Main Admins and Workflow Admins), then on the Bulk Review panel we merge these settings into one: Name: “_Complete Stage / Request_”
2. When selected, and ‘Applied’, this will update either corresponding field on the single level
3. Ideally, when we can tell no Pending items remain in the list with either option (ie, all that remain are either ‘Complete Stage’ OR ‘Complete Request’) then we update accordingly in Bulk Response.

### Manual Scenario:

- Scenario: Merging 'Complete Stage' and 'Complete Request' fields and applying in Bulk Review
-     Given the user is an Admin (Main Admin or Workflow Admin)
-     And the user selects a mix of requests with some having 'Complete Stage' and others having 'Complete Request' fields
-     When the Bulk Review panel detects the mix of fields
-     Then the settings are merged into one field named "Complete Stage / Request"
-     And the user can apply the merged setting to the selected requests
-     And the corresponding field ('Complete Stage' or 'Complete Request') is updated at the single request level
-     And if no Pending items remain in the list with mixed options
-     Then the Bulk Response updates to show either 'Complete Stage' or 'Complete Request' based on the remaining Pending items

## ID: 228

### User Story:

[RESTRICTIONS] Cross param handling of 'Hide Decline' (hide Decline if all share param, ignore Bulk Apply of Decline to items that don't apply)

### Requirements:

1. When we can detect that the requests selected for Bulk Review feature a mix of items where Hide Decline is enabled and some that do not, then on the Bulk Review response panel we still display Decline as an option
2. When Decline is selected, and this is ‘Applied’ in bulk, this will skip any item where we ‘Hide Decline’ for.
3. Those items will therefore fail submission validation unless they are re-selected for Bulk ‘Approve’ options or approve options are selected individually
4. Ideally, when we can tell all items that remain in Pending in the list all have ‘Hide Decline’ we update accordingly in the Bulk Response, and hide decline from the Bulk response option

### Manual Scenario:

- Scenario: Handling 'Hide Decline' when some requests have it enabled and others do not
-     Given the user is an Admin (Main Admin or Workflow Admin)
-     And the user selects a mix of requests with some having 'Hide Decline' enabled and others not
-     When the Bulk Review panel detects the presence of 'Hide Decline' for some requests
-     Then the Decline option is still displayed in the Bulk Review response panel
-     When the user selects Decline and applies it in bulk
-     Then any items with 'Hide Decline' enabled are skipped and not declined
-     And those items will fail submission validation unless re-selected for Bulk 'Approve' or approved individually
-     And if all items remaining in the Pending list have 'Hide Decline' enabled
-     Then the Bulk Response updates to hide the Decline option from the Bulk response panel

## ID: 229

### User Story:

Bulk Approve Response UUID {createdInBulkId} condition in Stats - so we can see all requests responded to together

### Requirements:

1. In stats module, when Tool is ‘{{Workflow}} Responses’, and either ‘All {{Workflows}}’ or called ‘_Bulk Response UUID_’ is displayed
2. In terms of ordering, this displays under ‘Bulk Review’ in the column dropdown
3. Joining conditions and value behaviour match those for other UUID fields:
4. equals / does not equal / begins with / does not begin with / ends with / does not end with / contains / does not contain
5. Value option is a text field, placeholder text: ‘Value’

### Manual Scenario:

- Scenario: Viewing Bulk Approve Responses with Bulk Response UUID in Stats
-     Given the user is in the Stats module with the Tool set to ‘{{Workflow}} Responses’
-     When the user selects either ‘All {{Workflows}}’ or the ‘*Bulk Response UUID*’ option
-     Then the ‘Bulk Response UUID’ appears under the 'Bulk Review' column dropdown
-     And the Bulk Response UUID column allows filtering by the following conditions:
-       | equals         | does not equal | begins with | does not begin with | ends with | does not end with | contains | does not contain |
-     And the value option for the filter is a text field with the placeholder text ‘Value’

## ID: 230

### User Story:

[RESTRICTIONS] Cross param handling of Comment field (plain text on bulk page regardless of if rich on request)

### Requirements:

1. When we can detect that the requests selected for Bulk Review feature a mix of items where Rich Text Comments is enabled and some that do not, then on the Bulk Review response panel +we only display the plain comments option+
2. Text entered in Basic text on bulk response can be applied to both basic and rich text comment fields on individual level
3. Users can update to rich text on the single level for those relevant requests

### Manual Scenario:

- Scenario: Displaying Plain Text Comments in Bulk Review for Mixed Comment Types
-     Given the user has selected requests for Bulk Review, where some have Rich Text Comments enabled and others do not
-     When the user accesses the Bulk Review response panel
-     Then the system displays only the plain text comment option in the response panel
-     And the user can enter text in the Basic text field in the Bulk Review response
-     And the text entered will be applied to both Basic and Rich Text comment fields on the individual requests
-     When the user updates an individual request
-     Then they can update the comment to Rich Text on requests that support it

## ID: 231

### User Story:

Bulk Approve action Tracking surfacing in Review Request - Responses

### Requirements:

1.This ticket is to add some sort of UI indicator against the Request Status > Response(s) +to denote if response was submitted on the single view, or in bulk+ 2. Purpose of this ticket is, using back end data captured in, marking the individual responses as being made in Bulk by that user 3. As per designs, text will be added to the right of the status chip in the individual response with the below options, either: Bulk Review 4. However if I am viewing another user’s response I see it aligned right of user’s name: 5. Here we will CHANGE this behaviour so that the chip always appears on its own line as per updated Designs

### Manual Scenario:

- Scenario: Displaying Indicator for Responses Submitted in Bulk
-     Given the user is viewing a Review Request with responses
-     When the response is made via Bulk Review
-     Then the system displays an indicator next to the Request Status > Response(s) to denote that the response was submitted in Bulk
-     And the indicator text "Bulk Review" is displayed to the right of the status chip for responses made in bulk
-     And when viewing another user's response, the indicator text "Bulk Review" appears aligned to the right of the user's name
-     When the indicator is displayed
-     Then it should always appear on its own line, as per updated designs

## ID: 232

### User Story:

[RESTRICTIONS] When we detect not all requests have same params we modify Response section (Overall check for non-matching params)

### Requirements:

1. This is the overall ticket to detect when items do not have matching params, in which case we know to modify the bulk response section (how it gets modified will be based on the below listed linked tickets)
2. This ticket is to handle the workflow setting passed to BulkReview component. Previously it’s the workflow setting id which calls BE to fetch the config but now it needs to pass a setting including all params directly.
3. How we handle the UI changes in cross-param scenarios is to be handled in each individual ticket

### Manual Scenario:

- Scenario: Detect and update response when bulk request items have non-matching parameters
-     Given a user submits a bulk request
-     And the request contains items with different parameters
-     When the system detects a parameter mismatch
-     Then the response section should be modified accordingly
-     And the updated response should follow the rules defined in linked tickets

## ID: 233

### User Story:

PB - As a User, I want to see Nav panel when viewing a Simple Page

### Requirements:

1. Be able to see the new extend / collapse button icon from the top left to open the Left Side Panel as Page Nav as per design
2. Be able to see all the saved Simple pages from the Left Side Panel against current user’s permission as per design
3. By default, in oder of Last Updated as the same in v2 index list
4. Be able to see the currently opened page in effect as per design from Nav (background: grey-100, font in bold style)
5. Be able to click on and switch to viewing the designated page For details

### Manual Scenario:

- Scenario: User views and interacts with the Navigation Panel on a Simple Page
-     Given the user is viewing a Simple Page
-     When the user clicks the extend/collapse button in the top left corner
-     Then the Left Side Panel (Page Nav) should open
-     And it should display all saved Simple Pages based on the user’s permissions
-     And the pages should be listed in order of Last Updated
-     And the currently opened page should be highlighted with a grey-100 background and bold font
-     When the user clicks on a different page in the navigation panel
-     Then the designated page should open for viewing

## ID: 234

### User Story:

BP - As a User, I want to single select resources from Resource Lookup with unchangeable filter based on file type in Page Builder

### Requirements:

1. Be able to see and select resources into Page Builder via Resource Lookup with unchangeable filter applied with results by default, depending on the target page area:
2. Page/Section/Block background: Filtering Options > General Options > File Format will be _locked_ with only _Image_ enabled
3. Image Widgets: Filtering Options > General Options > File Format will be _locked_ with only _Image_ enabled

### Manual Scenario:

- Scenario: User selects a resource with a locked file type filter in Page Builder
-     Given the user opens the Resource Lookup in Page Builder
-     When the user views the filtering options
-     Then the "File Format" filter should be locked
-     And it should only allow selecting "Image" file types
-     And the filtered results should be displayed by default based on the target page area
-     When the user selects an image resource
-     Then it should be added to the designated area in Page Builder

## ID: 235

### User Story:

As a user I can only select a max of 300 items to Review in Bulk (FE)

### Requirements:

1.When user has selected 300 total items, then: 2. All other select icons for non-selected items in the list become disabled Hover text: ‘A maximum of 300 Requests has been selected.’ 3. This only displays for items that were previously selectable before limit was reached.

### Manual Scenario:

- Scenario: User selects the maximum allowed items for bulk review
-     Given the user is selecting items for bulk review
-     When the user selects a total of 300 items
-     Then all other select icons for non-selected items should become disabled
-     And a hover text should appear with the message "A maximum of 300 Requests has been selected."
-     And the disable effect should only apply to items that were previously selectable

## ID: 236

### User Story:

Need to add Stage icon in bulk review list for Staged requests

### Requirements:

1. Follow staged icon handling in the Approvals List and add that into the Bulk Review Page list, where relevant
2. Stage may update as requests are responded to, ie we will need to reflect any changes in the stages in the list after bulk actions

### Manual Scenario:

- Scenario: Show and update stage icon for staged requests
-     Given the user is viewing the Bulk Review list
-     When a request has a staged status
-     Then the corresponding stage icon should be displayed as per the Approvals List design
-     And if the request’s stage updates after a bulk action
-     Then the stage icon should dynamically reflect the updated stage

## ID: 237

### User Story:

As a user, I want to see added information saved to request when I click on Navigation buttons for Single Page

### Requirements:

1.This should follow same requirements as in but with the below additional handling to what has already been done in Grouped work: 2. If ‘Complete Stage’ is present and selected/deselected (either via bulk apply, or single) then this is retained on the individual item level as user navigates between items (either toggles, save & next, or clicking out of single > back to list > back to single) 3. If ‘Hide Decline’ feature is enabled, then only ‘Approve’ or ‘Approve with Comments’ (when that is enabled) can be selected. This should also be retained on the individual item level as user navigates between items (either toggles, save & next, or clicking out of single > back to list > back to single)

### Manual Scenario:

- Scenario: Preserve request details when navigating between items
-     Given the user is viewing a request in Single Page view
-     And has updated information on the request
-     When the user navigates to another request using navigation buttons
-     Then the added information should be saved for the individual request
-     And it should be retained when the user navigates back to the request

## ID: 238

### User Story:

As a user I want to see 'Bulk Review' in bulk review page header (page name)

### Requirements:

1. When Bulk Review page is opened, as done in, name of page is simply ‘Bulk Review’

### Manual Scenario:

- Scenario: Show correct page name in Bulk Review header
-     Given the user navigates to the Bulk Review page
-     When the page loads
-     Then the page header should display the title "Bulk Review"

## ID: 239

### User Story:

As a user I can Bulk Submit (updates from Grouped work)

### Requirements:

1. Behaviour here should follow the same as it does in Grouped Review page, including: Submit & Continue button hover tooltip text, Snackbars after Submit
   2.Actual Submit processing logic, including updating the item in the list accordingly after successful submit
2. Behaviour here need extra check, including: Able to complete staged request multiple times to proceed its stage until completed
   4.The Complete Stage works for last stage completion
3. Able to save staged request with mixed current stage

### Manual Scenario:

- Scenario: User bulk submits updates and completes staged requests
-     Given the user is on the Bulk Review page
-     When the user clicks the "Submit & Continue" button
-     Then the button should show the correct hover tooltip text
-     And the system should display the appropriate snackbar after the submit
-     And the items in the list should be updated accordingly after a successful submit
-     And the user should be able to complete staged requests multiple times until they reach the last stage
-     And the "Complete Stage" should mark the request as completed when in the last stage
-     And the user should be able to save staged requests with mixed current stages

## ID: 240

### User Story:

As a user I can Bulk Apply (updates from Grouped work)

### Requirements:

1. Behaviour here should follow the same as it does in Grouped Review page, including: Apply count in button , Button hover tooltip text for enable + disable views,Snackbars
2. Actual apply logic
   3.Behaviour here need extra check, including:
3. Complete Request/Stage depends on Requests are staged requests and it’s current stage, or single requests

### Manual Scenario:

- Scenario: User applies updates in bulk and completes staged requests
-     Given the user is on the Bulk Review page
-     When the user clicks the "Apply" button
-     Then the button should display the correct apply count
-     And the button should show the appropriate hover tooltip text for enabled and disabled views
-     And the system should display the appropriate snackbar after applying the updates
-     And the apply logic should be processed successfully
-     And the "Complete Request/Stage" functionality should depend on whether the requests are staged and their current stage, or if they are single requests

## ID: 241

### User Story:

As a user I want to click 'Review Request' action in action dropdown in footer to open Bulk Approve Page (action redirect)

### Requirements:

1. When Bulk ‘Review Request’ action is clicked, as done in, then the Bulk Review Request page opens
   2.This ticket is specifically to handle the load/re-direct of user from Bulk List to the page, with subsequent ticket to handle the page UI (and reusability of Grouped Review page)
2. If user closes this page, they are returned to the Approvals List
3. Previously selected items are still selected and Bulk Footer still displays in this scenario

### Manual Scenario:

- Scenario: User clicks 'Review Request' action and is redirected to Bulk Approve Page
-     Given the user is on the Bulk List page
-     When the user clicks the 'Review Request' action in the footer dropdown
-     Then the user should be redirected to the Bulk Review Request page
-     And if the user closes the Bulk Review Request page
-     Then they should be returned to the Approvals List
-     And the previously selected items should still be selected
-     And the Bulk Footer should still be displayed

## ID: 242

### User Story:

As a user I want to see 'Review Request' bulk action in action dropdown in footer

### Requirements:

1. When one item’s checkbox is selected, the Bulk Action footer bar displays
2. When user clicks into ‘Select Bulk Action’ dropdown, the ‘Review Request’ action displays as per designs Clicking/action/redirect then handled in

### Manual Scenario:

- Scenario: User sees 'Review Request' in Bulk Action dropdown
-     Given the user has selected at least one item in the list
-     When the user views the Bulk Action footer bar
-     Then the Bulk Action footer bar should be displayed
-     When the user clicks into the 'Select Bulk Action' dropdown
-     Then the 'Review Request' action should be visible as per the design

## ID: 243

### User Story:

As a user I want to check cancel in footer to clear the select of all selected requests

### Requirements:

1. When one item’s checkbox is selected, the Bulk Action footer bar displays 'Cancel' action shows on right side of footer
2. Any items that were selected in the list are now de-selected
   3.This means the checkbox for any enabled item in the list may now display again as selectable

### Manual Scenario:

- Scenario: User clicks 'Cancel' to clear all selected requests
-     Given the user has selected at least one item in the list
-     When the Bulk Action footer bar is displayed
-     And the user clicks the 'Cancel' action in the footer
-     Then all selected items should be de-selected
-     And the checkbox for any enabled item in the list should become selectable again

## ID: 244

### User Story:

As a user the Bulk Action Footer bar displays when one relevant item is selected

### Requirements:

1. When one item’s checkbox is selected, the Bulk Action footer bar displays
2. For Beta the ‘Select All’ action from existing footer bar will have to be hidden in this location
3. For Beta the ‘View Selected’ text/feature will have to be hidden in this location
4. When all items are de-selected the Bulk Action footer no longer displays

### Manual Scenario:

- Scenario: User selects an item and sees the Bulk Action footer bar
-     Given the user has selected one item in the list
-     When the item’s checkbox is selected
-     Then the Bulk Action footer bar should be displayed
-     And the 'Select All' action and 'View Selected' text should be hidden for Beta
-     When all items are de-selected
-     Then the Bulk Action footer bar should no longer be displayed

## ID: 245

### User Story:

As a user I only see the checkbox _column_ when relevant (core mcp / template level check)

### Requirements:

1. The new column for the Bulk Actions Checkboxes to display as per designs when: MCP development setting from is enabled
2. at least one active Template has the new setting enabled, as per
3. If MCP development setting is disabled, or if the new setting in Admin > Templates is disabled for all Templates, the the column no longer appears for any user

### Manual Scenario:

- Scenario: User sees the checkbox column when relevant settings are enabled
-     Given the MCP development setting is enabled
-     And at least one active Template has the new setting enabled
-     When the user views the list
-     Then the checkbox column for Bulk Actions should be displayed as per the design
-     And if the MCP development setting or the new setting in Templates is disabled, the checkbox column should not appear

## ID: 246

### User Story:

Bulk Approvals - MCP Development Setting

### Requirements:

1. Add new MCP setting in development section: 2._Approvals - Approvals List (V3) - Bulk Approvals (development use only)_
   3.. All further related Bulk Approval project development in sprint 203 to be tied to this setting

### Manual Scenario:

- Scenario: Add new MCP setting for Bulk Approvals
-     Given the user is in the development section of MCP settings
-     When a new MCP setting named "Approvals - Approvals List (V3) - Bulk Approvals (development use only)" is added
-     Then the new setting should be available for further related Bulk Approval project development in sprint 203
-     And all Bulk Approval development work in sprint 203 should be tied to this setting

## ID: 247

### User Story:

PB - As a User, I want to single-select resource from resource module overlay

### Requirements:

1. Be able to _single-select resources only_ to save the select from the overlay and then upload to designated area in Page Builder: Image type resource for background of ,Page/Section/Block,Image, video, -or audio- type resource for Widgets: Image/Video/-Audio-
2. Be able to see the tooltips on exit button from top right corner (Currently in Database resource lookup overlay, the tooltips explains user flows of Database Records, which should be amend to be Simple Pages
3. Tooltip message: "Close overlay. No selections will be added."

### Manual Scenario:

- Scenario: User selects a resource and sees tooltip on exit button
-     Given the user is in the resource module overlay
-     When the user selects a single resource for the designated area in Page Builder
-     Then the selected resource should be saved and uploaded to the designated area (Image for background or Image/Video/Audio for Widgets)
-     And when the user hovers over the exit button in the top right corner
-     Then the tooltip should display the message "Close overlay. No selections will be added."
-     And the tooltip message should explain the user flows of Simple Pages instead of Database Records

## ID: 248

### User Story:

PB - As a User, I want to report Create Page action in the usage reporting

### Requirements:

1. Be able to see Simple Page reporting on Create action
2. User Usage Report
3. Custom Page Usage Report
4. Be able to search and export the Report on create action
5. To note: the searching rules and displaying will be natively handled

### Manual Scenario:

- Scenario: User can see Create Page action in usage reporting
-     Given the user is in the Usage Reporting section
-     When the user looks at the usage reports
-     Then the Create action for Simple Page should be visible in the User Usage Report
-     And the Create action for Simple Page should be visible in the Custom Page Usage Report
-     And the user should be able to search for and export the Create Page action report
-     And the searching rules and display should be handled natively

## ID: 249

### User Story:

PB - As a User, I want to report Edit Page action in the usage reporting

### Requirements:

1. Be able to see Simple Page reporting on Edit action
2. User Usage Report
3. Custom Page Usage Report
4. Be able to search and export the Report on Edit action
5. To note: the searching rules and displaying will be natively handled

### Manual Scenario:

- Scenario: User can see Edit Page action in usage reporting
-     Given the user is in the Usage Reporting section
-     When the user views the usage reports
-     Then the Edit action for Simple Page should be visible in the User Usage Report
-     And the Edit action for Simple Page should be visible in the Custom Page Usage Report
-     And the user should be able to search for and export the Edit Page action report
-     And the searching rules and display should be handled natively

## ID: 250

### User Story:

PB - As a User, I want to report Delete Page action in the usage reporting

### Requirements:

1. Be able to see Simple Page reporting on Delete action
2. User Usage Report
3. Custom Page Usage Report
4. Be able to search and export the Report on Delete action
5. To note: the searching rules and displaying will be natively handled

### Manual Scenario:

- Scenario: User can see Delete Page action in usage reporting
-     Given the user is in the Usage Reporting section
-     When the user views the usage reports
-     Then the Delete action for Simple Page should be visible in the User Usage Report
-     And the Delete action for Simple Page should be visible in the Custom Page Usage Report
-     And the user should be able to search for and export the Delete Page action report
-     And the searching rules and display should be handled natively

## ID: 251

### User Story:

PB - As a User, I want to report View Page action in the usage reporting

### Requirements:

1. Be able to see Simple Page reporting on View action User Usage Report, Custom Page Usage Report
2. Be able to search and export the Report on View action
3. Be able to see Simple Page (as a type of Custom Pages) counts in User/Group Reports,Top Groups by Page Views, Top Users by Page Views, Content Reports, Top Viewed Custom Pages

### Manual Scenario:

- Scenario: User can see View Page action in usage reporting
-     Given the user is in the Usage Reporting section
-     When the user views the usage reports
-     Then the View action for Simple Page should be visible in the User Usage Report
-     And the View action for Simple Page should be visible in the Custom Page Usage Report
-     And the user should be able to search for and export the View Page action report
-     And the user should be able to see Simple Page counts in the following reports:
-       | User/Group Reports             | Top Groups by Page Views   | Top Users by Page Views  | Content Reports          | Top Viewed Custom Pages  |
-     And these reports should include Simple Page as a type of Custom Page

## ID: 252

### User Story:

PB - As a User, I want to set Page/Section/Block/Widgets Colour in Opacity

### Requirements:

1. Be able to set Page/Section/Block 's background, Colour Palette Widget 's Colour, Button Widget's Text & Background in opacity as per design
2. Be bale to se the transparency / opacity via the opacity bar blow the hue bar as per design
3. Be able to see Hex code (8 digital) simultaneously updated, given the configuration against the opacity bar, hue bar, and colour swatch altogether
4. If the target background has been set with opacity, users can see the content through it given the opacity % from behind/front layers

### Manual Scenario:

- Scenario: User sets opacity for Page/Section/Block and Widgets
-     Given the user is editing the Page/Section/Block or Widget
-     When the user adjusts the opacity using the opacity bar below the hue bar
-     Then the Page/Section/Block background, Colour Palette Widget's Colour, and Button Widget's Text & Background should reflect the opacity setting as per the design
-     And the Hex code (8 digital) should be updated simultaneously with the opacity and hue bar configuration
-     And if the background has opacity set, the content behind the background should be visible based on the opacity percentage from the front and back layers

## ID: 253

### User Story:

PB - (Misc) As a User, I want to have a standard Text Widget - Link input without a placeholder

### Requirements:

1. Be able to see text widget link popup as per design
2. If users only input a valid web link without having a “https://“ prefix , the updated text link should still be always accessible with “http://“ or “https://“ to the front after clicking and opening it in the new browser tab

### Manual Scenario:

- Scenario: User inputs a valid link in the Text Widget without a placeholder
-     Given the user is editing the Text Widget
-     When the user clicks on the link input popup
-     Then the link input should be displayed as per the design without a placeholder
-     When the user enters a valid web link without the "https://" prefix
-     Then the link should automatically be updated to include "http://" or "https://" when opened in a new browser tab
-     And the link should be accessible with the updated "http://" or "https://" prefix

## ID: 254

### User Story:

As a User, I want to access Reply action for New Replies in Daily Digest Email

### Requirements:

1. Be able to see and click on "Reply" as per design
2. Be able to re-direct to the Reply page in new tab
3. Be able to have applicable comment highlighted ready to reply to & text-box will be active as well

### Manual Scenario:

- Scenario: User can access and reply to new comments from the Daily Digest Email
-     Given the user receives a Daily Digest Email with new replies
-     When the user clicks on the "Reply" action as per the design
-     Then the user should be redirected to the Reply page in a new tab
-     And the applicable comment should be highlighted and ready to reply to
-     And the text box should be active and ready for the user to type a response

## ID: 255

### User Story:

PB - (Misc) As a User, I want to differentiate page saving between creating a new and editing an existing Simple Page

### Requirements:

1. Be able to differentiate two scenarios while saving a Simple Page in Simple Page Builder
2. Be able to save the Simple Page then refresh to go to its Editing Page URL in editing mode, when first-time creating a new Simple page (page with create URL, via Create process)
3. Be able to save the Simple Page with the latest contents, when editing an existing Simple Page (page with update URL, via Edit action process or from the process above) and then stay on the Page in editing mode, meanwhile, cannot continue to save
4. Be able to continue to save the Simple Page with latest contents if there are new editing actions on this Simple Page

### Manual Scenario:

- Scenario: User differentiates saving actions between creating and editing a Simple Page
-     Given the user is in the Simple Page Builder
-     When the user creates a new Simple Page and saves it
-     Then the page should be saved and the user should be redirected to its Editing Page URL in editing mode
-     And when the user edits an existing Simple Page and saves it
-     Then the latest content should be saved and the user should remain on the page in editing mode
-     And the user should not be able to save again unless new edits are made

## ID: 256

### User Story:

PB - (Misc) As a User, I want to have custom fonts in SPB text widget

### Requirements:

1. Be able to have client’s custom fonts supported in Text Widget from Simple Page Builder
2. Be able to choose custom fonts from the font drop-down menu
3. Be able to see the applicable custom font contents during editing / previewing / viewing

### Manual Scenario:

- Scenario: User can choose and view custom fonts in the Text Widget
-     Given the user is editing a Text Widget in Simple Page Builder
-     When the user opens the font drop-down menu
-     Then the user should be able to choose from available custom fonts
-     And the selected custom font should be applied to the Text Widget content during editing
-     And the applicable custom font should be visible in both the preview and the final view of the page

## ID: 257

### User Story:

PB - (Misc) As a User, I want to set Spacing (aka. Gap) in between Blocks that added in a Section

### Requirements:

1. Be able set spacing for Section from side panel as per design
2. Be able to see “Spacing” as title as per design
3. Be able to see “GAP BETWEEN OBJECTS” as per design in between “Spacing” title and the slider
4. Be able to have default spacing value: 8px
5. Be able to have spacing range: From: 0px to 512px

### Manual Scenario:

- Scenario: User can set spacing (gap) between blocks in a Section
-     Given the user is editing a Section in the Simple Page Builder
-     When the user opens the side panel
-     Then the user should see "Spacing" as the title in the panel
-     And the user should see "GAP BETWEEN OBJECTS" between the title and the slider
-     And the user should see the default spacing value set to 8px
-     And the user should be able to adjust the spacing using a slider within the range of 0px to 512px
-     And the spacing should be applied to the blocks in the Section as per the selected value

## ID: 258

### User Story:

PB - As a User, I want to select a Simple Page in my Admin > Templates > Menu options

### Requirements:

1. Be able to list out created custom pages, incl. Simple Pages to add in Navigation in Admin template
2. Be able to save the setting
3. Be able to reset the setting

### Manual Scenario:

- Scenario: User selects a Simple Page in Admin Templates Menu
-     Given the user is in the Admin > Templates section
-     When the user navigates to the Menu options
-     Then the user should be able to see a list of created custom pages, including Simple Pages
-     And the user should be able to select a Simple Page to add to the Navigation
-     When the user saves the setting
-     Then the selected Simple Page should be added to the Navigation
-     And the user should be able to reset the setting and remove the Simple Page from the Navigation

## ID: 259

### User Story:

PB - As a Admin User, I want to update the permission in the Admin - Group(include user as group) for individual pages in the module, incl. Simple Pages

### Requirements:

1. Be able to update permissions in Admin module for individual pages, incl. Simple Pages
2. Be able to use the data loaded in the Filters will follow the setup in Admin - Filters
3. Be able to see Simple Page permission configuration in native design
4. AC: could include the default permission rules

### Manual Scenario:

- Scenario: Admin user updates permissions for individual pages including Simple Pages
-     Given the Admin user is in the Admin > Group section
-     When the Admin user selects an individual page, including a Simple Page
-     Then the Admin user should be able to update the permissions for the selected page
-     And the Admin user should be able to apply filters that follow the setup in Admin > Filters
-     When the Admin user views the permission configuration
-     Then the Simple Page permissions should be displayed in the native design
-     And the default permission rules should be applied as per the configuration

## ID: 260

### User Story:

PB - (Misc) As a User, I want to adjust Text colour simultaneously when interacting within the Text Widget's colour popup

### Requirements:

1. Be able to have a Text Colour icon within Text Widget tool bar as per design
2. Be able to click on Text Colour icon and adjust Text Colour simultaneously when using the colour swatch popup as per design
3. Be able to (_can do either a OR b_)
4. click on _any other area_ to dismiss the colour swatch popup, _OR_
5. click on the Text Colour icon again (see screenshot) to dismiss the colour swatch popup

### Manual Scenario:

- Scenario: User adjusts text colour in the Text Widget
-     Given the user is editing text within the Text Widget
-     When the user clicks on the Text Colour icon in the toolbar
-     Then the colour swatch popup should appear as per design
-     When the user selects a colour from the swatch
-     Then the text colour should update simultaneously in real-time
-     And the user should be able to dismiss the colour swatch popup by either:
-       * Clicking on any other area
-       * Clicking on the Text Colour icon again

## ID: 261

### User Story:

PB - As a User, I want to edit a Block

### Requirements:

1. Be able to set padding for Left, Right, Top, Bottom (0px by default) from Side Panel Range: 0 px - 512 px
2. Be able to set ratio (as same as it currently is in POC) Range: 1 - 3
3. Be able to set Background Image / Colour from Side Panel

### Manual Scenario:

- Scenario: User edits a Block's properties
-     Given the user is in the Simple Page Builder and has selected a Block
-     When the user adjusts the padding for Left, Right, Top, or Bottom from the Side Panel
-     Then the padding value should be updated accordingly with a range of 0px to 512px
-     When the user sets the ratio from the Side Panel
-     Then the Block’s ratio should update with a range of 1 to 3
-     When the user selects a Background Image or Colour from the Side Panel
-     Then the Block should reflect the chosen Background Image or Colour as per the selection

## ID: 262

### User Story:

PB - As a User, I want to add a Section to a Simple Page

### Requirements:

1. Be able to add a Section to a Simple Page from Side Panel
2. Be able to only contain Block (up to 12)
3. Be able to have customised background Image / Colour by configuring from Side Panel
4. Be able to customise direction: vertical / horizontal in order to drag more Blocks into by configuring from Side Panel

### Manual Scenario:

- Scenario: User adds a Section to a Simple Page
-     Given the user is in the Simple Page Builder
-     When the user adds a new Section from the Side Panel
-     Then the Section should be added to the Simple Page
-     When the user attempts to add Blocks to the Section
-     Then the Section should allow up to 12 Blocks
-     When the user configures the Section’s background with an Image or Colour from the Side Panel
-     Then the Section should reflect the selected background settings
-     When the user sets the direction of the Section to vertical or horizontal
-     Then the Section should adjust its layout accordingly to allow dragging more Blocks

## ID: 263

### User Story:

PB - As a User, I want to delete a Block

### Requirements:

1. Be able to select and see the tool bar then click on the delete icon to delete the block
2. Be able to delete the Block and all Contents within
3. Be able to trigger Undo and revert back if click on undo
4. Be able to see the remaining Blocks auto-aligned within a Section if the target Block gets deleted

### Manual Scenario:

- Scenario: User deletes a Block from a Simple Page
-     Given the user is in the Simple Page Builder
-     And the user has added at least one Block to a Section
-     When the user selects a Block
-     Then the toolbar should appear with a delete icon
-     When the user clicks on the delete icon
-     Then the Block and all its contents should be removed
-     When the user clicks "Undo"
-     Then the deleted Block and its contents should be restored
-     When a Block is deleted
-     Then the remaining Blocks should auto-align within the Section

## ID: 264

### User Story:

PB - As a User, I want to re-order Blocks, so I can re-order the Widgets within

### Requirements:

1. Be able select the Block and see the tool bar then click & hold on the Reorder icon to drag and drop the Block as per design
   2.Be able to drag and drop to another Block area to switch position within the same Section, thereby reordering the Blocks
2. Be able to drag and drop the Block to another Block area and switch position- _-across different Sections-_-, thereby reordering the blocks

### Manual Scenario:

- Scenario: User reorders a Block within the same Section
-     Given the user is on the Simple Page Builder
-     And there are multiple Blocks within a Section
-     When the user selects a Block
-     And clicks and holds the Reorder icon
-     And drags the Block to a new position within the same Section
-     Then the Block should be placed in the new position
-     And the updated order should be reflected immediately

## ID: 265

### User Story:

PB - As a User, I want to have an Image Widget (via URL)

### Requirements:

1. Be able to add Image Widget to a Block by dragging the icon from side panel as per design
2. Be able to see the image placeholder icon as per design for that added image widget before inputing a valid image URL
3. Be able to still see the image placeholder icon if the URL won’t work in any way (means the image cannot display)
4. Be able to see the Image via inputing/updating Image Resource URL from side Panel as per design (URL input placeholder: “Enter URL“)

### Manual Scenario:

- Scenario: User adds an Image Widget and inputs a valid URL
-     Given the user is on the Simple Page Builder
-     And the user has added a Block to the page
-     When the user drags the Image Widget from the side panel into the Block
-     Then the Image Widget should display a placeholder icon
-     When the user enters a valid image URL in the side panel
-     Then the Image Widget should display the image from the provided URL

## ID: 266

### User Story:

PB - As a User, I want to edit Colour in Text Widget (excl. eye dropper)

### Requirements:

1. Be able to edit Rich Text Editor for Text Widget Colours:
2. Be able to have the built-in Colour Swatch in Rich Text Editor as per design
   3.Be able to change the colour of Text within Text Widget via Colour Swatch or picking up from the page

### Manual Scenario:

- Scenario: User changes text color using the built-in color swatch
-     Given the user is on the Simple Page Builder
-     And the user has added a Text Widget to a Block
-     When the user selects text within the Text Widget
-     And the user clicks on the Text Color icon in the Rich Text Editor toolbar
-     And the user selects a color from the built-in Color Swatch
-     Then the selected text should change to the chosen color

## ID: 267

### User Story:

PB - As a User, I want to have a Text Widget

### Requirements:

1. Be able to call the rich text editor and use it within the Block, not in right side Panel
2. Be able to have the same default functionalities as per current custom page V3 rich text editor including: Size, Bold, Italic,Strike-through, Underline Alignment
3. Be able to auto-extend the height of text box by inputing contents, without limitation
4. Be able to delete

### Manual Scenario:

- Scenario: User adds and edits a Text Widget in a Block
-     Given the user is on the Simple Page Builder
-     And the user has added a Block to a Section
-     When the user drags a Text Widget into the Block
-     Then the rich text editor should appear within the Block, not in the right-side panel
-     When the user types text into the Text Widget
-     Then the text box should auto-extend in height as content is added
-     When the user applies formatting options such as Bold, Italic, Underline, or Alignment
-     Then the text should reflect the selected formatting
-     When the user deletes the Text Widget
-     Then it should be removed from the Block

## ID: 268

### User Story:

PB - As a User, I want to add a Widget to Block

### Requirements:

1. Be able to drag one widget from the widget toolbar to one target existing Block
2. Be able to edit on the added widget from default size according to different widget types: Image, Text, Colour Palette
3. Be able to disappear if the widget dragged outside any Blocks

### Manual Scenario:

- Scenario: User adds a widget to a Block
-     Given the user is on the Simple Page Builder
-     And the user has an existing Block in the Section
-     When the user drags a widget (Image, Text, Colour Palette) from the widget toolbar
-     Then the widget should be added to the target Block
-     When the user edits the widget
-     Then the widget should adjust its size according to the widget type (Image, Text, Colour Palette)
-     When the user drags the widget outside of any Block
-     Then the widget should disappear

## ID: 269

### User Story:

PB - As a User, I want to move Widgets across Blocks

### Requirements:

1. Be able to reorder added Widget across Blocks in the same Section by clicking and holding the reorder icon as per design, only if the target Block is empty
2. Be able to reorder added Widget across Blocks to a different Section by clicking and holding the reorder icon as per design, only if the target Block is empty
3. Be able to see selecting and hovering effects while dragging and reordering widgets across

### Manual Scenario:

- Scenario: User moves a widget to another Block within the same Section
-     Given the user is on the Simple Page Builder page
-     And there are multiple widgets in different Blocks within the same Section
-     And the target Block is empty
-     When the user clicks and holds the reorder icon of a widget
-     And drags the widget to the target Block within the same Section
-     Then the widget should be successfully moved to the target Block
-     And the user should see selecting and hovering effects while dragging the widget
-

## ID: 270

### User Story:

PB - As a User, I want to Undo & Redo any editing actions on Simple Page

### Requirements:

1. Be able to have Undo & Redo action buttons, see button designs
2. Be able to click on Undo or Redo the previous edit action on sections / widgets / contents within Simple Page Builder
3. Be able to hover on Undo or Redo buttons and see tooltips

### Manual Scenario:

- Scenario: User undoes and redoes an editing action in Simple Page Builder
-     Given the user is on the Simple Page Builder page
-     And the user has made multiple edits to sections, widgets, or contents
-     When the user clicks on the "Undo" button
-     Then the most recent edit action should be reverted
-     When the user clicks on the "Redo" button
-     Then the previously undone action should be reapplied
-     And the Undo and Redo buttons should function as expected

## ID: 271

### User Story:

PB - As a User, I want to edit an existing Simple page in Simple Page Builder

### Requirements:

1. Be able to update the page with loaded pre-saved contents
2. Be able to update the page with URL
3. Be able to click on save/publish to save the updates/changes made

### Manual Scenario:

- Scenario: User edits an existing Simple page and saves the changes
-     Given the user is on the Simple Page Builder page
-     And the user has an existing Simple Page with pre-saved content loaded
-     When the user makes changes to the content on the page
-     And the user clicks on the "Save" or "Publish" button
-     Then the updates to the Simple Page should be saved and published
-     And the URL of the Simple Page should remain the same
-     And the user should see a confirmation message indicating that the changes were saved successfully

## ID: 272

### User Story:

PB - As a Dev, I want to have a dev only MCP setting to control the feature of Simple Page Builder

### Requirements:

1. Be able to see the dev-use only MCP setting that located at WITHIN Development Use Only Area
2. Be able to enable / disable the use of simple page builder and the new type: Simple Page for development use only
3. Unable to view the Simple Page option from page creation popup, thereby no access to Simple Page Builder if disable MCP setting

### Manual Scenario:

- Scenario: Developer enables or disables Simple Page Builder via MCP setting
- Given the developer is in the Development Use Only area of the settings
- When the developer enables the MCP setting for Simple Page Builder
- Then the Simple Page option should be visible in the page creation popup
- And the developer should be able to access and use Simple Page Builder
- When the developer disables the MCP setting for Simple Page Builder
- Then the Simple Page option should be hidden in the page creation popup
- And the developer should not be able to access Simple Page Builder

## ID: 273

### User Story:

As a user, I want to see footer actions like cancel, save as draft, next and submit (Single Database)

### Requirements:

1.When MCP is ON 2. Create a footer component to replace {{renderButtonRow}} in recordForm 3. Pages (with and without worlkflow) 4. No Pages (with and without worlkflow)

### Manual Scenario:

- Scenario: Display Footer Component in Record Form When MCP is ON
- Given the MCP setting is enabled
- When the user is on a record form
- Then the footer component should replace {{renderButtonRow}}
- And the footer should be displayed for pages with and without workflow
- And the footer should be displayed for records without pages, with and without workflow

## ID: 274

### User Story:

As a user, I want to easily identify where a section starts and ends

### Requirements:

1.When MCP setting is on
2.Background color on sections 3. border-radius for sections 4. border around section

### Manual Scenario:

- Scenario: Apply Background Color, Border-Radius, and Border to Sections When MCP is ON
- Given the MCP setting is enabled
- When the user views a section
- Then the background color should be applied to the section
- And the section should have a border-radius as per design
- And the section should have a border around it
-
-
-
-
-
-
-

## ID: 275

### User Story:

As a user, I want to be able to change the width of the form

### Requirements:

1. Expand/Collapse icon
2. On click it changes the width of the form and also the footer
3. Expand/Collapse state doesn’t persist when record is closed

### Manual Scenario:

- Scenario: Expand/Collapse Icon Adjusts Form and Footer Width Without Persisting State
- Given the user is viewing a record form
- When the user clicks on the Expand/Collapse icon
- Then the form width should adjust accordingly
- And the footer width should also adjust to match the form
- But when the record is closed and reopened, the Expand/Collapse state should reset to default

## ID: 276

### User Story:

As a user, I want to be able to close the record

### Requirements:

1. Record can be closed by clicking the {{X }} ghost button on the right hand of the header AND the Close button in the footer.
2. When in Edit and Create mode and changes have been made, when record is closed a dialog is displayed warning of the unsaved changes
3. Warning message: Change to ib-ui/dist/DialogNew and Change message (see comment from Eva)

### Manual Scenario:

- Scenario: Closing a Record and Handling Unsaved Changes Warning
- Given the user is in Edit or Create mode
- And the user has made changes to the record
- When the user clicks the (X) ghost button in the header OR the Close button in the footer
- Then a dialog should be displayed warning the user about unsaved changes
- And the warning message should be updated as per ib-ui/dist/DialogNew
- When the user confirms the action, the record should close
- But if the user cancels, the record should remain open

## ID: 277

### User Story:

As a user, I want to be able to see the actions when in view and update mode

### Requirements:

1. Show actions in View and Update mode

### Manual Scenario:

- Scenario: Displaying Actions in View and Update Mode
- Given the user is viewing or updating a record
- When the record is opened in View mode
- Then the available actions should be displayed as per the design
- And the actions should be accessible based on user permissions
- When the record is opened in Update mode
- Then the actions should also be displayed, allowing the user to perform relevant updates
-
-
-
-
-
-
-

## ID: 278

### User Story:

As a user, I want to see the seq ID of the record in the header

### Requirements:

1. Display sequence ID in a Chip component
2. Sequence id truncates with tooltip to display value
3. Copy icon and ability to copy

### Manual Scenario:

- Scenario: Displaying Sequence ID in a Chip Component with Truncation and Copy Functionality
- Given the user is viewing a record with a Sequence ID
- When the Sequence ID is displayed
- Then it should be shown inside a Chip component
- And if the Sequence ID is too long, it should be truncated
- And when the user hovers over the truncated Sequence ID, a tooltip should appear displaying the full value
- And a copy icon should be available next to the Sequence ID
- When the user clicks the copy icon
- Then the full Sequence ID should be copied to the clipboard
- And a confirmation message should appear indicating that the ID has been copied successfully

## ID: 279

### User Story:

As a user, I want to see the status of the record in the header

### Requirements:

1.Possible values:Draft, Archived

### Manual Scenario:

- Scenario: Display Possible Values for a Record Status
- Given the user is viewing or updating a record
- When the status field is displayed
- Then the possible values for the status should be "Draft" and "Archived"
- And the user should only be able to select between these two values
-
-
-
-
-
-
-

## ID: 280

### User Story:

As a user, I want to see the database name and record name in the header

### Requirements:

1. Replace with ib-ui Overlay component (Change in Typography, buttons? etc) (Note: this will affect other usage of OverlayHeader)
2. Display Database name (Database Name is clickable)
3. Display Record Name
4. Truncates (see design)with tooltip to display value

### Manual Scenario:

- Scenario: Update Overlay Component to Use ib-ui Overlay and Display Database & Record Information
- Given the user is viewing a record in an overlay
- When the ib-ui Overlay component is used
- Then the typography and button styles should be updated according to the new design
- And the overlay header should display the database name
- And the database name should be clickable
- And the overlay header should display the record name
- And if the database name or record name is too long, it should be truncated with a tooltip displaying the full value

## ID: 281

### User Story:

PB - As a User, I want the status of background Image added via Resource Lookup to be linked with Resource module

### Requirements:

1. Be able to _link the status_ of the the background Image _with the derived Image resources in Resource Module_ if it has been added as _Page_ or _Section_ background in Page Builder via Resource Lookup

### Manual Scenario:

- Scenario: Link Background Image Status with Derived Image Resources in Resource Module
- Given a background image has been added as a Page or Section background in Page Builder via Resource Lookup
- When the background image exists in the Resource Module
- Then the status of the background image should be linked with the derived image resources in the Resource Module
- And any changes in the background image status (e.g., active, archived, or deleted) should be reflected in the linked image resources

## ID: 282

### User Story:

PB - (Misc) As a User, I want to select and upload more file formats via Resource Lookup in Page Builder

### Requirements:

1. Be able to select and upload those file formats based on the feasible quality automatically as default (skipping the quality selection popup)
2. load these file formats with _Good_ quality _automatically_ (_skip_ the quality popup) after adding from Resource lookup since Best quality are not displaying for:

### Manual Scenario:

- Scenario: Automatically Select and Upload File Formats with Good Quality
- Given a user is uploading files through the Resource Lookup
- When the file formats are selected based on feasible quality
- Then the system should automatically select and upload these file formats with 'Good' quality
- And the quality selection popup should be skipped
- And the files should load with 'Good' quality by default since 'Best' quality is not displaying for these formats

## ID: 283

### User Story:

Guest Upload MVP: Add in new temporary MCP settings for this project

### Requirements:

1. New child settings to be added under parent _Database - Public Records & Uploads (development use only)_
2. When parent is enabled, child settings below display:

### Manual Scenario:

- Scenario: Display Child Settings When Parent Setting is Enabled
- Given the parent setting "Database - Public Records & Uploads (development use only)" exists
- When the parent setting is enabled
- Then the new child settings should be displayed under this parent setting

## ID: 284

### User Story:

Guest Upload MVP: All Save/Submit buttons to say 'Submit' for Public User and redirect to success message

### Requirements:

1.Overall, ‘Submit’ displays instead of other ‘Save’ variants for all scenarios for public users. In this instance, ‘Submit’ is used in a non-workflow capacity, since we are bypassing that in

### Manual Scenario:

- Scenario: Display ‘Submit’ Instead of ‘Save’ for Public Users
- Given a public user is interacting with the system
- When the user encounters a button labeled with any variant of 'Save'
- Then the button label should be replaced with 'Submit'
- And this change should apply in all scenarios where workflow is bypassed

## ID: 285

### User Story:

PB - (Misc UI) As a User, I want to have tooltips around Widgets after combining with Blocks

### Requirements:

1. Be able to have updated tooltips on Image Resizing for Image Widgets when hovering on buttons:(/)
2. Image Fit

### Manual Scenario:

- Scenario: Display Updated Tooltips for Image Resizing in Image Widgets
- Given a user is interacting with an Image Widget
- When the user hovers over the image resizing buttons
- Then the tooltip should display the updated text for each button
- And the tooltip for the 'Image Fit' button should clearly describe its function

## ID: 286

### User Story:

PB - As a User, I want to edit (rename) an existing Page Category in Page Builder

### Requirements:

1. Be able to click on kebab button as per design and click on ‘Edit Page Category’
2. Be able to see ‘Edit Page Category’ pop-up as per design
3. Be able to see Info message as per design: “Rename Page Category.“

### Manual Scenario:

- Scenario: Edit Page Category via Kebab Button
- Given the user is on the Page Management screen
- When the user clicks on the kebab (three-dot) button next to a page category
- And selects ‘Edit Page Category’ from the dropdown
- Then the ‘Edit Page Category’ pop-up should appear as per design
- And the pop-up should display the info message: “Rename Page Category.”

## ID: 287

### User Story:

PB - As a User, I should not see the Page Category dropdown when viewing Pages if none of them are assigned to Category

### Requirements:

1. Be able to see only Pages from the Left Panel when viewing a Page, if all the pages the user has access to view are all not associated with any Page Category

### Manual Scenario:

- Scenario: Display Only Pages in the Left Panel When No Page Categories Exist
- Given the user is viewing a Page
- And all pages the user has access to are not associated with any Page Category
- When the user opens the Left Panel
- Then the Left Panel should display only the list of Pages
- And no Page Categories should be shown

## ID: 288

### User Story:

PB - As a User, I want to switch Page Categories when viewing a Page if there are multiple Page Categories

### Requirements:

1. Be able to see multiple Page Categories in the dropdown to switch from Nav, if there are more than one Page Categories exist and the user has permission to view those pages are under the Page Categories
2. Be able to select and to switch to another Page Category (incl. 'All Pages') via the drop-down menu as per design, then load Pages under from Nav

### Manual Scenario:

- Scenario: Switch Between Multiple Page Categories in Navigation Dropdown
- Given there are multiple Page Categories
- And the user has permission to view pages under those Page Categories
- When the user clicks on the Page Category dropdown in the Navigation
- Then the dropdown should display all available Page Categories, including 'All Pages'
- And the user should be able to select a different Page Category
- When the user selects a Page Category from the dropdown
- Then the navigation should update to show only the pages under the selected Page Category

## ID: 289

### User Story:

PB - As a User, I want to see Page Category being selected by default when viewing a Page as it's been assign to one

### Requirements:

1. By default the Page Category Name itself is displayed as per
2. Be able to see the pages under are loaded to the left side from Nav when viewing a Page

### Manual Scenario:

- Scenario: Display Page Category Name and Load Pages in Navigation
- Given the user is viewing a Page
- When the page loads
- Then the Page Category Name should be displayed by default as per design
- And the pages under the selected Page Category should be loaded and displayed in the left-side navigation

## ID: 290

### User Story:

PB - As a User, I want to un-assign a Page Category from an existing parent / standalone page

### Requirements:

1. Be able to un-assign (aka. update a Page to be removed from a Page Category) _a standalone Page_ or _Parent including sub-pages together_ from an existing Page Category via the Assign Page Category button as per

### Manual Scenario:

- Scenario: Un-assign a Page or Parent with Sub-Pages from a Page Category
- Given the user is on the Assign Page Category interface
- When the user selects a standalone Page or a Parent Page (including all sub-pages) to be removed from an existing Page Category
- And the user confirms the action
- Then the selected Page or Parent Page with sub-pages should be unassigned from the Page Category
- And the Page(s) should no longer appear under the previously assigned Page Category in the navigation

## ID: 291

### User Story:

PB - As a User, I want to assign / re-assign an existing parent / standalone page to an existing Page Category

### Requirements:

1. Be able to assign or re-assign (aka. update to attach to another Page Category) _a standalone Page_ or _Parent including sub-pages together_ to an existing Page Category via the Assign Page Category button as per

### Manual Scenario:

- Scenario: Assign or Re-Assign a Page or Parent with Sub-Pages to a Page Category
- Given the user is on the Assign Page Category interface
- When the user selects a standalone Page or a Parent Page (including all sub-pages) to be assigned or re-assigned to an existing Page Category
- And the user confirms the action
- Then the selected Page or Parent Page with sub-pages should be assigned to the chosen Page Category
- And the Page(s) should now appear under the newly assigned Page Category in the navigation

## ID: 292

### User Story:

PB - As a User, I want to customise the order of pages under All Pages and the order of pages under each Page Category

### Requirements:

1. Be able to customise the order of pages under All Pages and the order of pages under each Page Category

### Manual Scenario:

- Scenario: Customizing the Order of Pages Under 'All Pages' and Page Categories
- Given the user has access to the Page Management interface
- When the user customizes the order of pages under 'All Pages' or within a specific Page Category
- And the user saves the changes
- Then the updated order of pages should be reflected accordingly under 'All Pages' and within the respective Page Category in the navigation panel

## ID: 293

### User Story:

PB - As a User, I want to delete an existing Page Category in Page Builder

### Requirements:

1. Be able to click on kebab button next to Page Category dropdown menu from Navi Panel as per and click on ‘Delete Page Category’ in Page Builder

### Manual Scenario:

- Scenario: Deleting a Page Category from the Navigation Panel in Page Builder
- Given the user is in the Page Builder and has access to manage Page Categories
- When the user clicks on the kebab button next to the Page Category dropdown menu in the Navigation Panel
- And the user selects ‘Delete Page Category’ from the dropdown options
- Then a confirmation dialog should appear asking the user to confirm the deletion
- And if the user confirms the deletion, the selected Page Category should be removed from the system and no longer appear in the dropdown menu
- But if the user cancels the action, the Page Category remains unchanged

## ID: 294

### User Story:

PB - As a User, I want to create a new Page Category in Page Builder

### Requirements:

1. Be able to click on kebab button as per and click on ‘Add Page Category’
2. Be able to see ‘Add Page Category’ pop-up as per

### Manual Scenario:

- Scenario: Adding a New Page Category from the Navigation Panel in Page Builder
- Given the user is in the Page Builder and has access to manage Page Categories
- When the user clicks on the kebab button next to the Page Category dropdown menu in the Navigation Panel
- And the user selects ‘Add Page Category’ from the dropdown options
- Then an ‘Add Page Category’ pop-up should appear as per the design
- And the user should be able to input a name for the new Page Category and confirm the action

## ID: 295

### User Story:

PB - As a User, I want to see & select Page Category in Page Builder

### Requirements:

1. Be able to always see the Page Category in drop-down menu as per from Nav in Page Builder
2. Be able to see ‘All Pages’ selected by default as in Page Category drop-down menu when first time entering Page Builder via any page Edit action button

### Manual Scenario:

- Scenario: Displaying Page Category Dropdown and Default Selection in Page Builder
- Given the user is in the Page Builder
- When the user opens the Navigation Panel
- Then the Page Category dropdown menu should always be visible as per design
- And when the user enters the Page Builder for the first time via any page Edit action button
- Then the ‘All Pages’ option should be selected by default in the Page Category dropdown menu

## ID: 296

### User Story:

PB - [4/4] As an Internal User, I want to have MCP(development use only) settings to enable/disable features per Epic for Drag & Drop Page MVP

### Requirements:

1. Add a MCP setting “Drag & Drop Pages - Page Category (development use only)“ under Development Use only section under Platform Settings

### Manual Scenario:

- Scenario: Adding MCP Setting for Drag & Drop Pages - Page Category
- Given the user has access to MCP settings in Platform Settings
- When the user navigates to the "Development Use Only" section
- Then the user should see a new setting named "Drag & Drop Pages - Page Category (development use only)"
- And the setting should be listed under the Development Use Only section

## ID: 297

### User Story:

Guest Upload MVP: Mandatory Anti-Virus for all public uploads (even when not enabled in MCP)

### Requirements:

1.  All items uploaded to upload fields (multi and single) when user is not logged in are to be scanned for viruses
2.  Virus items error in the field as is current behaviour when Anti-Virus is enabled, with error hover explaining why to the user

### Manual Scenario:

- Scenario: Virus Scan for Uploaded Files in Upload Fields (Multi and Single) for Unauthenticated Users
- Given the user is not logged in
- When the user uploads a file to a single or multi-upload field
- Then the file should be scanned for viruses
- And if a virus is detected, an error should be displayed in the upload field
- And the error should include a hover tooltip explaining the reason (virus detected) when Anti-Virus is enabled

## ID: 298

### User Story:

PB - (Misc) As a User, I want to be informed why the Page cannot be saved in Page Builder if it's beyond the set Page limit in MCP

### Requirements:

1. When the user is in Page Builder already and the set D&D page limit in MCP has been reached:
2. Be able to see a warning snack bar with message “Page limit of {&number set as page limit in MCP} reached.“ _in Page Builder after clicking on:_
3. Save button on the top bar

### Manual Scenario:

- Scenario: Display Warning Snackbar When D&D Page Limit is Reached in Page Builder
- Given the user is in Page Builder
- And the Drag & Drop (D&D) page limit set in MCP has been reached
- When the user clicks on the "Save" button in the top bar
- Then a warning snackbar should be displayed with the message:
- “Page limit of {&number set as page limit in MCP} reached.”

## ID: 299

### User Story:

[Ask AI Alpha] As a user I want to choose to search whole platform or current location (Logic: Filter/Search results limit)

### Requirements:

1.   ‘Limit to current view’ checkbox field appears under question field
2.  This is always enabled by default when panel is opened
3.  User can deselect option before asking a question, meaning whole platform will be searched no matter their current location

### Manual Scenario:

- Scenario: ‘Limit to current view’ Checkbox Behavior in Question Panel
- Given the user opens the question panel
- Then the ‘Limit to current view’ checkbox field appears under the question field
- And the checkbox is enabled by default
- When the user deselects the ‘Limit to current view’ checkbox
- Then the entire platform will be searched instead of limiting to the current view

## ID: 300

### User Story:

[V3 Move] Resources - Info/Preview Page: When Resource is Pending, hide Move action in this page

### Requirements:

1. When a resource is +currently+ in _pending publish request_, and user accesses Info Preview action via the Workflow actions, then ‘Move’ action does not appear in Info Preview actions +for any/all users+

### Manual Scenario:

- Scenario: Hide ‘Move’ Action in Info Preview for Pending Publish Request
- Given a resource is currently in a pending publish request
- When the user accesses the Info Preview action via the Workflow actions
- Then the ‘Move’ action does not appear in the Info Preview actions for any and all users

## ID: 301

### User Story:

PB - As a User, I want to have previous 'Block' background colour setting embedded in Text Widget toolbar after combining these two

### Requirements:

1. Be able to have have previous 'Block' background colour setting embedded in Text Widget toolbar as per
2. Be able to click on the background colour setting in text widget toolbar and open the colour swatch popover then set the colour for Text Widget background

### Manual Scenario:

- Scenario: Retaining and Applying Background Color in Text Widget Toolbar
- Given a user has previously set a background color for a 'Block'
- And the background color setting is embedded in the Text Widget toolbar
- When the user opens the Text Widget toolbar
- Then the previously selected background color should be displayed in the toolbar
- And Given the user clicks on the background color setting in the Text Widget toolbar
- When the color swatch popover opens
- And the user selects a new background color
- Then the selected color should be applied to the Text Widget background

## ID: 302

### User Story:

PB - As a User, I want to configure both Block and Video Widget properties

### Requirements:

1. Be able to see and configure the new widget settings from Nav (combining previously defined Block and Widget's settings) for each widgets:
2. _Video:_
3. Video URL & resource lookup

### Manual Scenario:

- Scenario: Configuring Video Widget Settings from Navigation
- Given the user is in the application
- And the navigation menu contains a section for widget settings
- When the user selects the "Video" widget from the navigation menu
- Then the widget settings panel should display the combined settings of Block and Widget
- And Given the user is viewing the "Video" widget settings
- When they enter a Video URL in the provided field
- Then the Video widget should update to use the entered Video URL
- And Given the user wants to look up a video resource
- When they access the resource lookup option
- Then they should be able to browse and select a video resource
- And the selected resource should be applied to the Video widget

## ID: 303

### User Story:

PB - As a User, I want to configure both Block and Image Widget properties

### Requirements:

1. Be able to see and configure the new widget settings from Nav (combining previously defined Block and Widget's settings) for each widgets:
2. _Image:_
3. Image URL input & resource lookup

### Manual Scenario:

- Scenario: Configuring Image Widget Settings from Navigation
- Given the user is in the application
- And the navigation menu contains a section for widget settings
- When the user selects the "Image" widget from the navigation menu
- Then the widget settings panel should display the combined settings of Block and Widget
- And Given the user is viewing the "Image" widget settings
- When they enter an Image URL in the provided field
- Then the Image widget should update to display the image from the entered URL
- And Given the user wants to look up an image resource
- When they access the resource lookup option
- Then they should be able to browse and select an image resource
- And the selected image should be applied to the Image widget

## ID: 304

### User Story:

PB - As a User, I want to configure both Block and Text Widget properties

### Requirements:

1. Be able to see and configure the new widget settings from Nav (combining previously defined Block and Widget's settings) for each widgets:
2. _Text box:_
3. Padding

### Manual Scenario:

- Scenario: Configuring Text Box Widget Padding from Navigation
- Given the user is in the application
- And the navigation menu contains a section for widget settings
- When the user selects the "Text Box" widget from the navigation menu
- Then the widget settings panel should display the combined settings of Block and Widget
- And Given the user is viewing the "Text Box" widget settings
- When they adjust the padding settings using the provided controls
- Then the padding should be applied to the Text Box widget
- And the changes should be reflected in real-time

## ID: 305

### User Story:

PB - As a User, I want to configure both Block and Button Widget properties

### Requirements:

1. Be able to see and configure the new widget settings from Nav (combining previously defined Block and Widget's settings) for each widgets:
2. _Button_:
3. Button Text
4. Button Link

### Manual Scenario:

- Scenario: Configuring Button Widget Settings from Navigation
- Given the user is in the application
- And the navigation menu contains a section for widget settings
- When the user selects the "Button" widget from the navigation menu
- Then the widget settings panel should display the combined settings of Block and Widget
- And Given the user is viewing the "Button" widget settings
- When they enter a new text value in the "Button Text" field
- Then the button in the widget should update to display the entered text
- And Given the user is viewing the "Button" widget settings
- When they enter a valid URL in the "Button Link" field
- Then the button should be configured to navigate to the entered URL when clicked

## ID: 306

### User Story:

[Ask AI Alpha] As a user I want to choose to search whole platform or current location (Logic: Folder location limit)

### Requirements:

1.   ‘Limit to current view’ checkbox field appears under question field
2.  This is always enabled by default when panel is opened

### Manual Scenario:

- Scenario: ‘Limit to current view’ Checkbox Behavior in Panel
- Given the user opens the panel
- When the panel is displayed
- Then the ‘Limit to current view’ checkbox field should appear under the question field
- And the checkbox should be enabled by default

## ID: 307

### User Story:

3-1. As a User, I want to resize Image Widget by dragging image itself when creating/editing a Page

### Requirements:

1. Be able to see dotted line of the Image and bounding box for the entire Widget with a default 8px paddings as per design, after dragging an Image Widget into a Section
2. Be able to always see the Image Widget’s outer bounding box border line as per design, whenever the Image has been re-sized
3. Be able to click on all eight dots to change the size of the Image within the 'Block'

### Manual Scenario:

- Scenario: Displaying Image Widget Boundaries and Resizing Controls
- Given the user drags an Image Widget into a Section
- When the widget is placed
- Then a dotted line should appear around the Image
- And a bounding box should be visible for the entire widget with a default 8px padding as per design
- And Given the Image Widget is displayed
- When the user resizes the image
- Then the outer bounding box border should always remain visible as per design
- And Given the Image Widget is displayed with a bounding box
- When the user clicks on any of the eight dots on the bounding box
- Then they should be able to resize the Image within the 'Block' accordingly

## ID: 308

### User Story:

4-1. As a User, I want to resize Image Widget by Width slider from Nav

### Requirements:

1. Be able to set the ratio of the Image to change the ‘Block'’s width for the combination of Image Widget from Nav Panel as per design (existing behaviour)
2. Be able to still see Image remain the same percentage of it’s “Block“ _horizontally_
3. Be able to still resize the Widget by dragging the dot line

### Manual Scenario:

- Scenario: Adjusting Image Ratio and Resizing Image Widget within a Block
- Given the user selects the Image Widget from the Navigation Panel
- When they set the ratio of the Image
- Then the ‘Block’ width should adjust accordingly as per design
- And the behavior should match the existing functionality
- And Given the Image Widget is within a ‘Block’
- When the user changes the ‘Block’ width
- Then the Image should maintain the same percentage of its ‘Block’ horizontally
- And Given the Image Widget is displayed with a bounding box
- When the user drags the dotted line to resize the Widget
- Then the Widget should resize accordingly while maintaining its defined ratio

## ID: 309

### User Story:

3-2. As a User, I want to reposition Image Widget by dragging image itself when create/editing a Page

### Requirements:

1. Be able to see dotted line of the Image and bounding box for the entire Widget with a default 8px paddings as per design, after dragging an Image Widget into a Section
2. Be able to always see the Image Widget’s outer bounding box border line as per design, whenever the Image has been re-sized

### Manual Scenario:

- Scenario: Displaying Image Widget Boundaries and Maintaining Bounding Box on Resize
- Given the user drags an Image Widget into a Section
- When the widget is placed
- Then a dotted line should appear around the Image
- And a bounding box should be visible for the entire widget with a default 8px padding as per design
- And Given the Image Widget is displayed
- When the user resizes the Image
- Then the outer bounding box border should always remain visible as per design

## ID: 310

### User Story:

4-2. As a User, I want the position and size that I set of the image to still work in different responsive modes

### Requirements:

1. Be able to see the same percentage _horizontally_ of Image with the Block in mobile, tablet, and desktop modes, after
2. resizing the Image by dragging the dots
3. repositioning the Image by dragging the Image itself

### Manual Scenario:

- Scenario: Maintaining Image Percentage Horizontally Across Devices
- Given the user resizes the Image by dragging the dots
- When the Image is resized
- Then the Image should maintain the same percentage of its ‘Block’ horizontally in mobile, tablet, and desktop modes
- And Given the user repositions the Image by dragging it within the ‘Block’
- When the Image is moved
- Then the Image should still maintain the same percentage of its ‘Block’ horizontally across mobile, tablet, and desktop modes

## ID: 311

### User Story:

2-3. As a User, I want to Undo & Redo resizing & repositioning

### Requirements:

1. Be able to still click on Undo & Redo from top bar to go back & forward the actions on:
2. Resizing the Image by dragging the dots
3. Resizing the Image by changing the ratio

### Manual Scenario:

- Scenario: Undo & Redo Actions for Image Resizing
- Given the user resizes the Image by dragging the dots
- When they click the Undo button from the top bar
- Then the Image should revert to its previous size
- And Given the user has undone the resizing action
- When they click the Redo button from the top bar
- Then the Image should return to the resized state
- And Given the user resizes the Image by changing the ratio
- When they click the Undo button from the top bar
- Then the Image should revert to its previous ratio
- And Given the user has undone the ratio change
- When they click the Redo button from the top bar
- Then the Image should return to the resized ratio state

## ID: 312

### User Story:

2-4. As a User, I want to set Image Fit & Position via Nav Panel

### Requirements:

1.Be able to set Image Fit in three different modes for Image Widgets from Nav as per, after entering a valid URL or selecting successfully via Resource Lookup 2. Cover: Image shall be resized in cover mode where Image can be resized & cropped (partially visible)

### Manual Scenario:

- Scenario: Setting Image Fit Modes for Image Widgets
- Given the user selects an Image Widget from the Navigation Panel
- When they enter a valid Image URL or successfully select an image via Resource Lookup
- Then the Image should be displayed in the widget
- And Given the user is configuring the Image Fit settings
- When they select the Cover mode
- Then the Image should be resized to cover the entire widget area
- And the Image should be partially visible due to cropping
- And the user should still be able to resize the Image within the widget

## ID: 313

### User Story:

PB - As a User, I want to see Drag & Drop Page thumbnails as preview in Custom Page v2 index page

### Requirements:

1. Be able to preview pages as thumbnails for Drag & Drop Pages in v2 index page for both List and thumb layout views

### Manual Scenario:

- Scenario: Previewing Pages as Thumbnails for Drag & Drop in v2 Index Page
- Given the user is on the v2 index page
- When they switch to either List view or Thumbnail layout view
- Then each page should be displayed as a thumbnail preview
- And Given the user is viewing the page thumbnails
- When they attempt to drag and drop a page to reorder it
- Then the page should be repositioned correctly in the updated order
- And the thumbnail preview should reflect the new position accordingly

## ID: 314

### User Story:

Conditional Reviewers: Re-assign should only be supported when Condition Set has 'Required Approvals' set to 'One'

### Requirements:

1.Add: Alert message “Re-assign is not supported as all selected Reviewer(s) are required to approve.” error message in V2 pop-up when this occurs

### Manual Scenario:

- Scenario: Displaying Alert Message When Re-Assign is Not Supported
- Given the user attempts to re-assign a task to another reviewer
- And all selected reviewers are required to approve
- When the re-assign action is triggered
- Then a V2 pop-up should appear with the alert message:
- “Re-assign is not supported as all selected Reviewer(s) are required to approve.”

## ID: 315

### User Story:

[Ask AI Alpha] As a user, I want the Q&A system not to include any deleted documents

### Requirements:

1. Deleted resources should be excluded from being a source for any questions/answers

### Manual Scenario:

- Scenario: Excluding Deleted Resources from Questions and Answers
- Given a resource has been deleted
- When a question or answer attempts to reference the deleted resource as a source
- Then the deleted resource should not be available as a source
- And the question or answer should not display or retrieve information from the deleted resource

## ID: 316

### User Story:

[Ask AI Alpha] As a user, I want my newly uploaded documents to be ingested by the Q&A system

### Requirements:

1. Ideally for Alpha phase, if related MCP setting _Enable vector search - text (V3) (development use only)_ is enabled, then new documents are ingested/indexed as they are added so that the Search is up to date with current resources on the platform when performing a search

### Manual Scenario:

- Scenario: Ingesting and Indexing New Documents for Up-to-Date Search
- Given the MCP setting "Enable vector search - text (V3) (development use only)" is enabled
- When a new document is added to the platform
- Then the document should be ingested and indexed automatically
- And Given the document has been successfully indexed
- When a user performs a search
- Then the search results should include the newly added document
- And the search should be up to date with the current resources on the platform

## ID: 317

### User Story:

PB - (Misc) As a User, I want to set auto-play as default or not for Video Widgets when viewing a Smart Page

### Requirements:

1. Be able to set added Video Widget auto-playing on Viewing via the button as per
   2.By default, the auto-play button is unchecked, meaning Videos won’t be auto-played on viewing by default

### Manual Scenario:

- Scenario: Configuring Auto-Play for Video Widget
- Given the user has added a Video Widget
- When they open the Video Widget settings
- Then an Auto-Play button should be available
- And Given the Video Widget is newly added
- When the user has not changed the auto-play setting
- Then the auto-play button should be unchecked by default
- And the video should not auto-play when viewed
- And Given the user enables the auto-play button
- When they view the Video Widget
- Then the video should start playing automatically

## ID: 318

### User Story:

[Ask AI Alpha] As a Main Admin user, only I and other Main Admins can use 'Ask AI' in Alpha phase

### Requirements:

1.   In Alpha phase, only Main Admin users can see the ‘AI Assist’ button
2.  Users who are not Main Admins cannot see the ‘AI Assist’ button, and therefore cannot access this feature
3.  Main users emulating non Main Admin users should also not be able to see this button (but may be acceptable handling for alpha until we update permissions

### Manual Scenario:

- Scenario: Visibility of ‘AI Assist’ Button Based on User Role
- Given the platform is in the Alpha phase
- When a Main Admin user logs in
- Then they should see the ‘AI Assist’ button in the interface
- And Given a user who is not a Main Admin logs in
- When they access the interface
- Then they should not see the ‘AI Assist’ button
- And they should not be able to access this feature
- And Given a Main Admin user is emulating a non-Main Admin user
- When they navigate the interface as the emulated user
- Then they should also not see the ‘AI Assist’ button

## ID: 319

### User Story:

[Ask AI Alpha] As a user when button is clicked the 'Ask AI' side panel slides in (overall side panel component)

### Requirements:

1. When ‘Ask AI’ button is clicked, side panel opens from the right side of screen
2. As this will not be supported for mobile, side panel closed when mobile breakpoints are reached

### Manual Scenario:

- Scenario: Opening and Closing the ‘Ask AI’ Side Panel
- Given the user is on a desktop or tablet device
- When they click the ‘Ask AI’ button
- Then a side panel should open from the right side of the screen
- And Given the side panel is open
- When the screen size is adjusted to a mobile breakpoint
- Then the side panel should automatically close
- And the ‘Ask AI’ feature should not be accessible on mobile devices

## ID: 320

### User Story:

[Ask AI Alpha] As a user I want to see the 'Ask AI' side panel header and see help tooltip there

### Requirements:

1. Search AI header of side-panel: ‘Ask AI’  
   2.Help tooltip icon displays next to the name
   3.Text that displays on hover: 'Ask AI to summarize an answer from your documents. Enable 'Current view' to narrow your search to your current folder location and search only.

### Manual Scenario:

- Scenario: Displaying ‘Ask AI’ Header and Help Tooltip in Side Panel
- Given the user has opened the ‘Ask AI’ side panel
- When the panel is displayed
- Then the header should show ‘Ask AI’ at the top
- And Given the help tooltip icon is next to the header name
- When the user hovers over the tooltip icon
- Then a tooltip should appear with the text:
- "Ask AI to summarize an answer from your documents. Enable 'Current view' to narrow your search to your current folder location and search only."

## ID: 321

### User Story:

[Ask AI Alpha] As a user I want to close the 'Ask AI' side panel

### Requirements:

1. Close icon displays top right of Ask AI side panel in header section
2. User can click close icon which will close the side-panel

### Manual Scenario:

- Scenario: Closing the ‘Ask AI’ Side Panel Using the Close Icon
- Given the user has opened the ‘Ask AI’ side panel
- When the panel is displayed
- Then a close icon should be visible in the top-right corner of the header section
- And Given the user wants to close the side panel
- When they click the close icon
- Then the ‘Ask AI’ side panel should close

## ID: 322

### User Story:

[Ask AI Alpha] As a user I want to enter a question in 'Ask AI' field

### Requirements:

1. Question field displays as text field under panel header
2. Placeholder text: ‘Ask me a question’

### Manual Scenario:

- Scenario: Displaying Question Field in ‘Ask AI’ Side Panel
- Given the user has opened the ‘Ask AI’ side panel
- When the panel is displayed
- Then a text field for entering a question should appear under the panel header
- And Given the question field is visible
- Then it should display the placeholder text: ‘Ask me a question’

## ID: 323

### User Story:

[Ask AI Alpha] As a user I can click 'Ask' button to trigger search AI (or can click enter)

### Requirements:

1 ‘Ask’ button displays under question field, is disabled by default when panel opens 2. Hover text when enabled: ‘Click or hit enter to ask your question.’

### Manual Scenario:

- Scenario: Displaying and Enabling the ‘Ask’ Button in the ‘Ask AI’ Side Panel
- Given the user has opened the ‘Ask AI’ side panel
- When the panel is displayed
- Then an ‘Ask’ button should appear under the question field
- And the ‘Ask’ button should be disabled by default
- And Given the user has entered a valid question in the question field
- When the ‘Ask’ button becomes enabled
- Then hovering over the button should display the tooltip text:
- "Click or hit enter to ask your question."

## ID: 324

### User Story:

[Ask AI Alpha] As a user I want to choose to search whole platform or current location (UI + pendo)

### Requirements:

1.   ‘Limit to current view’ checkbox field appears under question field
2.  This is always enabled by default when panel is opened

### Manual Scenario:

- Scenario: Displaying and Enforcing Default State of ‘Limit to Current View’ Checkbox
- Given the user has opened the ‘Ask AI’ side panel
- When the panel is displayed
- Then a ‘Limit to current view’ checkbox should appear under the question field
- And the checkbox should be enabled by default

## ID: 325

### User Story:

[Ask AI Alpha] As a user I can tell when results are being loaded

### Requirements:

1. While answer is both first being fetched AND as it gets built out incrementally we have a loading wheel on the disabled ‘Ask’ button (so user knows when answer has 100% finished building when this loading wheel ceases)
2. Loading wheel/spinner no longer appears when answer build is complete

### Manual Scenario:

- Scenario: Displaying Loading Indicator on ‘Ask’ Button During Answer Generation
- Given the user has entered a question in the ‘Ask AI’ field
- When they click the ‘Ask’ button
- Then the ‘Ask’ button should become disabled
- And a loading wheel/spinner should appear on the button
- And Given the AI is generating the answer
- When the answer is still being fetched or built incrementally
- Then the loading wheel/spinner should remain visible on the disabled ‘Ask’ button
- And Given the AI has fully generated the answer
- When the answer build is 100% complete
- Then the loading wheel/spinner should disappear
- And the ‘Ask’ button should become enabled again

## ID: 326

### User Story:

[Ask AI Alpha] As a user I get informed if there is no answer and advised to update my question to try again

### Requirements:

1. When we cannot find any answer to return, we display an re-try message as per designs:
2. ‘We are unable to assist with that query at the moment. Try asking something else.’

### Manual Scenario:

- Scenario: Displaying Retry Message When No Answer is Found
- Given the user has entered a question in the ‘Ask AI’ field
- When the AI processes the query but cannot find an answer
- Then a message should be displayed as per design:
- “We are unable to assist with that query at the moment. Try asking something else.”
- And the user should be able to enter a new query in the question field to try again.

## ID: 327

### User Story:

[Ask AI Alpha] As a user I get informed if there is an tech error (generic error handling)

### Requirements:

1. When an unexpected error occurs (most likely on 3rd party end, or due to internet connection etc) we display an error message as per designs:
2. ‘We are having some technical issues. Try again later.’

### Manual Scenario:

- Scenario: Displaying Error Message When an Unexpected Issue Occurs
- Given the user has entered a question in the ‘Ask AI’ field
- When an unexpected error occurs (e.g., third-party service failure or internet connection issue)
- Then an error message should be displayed as per design:
- “We are having some technical issues. Try again later.”
- And the user should not receive a partial or incorrect response
- And they should have the option to try again later when the issue is resolved.

## ID: 328

### User Story:

[Ask AI Alpha] As a user I can see the answer (in scrollable field)

### Requirements:

1.   Answer field displays under Search bar (and other fields) when we have an answer to return
2.  Answer field height can expand as answer is incrementally built out to, but will hit a fixed height that is scrollable when that is reached/surpassed
3.  Answer component also includes the icon for Copying the answer - to be handled in a separate ticket in

### Manual Scenario:

- Scenario: Displaying and Expanding Answer Field in ‘Ask AI’ Side Panel
- Given the user has submitted a question in the ‘Ask AI’ field
- When the AI returns an answer
- Then an answer field should appear under the Search bar and other fields
- And Given the answer is being incrementally built out
- When the response length increases
- Then the answer field height should expand dynamically
- And Given the answer reaches a fixed height limit
- When the response continues to build beyond this limit
- Then the answer field should become scrollable
- And Given the answer is displayed
- Then an icon for Copying the answer should be included in the answer component (handled in a separate ticket)

## ID: 329

### User Story:

[Ask AI Alpha] As a user I can see the Sources listed below the answer and click to open in new tab

### Requirements:

1.   When answer is returned we also show Sources section underneath the answer container

### Manual Scenario:

- Scenario: Displaying Sources Section When an Answer is Returned
- Given the user has submitted a question in the ‘Ask AI’ field
- When the AI returns an answer
- Then a Sources section should appear underneath the answer container
- And Given the answer is based on specific documents or references
- Then the Sources section should display the relevant sources used to generate the answer

## ID: 330

### User Story:

[Ask AI Alpha] As a user I want to copy the answer to my clipboard

### Requirements:

1. Copy icon appears in Answer field when answer is complete
2. Hover text: 'Click to copy this answer to your clipboard.'
3. When clicked a success snackbar confirms “Copied to clipboard”

### Manual Scenario:

- Scenario: Copying the Answer from the Answer Field
- Given the AI has completed generating an answer
- When the answer is displayed in the Answer field
- Then a Copy icon should appear within the Answer field
- And Given the user hovers over the Copy icon
- Then a tooltip should appear with the text:
- "Click to copy this answer to your clipboard."
- And Given the user clicks the Copy icon
- Then the answer should be copied to the clipboard
- And a success snackbar should appear with the message:
- "Copied to clipboard"

## ID: 331

### User Story:

[Ask AI Alpha] As a user I can clear my search to enter another (or cancel current search)

### Requirements:

1.   ‘x' displays at end of Question field when it has been populated with any data (including just blank spaces, though we wont enable 'Ask’ button in that scenario, as handled in

### Manual Scenario:

- Scenario: Displaying and Using the ‘X’ Button in the Question Field
- Given the user has entered any data into the Question field (including blank spaces)
- When the field is populated
- Then an ‘X’ (clear) button should appear at the end of the Question field
- And Given the ‘Ask’ button is only enabled when a valid question (not just spaces) is entered
- Then entering only blank spaces should not enable the ‘Ask’ button (handled separately)
- And Given the ‘X’ button is visible
- When the user clicks it
- Then the Question field should be cleared
- And the ‘X’ button should disappear

## ID: 332

### User Story:

[Ask AI Alpha] As a user I want to see/click on the 'Ask AI' button in Resources

### Requirements:

1. When _Enable vector search - text (V3) (development use only)_ is enabled in MCP, a new ‘AI Assist’ button displays in that platform:
2. Button displays to the right of Search bar in Resources (after search help tooltip to right of searchbar, when that displays)

### Manual Scenario:

- Scenario: Displaying the ‘AI Assist’ Button When Vector Search is Enabled
- Given the ‘Enable vector search - text (V3) (development use only)’ setting is enabled in MCP
- When the user accesses the platform
- Then a new ‘AI Assist’ button should be displayed
- And Given the user is in the Resources section
- When the Search bar is visible
- Then the ‘AI Assist’ button should appear to the right of the Search bar
- And if the Search help tooltip is displayed, the ‘AI Assist’ button should be positioned after it

## ID: 333

### User Story:

BP - (Misc) As a User, I want to Replace resources via Resource Lookup from Nav Panel

### Requirements:

1. Be able to still see and click on the button “Replace“ to select another Resource via Resource Lookup from Nav Panel in Page Builder, after selecting a Resource successfully, as per

### Manual Scenario:

- Scenario: Replacing a Selected Resource via Resource Lookup in Page Builder
- Given the user has successfully selected a Resource via Resource Lookup in the Nav Panel of Page Builder
- When the selection is confirmed
- Then a “Replace” button should be displayed
- And Given the “Replace” button is visible
- When the user clicks on it
- Then the Resource Lookup should reopen
- And the user should be able to select a new Resource to replace the existing one

## ID: 334

### User Story:

PB - [1/4] As an Internal User, I want to have MCP(development use only) settings to enable/disable features per Epic for Drag & Drop Page MVP

### Requirements:

1. Add a MCP setting “Smart Pages - Page Templates (development use only)“ under Development Use only

### Manual Scenario:

- Scenario: Adding "Smart Pages - Page Templates (development use only)" Setting in MCP
- Given the user has access to the MCP settings
- When they navigate to the Development Use Only section
- Then a new setting named “Smart Pages - Page Templates (development use only)” should be displayed
- And Given the setting is visible
- Then the user should be able to enable or disable it based on their preferences

## ID: 335

### User Story:

PB - As a User, I want to create a Drag & Drop Page (as a standalone Page) from Nav

### Requirements:

1. Be able to create a Drag & Drop Page from Nav via the creation button at the bottom or the action button 'Page' from kebab icon (this action is only for standalone or parent page) as per under ‘All Pages' or specific Page Category in Page Builder

### Manual Scenario:

- Scenario: Creating a Drag & Drop Page from Navigation in Page Builder
- Given the user is in the Page Builder under ‘All Pages’ or a specific Page Category
- When they want to create a Drag & Drop Page
- Then they should see the creation button at the bottom of the Nav Panel
- And Given the user clicks the creation button
- Then they should be able to start creating a Drag & Drop Page
- And Given the user is interacting with a standalone or parent page
- When they click the kebab menu icon (⋮) and select the ‘Page’ action
- Then they should also be able to create a Drag & Drop Page

## ID: 336

### User Story:

PB - As a User, I want to see a Smart Page template popup after click on V2 create

### Requirements:

1. Be able to go to V3 Page Builder and see a Page Template popup, after clicking on Smart Page from V2 Page creation popup, as per

### Manual Scenario:

- Scenario: Navigating to V3 Page Builder and Seeing the Page Template Popup
- Given the user is in V2 Page Creation Popup
- When they click on ‘Smart Page’
- Then they should be redirected to V3 Page Builder
- And Given the user has arrived in V3 Page Builder
- Then a Page Template Popup should be displayed automatically
-
-
-
-
-
-
-

## ID: 337

### User Story:

PB - As a User, I want to create an empty Smart Page from the template popup

### Requirements:

1. Be able to see and click on the button : “Start with a blank template” as per
2. Be able to see selected effect as per once click on it

### Manual Scenario:

- Scenario: Selecting ‘Start with a Blank Template’ in Page Template Popup
- Given the user is in the Page Template Popup in V3 Page Builder
- When they view the available options
- Then a button labeled “Start with a Blank Template” should be visible
- And Given the “Start with a Blank Template” button is visible
- When the user clicks on it
- Then the button should show a selected effect as per design
- And the user should proceed to create a blank page template

## ID: 338

### User Story:

PB - As a User, I want to select a Template from Template popup

### Requirements:

1. Be able to see templates from the popup and to click on one template (incl. the blank template) as per with _hover_ and _selected_ effects & experience
2. hovering: dotted border line

### Manual Scenario:

- Scenario: Selecting a Template from the Page Template Popup
- Given the user is in the Page Template Popup in V3 Page Builder
- When they view the available templates, including the Blank Template
- Then each template should be displayed with a hover and selected effect as per design
- And Given the user hovers over a template
- Then a dotted border line should appear around the template
- And Given the user clicks on a template (including the Blank Template)
- Then the selected template should display a selected effect as per design
- And the user should proceed with creating a page using the selected template

## ID: 339

### User Story:

PB - As a User, I want to see previews of Page templates as in thumbnails

### Requirements:

1. Be able to see thumbnails of pre-defined Page Templates from the popup as per

### Manual Scenario:

- Scenario: Displaying Thumbnails of Pre-Defined Page Templates in the Popup
- Given the user is in the Page Template Popup in V3 Page Builder
- When the popup is displayed
- Then the user should see thumbnails of pre-defined Page Templates
- And Given the thumbnails are displayed
- Then each thumbnail should accurately represent the layout and design of the corresponding template as per the predefined settings

## ID: 340

### User Story:

PB - As a User, I want to edit and save a Smart Page with template after it's loaded

### Requirements:

1. Be able to continue editing and saving the Smart Page with loaded page template
2. Current “template“ and “thumbnails” design are dummy/mock ones, once the real templates are final we will import them with the task:

### Manual Scenario:

- Scenario: Editing and Saving a Smart Page with a Loaded Page Template
- Given the user has selected a Page Template in the V3 Page Builder
- When the template is loaded into the Smart Page editor
- Then the user should be able to edit the content and layout of the page
- And Given the user has made changes to the Smart Page
- When they click Save
- Then the changes should be successfully saved
- And Given the current template and thumbnails are dummy/mock versions
- Then they should be replaced with final templates once they are imported in a future task

## ID: 341

### User Story:

PB - As a User, I want to apply/load a selected Smart Page template in Page Builder

### Requirements:

1. Be able to click on one of the Templates and proceed to Page Builder as per
   2.Current “template“ and “thumbnails” design are dummy/mock ones, hence the selected “Templates“ _will be loaded as an empty Smart Page_
2. _Once the real templates are final we will import them with the task:_, and the real templates will be loaded accurately\*

### Manual Scenario:

- Scenario: Selecting a Template and Proceeding to Page Builder
- Given the user is in the Page Template Popup in V3 Page Builder
- When they click on one of the Templates (including the Blank Template)
- Then they should be redirected to the Page Builder
- And Given the current Templates and Thumbnails are dummy/mock versions
- Then the selected Template should load as an empty Smart Page
- And Given the real Templates will be finalized in a future task
- Then once they are imported, selecting a Template should accurately load the correct design and layout

## ID: 342

### User Story:

BP - (Misc) As a User, I want to see the Page Tree remain the same while switching Pages from Nav Panel

### Requirements:

1. Be able to see Page Tree remain the same while switching pages from Nav Panel during Viewing or Editing
2. If the parent page is expanded with sub-pages displayed under it, the Tree view should remain the same while switching to any other pages

### Manual Scenario:

- Scenario: Maintaining Page Tree Structure While Switching Pages
- Given the user is in the V3 Page Builder
- And the Page Tree is displayed in the Nav Panel
- When the user switches between pages during Viewing or Editing
- Then the Page Tree structure should remain unchanged
- And Given the parent page is expanded with sub-pages displayed under it
- When the user navigates to a different page
- Then the expanded parent page and its visible sub-pages should remain unchanged in the Page Tree

## ID: 343

### User Story:

As a User, I want to see unsuccessfully added Markup Comments

### Requirements:

1. Be able to always see unsuccessfully added Markup Comments as per

### Manual Scenario:

- Scenario: Displaying Unsuccessfully Added Markup Comments
- Given the user is adding a Markup Comment
- When the comment fails to be added successfully
- Then the unsuccessfully added Markup Comment should still be visible in the interface
- And Given the comment is visible
- Then the user should be able to identify and retry submitting it

## ID: 344

### User Story:

PB - As a User, I want to create a D&D Page by copying another D&D Page's content

### Requirements:

1. Be able to click on action button "Copy" of a Parent or standalone Page from Navigation Panel as per under ‘All Pages' or specific Page Category in Page Builder
2. Then a copied standalone Page is created, it will be placed below this parent or standalone Page under both ‘All Pages' and specific Page Category populated with the copied page content

### Manual Scenario:

- Scenario: Copying a Parent or Standalone Page from Navigation Panel
- Given the user is in Page Builder under ‘All Pages’ or a specific Page Category
- And there is a Parent or Standalone Page in the Navigation Panel
- When the user clicks on the "Copy" action button for that page
- Then a copied standalone page should be created
- And Given the copied standalone page is created
- Then it should be placed below the original Parent or Standalone Page
- And it should appear under both ‘All Pages’ and the specific Page Category
- And Given the copied page is successfully placed
- Then it should be populated with the same content as the original page

## ID: 345

### User Story:

PB - (Misc) As a User, I want to further have an option to hide / unhide the download button for Images / Video

### Requirements:

1. Be able to hide / un-hide download button for Image / Video Widgets added into Page via the hide/unhide button as per
   2.By default, Download button is unhidden

### Manual Scenario:

- Scenario: Hiding and Unhiding the Download Button for Image/Video Widgets
- Given the user has added an Image or Video Widget into a Page
- And the Download button is visible by default
- When the user clicks on the hide/unhide button
- Then the Download button should be hidden
- And Given the Download button is currently hidden
- When the user clicks the hide/unhide button again
- Then the Download button should become visible again

## ID: 346

### User Story:

PB - As a User, I want to configure both Block and Colour Palette Widget properties

### Requirements:

1. Be able to see and configure the new widget settings from Nav (combining previously defined Block and Widget's settings) for each widgets:
2. Colour Palette:
3. Colour

### Manual Scenario:

- Scenario: Configuring Colour Palette for Widgets from Navigation Panel
- Given the user is in the Page Builder
- And the Navigation Panel is open
- When the user selects a Widget
- Then the Widget Settings should display options combining Block and Widget settings
- And Given the user is in the Colour Palette settings
- When they select a Colour
- Then the chosen Colour should be applied to the selected Widget

## ID: 347

### User Story:

PB - As a User, I want to add Widgets directly to a Section

### Requirements:

1. Be able to drag Widgets from Nav to Section directly in Page Builder on Create/Edit mode

### Manual Scenario:

- Scenario: Dragging Widgets from Navigation Panel to a Section in Page Builder
- Given the user is in Create or Edit mode in Page Builder
- And the Navigation Panel is open
- When the user drags a Widget from the Navigation Panel to a Section
- Then the Widget should be added to the selected Section successfully
-
-
-
-
-
-
-

## ID: 348

### User Story:

PB - As a User, I want to add a new Widget "Spacer"

### Requirements:

1. Be able to see and drag a new type of Widget "Spacer" as per in a Section from Nav

### Manual Scenario:

- Scenario: Dragging the "Spacer" Widget from Navigation Panel to a Section
- Given the user is in Page Builder
- And the Navigation Panel is open
- When the user sees the new "Spacer" Widget in the Navigation Panel
- Then they should be able to drag the "Spacer" Widget into a Section
- And Given the user has dragged the "Spacer" Widget
- Then it should be added to the Section successfully

## ID: 349

### User Story:

PB - As a User, I want to delete a Widget with the underlying Block

### Requirements:

1. Be able to delete a Widget with the same experience of deleting the old Widget
2. the block behind will be deleted too with the Widget
3. Undo and Redo will remain the same for Widget deletion
4. Unsaved trigger will remain the same for Widget deletion

### Manual Scenario:

- Scenario: Deleting a Widget and Its Associated Block
- Given the user is in Page Builder in Create or Edit mode
- And a Widget is present in a Block
- When the user deletes the Widget
- Then the Widget deletion experience should be the same as deleting the old Widget
- And Given the Widget is deleted
- Then the Block behind the Widget should also be deleted
- And Given the Undo and Redo functions are available
- When the user clicks Undo or Redo after deleting a Widget
- Then the Widget and Block deletion should be reversible
- And Given the Unsaved Changes trigger exists
- When the user deletes a Widget and its Block
- Then the Unsaved Changes trigger should behave the same way as before

## ID: 350

### User Story:

PB - As a User, I want to have Text Box Widget toolbar as a whole for the combo of Block & Widget

### Requirements:

1. Be able to select Text Box Widget and Block as a whole, and the bounding box will be highlighted as the same experience as old Block's bounding box
2. Be able to see previously defined text box toolbar with Up arrow only with the Block bounding box experience

### Manual Scenario:

- Scenario: Selecting a Text Box Widget and Block with Bounding Box Highlighting
- Given the user is in Page Builder
- And a Text Box Widget is inside a Block
- When the user selects the Text Box Widget
- Then the entire Block should be selected as well
- And the bounding box should be highlighted with the same experience as the old Block's bounding box
- And Given the Text Box Widget is selected
- When the user interacts with the Text Box toolbar
- Then the toolbar should display only the Up arrow, maintaining the Block bounding box experience

## ID: 351

### User Story:

PB - As a User, I want to only select & see the combo of Widget and Block (bounding box experience) in Page Builder

### Requirements:

1. Be able to select Widget and Block as a whole, and the bounding box will be highlighted as the same experience as old Block's bounding box
2. Be able to only navigate Up back to the Section

### Manual Scenario:

- Scenario: Selecting a Widget and Block with Bounding Box Highlighting and Up Navigation
- Given the user is in Page Builder
- And a Widget is inside a Block
- When the user selects the Widget
- Then the entire Block should also be selected
- And the bounding box should be highlighted with the same experience as the old Block's bounding box
- And Given the Widget and Block are selected
- When the user attempts to navigate Up
- Then they should be taken back to the Section containing the Block
- And no other navigation options should be available

## ID: 352

### User Story:

PB - As a User, I want to undo & redo actions for the combo of Widget & Block

### Requirements:

1. Be able to Undo & Redo actions of the Widget & Block as whole
2. Adding Widgets with Blocks to Page (dragging in)
3. Removing/deleting Widgets with Blocks from Page
4. Moving Widgets with Blocks by dragging

### Manual Scenario:

- Scenario: Undo & Redo Actions for Widget and Block as a Whole
- Given the user is in Page Builder in Create or Edit mode
- And the Undo and Redo buttons are available
- When the user drags a Widget with its Block into the Page
- Then the action should be recorded
- And clicking Undo should remove the newly added Widget and Block
- And clicking Redo should restore the Widget and Block
- When the user deletes a Widget with its Block
- Then clicking Undo should restore the deleted Widget and Block
- And clicking Redo should delete the Widget and Block again
- When the user drags and moves a Widget with its Block to a different location
- Then clicking Undo should return the Widget and Block to their previous position
- And clicking Redo should move the Widget and Block back to the new position

## ID: 353

### User Story:

PB - As a User, I want to see a new landing page

### Requirements:

1. Be able to see just empty Sections with no "Blocks"

### Manual Scenario:

- Scenario: Viewing Empty Sections Without Blocks
- Given the user is in Page Builder
- And the Page is in Create or Edit mode
- When the user adds a new Section
- Then the Section should be visible as an empty container
- And it should not contain any Blocks by default
- And the user should have the option to drag Widgets into the empty Section

## ID: 354

### User Story:

[QW 1/5] Requester Re-assign: MCP Setting for new updates

### Requirements:

1. In MCP under the ‘_Development Use Only_’ section we add a new setting:
2. _Approvals - Approvals List (V3) - Requester Reassign (development use only):_
3. To be listed under other Approvals options in the ‘_Development Use Only_’ section

### Manual Scenario:

- Scenario: Adding a new 'Approvals - Approvals List (V3) - Requester Reassign' setting under 'Development Use Only' in MCP
- Given the user has administrative access to the Management Control Panel (MCP)
- When the user navigates to the 'Development Use Only' section in the MCP settings
- Then they should see a new setting labeled 'Approvals - Approvals List (V3) - Requester Reassign'
- And this setting should be listed under other 'Approvals' options within the 'Development Use Only' section

## ID: 355

### User Story:

PB - As a User, I want to report Resource Download (Preview) action in Usage Reporting for Custom Page Module

### Requirements:

1. Be able to track the Smart Page usage reporting and User’s usage reporting for resource download action (Preview type of Resource, aka “Good“ quality)

### Manual Scenario:

- Scenario: Track Smart Page and user resource download actions for "Good" quality previews
- Given a user is logged into the platform
- When the user interacts with a Smart Page
- And the user downloads a resource in "Good" quality preview mode
- Then the system records the Smart Page usage in the usage reporting system
- And the system logs the user's resource download action in the user's usage reporting system

## ID: 356

### User Story:

PB - As a User, I want to report on Resource downloaded (Preview) separately than added in Smart Page for Resource Module (Usage)

### Requirements:

1. Be able to track Resource usage reporting and User’s usage reporting - Resource download action that happens in Smart Pages for previously uploaded Resource (Preview type of Resource, aka “Good“ quality) via Resource Lookup

### Manual Scenario:

- Scenario: Track resource download actions in Smart Pages via Resource Lookup
- Given a user is editing a Smart Page
- And the user has added a previously uploaded resource to the page using the Resource Lookup feature
- When the user downloads the resource in "Good" quality (preview mode)
- Then the system records this download action in the resource usage reporting system
- And the system logs this download action in the user's usage reporting system

## ID: 357

### User Story:

Related (V3) - Permission Handling, Updates, and other core existing logic (F.E.) - [1 of 4: Resource Permissions]

### Requirements:

1. Instead of just re-writing existing permission logic, changes will need to be made in the re-write to help restore originally intended logic. The below calls out all logic scenarios with the required updates specifically noted with (!). _These should only apply for users using the V3 Related functionality (so tied to the development MCP setting)._

### Manual Scenario:

- Scenario: Restore intended permission logic for V3 Related functionality with development MCP setting
- Given the development MCP setting for V3 Related functionality is enabled
- And a user with specific permissions is logged into the system
- When the user attempts to perform an action related to the V3 Related functionality
- Then the system applies the updated permission logic as per the originally intended design
- And the user's action is allowed or denied based on these permissions
- And the system logs this permission check for auditing purposes

## ID: 358

### User Story:

Related (V3) - As a user I want to open View Related Items for Folder/Record/Databases (New Page ticket). [Design Ticket #3]

### Requirements:

1. When source item is a not a Resource (ie, is a _Folder_, or a _Database_, or a _Record_), this ‘View’ Related page will open when that source item’s Action or Icon is selected
2. Title of page is ‘Related - {{itemname}}’

### Manual Scenario:

- Scenario: Opening the 'Related' page for non-resource items
- Given a user is viewing a source item that is not a resource (e.g., a Folder, Database, or Record)
- When the user selects the action or icon associated with viewing related items for that source
- Then a new 'View' Related page opens
- And the title of the page is 'Related - {{itemname}}'

## ID: 359

### User Story:

Related (V3) - As a user I want to open View Related Items for Resources (in existing Info Page). [Design Ticket #2]

### Requirements:

1. When source item is a Resource, the ‘View’ Related screen will be added as a tab in Info Preview for that Resource
2. 'x' icon for Info Preview page and other existing elements should behave same for new tab as others

### Manual Scenario:

- Scenario: Addition of 'View' Related Tab in Resource Info Preview with Consistent Behavior
- Given a user is viewing the Info Preview of a Resource
- When the system adds a new 'View' Related tab to the Info Preview interface
- Then the 'View' Related tab should function consistently with existing tabs
- And the 'x' icon for closing the Info Preview should behave the same as it does for other tabs
- And all existing elements within the Info Preview should maintain their current behavior with the addition of the new tab

## ID: 360

### User Story:

Related (V3) - As a user I want to "Add Related Items" (Core New Overlay) [Design Ticket #1A: Overall Page UI + Resource Tab]

### Requirements:

1.This overlay will open when ‘Add items’ is selected from the ‘View’ related pages as handled in other tickets. 2. Page name in overlay header is '_Add Related Items:_ _{{itemname}}_

### Manual Scenario:

- Scenario: Opening the 'Add Related Items' Overlay from the 'View' Related Page
- Given the user is on the 'View' related page for an item named "{{itemname}}"
- When the user selects the 'Add items' option
- Then an overlay opens with the header titled 'Add Related Items: {{itemname}}'

## ID: 361

### User Story:

Related (V3) - Development MCP Setting

### Requirements:

1. New setting to be added under _Development Use Only_ section in MCP > Settings

### Manual Scenario:

- Scenario: Adding a New Setting Under 'Development Use Only' in MCP Settings
- Given an administrator is logged into the Management Control Panel (MCP)
- When the administrator navigates to the 'Settings' section
- Then they should see a section labeled 'Development Use Only'
- And within this section, there should be an option to add a new setting
- When the administrator adds a new setting
- Then the new setting should appear under the 'Development Use Only' section
- And the setting should be configurable as intended

## ID: 362

### User Story:

Rename "Simple" Page to "Smart" Page

### Requirements:

1. Be able to see the keyword updated to “Smart“ Page, instead of “Simple“ Page (front-end) in the Brand Page MVP project scope, see detailed locations to rename the keyword as below:
   || ||_Location to rename_||
   |1|V2 Index List > Add a Page:

### Manual Scenario:

- Scenario: Renaming 'Simple Page' to 'Smart Page' in the V2 Index List's 'Add a Page'
- Given a user is on the V2 Index List
- When the user selects the 'Add a Page' option
- Then they should see an option labeled 'Smart Page' instead of 'Simple Page'

## ID: 363

### User Story:

PB - (FE components) As a User, I want to move a sub page to become a standalone Simple Page (Parent)

### Requirements:

1. Be able to move a sub-Page to become a standalone Page that doesn’t contain any sub-Page, via drag-and-drop from Navigation Panel on editing mode in Page Builder
2. Be able to see the updated order / hierarchy of Page list from Navigation Panel

### Manual Scenario:

- Scenario: Moving a Sub-Page to Become a Standalone Page via Drag-and-Drop in Page Builder
- Given the user is in editing mode within the Page Builder
- And the Navigation Panel displays a hierarchical list of pages, including sub-pages
- When the user drags a sub-page from its current parent page and drops it into the root level of the Navigation Panel
- Then the sub-page becomes a standalone page without any sub-pages
- And the Navigation Panel updates to reflect the new page hierarchy
- And the user can see the updated order and hierarchy of the page list in the Navigation Panel

## ID: 364

### User Story:

Guest Upload MVP: Send success / confirmation email receipt to public user

### Requirements:

1. As per designs, using a V3 style email, when user successfully submits their public record a ‘success’ email is sent to that user via the email address we gathered during authentication / are adding to usage tracking
2. System Email is sent to the user’s email address after successful input and submit in

### Manual Scenario:

- Scenario: Sending a Success Email Upon Public Record Submission
- Given a user has successfully submitted their public record
- When the system processes the submission
- Then the system sends a 'success' email to the user's email address gathered during authentication
- And the email follows the V3 style design as per the provided templates
- And the email confirms the successful submission of the public record

## ID: 365

### User Story:

Guest Upload MVP: Skip/Bypass Record Workflow handling for Public User/First Stage of Database

### Requirements:

1.Overall, workflows should not apply for public users._ +\*\_It should act like ‘Skip’ workflow condition has been enabled_\*+ \_(that supersedes any other condition). This could mean that if a workflow is configured that a logged in user who submits a record for the same database may have to submit via a workflow while public user does not. 2. If a workflow is enabled for a single database, this is skipped for a public user

### Manual Scenario:

- Scenario: Public Users Bypass Workflow Requirements When Submitting Records
- Given a database has an active workflow configured for record submissions
- And a public user (not logged in) accesses the record submission form
- When the public user submits a new record to the database
- Then the system skips the workflow process for this submission
- And the record is accepted and processed immediately without workflow approval
- And a success message is displayed to the public user confirming the submission
- And a confirmation email is sent to the public user's provided email address

## ID: 366

### User Story:

Guest Upload MVP: Updated success message

### Requirements:

1. As per designs:
2. New tick icon displays
3. Main text/page header is ‘Your {{Record}} has been submitted’ (current text but updated positing etc)

### Manual Scenario:

- Scenario: Display Submission Confirmation with Tick Icon and Header
- Given a user submits a {{Record}}
- When the submission is successful
- Then a confirmation page displays
- And a tick icon appears on the page
- And the main header text reads 'Your {{Record}} has been submitted'

## ID: 367

### User Story:

Grouped Email Updates [existing designs]: Same Template Cross Folder Handling (different reviewers for different folders, but same template)

### Requirements:

1. If Cross Folder bulk edit involves resources from different folders that have workflows from the same Workflow Template, but where reviewers may be different per folder due to config (_as detailed in scenarios above, this could be a mix of Global+Local, or Global+Global but with different reviewers, or Local+Local with different reviewers_)

### Manual Scenario:

- Scenario: Cross-Folder Bulk Edit with Resources from Different Folders Sharing the Same Workflow Template but with Different Reviewers
- Given multiple resources located in different folders
- And each folder has a workflow configured from the same workflow template
- And the reviewers assigned to each folder's workflow are different
- When a user initiates a bulk edit action that includes resources from these different folders
- Then the system identifies the distinct sets of reviewers based on each folder's configuration
- And the system sends separate workflow approval requests to each set of reviewers corresponding to their respective folders
- And each set of reviewers receives a notification detailing the resources from their specific folder that require approval
- And the bulk edit changes are applied to the resources only after the respective reviewers from each folder have approved the changes

## ID: 368

### User Story:

Grouped Notifications: Record File/Resource Publish - Add options for users to continue to receive individual emails as well as Grouped ones (Core use case)

### Requirements:

1. For +Record File+ and +Resource Publish+ workflow Templates when _Enable Grouped Requests_ is selected, then the below new handling occurs:
2. When _User Notifications_ is set to _Select:_

### Manual Scenario:

- Scenario: Grouped Requests Handling in Record File and Resource Publish Workflows with Selective User Notifications
- Given the 'Enable Grouped Requests' option is activated for both Record File and Resource Publish workflow templates
- And the 'User Notifications' setting is configured to 'Select'
- When a user initiates multiple requests that qualify for grouping under these workflows
- Then the system consolidates these requests into a single grouped request
- And the system prompts the user to select specific recipients for notifications regarding this grouped request
- And only the selected users receive notifications about the grouped request
- And the grouped request proceeds through the workflow as a single entity

## ID: 369

### User Story:

[X-Template] Bulk Approvals - Select logic: Admin Level Setting for Cross-Template Handling (setting - logic in 41483)

### Requirements:

1. This ticket expands the support for what other requests can be selected from the Approval List when one item is selected, so that: If multiple Templates have- _-Enable Bulk Reviewing-_ -enabled-

### Manual Scenario:

- Scenario: Expanding Approval List Selection with Multiple Templates Having 'Enable Bulk Reviewing' Enabled
- Given multiple approval templates have the 'Enable Bulk Reviewing' option enabled
- And there are pending approval requests associated with these templates
- When a user selects one approval request from the approval list
- Then the system identifies other pending approval requests that are associated with templates having 'Enable Bulk Reviewing' enabled
- And the system allows the user to select and process these identified requests in bulk
- And the user can approve or reject multiple requests simultaneously
- And the system updates the status of all selected requests accordingly

## ID: 370

### User Story:

Grouped Resource Publish/Record File - Future Stage Handling for Reviewer Grouped Request Email consolidation

### Requirements:

1. +Admin > Template UI change+:
2. For Record File and Resource Publish Workflows, when they are selected as Staged in creation, or are an existing Staged template, then:

### Manual Scenario:

- Scenario: Admin Template UI Adjustments for Staged Record File and Resource Publish Workflows
- Given a user is in the Admin interface managing workflow templates
- When the user creates a new workflow template or accesses an existing one
- And the workflow template is designated as "Staged"
- And the workflow type is either "Record File" or "Resource Publish"
- Then the system displays UI elements specific to staged workflows
- And the user can configure settings pertinent to staged workflows
- And the system ensures that these configurations apply exclusively to the staged workflow template

## ID: 371

### User Story:

Staged Request 'Reviewer' data+component handling in Grouped Tab of Approvals List

### Requirements:

1.In Reviewers component on Grouped Tab for Staged requests:
2.List all reviewers across from all stages for all requests, including re-assign scenarios (ie, where a reviewer may only be a reviewer on 1 of X requests) 3. List which stage they are on (like we do for single requests)

### Manual Scenario:

- Scenario: Display All Reviewers Across All Stages for Grouped Staged Requests
- Given a user is viewing the 'Grouped' tab for staged requests
- When the system displays the list of reviewers
- Then it includes all reviewers from all stages across all requests, even if a reviewer is assigned to only one of multiple requests
- And each reviewer is accompanied by an indication of the specific stage(s) they are assigned to

## ID: 372

### User Story:

PB - As a User, I want to re-order pages within the same parent/root via Nav - FE integration

### Requirements:

1. Be able to re-order Pages via drag-and-drop from Nav Panel during editing
2. Sub-pages will be moved all together with Page if it contains any
3. After drag-and-drop of Pages, Sub-pages will be _collapsed_ under Page from Nav Panel

### Manual Scenario:

- Scenario: Reordering Pages via Drag-and-Drop in Navigation Panel during Editing
- Given the user is in editing mode within the Page Builder
- And the Navigation Panel displays a list of pages, some of which contain sub-pages
- When the user drags a page to a new position within the Navigation Panel
- Then the system moves the selected page to the new position
- And if the moved page contains sub-pages, all associated sub-pages move along with it
- And after the drag-and-drop action, any sub-pages under the moved page are collapsed in the Navigation Panel

## ID: 373

### User Story:

PB - As a User, I want to delete pages via Nav - BE

### Requirements:

1. Be able to click on setting button of a simple page from Nav as per and click on Delete
2. Be able to see the deletion popup (Page deletion and sub-page deletion )as per
3. Be able to click on yes or no to proceed the deletion or not

### Manual Scenario:

- Scenario: Deleting a Simple Page from the Navigation Panel
- Given the user is in the Page Builder's editing mode
- And the Navigation Panel displays a list of pages
- When the user clicks on the settings button of a simple page in the Navigation Panel
- And selects the "Delete" option
- Then a confirmation popup appears, indicating that the page and any sub-pages will be deleted
- And the popup provides "Yes" and "No" options to confirm or cancel the deletion
- When the user clicks "Yes"
- Then the selected page and all its sub-pages are deleted from the Navigation Panel
- And the Navigation Panel updates to reflect the deletion
- When the user clicks "No"
- Then the deletion is canceled
- And the page and its sub-pages remain unchanged in the Navigation Panel

## ID: 374

### User Story:

PB - As a User, I want to re-order pages within the same parent via Nav - BE

### Requirements:

1.Be able to re-order Pages via drag-and-drop from Nav Panel during editing 2. Sub-pages will be moved all together with Page if it contains any 3. After drag-and-drop of Pages, Sub-pages will be _collapsed_ under Page from Nav Panel 4. Be able to re-order sub-Pages via drag-and-drop within the _same_ parent Page from Nav Panel during editing

### Manual Scenario:

- Scenario: Reordering Pages and Sub-Pages via Drag-and-Drop in Navigation Panel during Editing
- Given the user is in editing mode within the Page Builder
- And the Navigation Panel displays a hierarchical list of pages, some containing sub-pages
- When the user drags a page to a new position within the Navigation Panel
- Then the system moves the selected page to the new position
- And if the moved page contains sub-pages, all associated sub-pages move along with it
- And after the drag-and-drop action, any sub-pages under the moved page are collapsed in the Navigation Panel

## ID: 375

### User Story:

MCP setting for new Grouped Approval types

### Requirements:

1. New MCP setting listed under _Development Use Only_ section
2. Setting: _Approvals - Approvals List (V3) - Grouped Approvals - Record File & Resource Publish (development use only):_

### Manual Scenario:

- Scenario: Adding a New Setting Under "Development Use Only" in MCP
- Given an administrator is logged into the Management Control Panel (MCP)
- And the administrator navigates to the "Settings" section
- When the administrator scrolls to the "Development Use Only" section
- Then they should see a setting labeled "Approvals - Approvals List (V3) - Grouped Approvals - Record File & Resource Publish (development use only)"
- And this setting should be configurable as per the system's standard configuration options

## ID: 376

### User Story:

As a user I can enable Grouped Requests in New/Existing Workflow for Resource Publish Template setting

### Requirements:

1. When MCP development setting from is enabled, a new setting is to be added to Admin > Workflow location for existing and new Resource Publish Workflow Templates

### Manual Scenario:

- Scenario: Addition of a New Setting in Admin Workflow for Resource Publish Templates Based on MCP Development Setting
- Given the "Approvals - Approvals List (V3) - Grouped Approvals - Record File & Resource Publish (development use only)" setting is enabled under the "Development Use Only" section in the Management Control Panel (MCP)
- When an administrator navigates to the Admin > Workflow section
- Then they should see a new setting available for both existing and new Resource Publish Workflow Templates
- And this new setting should be configurable as per the system's standard configuration options

## ID: 377

### User Story:

As a user I can enable Grouped Requests in New/Existing Workflow Template setting for Record File Approvals

### Requirements:

1. When MCP development setting from is enabled, a new setting is to be added to Admin > Workflow location for existing and new Record File Approval Templates
2. Setting ‘_Enable Grouped Requests_’
3. Tooltip text: ‘If enabled, multiple Requests that are successfully made at the same time via the Bulk Request action will be Grouped together. Grouped requests can be reviewed together in the Grouped Tab in the {{Workflows}} List, as well as individually.’

### Manual Scenario:

- Scenario: Adding 'Enable Grouped Requests' Setting to Record File Approval Templates
- Given the 'Approvals - Approvals List (V3) - Grouped Approvals - Record File & Resource Publish (development use only)' setting is enabled in the Management Control Panel (MCP)
- When an administrator navigates to Admin > Workflow
- And creates a new Record File Approval Template or edits an existing one
- Then they should see a setting labeled 'Enable Grouped Requests'
- And a tooltip for this setting displays: 'If enabled, multiple Requests that are successfully made at the same time via the Bulk Request action will be Grouped together. Grouped requests can be reviewed together in the Grouped Tab in the {{Workflows}} List, as well as individually.'
- And the administrator can enable or disable this setting as needed

## ID: 378

### User Story:

PB - As a User, I want the status of Resource added via Resource Lookup to be linked with Resource module - unsupported resource type scenario

### Requirements:

1.Be able to link the status with the the Resources added to Page Builder via Resource Lookup: 2. Image as Image Widget 3. Video as Video Widget

### Manual Scenario:

- Scenario: Display Resource Status for Widgets Added via Resource Lookup in Page Builder
- Given a user is in the Page Builder's editing mode
- When the user adds an Image Resource as an Image Widget via the Resource Lookup
- Then the status of the Image Resource should be displayed within the Image Widget
- And when the user adds a Video Resource as a Video Widget via the Resource Lookup
- Then the status of the Video Resource should be displayed within the Video Widget

## ID: 379

### User Story:

PB - As a User, I want to be able to download the resources added to the page, if I have permission to do so - Video widget

### Requirements:

1. Be able to _ONLY_ see the download button as per to download the added resources on Editing, Previewing & Viewing of Simple Page _by hovering on Widgets_:
2. Video resource from Video Widget

### Manual Scenario:

- Scenario: Display Download Button on Hover Over Video Widget in Simple Page
- Given a user is viewing, previewing, or editing a Simple Page containing a Video Widget
- When the user hovers over the Video Widget
- Then a download button should appear on the Video Widget
- And clicking the download button should initiate the download of the video resource associated with the Video Widget

## ID: 380

### User Story:

Guest Upload MVP: Hide Lookup Fields to Public Users

### Requirements:

1.Hide +All+ Lookup fields from +Public users only.+ Essentially it adds a new display condition for these fields which overrides all others: if current user is Public User, then we do not display. 2. We would need to skip any mandatory requirements for these hidden fields, including when only mandatory by conditions

### Manual Scenario:

- Scenario: Hide Lookup Fields and Skip Mandatory Validation for Public Users
- Given a public user accesses a form containing Lookup fields
- When the form is presented to the public user
- Then all Lookup fields should be hidden from the user's view
- And any mandatory validation associated with these hidden Lookup fields should be skipped, ensuring the public user can submit the form without encountering validation errors related to these fields

## ID: 381

### User Story:

[QW 4/5] Requester Re-assign: Load group users(expand group > users) from workflow config - (v2 component approach)

### Requirements:

1.As per, the below is not supported in the V2 Approvals List.
2.This means in V2 List, that Requesters cannot re-assign to any request unless Workflow or Main Admins (=current handling)

### Manual Scenario:

- Scenario: Requester Reassignment Restrictions in V2 Approvals List
- Given a requester has submitted an approval request in the V2 Approvals List
- When the requester attempts to reassign their own approval request
- Then the system should prevent the requester from reassigning the request
- And only Workflow Administrators or Main Administrators should have the ability to reassign approval requests in the V2 Approvals List

## ID: 382

### User Story:

Guest Upload MVP: Hide Close/Cancel/databaseName/etc for public users

### Requirements:

1. When user is a Public user and is Creating a public record, then:
2. We drop the Database name in the page header altogether (so header just says “Create {{Record}}”)
3. Hide the 'x' close icon

### Manual Scenario:

- Scenario: Public User Creates a Record Without Database Name in Header and No Close Icon
- Given a public user is on the "Create Record" page
- When the page is displayed
- Then the page header should read "Create {{Record}}" without mentioning the database name
- And the 'x' close icon should not be visible on the page

## ID: 383

### User Story:

PB - As a User, I want to move a sub page to become a standalone Smart Page (Parent)

### Requirements:

1. Be able to move a sub-Page to become a standalone Page that doesn’t contain any sub-Page, via drag-and-drop from Navigation Panel on editing mode in Page Builder
2. Be able to see the updated order / hierarchy of Page list from Navigation Panel
3. By default, the page list is in order of Last Updated as the same as V2 index list. Once the Navigation Panel gets re-ordered successfully by a User, the new order of Nav Panel will be updated and remain the latest order on editing and viewing till it gets updated again

### Manual Scenario:

- Scenario: Reordering Pages and Sub-Pages via Drag-and-Drop in Navigation Panel
- Given a user is in editing mode within the Page Builder
- When the user drags a sub-page from its parent page in the Navigation Panel and drops it at the top level
- Then the sub-page becomes a standalone page without any sub-pages
- And the Navigation Panel updates to reflect the new page hierarchy and order
- And the updated order persists across editing and viewing modes until it is changed again by the user

## ID: 384

### User Story:

PB - As a User, I want to move a page (sub-page or root-page) to a become a sub page via drag-drop

### Requirements:

1. Be able to move a sub-Page to another root (parent) Page and then become it’s sub-Page via drag-and-drop from Navigation Panel on editing mode in Page Builder as per
2. Be able to move a root page to become a sub-page of another root page as per

### Manual Scenario:

- Scenario: Reorganize Pages and Sub-Pages via Drag-and-Drop in Navigation Panel
- Given a user is in editing mode within the Page Builder
- When the user drags a sub-page and drops it onto a different root (parent) page in the Navigation Panel
- Then the sub-page becomes a child of the selected root page
- And the Navigation Panel updates to reflect the new page hierarchy
- When the user drags a root page and drops it onto another root page in the Navigation Panel
- Then the dragged root page becomes a sub-page of the target root page
- And the Navigation Panel updates accordingly to display the new hierarchy

## ID: 385

### User Story:

PB - As a User, I want to re-order pages within the same parent/root via Nav - FE UI component

### Requirements:

1. Be able to re-order Pages via drag-and-drop from Nav Panel during editing
2. Sub-pages will be moved all together with Page if it contains any
3. After drag-and-drop of Pages, Sub-pages will be _collapsed_ under Page from Nav Panel

### Manual Scenario:

- Scenario: Reordering Pages and Sub-Pages via Drag-and-Drop in Navigation Panel
- Given a user is in editing mode within the Page Builder
- When the user drags a page that contains sub-pages to a new position in the Navigation Panel
- Then the page, along with all its sub-pages, should move together to the new position
- And after the move, the sub-pages should be collapsed under the parent page in the Navigation Panel
- And the updated page order and hierarchy should be saved and persist across editing and viewing modes until changed again by the user

## ID: 386

### User Story:

PB - As a User, I want the status of Resource added via Resource Lookup to be linked with Resource module - resource deleted scenario

### Requirements:

1. Be able to link the status with the the Resources added to Page Builder via Resource Lookup:
2. Image as Image Widget
3. Video as Video Widget

### Manual Scenario:

- Scenario: Display Resource Status in Page Builder Widgets
- Given a user is in editing mode within the Page Builder
- When the user adds an image resource via Resource Lookup
- Then the system should insert an Image Widget displaying the selected image
- And the Image Widget should visibly indicate the current status of the image resource
- When the user adds a video resource via Resource Lookup
- Then the system should insert a Video Widget playing the selected video
- And the Video Widget should visibly indicate the current status of the video resource

## ID: 387

### User Story:

PB - As a User, I want to be able to download the resources added to the page, if I have permission to do so - Image widget

### Requirements:

1. Be able to _ONLY_ see the download button as per to download the added resources on Editing, Previewing & Viewing of Simple Page _by hovering on Widgets_:
2. Image resource from Image Widget

### Manual Scenario:

- Scenario: Display Download Button on Hover Over Image Widget in Page Builder
- Given a user is in the Page Builder in editing, previewing, or viewing mode
- When the user hovers over an Image Widget containing an image resource
- Then a download button should appear over the Image Widget
- And clicking the download button should initiate the download of the image resource
- And the download button should not be visible when the Image Widget is not being hovered over

## ID: 388

### User Story:

PB - As a User, I want the status of Resource added via Resource Lookup to be linked with Resource module - resource permission lost scenario

### Requirements:

1. Be able to only see page contents against my own permission of the resources
2. Be able to see placeholders icon in the middle and permission lost icon as per if the user has no permission on specific resources whilst editing/previewing/viewing the page
3. Be able to see tooltips by hovering on the permission lost icon as per

### Manual Scenario:

- Scenario: Display Placeholders and Permission Icons for Unauthorized Resources in Page Builder
- Given a user is editing, previewing, or viewing a page in the Page Builder
- When the page contains resources (e.g., images, videos) that the user does not have permission to access
- Then the system should display a placeholder icon in the center of the widget representing the restricted resource
- And a permission lost icon should be displayed as per the design specifications
- And hovering over the permission lost icon should reveal a tooltip explaining the lack of access to the specific resource
- And the user should only see page contents for resources they have permission to access

## ID: 389

### User Story:

PB - As an internal User, I want to set Page limits via MCP settings

### Requirements:

1. Be able to set Page limits on MCP control panel for client sites

### Manual Scenario:

- Scenario: Set Page Limits for Client Sites in the MCP Control Panel
- Given an administrator is logged into the MCP (Management Control Panel)
- When the administrator navigates to the settings section for a specific client site
- And the administrator sets a page limit for that client site
- Then the system should enforce the specified page limit for the client site
- And attempts to create additional pages beyond this limit should be restricted
- And an appropriate notification should be displayed to inform users of the page limit restriction

## ID: 390

### User Story:

[Bulk/Grouped] As a user, I cannot click Submit on single level unless I am on Response tab

### Requirements:

1. For requests that support Markup Comments & Versions/Revisions, when user accesses single view from the bulk review list, and clicks on Markup or Versions/Revisions tabs, then the _Submit & Next_ button is disabled on these tabs

### Manual Scenario:

- Scenario: Disable 'Submit & Next' Button on Markup and Versions/Revisions Tabs in Bulk Review
- Given a user is reviewing a request that supports Markup Comments and Versions/Revisions
- And the user accesses the single view from the bulk review list
- When the user clicks on the 'Markup' tab
- Then the 'Submit & Next' button should be disabled on the 'Markup' tab
- When the user clicks on the 'Versions/Revisions' tab
- Then the 'Submit & Next' button should be disabled on the 'Versions/Revisions' tab
- And the 'Submit & Next' button should remain enabled on other tabs where applicable

## ID: 391

### User Story:

[QW] Re-assign [Reporting]: Save & Display UUID of user who re-assigns

### Requirements:

1. This ticket it to not only add tracking to the new specific Requester scenario, +but for all Re-assign+ actions made after its release. At a high level the ticket will track:
2. Module & item the action was made against
3. User who made change

### Manual Scenario:

- Scenario: Track Re-assign Actions in the System
- Given a user with appropriate permissions is logged into the system
- When the user performs a re-assign action on a module or item
- Then the system should record the following information:
- The module and item against which the action was made
- The user who performed the re-assign action
- The date and time of the action
- And this information should be stored in the system's audit logs for tracking purposes

## ID: 392

### User Story:

[QW 3/5] Requester Re-assign: Load users (user list, load all users) from workflow config - (v2 component approach)

### Requirements:

1. Change from to exclude V2 Approval List from this new logic.
2. This means in V2 List, that Requesters cannot re-assign to any request unless Workflow or Main Admins

### Manual Scenario:

- Scenario: Restrict Requester Re-assignment Permissions in V2 Approval List
- Given a requester is accessing the V2 Approval List
- When the requester attempts to re-assign a request
- Then the system should prevent the requester from re-assigning the request
- And only users with Workflow Admin or Main Admin roles should have the permission to re-assign requests in the V2 Approval List

## ID: 393

### User Story:

[Bulk SBT] As a user when I toggle next I want the tab to stay engaged (ie. Markup or Response)

### Requirements:

1. When a user in on the Bulk review page and opens an individual request, then this will open to the Response tab for that request, as it does directly to the single request from the Approval List
2. If however the user selects the Markup or Version/Revision tab, and clicks either the right/next toggle, or the ‘Next’ footer button (if on a completed request), then when the next request in the list opens the last engaged tab also applies to this new request
3. Once user returns to the list, and clicks into another item then the behaviour re-sets to open Response by default

### Manual Scenario:

- Scenario: Maintain Active Tab Selection Across Requests in Bulk Review
- Given a user is on the Bulk Review page
- When the user opens an individual request
- Then the system should default to displaying the 'Response' tab for that request
- When the user selects the 'Markup' or 'Versions/Revisions' tab
- And the user navigates to the next request using the right/next toggle or the 'Next' footer button (if on a completed request)
- Then the system should display the same tab ('Markup' or 'Versions/Revisions') for the new request
- When the user returns to the Bulk Review list
- And the user opens another individual request from the list
- Then the system should reset to display the 'Response' tab by default for that request

## ID: 394

### User Story:

PB - As a User, I want to see sub-pages in Custom Page v2 index list (with a subtitle for parent)

### Requirements:

1. Be able to see a new row of information: "Parent: {parent page name}" after clicking on "+" button from the v2 index list for _sub-pages_

### Manual Scenario:

- Scenario: Display Parent Page Information for Sub-Pages in V2 Index List
- Given a user is viewing the V2 index list
- And the list contains pages with sub-pages
- When the user clicks on the "+" button next to a sub-page
- Then a new row of information should appear beneath the sub-page
- And this row should display "Parent: {parent page name}"
- Where "{parent page name}" is the name of the sub-page's parent page

## ID: 395

### User Story:

PB - As a User, I want to configure permissions of sub-pages in Admin -> Group

### Requirements:

1. Be able to see and configure sub-pages under their parent pages in line with design of resource folder/sub-folders in Admin - Group - Permission
2. Be able to trigger propagation in line with the same logic of resource folder/sub-folders in Admin - Group - Permission

### Manual Scenario:

- Scenario: Configure and Propagate Permissions for Sub-Pages Under Parent Pages
- Given an administrator is in the Admin - Group - Permission section
- When the administrator views the list of pages
- Then sub-pages should be displayed nested under their respective parent pages, consistent with the design of resource folders and sub-folders
- When the administrator sets permissions on a parent page
- And chooses to propagate these permissions
- Then the system should apply the same permissions to all sub-pages under that parent page, following the same logic used for resource folders and sub-folders
- And the administrator should receive a confirmation that permissions have been successfully propagated to all sub-pages

## ID: 396

### User Story:

PB - (BE) As a User, I want to create a sub-page for an exisiting Simple Page via Nav

### Requirements:

1. Be able to click on setting button of a simple page from Nav as per
2. Be able to see the sub-page popup as per

### Manual Scenario:

- Scenario: Access and View Sub-Page Settings via Navigation Panel
- Given a user is in the Page Builder's editing mode
- When the user clicks on the settings button (represented by a gear icon) of a simple page from the Navigation Panel
- Then a popup should appear displaying the settings for that page
- And if the page has sub-pages, the popup should include options to manage these sub-pages, such as viewing, adding, or editing them
- And the user should be able to configure settings specific to the sub-pages within this popup

## ID: 397

### User Story:

PB - (FE integration) As a User, I want to create a sub-page for an exisiting Simple Page via Nav

### Requirements:

1. Be able to click on setting button of a simple page from Nav as per
2. Be able to see the sub-page popup as per

### Manual Scenario:

- Scenario: Access Sub-Page Settings via Navigation Panel
- Given a user is in the Page Builder's editing mode
- When the user clicks on the settings button (represented by a gear icon) of a simple page from the Navigation Panel
- Then a popup should appear displaying the settings for that page
- And if the page has sub-pages, the popup should include options to manage these sub-pages, such as viewing, adding, or editing them
- And the user should be able to configure settings specific to the sub-pages within this popup

## ID: 398

### User Story:

[RESTRICTIONS] Same Template - Require Approval for Feedback requests cross-handling

### Requirements:

1. For Resource Feedback Requests, as long as requests are tied to the same Template, they can be selected together for Bulk Review regardless of if:
2. _Require Approval Response_ Setting is enabled or disabled

### Manual Scenario:

- Scenario: Bulk Review of Resource Feedback Requests with Mixed 'Require Approval Response' Settings
- Given multiple resource feedback requests exist that are associated with the same template
- And some of these requests have the 'Require Approval Response' setting enabled
- And some of these requests have the 'Require Approval Response' setting disabled
- When a reviewer selects these requests for bulk review
- Then the system should allow the selection of all these requests together for bulk review
- And the system should process the bulk review without any errors, regardless of the individual 'Require

## ID: 399

### User Story:

[Bulk Review] Same Template: Needed until - cross date value handling

### Requirements:

1. For Resource Download Requests, as long as requests are tied to the same Template, they can be selected together for Bulk Review regardless of what Needed until/Approved until value setting is, or value is (including no value)

### Manual Scenario:

- Scenario: Bulk Review of Resource Download Requests with Various 'Needed Until' or 'Approved Until' Values
- Given multiple resource download requests exist that are associated with the same template
- And these requests have varying 'Needed Until' or 'Approved Until' values, including some with no specified value
- When a reviewer selects these requests for bulk review
- Then the system should allow the selection of all these requests together for bulk review
- And the system should process the bulk review without any errors, regardless of the individual 'Needed Until' or 'Approved Until' values

## ID: 400

### User Story:

[RESTRICTIONS] Allow same Template Staged requests to be selected together if number of stages _in config_ doesn't match (or conditional requests with different stages)

### Requirements:

1.For Staged Pending Requests, as long as requests are tied to the same Template, AND as long as the requests themselves are on the same current stage, they can be selected together for Bulk Review regardless of the total number of stages in the config,

### Manual Scenario:

- Scenario: Bulk Review of Staged Pending Requests at the Same Current Stage
- Given multiple staged pending requests associated with the same workflow template
- And all these requests are currently at the same stage in the workflow
- When a reviewer selects these requests for bulk review
- Then the system should allow the selection of all these requests together for bulk review
- And the system should process the bulk review without any errors, regardless of the total number of stages configured in the workflow

## ID: 401

### User Story:

'Review Request' in footer should be plural - change to 'Review Request(s)'

### Requirements:

1. In Bulk Action Footer update ‘Review Request’ to ‘Review Request(s)’

### Manual Scenario:

- Scenario: Update 'Review Request' Button Text in Bulk Action Footer to 'Review Request(s)'
- Given a user is viewing the bulk action footer in the application
- When the bulk action footer is displayed
- Then the 'Review Request' button text should be updated to 'Review Request(s)'

## ID: 402

### User Story:

[Bulk SBT] Staged requests: values carry over for staged requests in individual response (should be wiped after stage response is submitted)

### Requirements:

1. When staged requests are present in the Bulk List, and user responds in Bulk - but request remains pending due to further stages being present - then the response fields for that request(s) are cleared

### Manual Scenario:

- Scenario: Clearing Response Fields for Staged Requests Remaining Pending After Bulk Response
- Given there are multiple staged requests present in the bulk list
- And these requests are currently pending at a specific stage
- And the workflow for these requests includes additional stages beyond the current one
- When a user submits a bulk response to these requests
- Then the system should process the responses for the current stage
- And the requests should remain pending due to the presence of further stages
- And the response fields for these requests should be cleared after the bulk response is submitted

## ID: 403

### User Story:

BP - As a User, I want to choose the best quality of single selected Image resource via Resource Lookup to appear as original file as a background image in the target area (download linkage)

### Requirements:

1. Be able to single select an Image resource via Resource Lookup overlay and proceed to Choose Image Quality popup afterwards
2. Be able to see the Image Quality options popup in Page Builder as per

### Manual Scenario:

- Scenario: Selecting an Image Resource and Choosing Image Quality in Page Builder
- Given the user is editing a page in Page Builder
- When the user opens the Resource Lookup overlay
- And the user selects a single image resource
- Then the system displays the "Choose Image Quality" popup
- And the user can select the desired image quality option from the popup
- And the selected image with the chosen quality is inserted into the page

## ID: 404

### User Story:

BP - As a User, I want to choose the best quality of single selected Image resource via Resource Lookup to appear as original file in Image Widget (download linkage)

### Requirements:

1. Be able to single select an Image resource via Resource Lookup overlay and proceed to Choose Image Quality popup afterwards
2. Be able to see the Image Quality options popup in Page Builder as per

### Manual Scenario:

- Scenario: Selecting an Image Resource and Choosing Image Quality in Page Builder
- Given the user is editing a page in the Page Builder
- When the user opens the Resource Lookup overlay
- And the user selects a single image resource
- Then the system displays the "Choose Image Quality" popup
- And the user can select the desired image quality option from the popup
- And the selected image with the chosen quality is inserted into the page

## ID: 405

### User Story:

[QW] Option to access to the Usage Reporting of an object with any permission to it vs requiring the highest level [following research in IB-41918]

### Requirements:

1. New option to be added to _Admin_ > _Settings_ page, under the _General_ section, at the bottom of that section.
2. Name: _{{Reports}} Access Restrictions_

### Manual Scenario:

- Scenario: Adding the 'Reports Access Restrictions' Option to the Admin Settings Page
- Given an administrator is logged into the system
- When the administrator navigates to the 'Admin' section
- And accesses the 'Settings' page
- Then they should see a new option labeled 'Reports Access Restrictions'
- And this option should be located at the bottom of the 'General' section
- And the administrator should be able to configure the 'Reports Access Restrictions' settings as intended

## ID: 406

### User Story:

Record File Grouped Requests handled in Group Review Page

### Requirements:

1. _Overall_ page design and behaviour matches Grouped Download handling with some minor exceptions:
2. _Bulk Download_ will not yet display here

### Manual Scenario:

- Scenario: Page Design Mimicking Grouped Download Handling with Bulk Download Omission
- Given a user is interacting with the page
- When the page is displayed
- Then the overall design and behavior of the page should match that of the Grouped Download handling
- Except the 'Bulk Download' feature should not be displayed on this page

## ID: 407

### User Story:

Record File Grouped Requests added to Group tab

### Requirements:

1. Grouped Record File requests are to be listed in the Grouped tab in V3 Approval List
2. This may cause the Grouped Tab to display for users that otherwise may not have seen it - ie, a Requester who never previously saw the Grouped Tab but requests their first Grouped Record File request will now see this Tab in the V3 Approvals List.

### Manual Scenario:

- Scenario: Displaying Grouped Record File Requests in the Grouped Tab of the V3 Approval List
- Given a user has submitted one or more Grouped Record File requests
- When the user navigates to the V3 Approval List
- Then the "Grouped" tab should be visible
- And the user's Grouped Record File requests should be listed under the "Grouped" tab
- And if the user has not previously seen the "Grouped" tab, it should now be displayed due to the presence of their Grouped Record File requests

## ID: 408

### User Story:

Publish Resource Grouped Requests handled in Group Review Page

### Requirements:

1. _Overall_ page design and behaviour matches Grouped Download handling with some minor exceptions
2. _Bulk Download_ will not yet display here

### Manual Scenario:

- Scenario: Page Design Aligns with Grouped Download Handling, Excluding Bulk Download Feature
- Given a user accesses the page
- When the page is displayed
- Then the overall design and behavior of the page should match that of the Grouped Download handling
- And the 'Bulk Download' feature should not be displayed on this page

## ID: 409

### User Story:

Publish Resource Grouped Requests added to Group tab

### Requirements:

1. Grouped Resource Publish requests are to be listed in the Grouped tab in V3 Approval List
2. This may cause the Grouped Tab to display for users that otherwise may not have seen it - ie, a Requester who never previously saw the Grouped Tab but requests their first Grouped Resource Publish request will now see this Tab in the V3 Approvals List.

### Manual Scenario:

- Scenario: Displaying Grouped Resource Publish Requests in the Grouped Tab of the V3 Approval List
- Given a user has submitted their first Grouped Resource Publish request
- When the user navigates to the V3 Approval List
- Then the "Grouped" tab becomes visible to the user
- And the user's Grouped Resource Publish request is listed under the "Grouped" tab

## ID: 410

### User Story:

Grouped Record Files - Grouped Completion Email to Requester

### Requirements:

1. Following, when _Enable Grouped Requests_ setting is enabled + _Requester > Grouped Request has been completed_ Grouped notification settings is enabled (in Select scenario or as part of ‘All’), then on Grouped Record File request being made, then:
2. Individual emails are no longer sent for these requests as they are individually completed

### Manual Scenario:

- Scenario: Suppressing Individual Completion Emails for Grouped Record File Requests
- Given the 'Enable Grouped Requests' setting is enabled
- And the 'Requester > Grouped Request has been completed' notification setting is enabled
- When a grouped Record File request is made
- Then individual completion emails should not be sent for each request as they are completed
- And a single grouped completion notification should be sent to the requester upon completion of the grouped request

## ID: 411

### User Story:

Grouped Record Files - Grouped Email Notification Settings added to Record File Templates

### Requirements:

1. When MCP development setting from is enabled, and the new ‘_Enable Grouped Requests_’ setting is enabled in Admin > Workflow location for existing or new Record File Approval Templates, then additional Notification options appear when User Notifications is set to ‘Select’
2. _Requester Emails_

### Manual Scenario:

- Scenario: Display Additional Notification Options When 'Enable Grouped Requests' is Enabled
- Given the 'MCP development' setting is enabled
- And the 'Enable Grouped Requests' setting is enabled in Admin > Workflow for a Record File Approval Template
- And 'User Notifications' is set to 'Select'
- When a user configures the notification settings
- Then additional notification options for 'Requester Emails' should be displayed

## ID: 412

### User Story:

Grouped Resource Publish - Grouped Completion Email to Requester

### Requirements:

1. Following, when _Enable Grouped Requests_ setting is enabled + _Requester > Grouped Request has been completed_ Grouped notification settings is enabled (in Select scenario or as part of ‘All’), then on Group Resource Publish request being made, then:
2. Individual emails are no longer sent for these requests as they are individually completed

### Manual Scenario:

- Scenario: Suppressing Individual Completion Emails for Grouped Resource Publish Requests
- Given the 'Enable Grouped Requests' setting is enabled
- And the 'Requester > Grouped Request has been completed' notification setting is enabled
- When a grouped Resource Publish request is made
- Then individual completion emails should not be sent for each request as they are individually completed
- And a single grouped completion notification should be sent to the requester upon completion of the grouped request

## ID: 413

### User Story:

Grouped Resource Publish - Grouped Email Notification Settings added to Resource Publish Templates

### Requirements:

1. When MCP development setting from is enabled, and the new ‘_Enable Grouped Requests_’ setting is enabled in Admin > Workflow location for existing or new Resource Publish Workflow Templates, then additional Notification options appear when User Notifications is set to ‘Select’ (in line with Download Templates, and replicating Record File Approval work in ):
2. _Requester Emails_:

### Manual Scenario:

- Scenario: Displaying Additional Notification Options When 'Enable Grouped Requests' is Enabled for Resource Publish Workflow Templates
- Given the 'MCP development' setting is enabled
- And the 'Enable Grouped Requests' setting is enabled in Admin > Workflow for a Resource Publish Workflow Template
- And 'User Notifications' is set to 'Select'
- When a user configures the notification settings
- Then additional notification options for 'Requester Emails' should be displayed, similar to those available for Download Templates and Record File Approval workflows

## ID: 414

### User Story:

PB - As a User, I want to delete pages via Nav - FE

### Requirements:

1. Be able to click on setting button of a simple page from Nav as per and click on Delete
2. Be able to see the deletion popup

### Manual Scenario:

- Scenario: Deleting a Simple Page via Navigation Settings
- Given I am on the navigation panel in editing mode
- When I click on the settings button of a simple page
- And I select the "Delete" option
- Then a deletion confirmation popup should appear

## ID: 415

### User Story:

PB - (DND replace) As a User, I want to create a sub-page for an exisiting Smart Page via Nav

### Requirements:

1. Be able to click on setting button of a simple page from Nav as per
2. Be able to see the sub-page popup as per
3. Be able to input the sub page's title and save (change "Done" to "Save")

### Manual Scenario:

- Scenario: Adding a Sub-Page via Navigation Settings
- Given I am in the navigation panel in editing mode
- When I click on the settings button of a simple page
- And I select the "Add Sub-Page" option
- Then a sub-page creation popup should appear
- When I input the sub-page's title
- And I click the "Save" button
- Then the new sub-page should be added under the selected simple page in the navigation panel

## ID: 416

### User Story:

[X-Template] Bulk Approvals - Select logic: Advanced cross template/type select (excluding record requests) - Full support/logic

### Requirements:

1.This ticket expands the support for what other requests can be selected from the Approval List when one item is selected, so that:
2.If multiple Templates have _Enable Bulk Reviewing_ enabled

### Manual Scenario:

- Scenario: Selecting Multiple Requests for Bulk Review Across Templates with 'Enable Bulk Reviewing' Enabled
- Given multiple workflow templates have the 'Enable Bulk Reviewing' setting enabled
- And there are pending requests associated with these templates in the approval list
- When I select a request associated with one template
- Then I should be able to select additional requests associated with other templates that also have 'Enable Bulk Reviewing' enabled
- And I can perform bulk review actions on the selected requests

## ID: 417

### User Story:

[RESTRICTIONS] Select logic: Extended same settings/ template across params for Selection

### Requirements:

1. This ticket expands the support for what can be _selected_ from the Approval List so that when one item is selected, based on the Workflow Template, then:
2. Overall - all requests (except for below staged exception) that belong to the same Template can also be selected for Bulk Review

### Manual Scenario:

- Scenario: Selecting Multiple Requests for Bulk Review Based on Workflow Template
- Given I am on the Approval List
- And there are multiple requests associated with the same Workflow Template
- When I select one request associated with that Workflow Template
- Then I should be able to select additional requests associated with the same Workflow Template for Bulk Review

## ID: 418

### User Story:

Bulk Approve Response action Tracking surfacing in Stats - new column in Responses (Bulk Review > in > Yes)

### Requirements:

1. Using back end data captured in we will surface that information in a new Stats column

### Manual Scenario:

- Scenario: Displaying Backend Data in a New 'Stats' Column
- Given I am on the Approval List page
- When I view the list of requests
- Then a new 'Stats' column should be displayed
- And each row in the 'Stats' column should display the corresponding backend data captured for that request

## ID: 419

### User Story:

[RESTRICTIONS] Cross param handling of 'Complete Stage/Complete Request' (merge setting in bulk, apply to relevant in bulk action)

### Requirements:

1. When we can detect that the requests selected for Bulk Review feature a mix of items where some have _Complete Stage_ and some have *Complete Reques*t fields for relevant Admin users (Main Admins and Workflow Admins), then on the Bulk Review panel we merge these settings into one:
2. Name: “_Complete Stage / Request_”

### Manual Scenario:

- Scenario: Merging 'Complete Stage' and 'Complete Request' Options in Bulk Review Panel
- Given I am an Admin user (Main Admin or Workflow Admin) accessing the Bulk Review panel
- And I have selected multiple requests for Bulk Review, some of which have the 'Complete Stage' option and others have the 'Complete Request' option
- When I view the Bulk Review panel
- Then I should see a single merged option labeled 'Complete Stage / Request'
- And selecting this option should apply the appropriate completion action to each request based on its configuration

## ID: 420

### User Story:

[RESTRICTIONS] Cross param handling of 'Hide Decline' (hide Decline if all share param, ignore Bulk Apply of Decline to items that don't apply)

### Requirements:

1. When we can detect that the requests selected for Bulk Review feature a mix of items where Hide Decline is enabled and some that do not, then on the Bulk Review response panel we still display Decline as an option

### Manual Scenario:

- Scenario: Displaying 'Decline' Option in Bulk Review Panel with Mixed 'Hide Decline' Settings
- Given I am an Admin user (Main Admin or Workflow Admin) accessing the Bulk Review panel
- And I have selected multiple requests for Bulk Review, where some requests have the 'Hide Decline' setting enabled and others do not
- When I view the Bulk Review response panel
- Then the 'Decline' option should still be displayed as an available action

## ID: 421

### User Story:

[RESTRICTIONS] Cross param handling of 'Yes with Comments' (show when one request has this - ignore items on bulk that don't apply)

### Requirements:

1. When we can detect Bulk Review items would feature a mix of items with _Approve with Comments_ and some that do not, then on the Bulk Review response panel we show ‘Approve with Comments’ as an option

### Manual Scenario:

- Scenario: Displaying 'Approve with Comments' Option in Bulk Review Panel with Mixed Request Settings
- Given I am an Admin user accessing the Bulk Review panel
- And I have selected multiple requests for Bulk Review, where some requests have the 'Approve with Comments' option enabled and others do not
- When I view the Bulk Review response panel
- Then the 'Approve with Comments' option should be displayed as an available action
- And selecting this option should apply the 'Approve with Comments' action to the applicable requests
- And for requests where 'Approve with Comments' is not applicable, the system should apply the standard 'Approve' action

## ID: 422

### User Story:

Bulk Approve Response UUID {createdInBulkId} condition in Stats - so we can see all requests responded to together

### Requirements:

1. In terms of ordering, this displays under ‘Bulk Review’ in the column dropdown

### Manual Scenario:

- Scenario: Ensure 'Bulk Review' Column Appears in the Correct Order in the Column Dropdown
- Given I am on the page with a column dropdown menu
- When I open the column dropdown menu
- Then I should see the 'Bulk Review' option listed in the menu
- And the 'Bulk Review' option should appear in the correct order within the dropdown menu

## ID: 423

### User Story:

Bulk Approve Response UUID {createdInBulkId} display column in Stats - Workflow Responses(to be used in condition)

### Requirements:

1.Using back end data captured in we will surface that information in a new Stats column

### Manual Scenario:

- Scenario: Display Backend Data in 'Stats' Column
- Given I am an authorized user on the Approval List page
- When I view the list of requests
- Then I should see a 'Stats' column displayed
- And each row in the 'Stats' column should display the corresponding backend data captured for that request

## ID: 424

### User Story:

[RESTRICTIONS] Cross param handling of Comment field (plain text on bulk page regardless of if rich on request)

### Requirements:

1. When we can detect that the requests selected for Bulk Review feature a mix of items where Rich Text Comments is enabled and some that do not, then on the Bulk Review response panel +we only display the plain comments option+
2. Text entered in Basic text on bulk response can be applied to both basic and rich text comment fields on individual level
3. Users can update to rich text on the single level for those relevant requests

### Manual Scenario:

- Scenario: Handling Mixed Rich Text and Plain Text Comments in Bulk Review
- Given I am an Admin user accessing the Bulk Review panel
- And I have selected multiple requests for Bulk Review, where some requests have 'Rich Text Comments' enabled and others do not
- When I view the Bulk Review response panel
- Then only the plain text comments option is displayed
- And any text entered in the plain text comments field is applied to both basic and rich text comment fields at the individual request level
- And I can update to rich text comments on individual requests where 'Rich Text Comments' is enabled

## ID: 425

### User Story:

Bulk Approve action Tracking surfacing in Review Request - Responses

### Requirements:

1. This ticket is to add some sort of UI indicator against the Request Status > Response(s) +to denote if response was submitted on the single view, or in bulk
2. Current look:

### Manual Scenario:

- Scenario: Indicating Submission Method for Request Responses
- Given I am a user viewing the Request Status > Response(s) section
- When I look at the list of responses
- Then each response should have a UI indicator showing whether it was submitted via single view or bulk action
- And the indicator should be clear and distinguishable for both submission methods

## ID: 426

### User Story:

Bulk Approve Response action Tracking surfacing in Stats - new condition in Responses (Bulk Review > in > Yes)

### Requirements:

1. In terms of ordering, this displays under ‘Reviewer Comment’ in the condition dropdown

### Manual Scenario:

- Scenario: Ensure 'Reviewer Comment' Option Appears in Correct Order in Condition Dropdown
- Given I am a user interacting with a condition dropdown menu
- When I open the condition dropdown menu
- Then I should see the 'Reviewer Comment' option listed
- And the 'Reviewer Comment' option should appear in the correct order within the dropdown menu

## ID: 427

### User Story:

[RESTRICTIONS] When we detect not all requests have same params we modify Response section (Overall check for non-matching params)

### Requirements:

1. This is the overall ticket to detect when items do not have matching params, in which case we know to modify the bulk response section
2. This ticket is to handle the workflow setting passed to BulkReview component. Previously it’s the workflow setting id which calls BE to fetch the config but now it needs to pass a setting including all params directly.
3. How we handle the UI changes in cross-param scenarios is to be handled in each individual ticket

### Manual Scenario:

- Scenario: Handle Mismatched Parameters in Bulk Response Section
- Given I am an authorized user accessing the Bulk Review panel
- And I have selected multiple requests with differing workflow parameters
- When the system detects mismatched parameters among the selected requests
- Then the Bulk Review component should receive the complete workflow settings, including all parameters, directly
- And the Bulk Review response section should adjust accordingly to accommodate the differing parameters
- And the UI should reflect these adjustments as specified in the individual handling tickets

## ID: 428

### User Story:

[QW] Stats - Workflow Responses: Add in data column for "Requester Comment" [to be done after IB-18115]

### Requirements:

1.When run, the data that gets returned is the comment the Requester added at time request was submitted
2.In terms of ordering, this displays under ‘Requester’ in the child column dropdown

### Manual Scenario:

- Scenario: Display Requester's Comment and Order 'Requester Comment' Column in Child Column Dropdown
- Given a requester submits a request with a comment
- When an authorized user retrieves the request data
- Then the system should return the comment added by the requester at the time of submission
- And in the child column dropdown, the 'Requester Comment' option should be displayed immediately under the 'Requester' option

## ID: 429

### User Story:

PB - As a User, I want to see Nav panel when viewing a Simple Page

### Requirements:

1. Be able to see the new extend / collapse button icon from the top left to open the Left Side Panel as Page Nav as per
2. Be able to see all the saved Simple pages from the Left Side Panel against current user’s permission as per

### Manual Scenario:

- Scenario: Expand/Collapse Left Side Panel to Display Simple Pages Based on User Permissions
- Given I am a user with specific permissions
- When I click the expand/collapse button icon located at the top left corner of the interface
- Then the Left Side Panel should open as the Page Navigation
- And I should see all the saved Simple pages in the Left Side Panel that I have permission to access

## ID: 430

### User Story:

PB - As a User, I want to switch pages via Nav (with popup msg if there is a change during editing/previewing)

### Requirements:

1. Be able to see popup warning msg if switching pages _without_ changes saved (including Page Title) on creating / editing as per

### Manual Scenario:

- Scenario: Display Warning Popup When Navigating Away with Unsaved Changes
- Given I am creating or editing a page
- And I have made changes that have not been saved, including modifications to the Page Title
- When I attempt to switch to another page without saving these changes
- Then a warning popup message should appear, alerting me that I have unsaved changes
- And the popup should prompt me to confirm whether I want to leave the current page without saving or stay to save my changes

## ID: 431

### User Story:

PB - As a User, I want to see Nav panel when editing a Simple Page(FE)

### Requirements:

1. Be able to see the new tab "Pages" from Right Side Panel when editing an existing Simple Page (By default, it's opened, compared to "Builder") as per
2. Be able to see all the saved Simple pages against current user’s permission, from the tab of the Right Side Panel as per

### Manual Scenario:

- Scenario: Display "Pages" Tab in Right Side Panel with Accessible Simple Pages
- Given I am editing an existing Simple Page
- When I view the Right Side Panel
- Then the "Pages" tab should be visible and open by default
- And the "Pages" tab should list all saved Simple Pages that I have permission to access

## ID: 432

### User Story:

PB - As a User, I want to see Nav panel when creating a Simple Page(BE)

### Requirements:

1. Be able to see the new tab "Pages" from Right Side Panel when creating a Simple Page (By default, it's opened, compared to "Builder" tab) as per
2. Be able to see all the saved Simple pages against current user’s permission, from the tab of the Right Side Panel as per
3. By default, in oder of _Last Updated_ as the same in v2 index list

### Manual Scenario:

- Scenario: Display "Pages" Tab in Right Side Panel During Simple Page Creation with Ordered List of Accessible Pages
- Given I am creating a new Simple Page
- When I view the Right Side Panel
- Then the "Pages" tab should be visible and open by default
- And the "Pages" tab should list all saved Simple Pages that I have permission to access
- And the list of pages should be ordered by the "Last Updated" date, consistent with the ordering in the version 2 index list

## ID: 433

### User Story:

[GDA] - As a User if I don't have permission to download the item I have to request permission to download again (or cannot download) - Part 2/2 - single download button

### Requirements:

1. Single Download icon displays for this user

### Manual Scenario:

- Scenario: Display Single Download Icon for Authorized Users
- Given I am a user with permission to download content
- When I access a page with downloadable content
- Then I should see a single download icon displayed
- And clicking the download icon should initiate the download process for the content

## ID: 434

### User Story:

As a User, I want to see "Closed Caption" only when file format is enabled as Video from Filter Panel in Resource module

### Requirements:

1. Filtering Options - General Options - Closed Captions will be by default invisible and will be visible only when the File Format is enabled with 'Video,' 'Audio,' or 'Video and Audio.' in the below scenarios:
2. Only Audio +or+ Video is selected

### Manual Scenario:

- Scenario: Conditional Visibility of Closed Captions Filter Based on File Format Selection
- Given I am on the Filtering Options interface under General Options
- When I select 'Audio', 'Video', or 'Video and Audio' as the File Format
- Then the Closed Captions filter should become visible
- And I should be able to interact with the Closed Captions filter
- When I select any other File Format
- Then the Closed Captions filter should be hidden

## ID: 435

### User Story:

[Cross Folder Bulk Edit] As a bulk edit user, I can see the Folder Filter in single view

### Requirements:

1. Add Folder Filter into Single Request pages, as per designs
2. When a single request is selected, the relevant folder that resource belongs to appears as selected in that filter

### Manual Scenario:

- Scenario: Display Folder Filter and Auto-Select Relevant Folder on Single Request Pages
- Given I am viewing a single request page
- When the page loads
- Then a Folder Filter should be visible on the page
- And the Folder Filter should automatically select and display the folder to which the resource in the request belongs

## ID: 436

### User Story:

BP - As a User, I want the single selected Video resource via Resource Lookup to appear in Video Widget (preview linkage)

### Requirements:

1. Be able to upload the latest single-selected video resource from overlay to target areas on page
2. Video Widgets
3. Be able to see the selected Video resource with .mp4 file type by its preview link as default

### Manual Scenario:

- Scenario: Upload and Display a Single-Selected Video Resource in Video Widgets with Default .mp4 Preview
- Given I have opened the resource selection overlay
- When I single-select a video resource with a .mp4 file type
- And I upload it to a target area on the page designated for video widgets
- Then the selected video should be displayed within the video widget
- And the video should be previewed by default using its .mp4 file
- And I should be able to play the video directly within the widget

## ID: 437

### User Story:

BP - As a User, I want the single selected Image resource via Resource Lookup to appear in Image Widget (preview linkage)

### Requirements:

1. Be able to see the latest single-selected image resource from overlay in target areas:
2. Image Widgets
3. Be able to see the selected and added image resource by its preview link

### Manual Scenario:

- Scenario: Display Selected Image Resource in Image Widget with Preview Link
- Given I am using the resource selection overlay
- When I single-select an image resource
- And I add it to an Image Widget on the page
- Then the selected image should be displayed within the Image Widget
- And the image should be accessible through its preview link

## ID: 438

### User Story:

BP - As a User, I want the single selected Image resource via Resource Lookup to appear as a background image in the target area (preview linkage)

### Requirements:

1. Be able to see the latest single-selected image resource from overlay in target areas:
2. Page, Section, Block as background
3. Be able to see the selected and added image resource by its preview link

### Manual Scenario:

- Scenario: Apply Selected Image Resource as Background to Page, Section, or Block
- Given I am editing a page
- And I have opened the resource selection overlay
- When I single-select an image resource
- And I apply it as a background to a specific page, section, or block
- Then the selected image should be set as the background for the chosen page, section, or block
- And the background image should be displayed using its preview link

## ID: 439

### User Story:

BP - As a User, I want to single select resources from Resource Lookup with unchangeable filter based on file type in Page Builder

### Requirements:

1. Be able to see and select resources into Page Builder via Resource Lookup with unchangeable filter applied with results by default, depending on the target page area:
2. Page/Section/Block background: Filtering Options > General Options > File Format will be _locked_ with only _Image_ enabled

### Manual Scenario:

- Scenario: Resource Lookup with Unchangeable Image Filter for Background Selection in Page Builder
- Given I am using the Resource Lookup overlay within the Page Builder
- When I attempt to select a resource for a Page, Section, or Block background
- Then the Filtering Options should display
- And the General Options > File Format filter should be locked with only 'Image' enabled
- And the search results should display only image resources
- And I should be able to select an image resource from these results
- And the selected image should be applied as the background to the chosen Page, Section, or Block

## ID: 440

### User Story:

As a user, if "Yes, with comments Response Option" is enabled for the workflow, I can see 'Approve with comments' response option in Bulk Response field

### Requirements:

1. In the ‘My Response’ panel, the below fields should already be handled in terms of when they appear (based on request settings/params):
2. Response (Approve / Decline)

### Manual Scenario:

- Scenario: Conditional Display of 'Approve' and 'Decline' Options in 'My Response' Panel Based on Request Settings
- Given a request is displayed in the 'My Response' panel
- When the request's settings permit approval or declination
- Then the 'Approve' and 'Decline' options should be visible in the 'My Response' panel
- But if the request's settings do not permit approval or declination
- Then the 'Approve' and 'Decline' options should not be visible in the 'My Response' panel

## ID: 441

### User Story:

As a user I can only select a max of 300 items to Review in Bulk (FE)

### Requirements:

1. When user has selected 300 total items, then:
2. All other select icons for non-selected items in the list become disabled

### Manual Scenario:

- Scenario: Disable Selection of Additional Items After Reaching Selection Limit
- Given I am on a page with a list of selectable items
- When I select items from the list
- And the total number of selected items reaches 300
- Then the selection controls for all non-selected items should become disabled
- And I should not be able to select any additional items beyond the 300-item limit
-
-
-
-

## ID: 442

### User Story:

Need to add Stage icon in bulk review list for Staged requests

### Requirements:

1.Follow staged icon handling in the Approvals List and add that into the Bulk Review Page list, where relevant 2. Stage may update as requests are responded to, ie we will need to reflect any changes in the stages in the list after bulk actions

### Manual Scenario:

- Scenario: Display and Update Stage Icons in Bulk Review Page List
- Given I am on the Bulk Review page
- And the list of requests includes stage icons indicating their current stages
- When I perform bulk actions that change the stages of multiple requests
- Then the stage icons in the list should update to reflect the new stages of the affected requests

## ID: 443

### User Story:

As a user, I want to see added information saved to request when I click on Navigation buttons for Single Page

### Requirements:

1.This should follow same requirements as in but with the below additional handling to what has already been done in Grouped work: 2. If ‘Complete Stage’ is present and selected/deselected (either via bulk apply, or single) then this is retained on the individual item level as user navigates between items (either toggles, save & next, or clicking out of single > back to list > back to single)

### Manual Scenario:

- Scenario: Retaining 'Complete Stage' Selection During Navigation in Bulk Review
- Given I am on the Bulk Review page
- And I have selected or deselected the 'Complete Stage' option for individual requests
- When I navigate between items using toggles, the 'Save & Next' button, or by clicking out of a single item back to the list and then back to a single item
- Then the 'Complete Stage' selection should be retained for each individual request as previously set

## ID: 444

### User Story:

As a user I can see 'Hide Decline', 'Complete Stage' etc fields in Bulk page - bulk apply handling for new fields

### Requirements:

1. Overall, Bulk Apply of existing response options (as done in Grouped Review page work) should apply natively here, and be verified in dev testing and A/C

### Manual Scenario:

- Scenario: Applying Bulk Responses in the Bulk Review Page
- Given I am on the Bulk Review page
- When I select multiple requests for review
- And I apply a bulk response action (e.g., approve, decline, or add comments)
- Then the selected response should be applied to all chosen requests
- And the status and any associated indicators (such as stage icons) should update accordingly for each request
- And these changes should be accurately reflected in the system's records and reports

## ID: 445

### User Story:

As a user, I can see "My Response" section that shows all editable fields (same params) - display of new fields

### Requirements:

1. In the ‘My Response’ panel, the below fields should already be handled in terms of when they appear (based on request settings/params):
2. Response Comment (either rich text, or not)

### Manual Scenario:

- Scenario: Conditional Display of 'Response Comment' Field in 'My Response' Panel
- Given I am viewing a request in the 'My Response' panel
- When the request settings specify that a response comment is required
- Then the 'Response Comment' field should be displayed
- And if the request settings indicate that rich text is enabled for comments
- Then the 'Response Comment' field should support rich text formatting
- Otherwise the 'Response Comment' field should support plain text input
- And if the request settings specify that a response comment is not required
- Then the 'Response Comment' field should not be displayed

## ID: 446

### User Story:

As a user I want to see 'Bulk Review' in bulk review page header (page name)

### Requirements:

1. When Bulk Review page is opened, as done in, name of page is simply ‘Bulk Review’

### Manual Scenario:

- Scenario: Display 'Bulk Review' as the Page Title on the Bulk Review Page
- Given I am a user with appropriate permissions
- When I navigate to the Bulk Review page
- Then the page title should be displayed as 'Bulk Review'

## ID: 447

### User Story:

As a user I can Bulk Submit (updates from Grouped work)

### Requirements:

1. Behaviour here should follow the same as it does in Grouped Review page, including:
2. Submit & Continue button hover tooltip text

### Manual Scenario:

- Scenario: Display 'Submit & Continue' Button with Appropriate Tooltip in Bulk Review Page
- Given I am on the Bulk Review page
- When I hover over the 'Submit & Continue' button
- Then a tooltip should appear displaying the text 'Submit your responses and proceed to the next set of items'
- And this behavior should be consistent with the functionality in the Grouped Review page

## ID: 448

### User Story:

As a user I can Bulk Apply (updates from Grouped work)

### Requirements:

1. Behaviour here should follow the same as it does in Grouped Review page, including:
2. Apply count in button

### Manual Scenario:

- Scenario: Display Apply Count on 'Apply' Button in Bulk Review Page
- Given I am on the Bulk Review page
- When I select multiple items for bulk action
- Then the 'Apply' button should display the count of selected items (e.g., 'Apply (3)')
- And this behavior should be consistent with the functionality in the Grouped Review page

## ID: 449

### User Story:

As a user I can see Resources or Record Files requests in Bulk Review Page and their Request Details in the List view

### Requirements:

1. This ticket is to ensure that items not already supported in Grouped Review Page work load into the list with the same display and functionality as the download requests currently show in that page, such as:
2. Record File requests

### Manual Scenario:

- Scenario: Display and Functionality of Record File Requests in the Grouped Review Page
- Given the 'Enable Grouped Requests' setting is enabled in the Record File Approval Workflow Template
- And a user has submitted multiple Record File requests that are grouped together
- When I navigate to the Grouped Review Page
- Then the grouped Record File requests should be displayed in the list
- And each grouped request should have the same display and functionality as existing download requests
- And I should be able to perform bulk actions (such as approve or decline) on these grouped Record File requests

## ID: 450

### User Story:

As a user I can open and view the Bulk Approve Review Page (Core UI)

### Requirements:

1. When user has clicked Bulk Review Request, the Bulk Review page opens

### Manual Scenario:

- cenario: Navigating to the Bulk Review Page
- Given I am a user with appropriate permissions
- When I click on the 'Bulk Review Request' button
- Then the Bulk Review page should open

## ID: 451

### User Story:

As a user I want to click 'Review Request' action in action dropdown in footer to open Bulk Approve Page (action redirect)

### Requirements:

1. When Bulk ‘Review Request’ action is clicked, as done in, then the Bulk Review Request page opens

### Manual Scenario:

- Scenario: Navigating to the Bulk Review Request Page
- Given I am a user with appropriate permissions
- When I click on the 'Bulk Review Request' action
- Then the Bulk Review Request page should open

## ID: 452

### User Story:

As a user I want to see 'Review Request' bulk action in action dropdown in footer

### Requirements:

1. When one item’s checkbox is selected, the Bulk Action footer bar displays

### Manual Scenario:

- Scenario: Display Bulk Action Footer When One Item is Selected
- Given the user is on the items list page
- And there are multiple items displayed with checkboxes
- When the user selects a single item's checkbox
- Then the Bulk Action footer bar should be displayed

## ID: 453

### User Story:

As a user I want to check cancel in footer to clear the select of all selected requests

### Requirements:

1.When one item’s checkbox is selected, the Bulk Action footer bar displays 2. 'Cancel' action shows on right side of footer

### Manual Scenario:

- Scenario: Display Bulk Action Footer with 'Cancel' Action on the Right
- Given the user is on the items list page
- And there are multiple items displayed with checkboxes
- When the user selects a single item's checkbox
- Then the Bulk Action footer bar should be displayed
- And the 'Cancel' action should be visible on the right side of the footer

## ID: 454

### User Story:

As a user the Bulk Action Footer bar displays when one relevant item is selected

### Requirements:

1. When one item’s checkbox is selected, the Bulk Action footer bar displays
2. For Beta the ‘Select All’ action from existing footer bar will have to be hidden in this location

### Manual Scenario:

- Scenario: Display Bulk Action Footer and Hide 'Select All' in Beta
- Given the user is on the items list page
- And there are multiple items displayed with checkboxes
- When the user selects a single item's checkbox
- Then the Bulk Action footer bar should be displayed
- And the 'Select All' action should be hidden in the footer for the Beta version

## ID: 455

### User Story:

As a user when one checkbox of request is checked only the requests that can be bulk approved can be selected

### Requirements:

1. Following - when one Pending request is selected then
2. Only checkboxes for relevant related Pending requests remain selectable

### Manual Scenario:

- Scenario: Selecting a Pending Request Limits Other Selectable Checkboxes
- Given the user is on the Pending Requests page
- And there are multiple pending requests displayed with checkboxes
- When the user selects a single pending request's checkbox
- Then only checkboxes for relevant related pending requests should remain selectable
- And all other checkboxes should be disabled or unselectable
-
-
-
-
-
-
-

## ID: 456

### User Story:

As a user I only see enabled checkboxes for relevant items (disable for records, and for relevant users Reviewers/Admins)

### Requirements:

1. When the new column displays , then when nothing is selected, the checkboxes within this column may only show as +selectable/enabled+ for the below:
2. Pending _Record File Approval_ requests (when enabled at template level)
3. Pending _Resource Feedback Approval_ requests (when enabled at template level)

### Manual Scenario:

- Scenario: Checkbox Availability in the New Column
- Given the new column is displayed
- And no items are selected
- When the user views the checkboxes within this column
- Then the checkboxes should be enabled only for:
- Pending Record File Approval requests (if enabled at the template level)
- Pending Resource Feedback Approval requests (if enabled at the template level)
- And checkboxes for all other requests should be disabled or unselectable

## ID: 457

### User Story:

As a user I only see the checkbox _column_ when relevant (core mcp / template level check)

### Requirements:

1. The new column for the Bulk Actions Checkboxes to display as per designs when
2. MCP development setting from is enabled

### Manual Scenario:

- Scenario: Display Bulk Actions Checkboxes in the New Column When MCP Development Setting is Enabled
- Given the MCP development setting is enabled
- When the user views the item list
- Then the new column for Bulk Actions checkboxes should be displayed as per the designs

## ID: 458

### User Story:

As an Admin user I want to enable Bulk Approve in Admin > Workflow Templates

### Requirements:

1. When Bulk Approval MCP setting from is enabled, then in Admin > Workflows a new setting will display based on the below:
2. For existing edited _Record File Approval_ Templates
3. For new _Record File Approval_ Templates

### Manual Scenario:

- Scenario: Display New Setting in Admin > Workflows When Bulk Approval MCP Setting is Enabled
- Given the Bulk Approval MCP setting is enabled
- When the user navigates to Admin > Workflows
- Then a new setting should be displayed for:
- Existing edited Record File Approval templates
- New Record File Approval templates

## ID: 459

### User Story:

Bulk Approvals - MCP Development Setting

### Requirements:

1. Add new MCP setting in development section:
2. _Approvals - Approvals List (V3) - Bulk Approvals (development use only)_
3. All further related Bulk Approval project development in sprint 203 to be tied to this setting

### Manual Scenario:

- Scenario: Add New MCP Setting for Bulk Approvals in Development Section
- Given the user is in the MCP settings development section
- When the system updates the settings
- Then a new setting should be added:
- Approvals - Approvals List (V3) - Bulk Approvals (development use only)
- And all further related Bulk Approval project development in sprint 203 should be tied to this setting

## ID: 460

### User Story:

FE task: As a User, I want to Delete the name from resources across platform on Training Centre

### Requirements:

1. Be able to see "Delete profile" action icon for recognised faces from training centre as per
2. Be able to see tooltips while hovering on the icon

### Manual Scenario:

- Scenario: Display 'Delete Profile' Icon with Tooltip for Recognized Faces
- Given the user is in the training center
- And there are recognized faces displayed
- When the user views a recognized face profile
- Then the "Delete Profile" action icon should be visible
- And when the user hovers over the icon, a tooltip should be displayed
-
-
-
-
-
-
-

## ID: 461

### User Story:

As a user I want to be able to click on a "Known" face on Info Preview to perform a search with that name

### Requirements:

1. _Known_ faces should be clickable in the tag area on info preview
2. Be able to still see bounding boxes appearing when hovering on
3. Be able to click on _Known_ faces and open a new tab where the corresponding person’s name automatically inputted into the resource search bar at root level

### Manual Scenario:

- Scenario: Clickable Known Faces in Tag Area with Bounding Boxes and Resource Search
- Given the user is viewing the info preview
- And there are Known faces displayed in the tag area
- When the user hovers over a Known face
- Then the bounding box should appear around the face
- And when the user clicks on a Known face
- Then a new tab should open
- And the corresponding person’s name should be automatically inputted into the resource search bar at the root level

## ID: 462

### User Story:

2FA: option to select between SMS, Email, or both as options to receive the code (option set at the client level, not configurable per user)

### Requirements:

1. Under _Admin > Settings > Login and Security_, below the existing _Two-Factor Authentication (2FA)_ settings (there can be up to 2 based on conditions), new +mandatory+ checkbox field setting that appears only when User Setting or Global options are enabled: _2FA Type:_, SMS

### Manual Scenario:

- Scenario: Display Mandatory '2FA Type: SMS' Checkbox Based on Conditions
- Given the user is in Admin > Settings > Login and Security
- And there are existing Two-Factor Authentication (2FA) settings (up to 2 based on conditions)
- When the User Setting or Global option is enabled
- Then a new mandatory checkbox field labeled "2FA Type: SMS" should appear below the existing 2FA settings
- And it should only be visible when one of these options is enabled

## ID: 463

### User Story:

FR: Clone MCP Site handling

### Requirements:

1.We need a mechanism within the MCP that allows for the complete removal of existing facial data and related flags.
2.This could be a checkbox to tick it and wipe existing data

### Manual Scenario:

- Scenario: Mechanism to Remove Facial Data and Related Flags in MCP
- Given the user is in the MCP settings
- And there is existing facial data and related flags stored
- When the user selects the checkbox to remove facial data
- And confirms the action
- Then all existing facial data and related flags should be completely wiped from the system

## ID: 464

### User Story:

PB - As a User, I want to single-select resource from resource module overlay

### Requirements:

1. Be able to _single-select resources only_ to save the select from the overlay and then upload to designated area in Page Builder:
2. Image type resource for background of
3. Page/Section/Block

### Manual Scenario:

- Scenario: Single-Select Resources for Upload in Page Builder
- Given the user is in the overlay for selecting resources
- When the user selects a single resource
- And the resource is an image type
- Then the selection should be saved
- And the image should be uploaded to the designated area in Page Builder for a Page, Section, or Block
- And multiple resource selection should not be allowed
-
-
-
-
-
-
-

## ID: 465

### User Story:

PB - As a User, I want to see and access resource module via a lookup button to select & upload Resources into Page Builder

### Requirements:

1. Be able to see resource lookup button “Select“ from Side Panel as per

### Manual Scenario:

- Scenario: Display 'Select' Resource Lookup Button in Side Panel
- Given the user is viewing the Side Panel
- When the panel contains a resource lookup option
- Then the "Select" button should be visible
- And the user should be able to interact with it as per the design

## ID: 466

### User Story:

As a user in single view when I click previous/next, or Save & Next, this takes into account my Search/Filtered results

### Requirements:

1. User can then change search to see more items
2. If the single item is the last in the folder, then this will be handled in

### Manual Scenario:

- Scenario: User Can Change Search to See More Items and Handle Last Item in Folder
- Given the user has performed a search and sees a list of items
- When the user modifies the search criteria
- Then more items should be displayed based on the new search query
- And if only a single item remains in the folder, it should be handled according to the defined system behavior

## ID: 467

### User Story:

PB - As a User, I want to report Create Page action in the usage reporting

### Requirements:

1. Be able to see Simple Page reporting on Create action
2. User Usage Report
3. Custom Page Usage Report

### Manual Scenario:

- Scenario: Display Simple Page Reporting on Create Action
- Given the user has access to reporting features
- When the user performs a Create action on a Simple Page
- Then the action should be recorded in the User Usage Report
- And the action should be recorded in the Custom Page Usage Report

## ID: 468

### User Story:

PB - As a User, I want to report Edit Page action in the usage reporting

### Requirements:

1. Be able to see Simple Page reporting on Edit action
2. User Usage Report

### Manual Scenario:

- Scenario: Display Simple Page Reporting on Edit Action
- Given the user has access to reporting features
- When the user performs an Edit action on a Simple Page
- Then the action should be recorded in the User Usage Report

## ID: 469

### User Story:

PB - As a User, I want to report Delete Page action in the usage reporting

### Requirements:

1. Be able to see Simple Page reporting on Delete action
2. User Usage Report
3. Custom Page Usage Report

### Manual Scenario:

- Scenario: Display Simple Page Reporting on Delete Action
- Given the user has access to reporting features
- When the user performs a Delete action on a Simple Page
- Then the action should be recorded in the User Usage Report
- And the action should be recorded in the Custom Page Usage Report
-
-
-
-
-
-
-

## ID: 470

### User Story:

PB - As a User, I want to report View Page action in the usage reporting

### Requirements:

1. Be able to see Simple Page reporting on View action
2. User Usage Report
3. Custom Page Usage Report

### Manual Scenario:

- Scenario: Display Simple Page Reporting on View Action
- Given the user has access to reporting features
- When the user performs a View action on a Simple Page
- Then the action should be recorded in the User Usage Report
- And the action should be recorded in the Custom Page Usage Report

## ID: 471

### User Story:

PB - As a User, I want to report Resource Download (Original) action in Usage Reporting for Custom Page Module

### Requirements:

1.Be able to track the Smart Page usage reporting for resource download action (Original size type of Resource, aka “Best“ quality)

### Manual Scenario:

- Scenario: Track Smart Page Usage Reporting for Resource Download (Best Quality)
- Given the user has access to a Smart Page
- And the page contains downloadable resources
- When the user downloads a resource in its Original size ("Best" quality)
- Then the action should be tracked in the Smart Page usage reporting

## ID: 472

### User Story:

PB - As a User, I want to report on Resource downloaded (Original) separately than added in Smart Page for Resource Module (Usage)

### Requirements:

1. Be able to track Resource Usage Reporting- Resource download action that happens in Smart Pages for previously uploaded Resource (Original size type of Resource, aka “Best“ quality) via Resource Lookup

### Manual Scenario:

- Scenario: Track Resource Usage Reporting for Resource Download in Smart Pages via Resource Lookup
- Given the user is on a Smart Page
- And a previously uploaded resource is available via Resource Lookup
- When the user downloads the resource in its Original size ("Best" quality)
- Then the action should be tracked in the Resource Usage Reporting

## ID: 473

### User Story:

PB - As a User, I want to set Page/Section/Block/Widgets Colour in Opacity

### Requirements:

1. Be able to set Page/Section/Block 's background, Colour Palette Widget 's Colour, Button Widget's Text & Background in opacity as per design
2. Be bale to se the transparency / opacity via the opacity bar blow the hue bar as per

### Manual Scenario:

- Scenario: Set and Adjust Opacity for Page/Section/Block Background, Color Palette Widget, and Button Widget
- Given the user is editing a Page, Section, or Block
- And the user has access to the Color Palette Widget and Button Widget settings
- When the user sets the background color, text color, or button background
- Then they should be able to adjust the transparency/opacity using the opacity bar below the hue bar as per the design
- And the selected opacity level should be applied accordingly
-
-
-
-
-
-
-

## ID: 474

### User Story:

Folder Filter: Navigation Behaviour issues/updates between single and bulk

### Requirements:

1.When user selects a folder from the filter, then opens a single file from that filtered list, then: when they click close/cancel user should be returned to Bulk List page with that filter choice still engaged and correct resources displaying (this is supported now, here for A/C)

### Manual Scenario:

- Scenario: Maintain Folder Filter Selection When Returning to Bulk List Page
- Given the user selects a folder from the filter on the Bulk List page
- And the user opens a single file from the filtered list
- When the user clicks Close or Cancel
- Then they should be returned to the Bulk List page
- And the previously selected folder filter should still be engaged
- And the correct resources should be displayed based on that filter selection

## ID: 475

### User Story:

As a bulk edit user, I can see the Folder name for the resource in single view

### Requirements:

1. In Single view page add in the Folder name to the page name, like we do for same folder bulk edit > single view

### Manual Scenario:

- Scenario: Display Folder Name in Single View Page Title
- Given the user is on the Single View page
- And the file belongs to a specific folder
- When the page is displayed
- Then the Folder name should be included in the page title
- Just like it is displayed in Bulk Edit > Single View for the same folder

## ID: 476

### User Story:

As a User, I want to filter Image Resources that flagged with Unknown faces

### Requirements:

1. Be able to filter resources with “Unknown People“ condition from resource filter panel if they ever include any Unknown faces in Facial Recognition as per
2. Be able to always see “Unknown People“ condition below “People” as per (the position of “Unknown People“ is closely blow “People“)

### Manual Scenario:

- Scenario: Filter Resources by 'Unknown People' in Resource Filter Panel
- Given the user is in the Resource Filter Panel
- When the resource contains Unknown faces detected by Facial Recognition
- Then the user should be able to filter resources using the "Unknown People" condition
- And the "Unknown People" filter option should always be positioned directly below the "People" filter in the panel

## ID: 477

### User Story:

As a User, I want to see Training Center popup with dedicated paddings & sizes

### Requirements:

1. Be able to see dedicated paddings and sizes on the Training Center popup as per

### Manual Scenario:

- Scenario: Display Correct Padding and Sizes in Training Center Popup
- Given the user opens the Training Center popup
- When the popup is displayed
- Then the padding and sizes should match the specified design requirements

## ID: 478

### User Story:

PB - (Misc) As a User, I want to have a standard Text Widget - Link input without a placeholder

### Requirements:

1. Be able to see text widget link popup as per

### Manual Scenario:

- Scenario: Display Text Widget Link Popup as Per Design
- Given the user is editing a Text Widget
- When the user selects text and clicks the link option
- Then the link popup should be displayed
- And it should appear as per the specified design requirements

## ID: 479

### User Story:

As a User, I want to control Daily Digest trigger of New Comments in Admin/My Account

### Requirements:

1. Be able to see New Comments setting for daily digest email in Admin - Alert (Markup)
2. Be able to turn on and apply only to _daily, never_

### Manual Scenario:

- Scenario: Configure 'New Comments' Setting for Daily Digest Email in Admin - Alert
- Given the user is in Admin > Alert (Markup) settings
- When the user enables the New Comments setting for the daily digest email
- Then the setting should be visible
- And the option should only apply to 'Daily' or 'Never' selections

## ID: 480

### User Story:

As a User, I want to access Reply action for New Comments in Daily Digest Email

### Requirements:

1. Be able to see and click on "Reply" as per design
2. Be able to re-direct to the Reply page in new tab

### Manual Scenario:

- Scenario: Click 'Reply' and Redirect to Reply Page in a New Tab
- Given the user is viewing a comment or message
- When the user clicks on the "Reply" button as per the design
- Then a new tab should open
- And the user should be redirected to the Reply page

## ID: 481

### User Story:

As a User, I want to see New Comments in Daily Digest Email

### Requirements:

1. Be able to see New markup comments in daily digest email as per design

### Manual Scenario:

- Scenario: Display New Markup Comments in Daily Digest Email
- Given the user has enabled daily digest emails for markup comments
- And new markup comments have been added
- When the daily digest email is generated
- Then the new markup comments should be included in the email
- And they should be displayed as per the specified design

## ID: 482

### User Story:

As a User, I want to control Daily Digest trigger of New Replies in Admin/My Account

### Requirements:

1. Be able to see New Replies setting for daily digest email in Admin - Alert (Markup)
2. Be able to turn on and apply only to _daily, never_
3. _By default, digest frequency: Never_

### Manual Scenario:

- Scenario: Configure 'New Replies' Setting for Daily Digest Email in Admin - Alert
- Given the user is in Admin > Alert (Markup) settings
- When they view the New Replies setting for the daily digest email
- Then the setting should be visible
- And the user should be able to set it to 'Daily' or 'Never'
- And the default digest frequency should be set to 'Never'

## ID: 483

### User Story:

As a User, I want to access Reply action for New Replies in Daily Digest Email

### Requirements:

1. Be able to see and click on "Reply" as per design
2. Be able to re-direct to the Reply page in new tab
3. Be able to have applicable comment highlighted ready to reply to & text-box will be active as well

### Manual Scenario:

- Scenario: Click 'Reply' and Redirect to Reply Page with Highlighted Comment and Active Text Box
- Given the user is viewing a comment or message
- When the user clicks on the "Reply" button as per the design
- Then a new tab should open
- And the user should be redirected to the Reply page
- And the applicable comment should be highlighted
- And the text box should be active and ready for input

## ID: 484

### User Story:

As a User, I want to see New Replies in Daily Digest Email

### Requirements:

1. Be able to see new replied markup comments in daily digest email as per design
2. Be able to see replied comment contents, user, time etc (in current logic)

### Manual Scenario:

- Scenario: Display Replied Markup Comments in Daily Digest Email
- Given the user has enabled daily digest emails for markup comments
- And there are new replies to markup comments
- When the daily digest email is generated
- Then the replied markup comments should be included as per the design
- And the email should display the replied comment contents, user, and timestamp according to the current logic

## ID: 485

### User Story:

FR - As a User, I want to filter Image Resource by tagged faces (with names) from Search - Filter - People

### Requirements:

1. Be able to see the new filter section: People from Resource Search Filter panel as per
2. Be able to input names

### Manual Scenario:

- Scenario: Use 'People' Filter in Resource Search Panel
- Given the user is in the Resource Search Filter panel
- When they view the filter options
- Then a new filter section labeled "People" should be visible as per the design
- And the user should be able to input names into the filter field
-
-
-
-
-
-
-

## ID: 486

### User Story:

PB - (Misc) As a User, I want to exit Editing mode and go back to Custom Page List during creating/editing a Simple Page

### Requirements:

1. Be able to see and click on page exit button from the top bar as per to exit Editing mode when

### Manual Scenario:

- Scenario: Click Page Exit Button to Exit Editing Mode
- Given the user is in Editing Mode
- When they view the top bar
- Then the page exit button should be visible as per the design
- And when the user clicks on it
- Then they should exit Editing Mode

## ID: 487

### User Story:

[FILTERS] As a user I can see the currently applied filter above the list / select between filters - on the fly filter support

### Requirements:

1.In Page toggle between Filters

### Manual Scenario:

- Scenario: Toggle Between Filters on a Page
- Given the user is on a page with multiple filter options
- When the user selects or toggles between different filters
- Then the displayed results should update accordingly
- And the active filter selection should be clearly indicated
-
-
-
-
-
-
-

## ID: 488

### User Story:

[GDA] - As a User if I don't have permission to download the item I have to request permission to download again (or cannot download) - Part 1/2 - grouped download button

### Requirements:

1. If user does not have permission to download +any+ selected items in the list, and bulk download is clicked, they will be taken to the existing Bulk Request Approval page, to again request or re-request permission to download

### Manual Scenario:

- Scenario: Redirect to Bulk Request Approval Page if User Lacks Download Permission
- Given the user has selected multiple items in a list
- And the user does not have permission to download any of the selected items
- When the user clicks on Bulk Download
- Then they should be redirected to the Bulk Request Approval page
- And they should be able to request or re-request permission to download

## ID: 489

### User Story:

[GDA] - As a User I want to be able to bulk download my items when able

### Requirements:

1.Requester needs to be able to bulk download files as they can currently do in V2 +when request is approved / within the approved timeframe

### Manual Scenario:

- Scenario: Bulk Download Files After Request Approval
- Given the requester has submitted a download request for multiple files
- And the request has been approved
- And the approval is within the approved timeframe
- When the requester initiates a Bulk Download
- Then they should be able to download the approved files
- And the functionality should match the existing behavior in V2

## ID: 490

### User Story:

[GDA] - Once user has responded, item will be ignored in bulk Apply + submit

### Requirements:

1. Once user responds, individual requests remain as selected on Grouped List page after Submit if passed validation.
2. Once they have made a response, users can then only update their responses individually as per

### Manual Scenario:

- Scenario: Maintain Selection of Individual Requests After Submission and Restrict Further Updates
- Given the user has selected multiple individual requests on the Grouped List page
- And the responses have passed validation
- When the user submits their responses
- Then the selected individual requests should remain selected on the Grouped List page
- And once a response has been submitted
- Then the user should only be able to update their responses individually as per the specified design

## ID: 491

### User Story:

[GDA] - As a user, I want to be able to Update my Response in single review page 1/2: Core handling

### Requirements:

1. When a Reviewer responds to a request and it remains in Pending (ie, still requires other approvals, or requires all reviewers to respond) then currently in single requests they can Update their response to that request. Users will likewise be able to do so via the single view from Grouped Review page
2. Update Response button displays in ‘My Response’ section as it does currently

### Manual Scenario:

- Scenario: Allow Reviewers to Update Response for Pending Requests in Single View from Grouped Review Page
- Given a Reviewer has responded to a request
- And the request remains in Pending status because it requires additional approvals or responses from other reviewers
- When the Reviewer navigates to the single view from the Grouped Review page
- Then they should be able to update their response to that request
- And the Update Response button should be displayed in the ‘My Response’ section, just as it does in the current single request view

## ID: 492

### User Story:

[GDA] - As a user, I want to be able to click Submit & Next (single view) and have validation checks occurs

### Requirements:

1. On Submit of single request, the below validation checks occur:
2. If comment is mandatory
3. If response is unfilled

### Manual Scenario:

- Scenario: Validate Mandatory Comment and Response Before Submitting a Single Request
- Given the user is submitting a single request response
- When they click Submit
- Then the system should check if a comment is mandatory
- And if the comment field is empty, display a validation message
- And the system should check if a response has been provided
- And if the response is unfilled, display a validation message preventing submission

## ID: 493

### User Story:

[GDA] - As a user, I want to be able to click Submit & Next (single view) and be taken to the next item in the list

### Requirements:

1. As per the button name on Single page will be ‘Submit & Next’

### Manual Scenario:

- Scenario: Display 'Submit & Next' Button on Single Page
- Given the user is on the Single Page
- When they view the action button for submitting a request
- Then the button should be labeled 'Submit & Next' as per the design

## ID: 494

### User Story:

[GDA] - As a user, I can add comment, approve/decline, select approved / until date in Grouped Approval Review Page & Apply that to Selected requests

### Requirements:

1. User can select / unselect requests
2. Individually

### Manual Scenario:

- Scenario: User Can Select and Unselect Requests Individually
- Given the user is on the requests list page
- When they view the available requests
- Then each request should have a selectable checkbox
- When the user clicks on a checkbox for a request
- Then the request should be selected
- When the user clicks on the checkbox again
- Then the request should be unselected

## ID: 495

### User Story:

As a user I want to see time to complete for requests in Workflow Dashboards (UPDATE) including Reviewed Status Requests

### Requirements:

1. For Item List when either ‘All Workflows’ or a specific Workflow is selected

### Manual Scenario:

- Scenario: Display Items Based on Workflow Selection
- Given the user is on the Item List page
- When they select either ‘All Workflows’ or a specific Workflow from the filter
- Then the item list should update to display only the items that match the selected workflow criteria
-
-
-
-
-
-
-

## ID: 496

### User Story:

CT - As a User, on Add Revision page I should be able to see my Threads and switch between them but not Manage them.

### Requirements:

1. User should be able to switch between Threads on Add Revision page
   2.User should NOT be able to manage Threads or create new Thread on Add Revision page
2. User should see all comments of the selected Threads

### Manual Scenario:

- Scenario: Switching Between Threads on Add Revision Page Without Managing or Creating New Threads
- Given the user is on the Add Revision page
- When they attempt to switch between different Threads
- Then they should be able to select and view different Threads
- And when a Thread is selected
- Then all comments within that Thread should be displayed
- But the user should not have the ability to manage existing Threads
- And the user should not be able to create a new Thread on the Add Revision page

## ID: 497

### User Story:

As a User, In the V2 Database Settings - I want to select a Feature Field Completion Value which will offer the approval statuses as options

### Requirements:

1.Field should only appear when a Multi Upload field has been selected as a Feature Field 2. Values include: Approved, Cancelled, Completed, Declined, Pending

### Manual Scenario:

- Scenario: Display Field Only When Multi Upload Field is Selected as a Feature Field
- Given the user is configuring a form or settings
- When they select a Multi Upload field as a Feature Field
- Then a new field should appear
- And this field should include the following values:
- Approved
- Cancelled
- Completed
- Declined
- Pending
- But if a Multi Upload field is not selected as a Feature Field
- Then this field should not be displayed

## ID: 498

### User Story:

As a user I want to filter by number of revisions for Resource Publish Requests in Workflow Request Stats

### Requirements:

1. When the below are selected then new data condition option ‘Markup Comments Revisions’ is available for Workflow +Requests+:
2. ‘All Workflows’ is selected

### Manual Scenario:

- Scenario: Display ‘Markup Comments Revisions’ Data Condition When ‘All Workflows’ is Selected
- Given the user is on the Workflow Requests page
- When they select ‘All Workflows’ from the available options
- Then a new data condition option ‘Markup Comments Revisions’ should be available for selection

## ID: 499

### User Story:

As a user I want to run a stats report for database tool and see files from multi upload field represented each on their own row (excluding in Duplicable sections)

### Requirements:

1. Where multiple files exist in a multiple upload field each one is represented on its own row
2. File names are expanded into separate rows

### Manual Scenario:

- Scenario: Display Multiple Files in Separate Rows for a Multi-Upload Field
- Given a Multi-Upload field contains multiple files
- When the user views the uploaded files
- Then each file should be represented on its own row
- And the file names should be expanded into separate rows for clear visibility

## ID: 500

### User Story:

As a user I want to filter by time to complete for any workflow request in Workflow Response Stats Reporting - conditions

### Requirements:

1. In Workflow Response Stats reports new filtering condition option to be added under ‘Workflow Request’ parent
2. ‘Time to Complete (Hours’)

### Manual Scenario:

- Scenario: Add 'Time to Complete (Hours)' Filtering Condition in Workflow Response Stats Reports
- Given the user is viewing the Workflow Response Stats reports
- When they open the filtering options under the ‘Workflow Request’ parent category
- Then a new filtering condition ‘Time to Complete (Hours)’ should be available for selection
