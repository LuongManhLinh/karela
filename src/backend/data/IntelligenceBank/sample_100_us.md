## ID: 1
### Summary:
As a user, I want to enable image tagging from the Asset Intelligence section in the MCP settings
### Description:
1. A new MCP setting is to be created under the Asset Intelligence section for Image Tagging (Azure). We may try any tie some of the existing Imagga settings later but for now we’ll keep seperate. 
2. Under Enable Video / Audio Tagging: there needs to be a new setting called Enable Image Tagging 
3. All Image Tagging Capabilities and categories will be dependant on this setting 
4. If this setting is enabled, then the platform should ignore any Imagga functionality and use Azure only
5. Underneath the setting Azure Video Processing Limit (per billing cycle):  there needs to be a new setting called Azure Image Processing Limit (Images) (per billing cycle):
6. While we’re here, change  Azure Video Processing Limit (per billing cycle): to  Azure Video Processing Limit (minutes) (per billing cycle):
7. Any Azure functionality and tickets worked on in this project should be tied to the Enable Image Tagging setting


## ID: 2
### Summary:
As an IB team member, I want to be able to enable an Auto-Focal setting in MCP so that I can control all the settings from one place.
### Description:
1. We need an MCP feature flag/setting called “Resources - Preset Auto-Focal” in the Development Use Only area. If this setting is enabled then any Auto-focal tickets as part of this project become enabled, if disabled then no Auto-focal settings should be available on the platform.
2. A setting called “Resources - Preset Auto-Focal” must be created in the Development Use only area of the MCP. 
3. The setting must be a toggle switch that can be enabled and disabled as needed. 
4. When enabled, any Auto-focal tickets as part of this project must become enabled. 
5. When disabled, no Auto-focal settings should be available on the platform. 



## ID: 3
### Summary:
As an IB team member, I want to be able to enable a GIF/Lottie setting in MCP so that I can control all the settings from one place
### Description:
1. We need an MCP feature flag/setting called “Resources - GIF/Lottie Preview Support” in the Development Use Only area. If this setting is enabled then any tickets as part of this project become enabled, if disabled then no GIF/Lottie preview features should be available on the platform.
2. Lottie general file support can be independent if needed 
3. A setting called “Resources - GIF/Lottie Preview Support” should be created in the Development Use only area of the MCP. 
4. The setting must be a toggle switch that can be enabled and disabled as needed. 
5. When enabled, any GIF/Lottie Preview tickets as part of this project must become enabled. 
6. When disabled, no GIF/Lottie Preview settings should be available on the platform.



## ID: 9
### Summary:
As a user, I want to be able to preview the GIF or Lottie File converted MP4 on the Share screen so that I can preview what the animation is like before share it
### Description:
1. Users should see the preview of the GIF or Lottie File converted MP4 on the Share screen. This should help users to preview the animation before deciding to share it.
2. As a user on the share/embed screen:
3. The preview should show the GIF or Lottie File converted MP4.
4. The controls should be hidden
5. The MP4 should autoplay 


## ID: 15
### Summary:
As a user, when no custom configs are enabled, and no workflow on parent, I see no pop-up and child records are created
### Description:
1. When Allow User updates to Titles upon creation checkbox is disabled in the form builder config, then end user cannot update title names at time of creation and so they see no overlay with that option
2. Instead, the flow for the user in this scenario is the same as if the new feature is not enabled (ie, record is Saved)
3. Info Snackbar in this scenario appears to confirm child record creation is in progress: 
4. Text TBC, draft: Linked Records are being created. Click here to open linked database.
5. Snackbar to appear after record creation snackbar in terms of stacking/ordering
6. Future state may be another snackbar to confirm when all child records have been created
7. When no workflow request is requested for parent, then Child records are therefore processed/created immediately after parent is saved 


## ID: 20
### Summary:
As a user, if child database has been edited and title field is no longer a valid text field, then users do not see a end user config pop-up overlay and no child records are created
### Description:
1. Assuming original Auto Create setting is successfully saved in the parent - if then a Database Manager user updates the child Form Builder and changes the title field to a non-text field, then the below will occur for end users:
A) In scenarios where end user config should display, we will no longer display due to ‘broken’ config.
This means that no child records are created, no snackbar error messaging is needed (current behaviour)
B) In scenarios where end user config does not currently display (no end user customisation is enabled) :
No child records are created, no snackbar error messaging is needed (current behaviour)


