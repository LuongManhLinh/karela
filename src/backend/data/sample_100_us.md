## ID: 7
### Summary:
As a user, I want to be able to preview the GIF or Lottie File converted MP4 on the Info Preview screen so that I can preview what the animation is like before I download it
### Description:
1. The Info Preview Screen should include a converted MP4 from either the GIF or Lottie file. This MP4 should auto-play, have the video controls hidden and be on a loop.
2. When a user is on the Info Preview page and the file type is a GIF or Lottie, then:
3. The Previewer should be displaying the converted GIF or Lottie file MP4 
4. All other components and actions on the Info Preview screen should remain the same as if it was a GIF or Lottie file.
5. Download should download the GIF or Lottie file
6. File type metadata fields and the like should show GIF/Lottie
7. Version file type should be GIF/Lottie


## ID: 9
### Summary:
As a user, I want to be able to preview the GIF or Lottie File converted MP4 on the Share screen so that I can preview what the animation is like before share it
### Description:
1. Users should see the preview of the GIF or Lottie File converted MP4 on the Share screen. This should help users to preview the animation before deciding to share it.
2. As a user on the share/embed screen:
3. The preview should show the GIF or Lottie File converted MP4.
4. The controls should be hidden
5. The MP4 should autoplay 


## ID: 16
### Summary:
As a user, when parent record undergoes publish approval process, child records are only created when parent is approved
### Description:
1. When parent record is sent for approval, and is approved, then the child records are created
2. No snackbar is needed in this scenario, (as that would show to last reviewer user who approves, and who may not need to know child records are created.
3. This occurs on request status becoming ‘Approved ' - ie: not when a single Reviewer 'Approves’ in the scenarios where more than 1 approval is required, and also not when the first stage of a multi-staged request is approved.
4. This can occur, theoretically, months after the record was submitted. ie, if submitted in March 2023 but not approved until June 2023, then child records will be created in June
5. This can also occur when Auto-Complete is enabled on the parent database workflow, in which the ‘delay’ time will be be very minimal when it successfully gets auto-completed (assumed this will occur almost immediately after submit)
6. If record publish is conditionally auto-completed, then:
7. If single stage workflow then child records will be auto-created upon successful auto-complete of parent record
8. If first stage of a staged workflow then delay creation of child records will be enacted, since this only completed the first stage of the request
9. Creator of the child records is the creator of the parent record, not the approver of the publish workflow request. 


## ID: 19
### Summary:
As a Database Manager, I want to allow end users to Add More child records ('Add More') - Handle maximum child records
### Description:
1. Configure Auto-Created Records overlay in the form builder, a setting called Allow User to Add More {Recordcustomnameplural} was added
2. While 30 is maximum total number of child records, we will keep this field ‘Allow User to Add More {Recordcustomnameplural}’ enabled / clickable even if 30 exist in config, since end users can potentially remove non-mandatory ones (which would then let them add more)
3. If however 30 exist in config and ALL 30 are disabled for ‘Allow User to skip…’ then we de-select + disable this field. This is because in this scenario end user cannot add more.  
4. Disabled state hover updates to:
The max 30 {{Records}} has been added here. Remove any of the above to allow users to add more.
{{Records}} here = child custom record plural name


## ID: 31
### Summary:
As a user, I want on close of Single view redirect to Grouped Approval Review page (don't clear out single page response values)
### Description:
1. When a user has entered any response info on a single response page and then returns to the List view, those details (comment/response/approved until values) are retained as long as the overall Grouped Review Page is open (As soon as user closes the overall overlay we no longer store this info)
2. This means, if user re-opens that single view, their response details remain 


## ID: 36
### Summary:
As a user, I want to review my document against compliance rules before submitting it to the system so that I can address issues early in the process.
### Description:
1. Capture and extract content from the active Word document
2. Send document content and filter values to Review API
3. Implement "Fix Issue" functionality that navigates to the relevant section in Word



## ID: 37
### Summary:
As a user, I want to view detailed risk results from my document review and take actions on each risk (dismiss or add as comment) so that I can address compliance issues efficiently within my document.

### Description:
1. Display risks in a format matching the current Red Marker Add-ins
2. Implement risk action buttons: Dismiss button (X), Insert Comment button that adds the risk as a native Office comment
3. When "Insert Comment" is clicked:
- Create a native Microsoft Office comment at the exact location of the risk
- Format comment text to include risk details and suggested remediation



## ID: 39
### Summary:
As an IB Admin, I want to designate a specific database as the default for the Add-in Risk Review so that users have a consistent starting point when using the Add-in as well as having a “Quick” drop off method. 
### Description:
1. Add a new setting labeled "Make this [DatabaseSingular] the default for Risk Reviews in Add-ins" 
in the Database Settings section, above the “Custom Item Names” field.


## ID: 43
### Summary:
As a User, I want to hide the record footer & hide actions in the header within the record view
### Description:
1. This is to avoid unnecessary confusion for the user and requires us to:
- Hide the record footer entirely
- Show Record Header but only display the Database Name, Record name and sequence ID 
- Hide all other actions, etc in top right currently
- Hide the close button in the record view header
- Hide left / right navigation arrows that appear on the record page (note these are controlled by an MCP setting)


## ID: 53
### Summary:
As a User, I want to Delete a Smart Page via API
### Description:
1. Be able to delete a Smart page via a API call
2. The call is documented in the API doc


## ID: 60
### Summary:
As a User, I want to have Section's height auto-adjusted based on the Section within
### Description:
1. Be able to have Section’s height adjusted automatically based on the height of Block within Height increases if the Block’s height is larger, Height decreases if the Block’s height is smaller


## ID: 66
### Summary:
As a User, I want to save the created Simple Page for CP module
### Description:
1. Be able to click on publish / save and save the Simple Page to CP module database
2. The successfully saved Simple Page could be listed later when open / refresh the CP module
3. Details should be in line with Design 


## ID: 77
### Summary:
As a User, I want to Restricted Actions for Template Resources [Database Locations]
### Description:
1. When a Resource is a created Template or a Master Template, the below Resource Actions +do not display+ for any user: *Download* , Block from Single and Bulk Download, *Alias* ,Block from Single and Bulk Create Alias
2.For A/C, below Resource actions +are+ still supported: *Edit*, *Email Internal Share Link*,  *Move*, *Check in / Out*, *Usage*, *Related*, *Feedback* (when enabled)



## ID: 79
### Summary:
As a User, I want MCP Setting for Single User Record Editor Restriction
### Description:
1. New development setting added to “*Development Use Only”* section of MCP:
2. Setting name: *Databases - Single User Record Edit Restriction*
3. Location: Can be added to bottom of the list


## ID: 82
### Summary:
As a User, On save, a new Job should appear in job list/tab for that Template Resource (B.E. handling)
### Description:
1. On successful Save, a Job will be saved against the Template from which it was created from


## ID: 85
### Summary:
As a User, I want Close or cancel handling
### Description:
1. If close or cancel is selected from Edit Template page, user is returned to the location they selected the Edit action from 



## ID: 90
### Summary:
As a user who selected to Create Blank Template, a blank slate opens with a Default blank size
### Description:
1. When user choose to create a new blank Template, when the *Create Template* page opens (aka, the Template editor) user sees the blank template opened to a default size
2. Default size is 1080 x 1080


## ID: 91
### Summary:
As a User, I want to Update Workflow Template Configure Groups/Divisions to be a modal not full overlay
### Description:
1.To update following designs, no changes to logic unless noted in design requirements in figma


## ID: 96
### Summary:
As a collaborator, I can be added to a Thread
### Description:
1. When Comment threads are enabled for the workflow (records file / resource publish / resource feedback), then collaborators can be added to new and existing threads by other thread participants/collaborators/admins/ 
2. When successfully added, added collaborator user can toggle between threads, edit thread, etc, the same as participants can


## ID: 99
### Summary:
As a User, I want to Publish Resource Grouped Requests handled in Group Review Page
### Description:
1. *Overall* page design and behaviour matches Grouped Download handling with some minor exceptions
2. *Bulk Download* will not yet display here
3. Response fields may differ than Grouped Download on Bulk and Single level, such as:
4. *Hide Decline* may be enabled for Record File Approvals (not applicable for Grouped Download)
5. *Approve with Comments* may be enabled for Record File Approvals (not applicable for Grouped Download)
6.  Requests may be *staged* (not applicable for Grouped Download)
7. Logic here to follow Bulk Review for now - ie, requests may be progressed to different stages from one another in the Grouped Request


## ID: 106
### Summary:
As a User, I want to switch Page Categories when viewing a Page if there are multiple Page Categories
### Description:
1. Be able to see multiple Page Categories in the dropdown to switch from Nav, if there are more than one Page Categories exist and the user has permission to view those pages are under the Page Categories
2. Be able to select and to switch to another Page Category (incl. 'All Pages') via the drop-down menu as per design, then load Pages under from Nav



## ID: 107
### Summary:
As a User, I want to see Page Category being selected by default when viewing a Page as it's been assign to one
### Description:
1. By default the Page Category Name itself is displayed as per 
2. Be able to see the pages under are loaded to the left side from Nav when viewing a Page


## ID: 110
### Summary:
As a User, I want to be informed why the Page cannot be saved in Page Builder if it's beyond the set Page limit in MCP
### Description:
1. When the user is in Page Builder already and the set D&D page limit in MCP has been reached:
2. Be able to see a warning snack bar with message “Page limit of {&number set as page limit in MCP} reached.“ *in Page Builder after clicking on:*
3. Standalone Page creation button 
4. at the bottom of Nav Panel
5. Page create button via kebab icon from Nav Panel
6. Sub-page creation button via kebab icon from Nav Panel


## ID: 112
### Summary:
As a User, I want to configure both Block and Video Widget properties
### Description:
1. Be able to see and configure the new widget settings from Nav (combining previously defined Block and Widget's settings) for each widgets:


## ID: 126
### Summary:
As a User, I want to add MCP Feature Flag for Collaborators in Approvals project
### Description:
1. Add a new MCP setting in development section:
2. Setting name: *Collaborator in approvals (BETA)*
3. Can be listed at bottom of development section 
4. All project work to be tied to this setting 


## ID: 127
### Summary:
As a User, I want a new workflowRequest PATCH call to update the collaborators
### Description:
1. We will implement a PATCH call for workflowRequest. Only collaborator field will be supported to update. If other fields are provided in the call they will be ignored.


## ID: 130
### Summary:
As a User, I want empty stages shouldn't be hidden
### Description:
1.Currently we hide pages and stages that don’t display any fields/sections.
2.This ticket is to not hide a stage when it’s empty, but we will continue doing it for Pages.



## ID: 134
### Summary:
As a User, I want to make the verification code in the email bigger & bolder to stand out more
### Description:
1. Update to new designs


## ID: 135
### Summary:
As a User, I want to add "Maximum number of files" to the empty Multi Upload Field so users are aware of limits before uploading
### Description:
1. Update text in empty multi upload field in create/update to reflect the max file limit as set in the new multi upload form field ‘*Maximum File Limit*’


## ID: 140
### Summary:
As a User, I want to change "Show All" to "Show More" logic
### Description:
1. Name of ‘Show All’ to change in all scenarios to ‘Show More’ when over 50 files exist
2. Limit to the Max number of items that can be displayed in ‘Show More’ to be 50 (regardless of how many more files may be allowed/exist)
3. Others above 50 can be seen within the scroll within the expanded multi upload field


## ID: 143
### Summary:
As a User, I want to hide Left Menu (to hide Future Stage details) for Public Users in updated UI in Create Record
### Description:
1. When *Databases - Briefs UI Uplift Phase 1* is enabled in MCP then for Public Users only in Create for Staged Databases, we hide the left menu altogether


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


## ID: 150
### Summary:
As a User, For "Ask AI Beta" project I want Beta icon
### Description:
1. Add ‘Beta’ icon to Ask AI opened side panel after the panel name+help tooltip to alert the user this feature is in 'beta'


## ID: 160
### Summary:
As a User, I want to have an Admin setting to enable that the Session can be manually ended
### Description:
1. Be able to configure the setting: 'Session Based Digest” for the manual end trigger of Session Based Digest of Markup Comments


## ID: 162
### Summary:
As a user, I want to see footer actions like cancel, save as draft, next and submit (Staged Database)
### Description:
1. When MCP is ON
2.Footer for staged database


## ID: 165
### Summary:
As a User, I want Permission updates/options: allow all platform users to Ask AI from documents they can Preview (or above)
### Description:
1. We add a MCP sub-setting under parent “*Enable vector search - text (V3) (development use only):*”
2. Sub-setting name: *Main Admin only (Beta)*


## ID: 175
### Summary:
Guest Upload MVP - Email verification: New Email Template + Send Email
### Description:
1. When public user enters/submits a valid email address in the new initial screen in then:
2. In Back end we generate code and sent the below email to the Public User’s entered email address


## ID: 177
### Summary:
CMD - As a User, I want to see Markup Comments removed from Dashboard automatically for removed / archived Assets
### Description:
1. Markup comments should be *hidden* (as ‘removed’) in Dashboard Widget automatically if the associated assets have been deleted


## ID: 178
### Summary:
Guest Upload MVP: Add Email address into Public Usage Create Action
### Description:
1.In Usage, when a record has been created by a public user we update the User details to append user’s email address, ie:
2. “Public Access (email@address.com)”


## ID: 191
### Summary:
2-3. As a User, I want to Undo & Redo resizing & repositioning
### Description:
1. Be able to still click on Undo & Redo from top bar to go back & forward the actions on: Resizing the Image by dragging the dots
2. undo & redo get triggered only after user finishes their dropping by un-clicking the dot - so won't undo every pixel along the way of dragging experience.
3. the undo & redo also only works for successful cases as unsuccessful cases have been handled by experience provided


## ID: 196
### Summary:
PB - As a User, I want to see a Smart Page  template popup after click on V2 create
### Description:
1. Be able to go to V3 Page Builder and see a Page Template popup, after clicking on Smart Page from V2 Page creation popup, as per design
2. Be able to see the popup: Popup Subject
3.the default background page in Page Builder behind the template popup is an empty default page with three empty Sections
4. Current “template“ and “thumbnails” design are dummy/mock ones, once the real templates are final we will import them with the task: 


## ID: 204
### Summary:
PB - As a User, I want to add Widgets directly to a Section
### Description:
1. Be able to drag Widgets from Nav to Section directly in Page Builder on Create/Edit mode Widgets: all existing ones, and a new Widget: "Spacer" see in corresponding 
2. For default config settings on Nav for each Widgets combined with 'Block', see in corresponding 
3. Be able to drag max. 6 Widgets to one Section
4. Be able to see *only* Section under Core elements from Nav to drag in without “Block“ option any more


## ID: 205
### Summary:
PB - As a User, I want to add a new Widget "Spacer"
### Description:
1. Be able to see and drag a new type of Widget "Spacer" as per design in a Section from Nav
2. Be able to see and configure settings for Spacer in order: Colour (by default, #FFFFFF) Padding (by default, 0pt for all directions) Ratio (by default, it follows the existing behaviour: 12 for an empty Section)
3. Be able to further drag a Section in this Widget (just to cater to previous behaviour of dragging a Section to a Block)



## ID: 206
### Summary:
PB - As a User, I want to delete a Widget with the underlying Block
### Description:
1. Be able to delete a Widget with the same experience of deleting the old Widget




## ID: 208
### Summary:
PB - As a User, I want to only select & see the combo of Widget and Block (bounding box experience) in Page Builder
### Description:
1. Be able to select Widget and Block as a whole, and the bounding box will be highlighted as the same experience as old Block's bounding box
2. Be able to only navigate Up back to the Section



## ID: 209
### Summary:
PB - As a User, I want to undo & redo actions for the combo of Widget & Block
### Description:
1. Be able to Undo & Redo actions of the Widget & Block as whole
2. Adding Widgets with Blocks to Page (dragging in)
3. Removing/deleting Widgets with Blocks from Page
4. Moving Widgets with Blocks by dragging


## ID: 211
### Summary:
PB - As a User, I want to report Resource Download (Preview) action in Usage Reporting for Custom Page Module
### Description:
1. Be able to track the Smart Page usage reporting and User’s usage reporting for resource download action (Preview type of Resource, aka “Good“ quality)
2. Module appears if it applies to User’s usage report, whilst in Custom Page usage report the Module will not be displayed
3.“Custom Page“ is dynamic to the setting configured in Admin: {Custom Custom Page Module singular}
4. Action: Resource Download (Preview) 



## ID: 215
### Summary:
PB - As a User, I want to re-order pages within the same parent/root via Nav - FE integration
### Description:
1. Be able to re-order Pages via drag-and-drop from Nav Panel during editing
2. Sub-pages will be moved all together with Page if it contains any
3. After drag-and-drop of Pages, Sub-pages will be *collapsed* under Page from Nav Panel
4. Be able to re-order sub-Pages via drag-and-drop within the *same* parent Page from Nav Panel during editing
5. Be able to re-order root-Pages via drag-and-drop from Nav Panel during editing This ticket does NOT include drag-and-drop across Parent



## ID: 219
### Summary:
PB - As an internal User, I want to set Page limits via MCP settings
### Description:
1. Be able to set Page limits on MCP control panel for client sites
2. Page limits are set with a number: 2, by default for a new client created on MCP), which restrict client’s site with a total amount of Drag & Drop Pages could be created by users 
3. Location: Platform Restriction area, after Custom Page Limit


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


## ID: 249
### Summary:
PB - As a User, I want to report Edit Page action in the usage reporting
### Description:
1. Be able to see Simple Page reporting on Edit action
2. User Usage Report
3. Custom Page Usage Report
4. Be able to search and export the Report on Edit action
5. To note: the searching rules and displaying will be natively handled


## ID: 255
### Summary:
PB - (Misc) As a User, I want to differentiate page saving between creating a new and editing an existing Simple Page
### Description:
1. Be able to differentiate two scenarios while saving a Simple Page in Simple Page Builder
2. Be able to save the Simple Page then refresh to go to its Editing Page URL in editing mode, when first-time creating a new Simple page (page with create URL, via Create process)
3. Be able to save the Simple Page with the latest contents, when editing an existing Simple Page (page with update URL, via Edit action process or from the process above) and then stay on the Page in editing mode, meanwhile, cannot continue to save
4. Be able to continue to save the Simple Page with latest contents if there are new editing actions on this Simple Page


## ID: 265
### Summary:
PB - As a User, I want to have an Image Widget (via URL)
### Description:
1. Be able to add Image Widget to a Block by dragging the icon from side panel as per design
2. Be able to see the image placeholder icon as per design  for that added image widget before inputing a valid image URL
3. Be able to still see the image placeholder icon if the URL won’t work in any way (means the image cannot display)
4. Be able to see the Image via inputing/updating Image Resource URL from side Panel as per design (URL input placeholder: “Enter URL“)


## ID: 267
### Summary:
PB - As a User, I want to have a Text Widget
### Description:
1. Be able to call the rich text editor and use it within the Block, not in right side Panel
2. Be able to have the same default functionalities as per current custom page V3 rich text editor including: Size, Bold, Italic,Strike-through, Underline Alignment
3. Be able to auto-extend the height of text box by inputing contents, without limitation
4. Be able to delete


## ID: 268
### Summary:
PB - As a User, I want to add a Widget to Block
### Description:
1. Be able to drag one widget from the widget toolbar to one target existing Block
2. Be able to edit on the added widget from default size according to different widget types: Image, Text, Colour Palette
3. Be able to disappear if the widget dragged outside any Blocks


## ID: 270
### Summary:
PB - As a User, I want to Undo & Redo any editing actions on Simple Page
### Description:
1. Be able to have Undo & Redo action buttons, see button designs 
2. Be able to click on Undo or Redo the previous edit action on sections / widgets / contents within Simple Page Builder
3. Be able to hover on Undo or Redo buttons and see tooltips


## ID: 277
### Summary:
As a user, I want to be able to see the actions when in view and update mode
### Description:
1. Show actions in View and Update mode


## ID: 281
### Summary:
PB - As a User, I want the status of background Image added via Resource Lookup to be linked with Resource module
### Description:
1. Be able to *link the status* of the the background Image *with the derived Image resources in Resource Module* if it has been added as *Page* or *Section* background in Page Builder via Resource Lookup



## ID: 288
### Summary:
PB - As a User, I want to switch Page Categories when viewing a Page if there are multiple Page Categories
### Description:
1. Be able to see multiple Page Categories in the dropdown to switch from Nav, if there are more than one Page Categories exist and the user has permission to view those pages are under the Page Categories
2. Be able to select and to switch to another Page Category (incl. 'All Pages') via the drop-down menu as per design, then load Pages under from Nav


## ID: 290
### Summary:
PB - As a User, I want to un-assign a Page Category from an existing parent / standalone page
### Description:
1. Be able to un-assign (aka. update a Page to be removed from a Page Category) *a standalone Page* or *Parent including sub-pages together* from an existing Page Category via the Assign Page Category button as per 


## ID: 293
### Summary:
PB - As a User, I want to delete an existing Page Category in Page Builder
### Description:
1. Be able to click on kebab button next to Page Category dropdown menu  from Navi Panel as per  and click on ‘Delete Page Category’ in Page Builder


## ID: 296
### Summary:
PB - [4/4] As an Internal User, I want to have MCP(development use only) settings to enable/disable features per Epic for Drag & Drop Page MVP 
### Description:
1. Add a MCP setting “Drag & Drop Pages - Page Category (development use only)“ under Development Use only section under Platform Settings


## ID: 304
### Summary:
PB - As a User, I want to configure both Block and Text Widget properties
### Description:
1. Be able to see and configure the new widget settings from Nav (combining previously defined Block and Widget's settings) for each widgets:
2. *Text box:*
3. Padding


## ID: 306
### Summary:
[Ask AI Alpha] As a user I want to choose to search whole platform or current location (Logic: Folder location limit)
### Description:
1.  ‘Limit to current view’ checkbox field appears under question field
2. This is always enabled by default when panel is opened


## ID: 315
### Summary:
[Ask AI Alpha] As a user, I want the Q&A system not to include any deleted documents 
### Description:
1. Deleted resources should be excluded from being a source for any questions/answers


## ID: 317
### Summary:
PB - (Misc) As a User, I want to set auto-play as default or not for Video Widgets when viewing a Smart Page
### Description:
1. Be able to set added Video Widget auto-playing on Viewing via the button as per 
2.By default, the auto-play button is unchecked, meaning Videos won’t be auto-played on viewing by default


## ID: 320
### Summary:
[Ask AI Alpha] As a user I want to see the 'Ask AI' side panel header and see help tooltip there
### Description:
1. Search AI header of side-panel: ‘Ask AI’  
2.Help tooltip icon displays next to the name
3.Text that displays on hover: 'Ask AI to summarize an answer from your documents. Enable 'Current view' to narrow your search to your current folder location and search only.



## ID: 321
### Summary:
[Ask AI Alpha] As a user I want to close the 'Ask AI' side panel
### Description:
1. Close icon displays top right of Ask AI side panel in header section
2. User can click close icon which will close the side-panel



## ID: 323
### Summary:
[Ask AI Alpha] As a user I can click 'Ask' button to trigger search AI (or can click enter)
### Description:
1 ‘Ask’ button displays under question field, is disabled by default when panel opens
2. Hover text when enabled: ‘Click or hit enter to ask your question.’


## ID: 328
### Summary:
[Ask AI Alpha] As a user I can see the answer (in scrollable field)
### Description:
1.  Answer field displays under Search bar (and other fields) when we have an answer to return
2. Answer field height can expand as answer is incrementally built out to, but will hit a fixed height that is scrollable when that is reached/surpassed 
3. Answer component also includes the icon for Copying the answer - to be handled in a separate ticket in 



## ID: 336
### Summary:
PB - As a User, I want to see a Smart Page  template popup after click on V2 create
### Description:
1. Be able to go to V3 Page Builder and see a Page Template popup, after clicking on Smart Page from V2 Page creation popup, as per 


## ID: 342
### Summary:
BP - (Misc) As a User, I want to see the Page Tree remain the same while switching Pages from Nav Panel
### Description:
1. Be able to see Page Tree remain the same while switching pages from Nav Panel during Viewing or Editing
2. If the parent page is expanded with sub-pages displayed under it, the Tree view should remain the same while switching to any other pages


## ID: 363
### Summary:
PB - (FE components) As a User, I want to move a sub page to become a standalone Simple Page (Parent)
### Description:
1. Be able to move a sub-Page to become a standalone Page that doesn’t contain any sub-Page, via drag-and-drop from Navigation Panel on editing mode in Page Builder
2. Be able to see the updated order / hierarchy of Page list from Navigation Panel


## ID: 367
### Summary:
Grouped Email Updates [existing designs]: Same Template Cross Folder Handling (different reviewers for different folders, but same template)
### Description:
1. If Cross Folder bulk edit involves resources from different folders that have workflows from the same Workflow Template, but where reviewers may be different per folder due to config (_as detailed in scenarios above, this could be a mix of Global+Local, or Global+Global but with different reviewers, or Local+Local with different reviewers_) 


## ID: 372
### Summary:
PB - As a User, I want to re-order pages within the same parent/root via Nav - FE integration
### Description:
1. Be able to re-order Pages via drag-and-drop from Nav Panel during editing
2. Sub-pages will be moved all together with Page if it contains any
3. After drag-and-drop of Pages, Sub-pages will be *collapsed* under Page from Nav Panel


## ID: 379
### Summary:
PB - As a User, I want to be able to download the resources added to the page, if I have permission to do so - Video widget
### Description:
1. Be able to *ONLY* see the download button as per to download the added resources on Editing, Previewing & Viewing of Simple Page *by hovering on Widgets*:
2. Video resource from Video Widget


## ID: 381
### Summary:
[QW 4/5] Requester Re-assign: Load group users(expand group > users) from workflow config - (v2 component approach)
### Description:
1.As per,  the below is not supported in the V2 Approvals List.
2.This means in V2 List, that Requesters cannot re-assign to any request unless Workflow or Main Admins (=current handling) 


## ID: 397
### Summary:
PB - (FE integration) As a User, I want to create a sub-page for an exisiting Simple Page via Nav
### Description:
1. Be able to click on setting button of a simple page from Nav as per 
2. Be able to see the sub-page popup as per 


## ID: 399
### Summary:
[Bulk Review] Same Template:  Needed until - cross date value handling
### Description:
1. For Resource Download Requests, as long as requests are tied to the same Template, they can be selected together for Bulk Review regardless of what Needed until/Approved until value setting is, or value is (including no value)


## ID: 400
### Summary:
[RESTRICTIONS] Allow same Template Staged requests to be selected together if number of stages *in config* doesn't match (or conditional requests with different stages)
### Description:
1.For Staged Pending Requests, as long as requests are tied to the same Template, AND as long as the requests themselves are on the same current stage, they can be selected together for Bulk Review regardless of the total number of stages in the config,


## ID: 401
### Summary:
'Review Request' in footer should be plural  - change to 'Review Request(s)'
### Description:
1. In Bulk Action Footer update ‘Review Request’ to ‘Review Request(s)’


## ID: 420
### Summary:
[RESTRICTIONS] Cross param handling of 'Hide Decline' (hide Decline if all share param,  ignore Bulk Apply of Decline to items that don't apply)
### Description:
1. When we can detect that the requests selected for Bulk Review feature a mix of items where Hide Decline is enabled and some that do not, then on the Bulk Review response panel we still display Decline as an option


## ID: 423
### Summary:
Bulk Approve Response UUID  {createdInBulkId} display column in Stats - Workflow Responses(to be used in condition)
### Description:
1.Using back end data captured in we will surface that information in a new Stats column 


## ID: 425
### Summary:
Bulk Approve action Tracking surfacing in Review Request - Responses
### Description:
1. This ticket is to add some sort of UI indicator against the Request Status > Response(s) +to denote if response was submitted on the single view, or in bulk
2. Current look:


## ID: 454
### Summary:
As a user the Bulk Action Footer bar displays when one relevant item is selected
### Description:
1. When one item’s checkbox is selected, the Bulk Action footer bar displays 
2. For Beta the ‘Select All’ action from existing footer bar will have to be hidden in this location 


## ID: 460
### Summary:
FE task: As a User, I want to Delete the name from resources across platform on Training Centre
### Description:
1. Be able to see "Delete profile" action icon for recognised faces from training centre as per 
2. Be able to see tooltips while hovering on the icon


## ID: 465
### Summary:
PB - As a User, I want to see and access resource module via a lookup button to select & upload Resources into Page Builder
### Description:
1. Be able to see resource lookup button “Select“ from Side Panel as per 


## ID: 466
### Summary:
As a user in single view when I click previous/next, or Save & Next,  this takes into account my Search/Filtered results
### Description:
1. User can then change search to see more items
2. If the single item is the last in the folder, then this will be handled in


## ID: 468
### Summary:
PB - As a User, I want to report Edit Page action in the usage reporting
### Description:
1. Be able to see Simple Page reporting on Edit action
2. User Usage Report


## ID: 471
### Summary:
PB - As a User, I want to report Resource Download (Original) action in Usage Reporting for Custom Page Module
### Description:
1.Be able to track the Smart Page usage reporting for resource download action (Original size type of Resource, aka “Best“ quality)


## ID: 473
### Summary:
PB - As a User, I want to set Page/Section/Block/Widgets Colour in Opacity 
### Description:
1. Be able to set Page/Section/Block 's background, Colour Palette Widget 's Colour, Button Widget's Text & Background in opacity as per design
2. Be bale to se the transparency / opacity via the opacity bar blow the hue bar as per 


## ID: 475
### Summary:
As a bulk edit user, I can see the Folder name for the resource in single view
### Description:
1. In Single view page add in the Folder name to the page name, like we do for same folder bulk edit > single view



## ID: 487
### Summary:
[FILTERS] As a user I can see the currently applied filter above the list / select between filters - on the fly filter support
### Description:
1.In Page toggle between Filters


## ID: 488
### Summary:
[GDA] -  As a User if I don't have permission to download the item I have to request permission to download again (or cannot download) - Part 1/2 - grouped download button
### Description:
1. If user does not have permission to download +any+ selected items in the list, and bulk download is clicked, they will be taken to the existing Bulk Request Approval page, to again request or re-request permission to download



## ID: 489
### Summary:
[GDA] -  As a User I want to be able to bulk download my items when able
### Description:
1.Requester needs to be able to bulk download files as they can currently do in V2 +when request is approved / within the approved timeframe


## ID: 490
### Summary:
[GDA] -  Once user has responded, item will be ignored in bulk Apply + submit
### Description:
1. Once user responds, individual requests remain as selected on Grouped List page after Submit if passed validation. 
2. Once they have made a response, users can then only update their responses individually as per 


## ID: 497
### Summary:
As a User, In the V2 Database Settings - I want to select a Feature Field Completion Value which will offer the approval statuses as options
### Description:
1.Field should only appear when a Multi Upload field has been selected as a Feature Field
2. Values include: Approved, Cancelled, Completed, Declined, Pending


## ID: 498
### Summary:
As a user I want to filter by number of revisions for Resource Publish Requests in Workflow Request Stats
### Description:
1. When the below are selected then new data condition option ‘Markup Comments Revisions’ is available for Workflow +Requests+:
2. ‘All Workflows’ is selected