## ID: 21
### Summary:
As a user, I can deselect items to not apply bulk changes to
### Description:
1. Resources that are de-selected will not have any changes applied when Bulk ‘Apply to Selected’ is selected (that have not been previously correctly applied in previous Bulk 'Apply to Selected’ action, ie:
2. If new data is entered in bulk Main Details, Tags, Filters, Custom Upload Fields, and/or Workflows and then 'Apply to Selected’ is selected, then only selected resources will get the eligible updates (de-selected resources will not)


## ID: 27
### Summary:
As a user, I want to see existing Status column containing all current data
### Description:
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


## ID: 41
### Summary:
As a User, I want to be able to view my Record's Request status in the same section that's available for other V3 Approval types
### Description:
1. Within the new Record Publish Approval review page, there should be a “Request Status” section which includes the same information as appears for other request types. 
2. This should include (though is not limited to):
- Request Status
- Approval(s) Still Required
- Waiting on


## ID: 44
### Summary:
As a User, I want to be able to view all Pages and specific Stages on the record view
### Description:
1. Single Records: Ability to view and navigate to any Page or section in a Single Database > Record request 
2. Staged Records:
- When in pending, restrict the views to the following:
- Stage 1 in Pending: View Stage 1 by default and all future stage names appear in nav but are diabled


## ID: 48
### Summary:
As a user, I want to remove double saving messages
### Description:
1. We have two messages appearing for the “Image will be tagged after saving.” message
2. I assume one is the existing and the other is the reusable component. 
3. Can we remove the one that is below the field (red one)


## ID: 51
### Summary:
As a User, I want to Get a list of Smart Pages via API
### Description:
1. Be able to get a list of Smart Pages via API call


## ID: 52
### Summary:
As a User, I want to Get a Smart page, including details: Page, Sections, Blocks, and Widgets via API
### Description:
1. Be able to get a smart page and its details via a API call


## ID: 53
### Summary:
As a User, I want to Delete a Smart Page via API
### Description:
1. Be able to delete a Smart page via a API call
2. The call is documented in the API doc


## ID: 74
### Summary:
As a User, I want MCP Setting for Kanban Sort Options Updates
### Description:
1. Add new below setting under *Development Use Only* section Databases - Kanban Sort Options, Location wise, this can be added to bottom of dev section under *Databases - Single User Record Edit Restriction*


## ID: 75
### Summary:
As a User, I want MCP Setting for Approvals List Bulk Actions Updates
### Description:
1. Add new below setting under *Development Use Only* section *Approvals - Request List (V3) -* *Bulk Action Updates* , Location wise, ideally it appears above *Approvals - Request List (V3) - Column Enhancements (development use only)* setting to keep things tidy, but can live with it being added to the bottom of the list of that adds any complexity point


## ID: 78
### Summary:
As a User, when I create, update and delete a Server and the action has failed, show a snackbar message to show the error
### Description:
1. After creating a Server and it fails, the page remains open and a snackbar appears with the error message 
2. After editing a Server and it fails, the page remains open and a snackbar appears with the error message 
3. After deleting a Server and it fails, the dialog remains open(?) and a snackbar appears with the error message



## ID: 80
### Summary:
As a user who has selected Master Template option, if I can see none, I am directed to Create a blank one instead
### Description:
1. If either no Mater templates exist, then the ‘No Master Templates available’ message displays and user can select to Create a Blank Template instead, as per designs




## ID: 82
### Summary:
As a User, On save, a new Job should appear in job list/tab for that Template Resource (B.E. handling)
### Description:
1. On successful Save, a Job will be saved against the Template from which it was created from


## ID: 83
### Summary:
As a user creating a job, I can only edit / configure elements allowed by Template creator
### Description:
1. As Job Creators open the Editor in Adopter Mode they will only be able to interact with layers and elements depending on what was configured by the Template Creator
2. Restrictions apply for all users, even Admins and Template Creator


## ID: 87
### Summary:
As a User, I want to remove stickers option from left menu
### Description:
1. Hide Stickers option from left menu 


## ID: 93
### Summary:
As a user, I can expand the Server form by closing the menu and using the expand button
### Description:
1. Form expands using expand button
2. Form expands when menu is closed
3. Footer also expands with the form


## ID: 94
### Summary:
As a user, who I can select as collaborator updates based on if 'all' is allowed in Template settings
### Description:
1. If ‘All users’ is selected in ‘*Collaborators permissions*’ in Workflow Template settings page
then
2. All Active platform users can be selected as a Collaborator can be anyone on the platform
3.This means the bypass permissions will be extended to any selected user,_ +_even if they lack permission to the source item module, etc_+ 


## ID: 105
### Summary:
As a User, I should not see the Page Category dropdown when viewing Pages if none of them are assigned to Category
### Description:
1. Be able to see only Pages from the Left Panel when viewing a Page, if all the pages the user has access to view are all not associated with any Page Category


## ID: 107
### Summary:
As a User, I want to see Page Category being selected by default when viewing a Page as it's been assign to one
### Description:
1. By default the Page Category Name itself is displayed as per 
2. Be able to see the pages under are loaded to the left side from Nav when viewing a Page


## ID: 108
### Summary:
As a User, I want to customise the order of pages under All Pages and the order of pages under each Page Category
### Description:
1. Be able to customise the order of pages under All Pages and the order of pages under each Page Category




## ID: 109
### Summary:
As an Internal User, I want to have MCP(development use only) settings to enable/disable features per Epic for Drag & Drop Page MVP 
### Description:
1. Add a MCP setting “Drag & Drop Pages: Widgets combining Block“ under Development Use only for Epic
2. Add a MCP setting “Drag & Drop Pages: Image Resizing“ under Development Use only
3. Add a MCP setting “Drag & Drop Pages: Page Templates“ under Development Use only
4. Add a MCP setting “Drag & Drop Pages - Page Category (development use only)“ under Development Use only section under Platform Settings



## ID: 111
### Summary:
As a User, I want to have previous 'Block' background colour setting embedded in Text Widget toolbar after combining these two
### Description:
1. Be able to have have previous 'Block' background colour setting embedded in Text Widget toolbar as per  
2. Be able to click on the background colour setting in text widget toolbar and open the colour swatch popover then set the colour for Text Widget background


## ID: 115
### Summary:
As a User, I want to configure both Block and Button Widget properties
### Description:
1. Be able to see and configure the new widget settings from Nav (combining previously defined Block and Widget's settings) for each widgets:



## ID: 116
### Summary:
As a User, I want to resize Image Widget by Width slider from Nav
### Description:
1. Be able to set the ratio of the Image to change the ‘Block'’s width for the combination of Image Widget from Nav Panel as per design (existing behaviour)
2. Be able to still see Image remain the same percentage of it’s “Block“ *horizontally*
3. Be able to still resize the Widget by dragging the dot line


## ID: 117
### Summary:
As a User, I want to reposition Image Widget by dragging image itself when create/editing a Page
### Description:
1. Be able to see dotted line of the Image and bounding box for the entire Widget with a default 8px paddings as per design, after dragging an Image Widget into a Section
2. Be able to always see the Image Widget’s outer bounding box border line as per design, whenever the Image has been re-sized
3. Be able to re-position and see the Image in the same percentage of ‘Block’ after resizing to smaller, and the percentage will obtain if the 'Block' width changes by



## ID: 120
### Summary:
As a user, I want to see an action to assign collaborators in action column in V3 Approval List
### Description:
1. When setting is enabled for the Workflow Template, a *NEW* action will display in Approvals List for pending requests tied to that item, for any users who can see that request, and who are one of the below: Requester,  Reviewer(s) from any stage
2. Other added collaborators who are not one of the above (who are collaborator on the current stage, for staged requests)




## ID: 129
### Summary:
As a user, I can search for a Server in the Servers List
### Description:
1. Search bar in Servers Landing page
2. Search functionality
3. Will show the search results in the table


## ID: 141
### Summary:
As a User, I want Surface Question/Answer/Rating back end data in weekly report / script
### Description:
1. Update the weekly closed_captions_activation_report_ to include 
2. Name update: weekly_asset_intelligence_report
Remove the Dev Server report ones e.g. dcfprod, rtsprod, dev018, dev015, dpctest, dcftest, dev016, dev003, dev027, dev026, rtstest, macsprod 


## ID: 143
### Summary:
As a User, I want to hide Left Menu (to hide Future Stage details) for Public Users in updated UI in Create Record
### Description:
1. When *Databases - Briefs UI Uplift Phase 1* is enabled in MCP then for Public Users only in Create for Staged Databases, we hide the left menu altogether


## ID: 145
### Summary:
As a user, I want to be able to be able to go the next record and previous record while in the record page
### Description:
1. If the record is first in the list the previous button should not show
2. If the record is last in the list the next button should not show
3. Show next/previous only on hover


## ID: 147
### Summary:
As a user, I want to be able to see the workflow history of a record if there is one
### Description:
1. Workflow history button in the footer of the side navigation Panel when record has workflow history
2. Clicking the button will show workflow history
3. Show Workflow history table on click on button


## ID: 148
### Summary:
As a User, I want new Auth Screens + Success Page - Add in Menu / Login Bar
### Description:
1.The tiger team consensus is to show a logo, but not the log-in or nav menu. So this would be like the CPSL links


## ID: 158
### Summary:
As a User, I want to set up Session Based Digest Email in My Account Alerts (Markup) for Mention & New Comment & New Reply
### Description:
1. Be able to select ‘Session' together with ‘Hourly’, ‘Daily’, and 'Weekly’ at the same time
2. The new "Session" option will follow the existing behaviours for *My Account* > *Alerts (Markup)* > *Currently set to*:


## ID: 163
### Summary:
As a User, I want to set Primary Font Size in Admin and reflect to page title font size in Page Nav (both left & right side)
### Description:
1. Be able to set Admin > Template > Primary Font Size and it applies to page title font size in Page Nav 
2. This should be applied whenever I’m viewing the Page Nav, including within the builder (on the right) and when viewing the Page (on the left)


## ID: 164
### Summary:
As an internal User, I want to set Drag & Drop Page limit via Custom Page limit in MCP
### Description:
1. Remove Drag & Drop limit from the Restrictions tab in MCP


## ID: 167
### Summary:
As a User, I want to allow users to rate the answer with thumbs up / thumbs down
### Description:
1. When an answer is fully formed (not partially loaded) we display the thumbs up & thumbs down icons underneath the answer
2. Thumbs up hover text: ‘Click if you found this response helpful.’
3. Thumbs down hover text: ‘Click if you found this response unhelpful.’


## ID: 170
### Summary:
As a user, I want to be able to see integrated fields
### Description:
1.When MCP is ON, display integrated fields according to design
2.Inside a normal section (View, Edit, Update)
3.Inside a duplicable section (View, Edit, Update)


## ID: 172
### Summary:
MCP Front End - As a user, I can delete a server
### Description:
1.When delete icon is clicked from Servers table a confirmation message is displayed
2. When Deleted item in the table is removed


## ID: 186
### Summary:
PB - As a User, I want to configure both Block and Text Widget properties
### Description:
1. Be able to see and configure the new widget settings from Nav (combining previously defined Block and Widget's settings) for each widgets:



## ID: 189
### Summary:
3-2. As a User, I want to reposition Image Widget by dragging image itself when create/editing a Page
### Description:
1. Be able to see dotted line of the Image and bounding box for the entire Widget with a default 8px paddings as per design, after dragging an Image Widget into a Section
2. Be able to always see the Image Widget’s outer bounding box border line as per design, whenever the Image has been re-sized
3. Be able to re-position and see the Image in the same percentage of ‘Block’ after resizing to smaller, and the percentage will obtain if the 'Block' width changes by



## ID: 190
### Summary:
4-2. As a User, I want the position and size that I set of the image to still work in different responsive modes
### Description:
1. Be able to see the same percentage *horizontally* of Image with the Block in mobile, tablet, and desktop modes, after 
2. resizing the Image by dragging the dots
3. repositioning the Image by dragging the Image itself


## ID: 191
### Summary:
2-3. As a User, I want to Undo & Redo resizing & repositioning
### Description:
1. Be able to still click on Undo & Redo from top bar to go back & forward the actions on: Resizing the Image by dragging the dots
2. undo & redo get triggered only after user finishes their dropping by un-clicking the dot - so won't undo every pixel along the way of dragging experience.
3. the undo & redo also only works for successful cases as unsuccessful cases have been handled by experience provided


## ID: 192
### Summary:
PB - As a User, I want to see Drag & Drop Page thumbnails as preview in Custom Page v2 index page
### Description:
1. Be able to preview pages as thumbnails for Drag & Drop Pages in v2 index page for both List and thumb layout views


## ID: 208
### Summary:
PB - As a User, I want to only select & see the combo of Widget and Block (bounding box experience) in Page Builder
### Description:
1. Be able to select Widget and Block as a whole, and the bounding box will be highlighted as the same experience as old Block's bounding box
2. Be able to only navigate Up back to the Section



## ID: 211
### Summary:
PB - As a User, I want to report Resource Download (Preview) action in Usage Reporting for Custom Page Module
### Description:
1. Be able to track the Smart Page usage reporting and User’s usage reporting for resource download action (Preview type of Resource, aka “Good“ quality)
2. Module appears if it applies to User’s usage report, whilst in Custom Page usage report the Module will not be displayed
3.“Custom Page“ is dynamic to the setting configured in Admin: {Custom Custom Page Module singular}
4. Action: Resource Download (Preview) 



## ID: 213
### Summary:
Rename "Simple" Page to "Smart" Page
### Description:
1. Be able to see the keyword updated to “Smart“ Page, instead of “Simple“ Page (front-end) in the Brand Page MVP  project scope, see detailed locations to rename the keyword as below: Location to rename



## ID: 215
### Summary:
PB - As a User, I want to re-order pages within the same parent/root via Nav - FE integration
### Description:
1. Be able to re-order Pages via drag-and-drop from Nav Panel during editing
2. Sub-pages will be moved all together with Page if it contains any
3. After drag-and-drop of Pages, Sub-pages will be *collapsed* under Page from Nav Panel
4. Be able to re-order sub-Pages via drag-and-drop within the *same* parent Page from Nav Panel during editing
5. Be able to re-order root-Pages via drag-and-drop from Nav Panel during editing This ticket does NOT include drag-and-drop across Parent



## ID: 224
### Summary:
[Bulk SBT] Staged requests: values carry over for staged requests in individual response (should be wiped after stage response is submitted)
### Description:
1. When staged requests are present in the Bulk List, and user responds in Bulk - but request remains pending due to further stages being present - then the response fields for that request(s) are cleared (ie, do not retain previous response ‘Apply’ values). 
2. User then therefore needs to add response anew, either in single or bulk, for this next stage


## ID: 225
### Summary:
PB - (DND replace) As a User, I want to create a sub-page for an exisiting Smart Page via Nav
### Description:
1. Be able to click on setting button of a simple page from Nav as per design
2. Be able to see the sub-page popup as per design
3. Be able to input the sub page's title and save (change "Done" to "Save")
4. Same validation as Page title input with same design / components
5. Be able to see the field placeholder “Add page name“ before inputing a value as per design
6. Be able to see the the created sub-page name displayed under the parent Page Order: by default, last updated descending aka. most recently updated to least


## ID: 233
### Summary:
PB - As a User, I want to see Nav panel when viewing a Simple Page
### Description:
1. Be able to see the new extend / collapse button icon from the top left to open the Left Side Panel as Page Nav as per design 
2. Be able to see all the saved Simple pages from the Left Side Panel against current user’s permission as per design 
3. By default, in oder of Last Updated as the same in v2 index list
4. Be able to see the currently opened page in effect as per design from Nav (background: grey-100, font in bold style)
5. Be able to click on and switch to viewing the designated page For details


## ID: 240
### Summary:
As a user I can Bulk Apply (updates from Grouped work)
### Description:
1. Behaviour here should follow the same as it does in Grouped Review page, including: Apply count in button , Button hover tooltip text for enable + disable views,Snackbars
2. Actual apply logic 
3.Behaviour here need extra check, including:
4. Complete Request/Stage depends on Requests are staged requests and it’s current stage, or single requests


## ID: 245
### Summary:
As a user I only see the checkbox *column* when relevant (core mcp / template level check)
### Description:
1. The new column for the Bulk Actions Checkboxes to display as per designs when: MCP development setting from is enabled
2. at least one active Template has the new setting enabled, as per 
3. If MCP development setting is disabled, or if the new setting in Admin > Templates is disabled for all Templates, the the column no longer appears for any user


## ID: 248
### Summary:
PB - As a User, I want to report Create Page action in the usage reporting
### Description:
1. Be able to see Simple Page reporting on Create action
2. User Usage Report
3. Custom Page Usage Report
4. Be able to search and export the Report on create action
5. To note: the searching rules and displaying will be natively handled


## ID: 256
### Summary:
PB - (Misc) As a User, I want to have custom fonts in SPB text widget
### Description:
1. Be able to have client’s custom fonts supported in Text Widget from Simple Page Builder
2. Be able to choose custom fonts from the font drop-down menu
3. Be able to see the applicable custom font contents during editing / previewing / viewing


## ID: 273
### Summary:
As a user, I want to see footer actions like cancel, save as draft, next and submit (Single Database)
### Description:
1.When MCP is ON
2. Create a footer component to replace {{renderButtonRow}} in recordForm 
3. Pages (with and without worlkflow)
4. No Pages (with and without worlkflow)


## ID: 279
### Summary:
As a user, I want to see the status of the record in the header
### Description:
1.Possible values:Draft,  Archived


## ID: 281
### Summary:
PB - As a User, I want the status of background Image added via Resource Lookup to be linked with Resource module
### Description:
1. Be able to *link the status* of the the background Image *with the derived Image resources in Resource Module* if it has been added as *Page* or *Section* background in Page Builder via Resource Lookup



## ID: 286
### Summary:
PB - As a User, I want to edit (rename) an existing Page Category in Page Builder
### Description:
1. Be able to click on kebab button as per design and click on ‘Edit Page Category’
2. Be able to see ‘Edit Page Category’ pop-up as per design
3. Be able to see Info message as per design: “Rename Page Category.“


## ID: 299
### Summary:
[Ask AI Alpha] As a user I want to choose to search whole platform or current location (Logic: Filter/Search results limit)
### Description:
1.  ‘Limit to current view’ checkbox field appears under question field
2. This is always enabled by default when panel is opened
3. User can deselect option before asking a question, meaning whole platform will be searched no matter their current location


## ID: 305
### Summary:
PB - As a User, I want to configure both Block and Button Widget properties
### Description:
1. Be able to see and configure the new widget settings from Nav (combining previously defined Block and Widget's settings) for each widgets:
2. *Button*:
3. Button Text
4. Button Link


## ID: 308
### Summary:
4-1. As a User, I want to resize Image Widget by Width slider from Nav
### Description:
1. Be able to set the ratio of the Image to change the ‘Block'’s width for the combination of Image Widget from Nav Panel as per design (existing behaviour)
2. Be able to still see Image remain the same percentage of it’s “Block“ *horizontally*
3. Be able to still resize the Widget by dragging the dot line


## ID: 318
### Summary:
[Ask AI Alpha] As a Main Admin user, only I and other Main Admins can use 'Ask AI' in Alpha phase
### Description:
1.  In Alpha phase, only Main Admin users can see the ‘AI Assist’ button 
2. Users who are not Main Admins cannot see the ‘AI Assist’ button, and therefore cannot access this feature 
3. Main users emulating non Main Admin users should also not be able to see this button (but may be acceptable handling for alpha until we update permissions



## ID: 323
### Summary:
[Ask AI Alpha] As a user I can click 'Ask' button to trigger search AI (or can click enter)
### Description:
1 ‘Ask’ button displays under question field, is disabled by default when panel opens
2. Hover text when enabled: ‘Click or hit enter to ask your question.’


## ID: 326
### Summary:
[Ask AI Alpha] As a user I get informed if there is no answer and advised to update my question to try again
### Description:
1. When we cannot find any answer to return, we display an re-try message as per designs:
2. ‘We are unable to assist with that query at the moment. Try asking something else.’


## ID: 337
### Summary:
PB - As a User, I want to create an empty  Smart Page from the template popup
### Description:
1. Be able to see and click on the button : “Start with a blank template” as per 
2. Be able to see selected effect as per once click on it


## ID: 347
### Summary:
PB - As a User, I want to add Widgets directly to a Section
### Description:
1. Be able to drag Widgets from Nav to Section directly in Page Builder on Create/Edit mode


## ID: 366
### Summary:
Guest Upload MVP: Updated success message
### Description:
1. As per designs:
2. New tick icon displays
3. Main text/page header is ‘Your {{Record}} has been submitted’ (current text but updated positing etc)


## ID: 367
### Summary:
Grouped Email Updates [existing designs]: Same Template Cross Folder Handling (different reviewers for different folders, but same template)
### Description:
1. If Cross Folder bulk edit involves resources from different folders that have workflows from the same Workflow Template, but where reviewers may be different per folder due to config (_as detailed in scenarios above, this could be a mix of Global+Local, or Global+Global but with different reviewers, or Local+Local with different reviewers_) 


## ID: 382
### Summary:
Guest Upload MVP: Hide Close/Cancel/databaseName/etc for public users
### Description:
1. When user is a Public user and is Creating a public record, then:
2. We drop the Database name in the page header altogether (so header just says “Create {{Record}}”)
3. Hide the 'x' close icon


## ID: 383
### Summary:
PB - As a User, I want to move a sub page to become a standalone Smart Page (Parent)
### Description:
1. Be able to move a sub-Page to become a standalone Page that doesn’t contain any sub-Page, via drag-and-drop from Navigation Panel on editing mode in Page Builder
2. Be able to see the updated order / hierarchy of Page list from Navigation Panel
3. By default, the page list is in order of Last Updated as the same as V2 index list. Once the Navigation Panel gets re-ordered successfully by a User, the new order of Nav Panel will be updated and remain the latest order on editing and viewing till it gets updated again


## ID: 385
### Summary:
PB - As a User, I want to re-order pages within the same parent/root via Nav - FE UI component
### Description:
1. Be able to re-order Pages via drag-and-drop from Nav Panel during editing
2. Sub-pages will be moved all together with Page if it contains any
3. After drag-and-drop of Pages, Sub-pages will be *collapsed* under Page from Nav Panel


## ID: 387
### Summary:
PB - As a User, I want to be able to download the resources added to the page, if I have permission to do so - Image widget
### Description:
1. Be able to *ONLY* see the download button as per to download the added resources on Editing, Previewing & Viewing of Simple Page *by hovering on Widgets*:
2. Image resource from Image Widget


## ID: 388
### Summary:
PB - As a User, I want the status of  Resource added via Resource Lookup to be linked with Resource module - resource permission lost scenario
### Description:
1. Be able to only see page contents against my own permission of the resources 
2. Be able to see placeholders icon in the middle and permission lost icon as per if the user has no permission on specific resources whilst editing/previewing/viewing the page
3. Be able to see tooltips by hovering on the permission lost icon as per 


## ID: 389
### Summary:
PB - As an internal User, I want to set Page limits via MCP settings
### Description:

1. Be able to set Page limits on MCP control panel for client sites


## ID: 392
### Summary:
[QW 3/5] Requester Re-assign: Load users (user list, load all users) from workflow config - (v2 component approach)
### Description:
1. Change from to exclude V2 Approval List from this new logic.
2. This means in V2 List, that Requesters cannot re-assign to any request unless Workflow or Main Admins 


## ID: 394
### Summary:
PB - As a User, I want to see sub-pages in Custom Page v2 index list (with a subtitle for parent)
### Description:
1. Be able to see a new row of information: "Parent: {parent page name}" after clicking on "+" button from the v2 index list for *sub-pages*


## ID: 395
### Summary:
PB - As a User, I want to configure permissions of sub-pages in Admin -> Group
### Description:
1. Be able to see and configure sub-pages under their parent pages in line with design of resource folder/sub-folders in Admin - Group - Permission
2. Be able to trigger propagation in line with the same logic of resource folder/sub-folders in Admin - Group - Permission


## ID: 396
### Summary:
PB - (BE) As a User, I want to create a sub-page for an exisiting Simple Page via Nav
### Description:
1. Be able to click on setting button of a simple page from Nav as per 
2. Be able to see the sub-page popup as per


## ID: 413
### Summary:
Grouped Resource Publish - Grouped Email Notification Settings added to Resource Publish Templates
### Description:
1. When MCP development setting from is enabled, and the new ‘*Enable Grouped Requests*’ setting is enabled in Admin > Workflow location for existing or new Resource Publish Workflow Templates, then additional Notification options appear when User Notifications is set to ‘Select’ (in line with Download Templates, and replicating Record File Approval work in ):
2. *Requester Emails*:



## ID: 420
### Summary:
[RESTRICTIONS] Cross param handling of 'Hide Decline' (hide Decline if all share param,  ignore Bulk Apply of Decline to items that don't apply)
### Description:
1. When we can detect that the requests selected for Bulk Review feature a mix of items where Hide Decline is enabled and some that do not, then on the Bulk Review response panel we still display Decline as an option



## ID: 426
### Summary:
Bulk Approve Response action Tracking surfacing in Stats - new condition in Responses (Bulk Review > in > Yes)
### Description:
1. In terms of ordering, this displays under ‘Reviewer Comment’ in the condition dropdown


## ID: 429
### Summary:
PB - As a User, I want to see Nav panel when viewing a Simple Page
### Description:
1. Be able to see the new extend / collapse button icon from the top left to open the Left Side Panel as Page Nav as per 
2. Be able to see all the saved Simple pages from the Left Side Panel against current user’s permission as per 


## ID: 436
### Summary:
BP - As a User, I want the single selected Video resource via Resource Lookup to appear in Video Widget (preview linkage)
### Description:
1. Be able to upload the latest single-selected video resource from overlay to target areas on page
2. Video Widgets
3. Be able to see the selected Video resource with .mp4 file type by its preview link as default


## ID: 445
### Summary:
As a user, I can see "My Response" section that shows all editable fields   (same params) - display of new fields
### Description:
1. In the ‘My Response’ panel, the below fields should already be handled in terms of when they appear (based on request settings/params):
2. Response Comment (either rich text, or not)


## ID: 447
### Summary:
As a user I can Bulk Submit (updates from Grouped work)
### Description:
1. Behaviour here should follow the same as it does in Grouped Review page, including:
2. Submit & Continue button hover tooltip text


## ID: 448
### Summary:
As a user I can Bulk Apply (updates from Grouped work)
### Description:
1. Behaviour here should follow the same as it does in Grouped Review page, including:
2. Apply count in button


## ID: 450
### Summary:
As a user I can open and view the Bulk Approve Review Page (Core UI)
### Description:
1. When user has clicked Bulk Review Request, the Bulk Review page opens 


## ID: 455
### Summary:
As a user when one checkbox of request is checked only the requests that can be bulk approved can be selected
### Description:
1. Following - when one Pending request is selected then
2. Only checkboxes for relevant related Pending requests remain selectable 


## ID: 463
### Summary:
FR: Clone MCP Site handling
### Description:
1.We need a mechanism within the MCP that allows for the complete removal of existing facial data and related flags.
2.This could be a checkbox to tick it and wipe existing data


## ID: 465
### Summary:
PB - As a User, I want to see and access resource module via a lookup button to select & upload Resources into Page Builder
### Description:
1. Be able to see resource lookup button “Select“ from Side Panel as per 


## ID: 476
### Summary:
As a User, I want to filter Image Resources that flagged with Unknown faces
### Description:
1. Be able to filter resources with “Unknown People“ condition from resource filter panel if they ever include any Unknown faces in Facial Recognition as per 
2. Be able to always see “Unknown People“ condition below “People” as per (the position of “Unknown People“ is closely blow “People“)


## ID: 479
### Summary:
As a User, I want to control Daily Digest trigger of New Comments in Admin/My Account
### Description:
1. Be able to see New Comments setting for daily digest email in Admin - Alert (Markup)
2. Be able to turn on and apply only to *daily, never*


## ID: 497
### Summary:
As a User, In the V2 Database Settings - I want to select a Feature Field Completion Value which will offer the approval statuses as options
### Description:
1.Field should only appear when a Multi Upload field has been selected as a Feature Field
2. Values include: Approved, Cancelled, Completed, Declined, Pending


## ID: 499
### Summary:
As a user I want to run a stats report for database tool and see files from multi upload field represented each on their own row (excluding in Duplicable sections)
### Description:
1. Where multiple files exist in a multiple upload field each one is represented on its own row
2. File names are expanded into separate rows


